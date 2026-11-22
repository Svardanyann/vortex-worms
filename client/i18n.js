// ================= LOCALIZATION =================
const LANGS = ['hy', 'ru', 'en'];
const I18N = {
  hy: {
    code: 'ՀԱՅ',
    name: 'Հայերեն',
    sub: 'WORMS',
    play: 'ՄԱՐՏԻ՛',
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
    soundLabel: 'Ձայն և Երաժշտություն',
    soundOn: '🔊 Միացված',
    soundOff: '🔇 Անջատված',
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
    claimBonus: 'Ստանալ +100 🪙',
    claimed: 'Արդեն ստացել ես այսօր'
  },
  ru: {
    code: 'РУС',
    name: 'Русский',
    sub: 'WORMS',
    play: 'В БОЙ!',
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
    soundLabel: 'Звук и Музыка',
    soundOn: '🔊 Вкл',
    soundOff: '🔇 Выкл',
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
    claimBonus: 'Забрать +100 🪙',
    claimed: 'Уже получено сегодня'
  },
  en: {
    code: 'ENG',
    name: 'English',
    sub: 'WORMS',
    play: 'PLAY!',
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
    soundLabel: 'Sound & Music',
    soundOn: '🔊 On',
    soundOff: '🔇 Off',
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
    claimBonus: 'Claim +100 🪙',
    claimed: 'Already claimed today'
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

function createDefaultProfileData(id, name = 'Սամվել', avatar = '🐛', lang = 'hy', sound = true) {
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
    sound,
    dailyClaimed: false
  };
}

function loadAllProfiles() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY));
    if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
      return raw;
    }
  } catch (e) {}

  // Migrate legacy single save if it exists
  const defaultId = 'prof_default';
  const base = createDefaultProfileData(defaultId);
  try {
    const legacy = JSON.parse(localStorage.getItem('worms_save_v3'));
    if (legacy && typeof legacy === 'object') {
      Object.assign(base, legacy, { id: defaultId });
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
  const fresh = createDefaultProfileData(newId, cleanName, randomAvatar, state.lang, state.sound);
  profilesMap[newId] = fresh;
  activeProfileId = newId;
  state = { ...fresh };
  saveState();
  if (typeof updateUI === 'function') updateUI();
}

// ================= SOUND & CALM AMBIENT MUSIC SYNTH =================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type = 'sine', dur = 0.08, vol = 0.08) {
  if (!state.sound) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  } catch(e) {}
}

// Gentle, relaxing ambient melody loop during gameplay
let bgMusicTimer = null;
let musicStep = 0;
const CALM_NOTES = [
  261.63, 329.63, 392.00, 493.88,
  440.00, 392.00, 329.63, 293.66,
  261.63, 329.63, 392.00, 523.25,
  493.88, 392.00, 349.23, 329.63
];

function startBgMusic() {
  stopBgMusic();
  bgMusicTimer = setInterval(() => {
    if (!inGame || !state.sound) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const freq = CALM_NOTES[musicStep % CALM_NOTES.length];
      musicStep++;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.025, audioCtx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0005, audioCtx.currentTime + 1.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.15);
    } catch(e) {}
  }, 750);
}

function stopBgMusic() {
  if (bgMusicTimer) {
    clearInterval(bgMusicTimer);
    bgMusicTimer = null;
  }
}