// ================= PRIVATE ROOMS (5-DIGIT CODE) & P2P VOICE CHAT =================
let activeRoomCode = 'PUBLIC';
let isPrivateRoom = false;
let pendingRoomAction = null; // { mode: 'create' | 'join', code: '12345' }

let localVoiceStream = null;
let micEnabled = true;
let speakerEnabled = true;
const peerConnections = new Map();
const remoteAudios = new Map();

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function generateRandom5DigitCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function setRoomModalMessage(text, isError = true) {
  const el = document.getElementById('roomStatusMsg');
  if (!el) return;
  el.style.color = isError ? '#fca5a5' : '#80ed99';
  el.textContent = text || '';
}

function sanitize5Digits(inputEl) {
  inputEl.value = (inputEl.value || '').replace(/\D/g, '').slice(0, 5);
}

const createInput = document.getElementById('createRoomCodeInput');
const joinInput = document.getElementById('joinRoomCodeInput');
if (createInput) createInput.addEventListener('input', () => sanitize5Digits(createInput));
if (joinInput) joinInput.addEventListener('input', () => sanitize5Digits(joinInput));

document.getElementById('randomRoomCodeBtn')?.addEventListener('click', () => {
  if (createInput) createInput.value = generateRandom5DigitCode();
  setRoomModalMessage('');
});

document.getElementById('openFriendsBtn')?.addEventListener('click', () => {
  if (createInput && !createInput.value) {
    createInput.value = generateRandom5DigitCode();
  }
  setRoomModalMessage('');
  openModal('friendsModal');
});

function submitRoomAction(mode, code) {
  const t = I18N[state.lang] || I18N.hy;
  if (!/^\d{5}$/.test(code)) {
    setRoomModalMessage(t.errInvalidCode, true);
    return;
  }
  pendingRoomAction = { mode, code };
  setRoomModalMessage('...', false);
  const socket = ensureSocketInitialized();
  const payload = JSON.stringify({
    type: mode === 'create' ? 'create_room' : 'check_room',
    roomCode: code
  });
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
  } else {
    socket.addEventListener('open', () => {
      try { socket.send(payload); } catch (_) {}
    }, { once: true });
  }
}

document.getElementById('createRoomSubmitBtn')?.addEventListener('click', () => {
  submitRoomAction('create', (createInput?.value || '').trim());
});

document.getElementById('joinRoomSubmitBtn')?.addEventListener('click', () => {
  submitRoomAction('join', (joinInput?.value || '').trim());
});

document.getElementById('inviteRoomBtn')?.addEventListener('click', () => {
  if (isPrivateRoom && activeRoomCode !== 'PUBLIC') {
    shareGameInvite(activeRoomCode);
  }
});

// Check ?room=12345 URL param on load
(function checkInviteLinkParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    const roomParam = (params.get('room') || '').trim();
    if (/^\d{5}$/.test(roomParam) && joinInput) {
      joinInput.value = roomParam;
      openModal('friendsModal');
    }
  } catch (_) {}
})();

// ================= VOICE CHAT (MIC ON/OFF + SPEAKER ON/OFF) =================
function updateVoiceButtonsUI() {
  const bar = document.getElementById('voiceBar');
  if (!bar) return;
  if (!inGame || !isPrivateRoom) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  const badge = document.getElementById('activeRoomBadge');
  if (badge) badge.textContent = `#${activeRoomCode}`;

  const micBtn = document.getElementById('toggleMicBtn');
  if (micBtn) {
    micBtn.classList.toggle('muted', !micEnabled);
    micBtn.textContent = micEnabled ? '🎤' : '🔇';
  }
  const spkBtn = document.getElementById('toggleSpeakerBtn');
  if (spkBtn) {
    spkBtn.classList.toggle('muted', !speakerEnabled);
    spkBtn.textContent = speakerEnabled ? '🔊' : '🔈';
  }
}

