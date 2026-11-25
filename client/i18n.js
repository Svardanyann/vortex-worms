// ================= SHINY 3D GOLD COIN SVG =================
function renderGoldCoinSvg(size = 18) {
  const uid = 'gc_' + Math.random().toString(36).slice(2, 7);
  return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" style="vertical-align:-3px;display:inline-block;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.55));">
    <defs>
      <linearGradient id="${uid}_rim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef9c3"/>
        <stop offset="45%" stop-color="#facc15"/>
        <stop offset="100%" stop-color="#92400e"/>
      </linearGradient>
      <radialGradient id="${uid}_face" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#b45309"/>
      </radialGradient>
    </defs>
    <circle cx="14" cy="14" r="12.5" fill="url(#${uid}_rim)" stroke="#fef08a" stroke-width="1"/>
    <circle cx="14" cy="14" r="9.6" fill="url(#${uid}_face)" stroke="#78350f" stroke-width="1.1"/>
    <path d="M14 7.5 L15.8 11.4 L20 12 L16.9 14.9 L17.7 19 L14 17 L10.3 19 L11.1 14.9 L8 12 L12.2 11.4 Z" fill="#fef9c3" stroke="#92400e" stroke-width="0.7"/>
    <ellipse cx="9.8" cy="8.5" rx="3.2" ry="1.5" transform="rotate(-32 9.8 8.5)" fill="#ffffff" opacity="0.78"/>
  </svg>`;
}

const GOLD_COIN_SVG = renderGoldCoinSvg(17);

// ================= LOCALIZATION =================
const LANGS = ['hy', 'ru', 'en'];
const I18N = {
  hy: {
    code: 'ՀԱՅ',
    name: 'Հայերեն',
    sub: 'WORMS',
    play: 'ՄԱՐՏԻ՛',
    friendsBtn: '👥 Ընկերներով',
    workshop: 'Արհեստանոց',
    hint: 'Սեղմիր ցանկացած տեղ կամ բռնիր որդիկին',
    free: 'ԱՆՎՃԱՐ',
    shopTitle: 'Արհեստանոց և Սկիններ',
    selected: 'Ընտրված է',
    select: 'Ընտրել',
    profileTitle: 'Իմ Պրոֆիլը',
    nameLabel: 'Խաղացողի անունը',
    avatarLabel: 'Ընտրիր ավատար',
    save: 'Պահպանել',
    newProfile: '+ Նոր պրոֆիլ',
    profilesListLabel: 'Պահպանված պրոֆիլներ',
    settingsTitle: 'Կարգավորումներ',
    musicLabel: '🎵 Երգի ձայնը',
    sfxLabel: '🔊 Խաղի ձայները',
    langLabel: 'Լեզու',
    fsLabel: 'Ամբողջ էկրան',
    fsOpen: '⛶ Բացել',
    score: 'Միավոր',
    coins: 'Մետաղադրամ',
    lb: 'ԱՌԱՋԱՏԱՐՆԵՐ',
    boost: 'ԱՐԱԳ',
    shieldEnd: '⚠️ Պաշտպանությունն ավարտվեց!',
    wormDefeated: '+1 որդ հաղթեցիր',
    gameOver: 'Խաղն ավարտվեց',
    yourScore: 'Քո միավորները',
    playAgain: 'ՆՈՐԻՑ ԽԱՂԱԼ',
    toLobby: 'Գլխավոր էջ',
    recordsTitle: 'Լավագույն Ռեկորդներ',
    bestScore: 'Ամենաբարձր միավոր',
    promoTitle: 'Հատուկ Առաջարկ',
    claimBonus: `Ստանալ +100 ${GOLD_COIN_SVG}`,
    claimed: 'Արդեն ստացել ես այսօր',
    friendsTitle: 'Խաղալ ընկերների հետ',
    createRoomTitle: '1. Ստեղծել փակ սենյակ (5 թիվ)',
    createRoomBtn: 'Ստեղծել',
    joinRoomTitle: '2. Միանալ սենյակին կոդով',
    joinRoomBtn: 'Մտնել',
    errInvalidCode: 'Մուտքագրիր ճիշտ 5 թիվ',
    errCodeTaken: 'Այս կոդով սենյակ արդեն կա, փորձեք ուրիշ կոդ',
    errNotFound: 'Այս կոդով սենյակ չգտնվեց',
    shareText: 'Միացիր ինձ Vortex Worms խաղում և մրցենք միասին!',
    roomShareText: 'Միացիր իմ փակ սենյակին Vortex Worms-ում (Կոդը՝ {code}):',
    linkCopied: 'Հղումը պատճենվեց'
  },
  ru: {
    code: 'РУС',
    name: 'Русский',
    sub: 'WORMS',
    play: 'В БОЙ!',
    friendsBtn: '👥 С друзьями',
    workshop: 'Мастерская',
    hint: 'Нажми в любое место или потяни червячка',
    free: 'БЕСПЛАТНО',
    shopTitle: 'Мастерская и Скины',
    selected: 'Выбрано',
    select: 'Выбрать',
    profileTitle: 'Мой Профиль',
    nameLabel: 'Имя игрока',
    avatarLabel: 'Выбери аватар',
    save: 'Сохранить',
    newProfile: '+ Новый профиль',
    profilesListLabel: 'Сохранённые профили',
    settingsTitle: 'Настройки',
    musicLabel: '🎵 Громкость музыки',
    sfxLabel: '🔊 Звуки игры',
    langLabel: 'Язык',
    fsLabel: 'Полный экран',
    fsOpen: '⛶ Открыть',
    score: 'Очки',
    coins: 'Монеты',
    lb: 'ЛИДЕРЫ',
    boost: 'УСКОР.',
    shieldEnd: '⚠️ Защита закончилась!',
    wormDefeated: '+1 червь побеждён',
    gameOver: 'Игра окончена',
    yourScore: 'Твои очки',
    playAgain: 'ИГРАТЬ СНОВА',
    toLobby: 'Главное меню',
    recordsTitle: 'Лучшие Рекорды',
    bestScore: 'Рекорд очков',
    promoTitle: 'Спецпредложение',
    claimBonus: `Забрать +100 ${GOLD_COIN_SVG}`,
    claimed: 'Уже получено сегодня',
    friendsTitle: 'Играть с друзьями',
    createRoomTitle: '1. Создать закрытую комнату (5 цифр)',
    createRoomBtn: 'Создать',
    joinRoomTitle: '2. Войти по коду комнаты',
    joinRoomBtn: 'Войти',
    errInvalidCode: 'Введите ровно 5 цифр',
    errCodeTaken: 'Комната с этим кодом уже существует, попробуйте другой',
    errNotFound: 'Комната с таким кодом не найдена',
    shareText: 'Заходи в Vortex Worms, сыграем вместе!',
    roomShareText: 'Заходи в мою закрытую комнату в Vortex Worms (Код: {code}):',
    linkCopied: 'Ссылка скопирована'
  },
  en: {
    code: 'ENG',
    name: 'English',
    sub: 'WORMS',
    play: 'PLAY!',
    friendsBtn: '👥 With Friends',
    workshop: 'Workshop',
    hint: 'Click anywhere or drag your worm around',
    free: 'FREE',
    shopTitle: 'Workshop & Skins',
    selected: 'Selected',
    select: 'Select',
    profileTitle: 'My Profile',
    nameLabel: 'Player Name',
    avatarLabel: 'Choose Avatar',
    save: 'Save',
    newProfile: '+ New Profile',
    profilesListLabel: 'Saved Profiles',
    settingsTitle: 'Settings',
    musicLabel: '🎵 Music Volume',
    sfxLabel: '🔊 Game SFX Volume',
    langLabel: 'Language',
    fsLabel: 'Fullscreen',
    fsOpen: '⛶ Open',
    score: 'Score',
    coins: 'Coins',
    lb: 'LEADERBOARD',
    boost: 'BOOST',
    shieldEnd: '⚠️ Shield expired!',
    wormDefeated: '+1 worm defeated',
    gameOver: 'Game Over',
    yourScore: 'Your Score',
    playAgain: 'PLAY AGAIN',
    toLobby: 'Main Lobby',
    recordsTitle: 'Best Records',
    bestScore: 'High Score',
    promoTitle: 'Special Offer',
    claimBonus: `Claim +100 ${GOLD_COIN_SVG}`,
    claimed: 'Already claimed today',
    friendsTitle: 'Play With Friends',
    createRoomTitle: '1. Create Private Room (5 digits)',
    createRoomBtn: 'Create',
    joinRoomTitle: '2. Join Room by Code',
    joinRoomBtn: 'Join',
    errInvalidCode: 'Enter a 5-digit number',
    errCodeTaken: 'Room code already exists, try another code',
    errNotFound: 'Room with this code was not found',
    shareText: 'Join me in Vortex Worms and let’s play together!',
    roomShareText: 'Join my private room in Vortex Worms (Code: {code}):',
    linkCopied: 'Link copied'
  }
};

// ================= PLAYER STATE & MULTI-PROFILE LOCALSTORAGE =================
const SKINS = [
  { id: 'white_pro', name: { hy: 'Սպիտակ Չեմպիոն', ru: 'Белый Чемпион', en: 'White Champ' }, colors: ['#ffffff', '#e2e8f0', '#38bdf8'], price: 0 },
  { id: 'emerald', name: { hy: 'Զմրուխտ', ru: 'Изумруд', en: 'Emerald' }, colors: ['#10b981', '#059669', '#a7f3d0'], price: 0 },
  { id: 'fire', name: { hy: 'Կրակե Վիշապ', ru: 'Огненный', en: 'Fire Dragon' }, colors: ['#f97316', '#ef4444', '#facc15'], price: 100 },
  { id: 'neon', name: { hy: 'Նեոն Գիշեր', ru: 'Неон', en: 'Neon Night' }, colors: ['#a855f7', '#ec4899', '#38bdf8'], price: 150 },
  { id: 'gold', name: { hy: 'Ոսկե Արքա', ru: 'Золотой', en: 'Golden King' }, colors: ['#fbbf24', '#d97706', '#fef08a'], price: 250 },
  { id: 'watermelon', name: { hy: 'Ձմերուկ', ru: 'Арбузик', en: 'Watermelon' }, colors: ['#ef4444', '#22c55e', '#15803d'], price: 300 }
];
const AVATARS = ['🐛', '🐉', '🐍', '🦊', '🦁', '🐼', '🐸', '👾'];

const PROFILES_STORAGE_KEY = 'worms_profiles_v1';
const ACTIVE_PROFILE_KEY = 'worms_active_profile_id';

function createDefaultProfileData(id, name = 'Սամվել', avatar = '🐛', lang = 'hy') {
  return {
    id,
    lang,
    name,
    avatar,
    level: 1,
    xp: 35,
    coins: 250,
    bestScore: 0,
    selectedSkin: 'white_pro',
    ownedSkins: ['white_pro', 'emerald'],
    musicVol: 100,
    sfxVol: 100,
    dailyClaimed: false
  };
}

function loadAllProfiles() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY));
    if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) return raw;
  } catch (e) {}

  const defaultId = 'prof_default';
  const base = createDefaultProfileData(defaultId);
  try {
    const legacy = JSON.parse(localStorage.getItem('worms_save_v3'));
    if (legacy && typeof legacy === 'object') {
      Object.assign(base, legacy, { id: defaultId });
      if (typeof legacy.sound === 'boolean' && legacy.musicVol === undefined) {
        base.musicVol = legacy.sound ? 100 : 0;
        base.sfxVol = legacy.sound ? 100 : 0;
      }
    }
  } catch (e) {}

  const initial = { [defaultId]: base };
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(initial));
    localStorage.setItem(ACTIVE_PROFILE_KEY, defaultId);
  } catch (e) {}
  return initial;
}

let profilesMap = loadAllProfiles();
let activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
if (!activeProfileId || !profilesMap[activeProfileId]) {
  activeProfileId = Object.keys(profilesMap)[0];
  try { localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId); } catch (e) {}
}

let state = { ...createDefaultProfileData(activeProfileId), ...profilesMap[activeProfileId], id: activeProfileId };
if (typeof state.musicVol !== 'number') state.musicVol = 100;
if (typeof state.sfxVol !== 'number') state.sfxVol = 100;

function getProfilesList() {
  return Object.values(profilesMap);
}

function saveState() {
  state.id = activeProfileId;
  profilesMap[activeProfileId] = { ...state };
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profilesMap));
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    localStorage.setItem('worms_save_v3', JSON.stringify(state));
  } catch (e) {}
}

function switchProfile(profileId) {
  if (!profilesMap[profileId]) return;
  saveState();
  activeProfileId = profileId;
  try { localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId); } catch (e) {}
  state = { ...createDefaultProfileData(activeProfileId), ...profilesMap[activeProfileId], id: activeProfileId };
  saveState();
  if (typeof updateUI === 'function') updateUI();
}

function createNewProfile(customName = '') {
  saveState();
  const newId = 'prof_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const count = Object.keys(profilesMap).length + 1;
  const cleanName = (customName || '').trim() || `Player ${count}`;
  const randomAvatar = AVATARS[(count - 1) % AVATARS.length];
  const fresh = createDefaultProfileData(newId, cleanName, randomAvatar, state.lang);
  fresh.musicVol = state.musicVol;
  fresh.sfxVol = state.sfxVol;
  profilesMap[newId] = fresh;
  activeProfileId = newId;
  state = { ...fresh };
  saveState();
  if (typeof updateUI === 'function') updateUI();
}

// ================= SEPARATE MUSIC & SFX AUDIO SYNTH =================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterCompressor = null;
let masterGain = null;

function getAudioOutput() {
  if (!masterGain) {
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-16, audioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(12, audioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(6, audioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.15, audioCtx.currentTime);

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(2.6, audioCtx.currentTime);

    masterCompressor.connect(masterGain);
    masterGain.connect(audioCtx.destination);
  }
  return masterCompressor;
}

function playTone(freq, type = 'sine', dur = 0.08, vol = 0.08) {
  const sfxScale = (state.sfxVol ?? 100) / 100;
  if (sfxScale <= 0 || document.hidden) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const boostedVol = Math.min(0.45, vol * 3.0 * sfxScale);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(boostedVol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(getAudioOutput());
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}

let bgMusicTimer = null;
let bgRestartTimeout = null;
let musicStep = 0;
let musicPausedByGameOver = false;

const CALM_NOTES = [
  261.63, 329.63, 392.00, 493.88,
  440.00, 392.00, 329.63, 293.66,
  261.63, 329.63, 392.00, 523.25,
  493.88, 392.00, 349.23, 329.63
];

function playSingleMusicStep() {
  const musicScale = (state.musicVol ?? 100) / 100;
  if (musicScale <= 0 || document.hidden || musicPausedByGameOver) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const freq = CALM_NOTES[musicStep % CALM_NOTES.length];
    musicStep++;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.11 * musicScale, audioCtx.currentTime + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0005, audioCtx.currentTime + 1.1);
    osc.connect(gain);
    gain.connect(getAudioOutput());
    osc.start();
    osc.stop(audioCtx.currentTime + 1.15);
  } catch (e) {}
}

function startBgMusic() {
  if (bgMusicTimer || musicPausedByGameOver || document.hidden || (state.musicVol ?? 100) <= 0) return;
  playSingleMusicStep();
  bgMusicTimer = setInterval(playSingleMusicStep, 750);
}

function stopBgMusic() {
  if (bgRestartTimeout) {
    clearTimeout(bgRestartTimeout);
    bgRestartTimeout = null;
  }
  if (bgMusicTimer) {
    clearInterval(bgMusicTimer);
    bgMusicTimer = null;
  }
}

function restartBgMusicForMatch() {
  musicPausedByGameOver = false;
  stopBgMusic();
  musicStep = 0;
  playTone(587.33, 'triangle', 0.14, 0.08);
  bgRestartTimeout = setTimeout(() => {
    bgRestartTimeout = null;
    startBgMusic();
  }, 380);
}

function pauseAudioForBackground() {
  stopBgMusic();
  if (audioCtx.state === 'running') audioCtx.suspend().catch(() => {});
}

function resumeAudioFromBackground() {
  if (document.hidden) return;
  if (((state.musicVol ?? 100) > 0 || (state.sfxVol ?? 100) > 0) && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  if (!musicPausedByGameOver && (state.musicVol ?? 100) > 0) startBgMusic();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseAudioForBackground();
  else resumeAudioFromBackground();
});
window.addEventListener('blur', pauseAudioForBackground);
window.addEventListener('focus', resumeAudioFromBackground);
window.addEventListener('pagehide', pauseAudioForBackground);
window.addEventListener('pageshow', resumeAudioFromBackground);

window.addEventListener('pointerdown', () => {
  if (document.hidden || musicPausedByGameOver || (state.musicVol ?? 100) <= 0) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  startBgMusic();
}, { passive: true });