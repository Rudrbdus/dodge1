import Phaser from 'phaser';
import { theme, GameStats, saveStats } from '../state';
import * as C from '../config';

interface RunResult {
  time: number;  // integer seconds survived
  coins: number; // bullets destroyed via items
}

const W = C.PLAYFIELD_W;
const H = C.PLAYFIELD_H;
const cx = W / 2;

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  create(data: RunResult) {
    const { time, coins } = data;
    const t = theme();

    // Update best (score = time)
    let newBest = false;
    if (time > GameStats.bestScore) {
      GameStats.bestScore = time;
      newBest = true;
      saveStats();
    }

    // Background
    this.add.rectangle(cx, H / 2, W, H, t.outerBg);

    // Play-area panel
    const panelX = C.PLAY_X;
    const panelY = C.PLAY_Y;
    const panelW = C.PLAY_W;
    const panelH = C.PLAY_H;
    const panelCx = panelX + panelW / 2;

    const panel = this.add.rectangle(panelCx, panelY + panelH / 2, panelW, panelH, t.playBg);
    panel.setStrokeStyle(1.5, t.borderColor, 0.7);

    // Title
    this.add.text(panelCx, panelY + 80, 'YOU DIED', {
      fontSize: '34px', color: t.textColor,
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', letterSpacing: 4,
    }).setOrigin(0.5);

    if (newBest) {
      this.add.text(panelCx, panelY + 122, '✦ NEW BEST ✦', {
        fontSize: '13px', color: '#FF9F43',
        fontFamily: 'Arial, sans-serif', letterSpacing: 2,
      }).setOrigin(0.5);
    }

    // Divider
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, t.borderColor, 0.7);
    divGfx.lineBetween(panelCx - 70, panelY + 148, panelCx + 70, panelY + 148);

    const labelStyle = { fontSize: '13px', color: t.dimColor, fontFamily: 'Arial, sans-serif', letterSpacing: 1 };
    const valueStyle = { fontSize: '28px', color: t.textColor, fontFamily: 'Arial, sans-serif', fontStyle: 'bold' };

    // SCORE (time value, no "s" suffix, TIME display removed)
    this.add.text(panelCx, panelY + 185, 'SCORE', labelStyle).setOrigin(0.5);
    this.add.text(panelCx, panelY + 215, `${time}`, valueStyle).setOrigin(0.5);

    // COINS EARNED — label + value only, no box
    this.add.text(panelCx, panelY + 330, 'COINS EARNED', {
      fontSize: '12px', color: t.dimColor, fontFamily: 'Arial, sans-serif', letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(panelCx, panelY + 362, `${coins}`, {
      fontSize: '32px', color: '#FF9F20', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Best score (no "s")
    this.add.text(panelCx, panelY + 455, `BEST  ${GameStats.bestScore}`, {
      fontSize: '14px', color: t.dimColor, fontFamily: 'Arial, sans-serif', letterSpacing: 2,
    }).setOrigin(0.5);

    // Buttons
    const btnY = panelY + 560;
    this.makeBtn(panelCx - 70, btnY, 'RETRY', t, () => this.scene.start('GameScene', { pregame: false }));
    this.makeBtn(panelCx + 70, btnY, 'HOME', t, () => this.scene.start('GameScene', { pregame: true }));
  }

  private makeBtn(x: number, y: number, label: string, t: ReturnType<typeof theme>, cb: () => void) {
    const bg = this.add.rectangle(x, y, 120, 50, t.btnBg).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '16px', color: t.btnText,
      fontFamily: 'Arial, sans-serif', letterSpacing: 2,
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setAlpha(0.75));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => bg.setAlpha(0.5));
    bg.on('pointerup', cb);
  }
}