async function initLocalMicrophone() {
  if (localVoiceStream) return localVoiceStream;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
  try {
    localVoiceStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localVoiceStream.getAudioTracks().forEach(tr => { tr.enabled = micEnabled; });
    return localVoiceStream;
  } catch (_) {
    micEnabled = false;
    updateVoiceButtonsUI();
    return null;
  }
}

function stopVoiceChat() {
  for (const pc of peerConnections.values()) {
    try { pc.close(); } catch (_) {}
  }
  peerConnections.clear();

  for (const audioEl of remoteAudios.values()) {
    try {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    } catch (_) {}
  }
  remoteAudios.clear();

  if (localVoiceStream) {
    localVoiceStream.getTracks().forEach(tr => tr.stop());
    localVoiceStream = null;
  }
  updateVoiceButtonsUI();
}

function createPeerConnection(peerId, isInitiator) {
  if (peerConnections.has(peerId)) return peerConnections.get(peerId);
  const pc = new RTCPeerConnection(RTC_CONFIG);
  peerConnections.set(peerId, pc);

  if (localVoiceStream) {
    localVoiceStream.getTracks().forEach(track => pc.addTrack(track, localVoiceStream));
  }

  pc.onicecandidate = (ev) => {
    if (ev.candidate && wsSocket && wsSocket.readyState === WebSocket.OPEN) {
      wsSocket.send(JSON.stringify({
        type: 'rtc_signal',
        to: peerId,
        signal: { candidate: ev.candidate }
      }));
    }
  };

  pc.ontrack = (ev) => {
    let audioEl = remoteAudios.get(peerId);
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.muted = !speakerEnabled;
      document.body.appendChild(audioEl);
      remoteAudios.set(peerId, audioEl);
    }
    audioEl.srcObject = ev.streams[0];
    audioEl.play().catch(() => {});
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
      peerConnections.delete(peerId);
    }
  };

  if (isInitiator) {
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
          wsSocket.send(JSON.stringify({
            type: 'rtc_signal',
            to: peerId,
            signal: { sdp: pc.localDescription }
          }));
        }
      })
      .catch(() => {});
  }

  return pc;
}

async function handleRoomPeersList(peers) {
  if (!isPrivateRoom || !inGame) return;
  await initLocalMicrophone();
  const activeIds = new Set(peers.map(p => p.id));

  for (const [pid, pc] of peerConnections.entries()) {
    if (!activeIds.has(pid)) {
      try { pc.close(); } catch (_) {}
      peerConnections.delete(pid);
      const a = remoteAudios.get(pid);
      if (a) { a.remove(); remoteAudios.delete(pid); }
    }
  }

  for (const peer of peers) {
    if (peer.id === mpPlayerId) continue;
    // Higher ID initiates offer to avoid glare
    if (!peerConnections.has(peer.id) && Number(mpPlayerId) > Number(peer.id)) {
      createPeerConnection(peer.id, true);
    }
  }
}

async function handleIncomingRtcSignal(fromId, signal) {
  if (!isPrivateRoom || !inGame) return;
  await initLocalMicrophone();
  const pc = createPeerConnection(fromId, false);
  try {
    if (signal.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      if (signal.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (wsSocket && wsSocket.readyState === WebSocket.OPEN) {
          wsSocket.send(JSON.stringify({
            type: 'rtc_signal',
            to: fromId,
            signal: { sdp: pc.localDescription }
          }));
        }
      }
    } else if (signal.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  } catch (_) {}
}

document.getElementById('toggleMicBtn')?.addEventListener('click', async () => {
  micEnabled = !micEnabled;
  if (micEnabled && !localVoiceStream) {
    await initLocalMicrophone();
  }
  if (localVoiceStream) {
    localVoiceStream.getAudioTracks().forEach(tr => { tr.enabled = micEnabled; });
  }
  updateVoiceButtonsUI();
});

document.getElementById('toggleSpeakerBtn')?.addEventListener('click', () => {
  speakerEnabled = !speakerEnabled;
  for (const audioEl of remoteAudios.values()) {
    audioEl.muted = !speakerEnabled;
  }
  updateVoiceButtonsUI();
});