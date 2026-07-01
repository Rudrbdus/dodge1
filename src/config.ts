// ── Canvas ──────────────────────────────────────────────────────────────────
export const PLAYFIELD_W = 390;
export const PLAYFIELD_H = 844;

// ── HUD & Play-area layout ───────────────────────────────────────────────────
export const HUD_H = 54;          // height of the top HUD bar
export const PLAY_PAD = 10;       // padding around the play area (sides + bottom)
export const PLAY_X = PLAY_PAD;
export const PLAY_Y = HUD_H + PLAY_PAD;
export const PLAY_W = PLAYFIELD_W - PLAY_PAD * 2;          // 370
export const PLAY_H = PLAYFIELD_H - HUD_H - PLAY_PAD * 2; // 770

// ── Player ──────────────────────────────────────────────────────────────────
export const PLAYER_HIT_RADIUS = 10;

// ── Bullets ─────────────────────────────────────────────────────────────────
export const BULLET_RADIUS = 7;
export const BULLET_FIXED_SPEED = 35;        // all bullets move at the same speed (px/s)
export const BULLET_SPAWN_START_MS = 1500;   // initial spawn interval
export const BULLET_SPAWN_MIN_MS = 125;      // minimum spawn interval (~8 bullets/sec max)
export const BULLET_SPAWN_ACCEL = 40;        // ms reduction per second survived
export const BULLET_SPAWN_MARGIN = 25;       // min distance from play-area edge when spawning
export const BULLET_SPAWN_MIN_DIST = 90;     // min distance from player when spawning
export const BULLET_HIT_FACTOR = 0.8;        // effective hitbox = 90% of visual radius (forgiveness margin)

export const BULLET_COLORS: number[] = [
  0xFF6B6B,
  0xFF9F43,
  0xFFED4A,
  0x1DD1A1,
  0x54A0FF,
  0xF368E0,
  0xFF9FF3,
  0x48DBFB,
];

// ── Items ───────────────────────────────────────────────────────────────────
export const ITEM_RADIUS = 18;
export const ITEM_HIT_RADIUS = 22;
export const ITEM_SPAWN_INTERVAL_MS = 10_000;
export const ITEM_LIFETIME_MS = 30_000;      // item evaporates 30s after spawn if not collected
