import Phaser from 'phaser';

export type DrawFn = (g: Phaser.GameObjects.Graphics) => void;

export const CHARACTER_COUNT = 5;

export const CHARACTER_NAMES: string[] = ['CURSOR', 'SPIKE', 'BLADE', 'COMET', 'PRISM'];

// All functions draw in local space where the nose (direction of travel)
// points right (+X axis). The caller is responsible for setting g.setRotation()
// before invoking these. All shapes fit within roughly ±14px radius.

function drawCursor(g: Phaser.GameObjects.Graphics): void {
  // Main face (bright, large lower body)
  g.fillStyle(0xDDDDDD, 1);
  g.lineStyle(1, 0x888888, 1);
  g.beginPath();
  g.moveTo(13, 0);
  g.lineTo(-9, -10);
  g.lineTo(-3, 0);

  g.closePath();
  g.fillPath();
  g.strokePath();

  // Shadow face (thin upper strip — drawn on top for clean spine edge)
  g.fillStyle(0xA0A0A0, 1);
  g.lineStyle(1, 0x777777, 1);
  g.beginPath();
  g.moveTo(13, 0);
  g.lineTo(-3, 0);
  g.lineTo(-9, 10);
  g.closePath();
  g.fillPath();
  g.strokePath();
}

function drawSpike(g: Phaser.GameObjects.Graphics): void {
  // 0x0097A7 (teal-cyan) replaces 0x00E5FF (neon cyan) which had ~1.45:1
  // contrast against the cream background — effectively invisible.
  g.fillStyle(0x0097A7, 1);
  g.lineStyle(2, 0x006080, 1);
  g.beginPath();
  g.moveTo(13, 0);
  g.lineTo(2, -7);
  g.lineTo(-6, -10);
  g.lineTo(-10, -5);
  g.lineTo(-12, 0);
  g.lineTo(-10, 5);
  g.lineTo(-6, 10);
  g.lineTo(2, 7);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Inner highlight diamond
  g.fillStyle(0x40C0D4, 0.7);
  g.beginPath();
  g.moveTo(8, 0);
  g.lineTo(1, -4);
  g.lineTo(-3, 0);
  g.lineTo(1, 4);
  g.closePath();
  g.fillPath();
}

function drawBlade(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xFF1493, 1);
  g.lineStyle(2, 0x880040, 1);
  g.beginPath();
  g.moveTo(13, 0);
  g.lineTo(4, -4);
  g.lineTo(-4, -12);
  g.lineTo(-10, -9);
  g.lineTo(-5, -2);
  g.lineTo(-12, 0);
  g.lineTo(-5, 2);
  g.lineTo(-10, 9);
  g.lineTo(-4, 12);
  g.lineTo(4, 4);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Inner accent
  g.fillStyle(0xFF80C0, 0.6);
  g.beginPath();
  g.moveTo(7, 0);
  g.lineTo(0, -5);
  g.lineTo(-6, 0);
  g.lineTo(0, 5);
  g.closePath();
  g.fillPath();
}

function drawComet(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xFF8C00, 1);
  g.lineStyle(2, 0xCC4400, 1);
  g.beginPath();
  g.moveTo(13, 0);
  g.lineTo(6, -6);
  g.lineTo(-2, -8);
  g.lineTo(-5, -13);
  g.lineTo(-8, -6);
  g.lineTo(-12, 0);
  g.lineTo(-8, 6);
  g.lineTo(-5, 13);
  g.lineTo(-2, 8);
  g.lineTo(6, 6);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Gold nose accent
  g.fillStyle(0xFFDD00, 0.8);
  g.fillEllipse(7, 0, 9, 5);
}

function drawPrism(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x9B59B6, 1);
  g.lineStyle(2, 0x5B2D8E, 1);
  g.beginPath();
  g.moveTo(13, 0);
  g.lineTo(6, -9);
  g.lineTo(-4, -11);
  g.lineTo(-13, -5);
  g.lineTo(-13, 5);
  g.lineTo(-4, 11);
  g.lineTo(6, 9);
  g.closePath();
  g.fillPath();
  g.strokePath();
  // Inner facet highlight
  g.fillStyle(0xC87FE0, 0.5);
  g.beginPath();
  g.moveTo(8, 0);
  g.lineTo(3, -6);
  g.lineTo(-4, -7);
  g.lineTo(-8, 0);
  g.lineTo(-4, 7);
  g.lineTo(3, 6);
  g.closePath();
  g.fillPath();
}

export const CHARACTER_DRAW_FNS: DrawFn[] = [
  drawCursor,
  drawSpike,
  drawBlade,
  drawComet,
  drawPrism,
];
