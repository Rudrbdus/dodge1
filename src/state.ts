export interface Theme {
  outerBg: number;
  playBg: number;
  borderColor: number;
  textColor: string;
  textColorHex: number;
  dimColor: string;
  btnBg: number;
  btnText: string;
  panelBg: number;
  panelBorder: number;
}

export const LIGHT: Theme = {
  outerBg: 0xF5F0E8,
  playBg: 0xF8F8F6,
  borderColor: 0xCCB89A,
  textColor: '#887766',
  textColorHex: 0x887766,
  dimColor: '#BBAA99',
  btnBg: 0x333322,
  btnText: '#F5F0E8',
  panelBg: 0xEEEAE0,
  panelBorder: 0xCCB89A,
};

export const DARK: Theme = {
  outerBg: 0x1A1A2E,
  playBg: 0x22223A,
  borderColor: 0x3A3A5E,
  textColor: '#9999CC',
  textColorHex: 0x9999CC,
  dimColor: '#5555AA',
  btnBg: 0x4444AA,
  btnText: '#E0E0FF',
  panelBg: 0x22223A,
  panelBorder: 0x44446A,
};

export const GameSettings = {
  darkMode: false,
  sensitivity: 1.0,
  sound: true,
  vibration: true,
  selectedCharacter: 0,
  selectedEffect: 0,
};

export const GameStats = {
  bestScore: 0,
  bestTime: 0,
};

try {
  const s = localStorage.getItem('bd_settings');
  if (s) Object.assign(GameSettings, JSON.parse(s));
  const t = localStorage.getItem('bd_stats');
  if (t) Object.assign(GameStats, JSON.parse(t));
} catch { /* ignore */ }

export function saveSettings(): void {
  try { localStorage.setItem('bd_settings', JSON.stringify(GameSettings)); } catch { /* ignore */ }
}

export function saveStats(): void {
  try { localStorage.setItem('bd_stats', JSON.stringify(GameStats)); } catch { /* ignore */ }
}

export function theme(): Theme {
  return GameSettings.darkMode ? DARK : LIGHT;
}
