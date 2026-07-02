import Phaser from 'phaser';
import { theme, GameSettings, saveSettings } from '../state';
import { PLAYFIELD_W, PLAYFIELD_H } from '../config';

const W = PLAYFIELD_W;
const H = PLAYFIELD_H;

export class SettingsScene extends Phaser.Scene {
  constructor() { super({ key: 'SettingsScene' }); }

  create() {
    const t = theme();

    // ── Background ────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, t.outerBg);

    // ── Header ────────────────────────────────────────────────────────────
    const backBtn = this.add.text(20, 34, '⬅ BACK', {
      fontSize: '15px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setAlpha(0.6));
    backBtn.on('pointerout',  () => backBtn.setAlpha(1));
    backBtn.on('pointerup',   () => this.scene.start('GameScene', { pregame: true }));

    this.add.text(W/2, 34, 'SETTINGS', {
      fontSize: '18px', color: t.textColor,
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5, 0.5);

    const headerDiv = this.add.graphics();
    headerDiv.lineStyle(1, t.borderColor, 0.6);
    headerDiv.lineBetween(0, 68, W, 68);

    // ── Row 1 — SIGN IN / SIGN UP (y = 115) ──────────────────────────────
    const signInBtn  = this.add.rectangle(150, 115, 110, 44, t.btnBg).setInteractive({ useHandCursor: true });
    this.add.text(150, 115, 'SIGN IN', {
      fontSize: '13px', color: t.btnText, fontFamily: 'Arial, sans-serif', letterSpacing: 2,
    }).setOrigin(0.5);

    const signUpBtn = this.add.rectangle(280, 115, 110, 44, t.btnBg).setInteractive({ useHandCursor: true });
    this.add.text(280, 115, 'SIGN UP', {
      fontSize: '13px', color: t.btnText, fontFamily: 'Arial, sans-serif', letterSpacing: 2,
    }).setOrigin(0.5);

    for (const btn of [signInBtn, signUpBtn]) {
      btn.on('pointerover',  () => btn.setAlpha(0.75));
      btn.on('pointerout',   () => btn.setAlpha(1));
      btn.on('pointerdown',  () => btn.setAlpha(0.5));
      btn.on('pointerup',    () => btn.setAlpha(1));
    }

    const rowDiv1 = this.add.graphics();
    rowDiv1.lineStyle(1, t.borderColor, 0.25);
    rowDiv1.lineBetween(0, 150, W, 150);

    // ── Row 2 — SENSITIVITY (label y = 175, slider y = 220) ──────────────
    this.add.text(24, 175, 'SENSITIVITY', {
      fontSize: '15px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5);

    const valueText = this.add.text(406, 175, GameSettings.sensitivity.toFixed(2), {
      fontSize: '14px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(1, 0.5);

    this.makeSensSlider(valueText);

    // Scale labels below track
    this.add.text(30,  240, '0.5', {
      fontSize: '11px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0);
    this.add.text(215, 240, '1.0', {
      fontSize: '11px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0);
    this.add.text(400, 240, '1.5', {
      fontSize: '11px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0);

    const rowDiv2 = this.add.graphics();
    rowDiv2.lineStyle(1, t.borderColor, 0.25);
    rowDiv2.lineBetween(0, 260, W, 260);

    // ── Row 3 — SOUND slider (disabled, y = 295 label, y = 335 track) ─────
    this.add.text(24, 295, 'SOUND', {
      fontSize: '15px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5);

    this.add.text(406, 295, '100', {
      fontSize: '14px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(1, 0.5).setAlpha(0.4);

    this.makeDisabledSlider(335, 400);

    this.add.text(30,  350, '0', {
      fontSize: '11px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0).setAlpha(0.4);
    this.add.text(400, 350, '100', {
      fontSize: '11px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0).setAlpha(0.4);

    const rowDiv3 = this.add.graphics();
    rowDiv3.lineStyle(1, t.borderColor, 0.25);
    rowDiv3.lineBetween(0, 370, W, 370);

    // ── Row 4 — VIBRATION (y = 405) ───────────────────────────────────────
    this.add.text(24, 405, 'VIBRATION', {
      fontSize: '15px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5);
    this.makeToggle(370, 405, 'vibration', true);

    const rowDiv4 = this.add.graphics();
    rowDiv4.lineStyle(1, t.borderColor, 0.25);
    rowDiv4.lineBetween(0, 440, W, 440);

    // ── Row 5 — DARK MODE (y = 475) ───────────────────────────────────────
    this.add.text(24, 475, 'DARK MODE', {
      fontSize: '15px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5);
    this.makeToggle(370, 475, 'darkMode');

    const rowDiv5 = this.add.graphics();
    rowDiv5.lineStyle(1, t.borderColor, 0.25);
    rowDiv5.lineBetween(0, 510, W, 510);

    // ── Version ───────────────────────────────────────────────────────────
    this.add.text(W/2, 804, 'v0.1.0', {
      fontSize: '12px', color: t.dimColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5, 0.5);
  }

  private makeToggle(cx: number, cy: number, key: keyof typeof GameSettings, disabled = false): void {
    const trackGfx = this.add.graphics();
    const thumb = this.add.circle(0, cy, 11, 0xFFFFFF);

    const redraw = () => {
      const on = GameSettings[key] as boolean;
      trackGfx.clear();
      const color = disabled ? 0x666666 : (on ? 0x5B8CF6 : 0x888888);
      trackGfx.fillStyle(color, disabled ? 0.4 : 1);
      trackGfx.fillRoundedRect(cx - 27, cy - 14, 54, 28, 14);
      thumb.x = on ? cx + 13 : cx - 13;
      thumb.setAlpha(disabled ? 0.4 : 1);
    };
    redraw();

    if (!disabled) {
      const hit = this.add.rectangle(cx, cy, 70, 36, 0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        (GameSettings as Record<string, unknown>)[key] = !GameSettings[key];
        saveSettings();
        if (key === 'darkMode') this.scene.restart();
        else redraw();
      });
    }
  }

  private makeSensSlider(valueText: Phaser.GameObjects.Text): void {
    const TRACK_X1 = 30, TRACK_X2 = 400, TRACK_Y = 220;
    const SENS_MIN = 0.5, SENS_RANGE = 1.0; // range [0.5, 1.5] so 1.0 is at center
    const thumbFill = GameSettings.darkMode ? 0x4444AA : 0x333322;
    const borderNum  = GameSettings.darkMode ? 0x3A3A5E : 0xCCB89A;

    // Clamp saved value to the new range; persist if it changed
    const clamped = Phaser.Math.Clamp(GameSettings.sensitivity, SENS_MIN, SENS_MIN + SENS_RANGE);
    if (clamped !== GameSettings.sensitivity) {
      GameSettings.sensitivity = clamped;
      saveSettings();
    }

    const trackGfx = this.add.graphics();
    trackGfx.lineStyle(2, borderNum, 0.8);
    trackGfx.lineBetween(TRACK_X1, TRACK_Y, TRACK_X2, TRACK_Y);

    const getX = () => {
      const t01 = (GameSettings.sensitivity - SENS_MIN) / SENS_RANGE;
      return TRACK_X1 + t01 * (TRACK_X2 - TRACK_X1);
    };

    const thumb = this.add.circle(getX(), TRACK_Y, 11, thumbFill);
    thumb.setStrokeStyle(1.5, borderNum, 1);
    thumb.setInteractive({ useHandCursor: true });
    this.input.setDraggable(thumb);

    this.input.on('drag', (_ptr: unknown, obj: unknown, dragX: number) => {
      if (obj !== thumb) return;
      const x = Phaser.Math.Clamp(dragX, TRACK_X1, TRACK_X2);
      thumb.x = x;
      thumb.y = TRACK_Y;
      const t01 = (x - TRACK_X1) / (TRACK_X2 - TRACK_X1);
      const raw = SENS_MIN + t01 * SENS_RANGE;
      GameSettings.sensitivity = Math.round(raw / 0.05) * 0.05;
      saveSettings();
      valueText.setText(GameSettings.sensitivity.toFixed(2));
    });
  }

  private makeDisabledSlider(trackY: number, thumbX: number): void {
    const TRACK_X1 = 30, TRACK_X2 = 400;
    const thumbFill = GameSettings.darkMode ? 0x4444AA : 0x333322;
    const borderNum  = GameSettings.darkMode ? 0x3A3A5E : 0xCCB89A;

    const trackGfx = this.add.graphics();
    trackGfx.lineStyle(2, borderNum, 0.3);
    trackGfx.lineBetween(TRACK_X1, trackY, TRACK_X2, trackY);

    const thumb = this.add.circle(thumbX, trackY, 11, thumbFill);
    thumb.setStrokeStyle(1.5, borderNum, 0.3);
    thumb.setAlpha(0.4);
  }
}
