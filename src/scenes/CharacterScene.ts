import Phaser from 'phaser';
import { theme, GameSettings, saveSettings } from '../state';
import { PLAYFIELD_W, PLAYFIELD_H } from '../config';
import { CHARACTER_COUNT, CHARACTER_NAMES, CHARACTER_DRAW_FNS } from '../characters';

const W = PLAYFIELD_W;
const H = PLAYFIELD_H;

const SLOT_POSITIONS: { x: number; y: number }[] = [
  { x: 113, y: 265 },
  { x: 240, y: 265 },
  { x: 367, y: 265 },
  { x: 177, y: 450 },
  { x: 303, y: 450 },
];

const FRAME_RADIUS = 44;

const EFFECT_CARD_Y = [155, 250, 345];
const CARD_W = 300;
const CARD_H = 80;
const CARD_CX = 240; // center of content area (x=50..430)

const EFFECT_DEFS = [
  { id: 0, name: 'NONE',       desc: 'No trail effect'         },
  { id: 1, name: 'AFTERIMAGE', desc: 'Ghost trail as you move' },
  { id: 2, name: 'TRAIL',      desc: 'Color dots behind you'   },
];

export class CharacterScene extends Phaser.Scene {
  private frameGfxList: Phaser.GameObjects.Graphics[] = [];
  private effectFrameGfxList: Phaser.GameObjects.Graphics[] = [];

  constructor() { super({ key: 'CharacterScene' }); }

  create() {
    if (SLOT_POSITIONS.length < CHARACTER_COUNT) {
      throw new Error(`CharacterScene: SLOT_POSITIONS has ${SLOT_POSITIONS.length} entries but CHARACTER_COUNT is ${CHARACTER_COUNT}`);
    }
    const t = theme();
    this.frameGfxList = [];
    this.effectFrameGfxList = [];

    // ── Background ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, t.outerBg);

    // ── Header (y=0..67, unchanged) ─────────────────────────────────────
    const backBtn = this.add.text(20, 34, '⬅ BACK', {
      fontSize: '15px', color: t.textColor,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setAlpha(0.6));
    backBtn.on('pointerout',  () => backBtn.setAlpha(1));
    backBtn.on('pointerup',   () => this.scene.start('GameScene', { pregame: true }));

    this.add.text(W/2, 34, 'SHOP', {
      fontSize: '18px', color: t.textColor,
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5, 0.5);

    const headerDiv = this.add.graphics();
    headerDiv.lineStyle(1, t.borderColor, 0.6);
    headerDiv.lineBetween(0, 68, W, 68);

    // ── Vertical tab bar divider (x=50, y=68..H) ────────────────────────
    const tabDivGfx = this.add.graphics();
    tabDivGfx.lineStyle(1, t.borderColor, 0.6);
    tabDivGfx.lineBetween(50, 68, 50, H);

    // ── Tab bar (centered at x=25) ───────────────────────────────────────
    const TAB_Y = [185, 285];
    const TAB_INDICATOR_H = 46;

    // Tab background circles (rendered first so icons appear above them)
    const tabBgGfx0 = this.add.graphics();
    const tabBgGfx1 = this.add.graphics();
    const tabBgList = [tabBgGfx0, tabBgGfx1];

    // 4px left-edge indicator rect
    const tabIndicator = this.add.graphics();

    const redrawTabBgs = (idx: number) => {
      tabBgGfx0.clear();
      tabBgGfx1.clear();
      tabBgList[idx].fillStyle(t.textColorHex, 0.18);
      tabBgList[idx].fillCircle(25, TAB_Y[idx], 20);
    };

    const redrawTabIndicator = (idx: number) => {
      tabIndicator.clear();
      tabIndicator.fillStyle(t.textColorHex, 1);
      tabIndicator.fillRect(0, TAB_Y[idx] - TAB_INDICATOR_H / 2, 4, TAB_INDICATOR_H);
    };

    redrawTabBgs(0);
    redrawTabIndicator(0);

    // Tab 0 icon: simple arrow cursor shape
    const tabIcon0 = this.add.graphics();
    tabIcon0.x = 25; tabIcon0.y = TAB_Y[0];
    tabIcon0.fillStyle(t.textColorHex, 0.8);
    tabIcon0.lineStyle(1.5, t.textColorHex, 0.9);
    tabIcon0.beginPath();
    tabIcon0.moveTo(10, 0);
    tabIcon0.lineTo(-7, -8);
    tabIcon0.lineTo(-3, 0);
    tabIcon0.lineTo(-3, 0);
    tabIcon0.lineTo(-7, 8);
    tabIcon0.closePath();
    tabIcon0.fillPath(); tabIcon0.strokePath();

    // Tab 1 icon: 3 overlapping ghost triangles (afterimage/trail concept)
    const tabIcon1 = this.add.graphics();
    tabIcon1.x = 25; tabIcon1.y = TAB_Y[1];
    const ghostPositions = [{ x: 8, a: 0.9 }, { x: -1, a: 0.5 }, { x: -10, a: 0.22 }];
    for (const gp of ghostPositions) {
      tabIcon1.fillStyle(t.textColorHex, gp.a);
      tabIcon1.fillTriangle(gp.x + 6, 0, gp.x, -6, gp.x - 5, 0);
      tabIcon1.fillTriangle(gp.x + 6, 0, gp.x, 6, gp.x - 5, 0);
    }

    // ── Content containers ───────────────────────────────────────────────
    const charContainer = this.add.container(0, 0);
    const effectContainer = this.add.container(0, 0);
    effectContainer.setVisible(false);

    // ── CHARACTER tab content ────────────────────────────────────────────
    charContainer.add(
      this.add.text(240, 100, 'SELECT YOUR CHARACTER', {
        fontSize: '11px', color: t.dimColor,
        fontFamily: 'Arial, sans-serif', letterSpacing: 3,
      }).setOrigin(0.5),
    );

    for (let charId = 0; charId < CHARACTER_COUNT; charId++) {
      const { x: slotX, y: slotY } = SLOT_POSITIONS[charId];

      const bgCircle = this.add.graphics();
      bgCircle.fillStyle(t.playBg, 0.55);
      bgCircle.fillCircle(slotX, slotY, FRAME_RADIUS);

      const frameGfx = this.add.graphics();
      this.frameGfxList.push(frameGfx);
      this.drawFrame(frameGfx, slotX, slotY, charId === GameSettings.selectedCharacter);

      const charGfx = this.add.graphics();
      charGfx.x = slotX; charGfx.y = slotY;
      CHARACTER_DRAW_FNS[charId](charGfx);
      charGfx.setScale(2);

      const nameLabel = this.add.text(slotX, slotY + 65, CHARACTER_NAMES[charId], {
        fontSize: '12px', color: t.dimColor,
        fontFamily: 'Arial, sans-serif', letterSpacing: 2,
      }).setOrigin(0.5, 0);

      const hitCircle = this.add
        .circle(slotX, slotY, FRAME_RADIUS, 0, 0)
        .setInteractive({ useHandCursor: true });

      const id = charId;
      hitCircle.on('pointerup', () => {
        GameSettings.selectedCharacter = id;
        saveSettings();
        this.redrawFrames();
      });

      charContainer.add([bgCircle, frameGfx, charGfx, nameLabel, hitCircle]);
    }

    // ── EFFECT tab content ───────────────────────────────────────────────
    effectContainer.add(
      this.add.text(240, 100, 'MOVEMENT EFFECTS', {
        fontSize: '11px', color: t.dimColor,
        fontFamily: 'Arial, sans-serif', letterSpacing: 3,
      }).setOrigin(0.5),
    );

    for (const def of EFFECT_DEFS) {
      const cy = EFFECT_CARD_Y[def.id];

      const cardGfx = this.add.graphics();
      this.effectFrameGfxList.push(cardGfx);
      this.drawEffectCard(cardGfx, CARD_CX, cy, CARD_W, CARD_H, def.id === GameSettings.selectedEffect);

      // Preview icon (left-side center: x=100, y=cy)
      const iconGfx = this.add.graphics();
      iconGfx.x = CARD_CX - CARD_W / 2 + 30; // = 70 + 30 = 100
      iconGfx.y = cy;

      if (def.id === 0) {
        iconGfx.lineStyle(2, t.borderColor, 0.6);
        iconGfx.strokeCircle(0, 0, 12);
        iconGfx.lineBetween(-8, -8, 8, 8);
      } else if (def.id === 1) {
        const positions = [{ x: 8, y: 0, a: 1.0 }, { x: -2, y: 0, a: 0.5 }, { x: -12, y: 0, a: 0.2 }];
        for (const p of positions) {
          iconGfx.fillStyle(t.textColorHex, p.a * 0.7);
          iconGfx.fillTriangle(p.x + 6, 0, p.x, -5, p.x - 5, 0);
          iconGfx.fillTriangle(p.x + 6, 0, p.x,  5, p.x - 5, 0);
        }
      } else {
        // TRAIL: colored dots representing the trail
        const dotColors = [0x54A0FF, 0x48DBFB, 0x1DD1A1];
        const dotPositions = [{ x: 8, r: 5 }, { x: 0, r: 4 }, { x: -8, r: 3 }];
        for (let di = 0; di < 3; di++) {
          const dp = dotPositions[di];
          const age = di * 0.15;
          iconGfx.fillStyle(dotColors[di], 0.9 - age * 2);
          iconGfx.fillCircle(dp.x, 0, dp.r);
        }
      }

      const textX = CARD_CX - CARD_W / 2 + 75; // right-side text start (x=145)

      const nameText = this.add.text(textX, cy - 12, def.name, {
        fontSize: '15px', color: t.textColor,
        fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      const descText = this.add.text(textX, cy + 12, def.desc, {
        fontSize: '12px', color: t.dimColor,
        fontFamily: 'Arial, sans-serif',
      }).setOrigin(0, 0.5);

      const cardHit = this.add
        .rectangle(CARD_CX, cy, CARD_W, CARD_H, 0, 0)
        .setInteractive({ useHandCursor: true });

      const effectId = def.id;
      cardHit.on('pointerup', () => {
        GameSettings.selectedEffect = effectId;
        saveSettings();
        this.redrawEffectCards();
      });

      effectContainer.add([cardGfx, iconGfx, nameText, descText, cardHit]);
    }

    // ── Tab hit areas (created last so they're on top) ───────────────────
    this.add.rectangle(25, 185, 50, 80, 0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        redrawTabBgs(0);
        redrawTabIndicator(0);
        charContainer.setVisible(true);
        effectContainer.setVisible(false);
      });

    this.add.rectangle(25, 285, 50, 80, 0, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        redrawTabBgs(1);
        redrawTabIndicator(1);
        charContainer.setVisible(false);
        effectContainer.setVisible(true);
      });
  }

  // ── Frame rendering ─────────────────────────────────────────────────────

  private drawFrame(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    selected: boolean,
  ): void {
    const t = theme();
    g.clear();
    if (selected) {
      g.fillStyle(t.textColorHex, 0.35);
      g.fillCircle(cx, cy, FRAME_RADIUS);
      g.lineStyle(2, t.textColorHex, 1);
      g.strokeCircle(cx, cy, FRAME_RADIUS);
    } else {
      g.lineStyle(1.5, t.borderColor, 0.4);
      g.strokeCircle(cx, cy, FRAME_RADIUS);
    }
  }

  private redrawFrames(): void {
    for (let charId = 0; charId < CHARACTER_COUNT; charId++) {
      const { x, y } = SLOT_POSITIONS[charId];
      this.drawFrame(
        this.frameGfxList[charId],
        x,
        y,
        charId === GameSettings.selectedCharacter,
      );
    }
  }

  // ── Effect card rendering ───────────────────────────────────────────────

  private drawEffectCard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    w: number,
    h: number,
    selected: boolean,
  ): void {
    const t = theme();
    g.clear();
    if (selected) {
      g.fillStyle(t.textColorHex, 0.1);
      g.fillRect(cx - w / 2, cy - h / 2, w, h);
      g.lineStyle(2, t.textColorHex, 1);
      g.strokeRect(cx - w / 2, cy - h / 2, w, h);
    } else {
      g.lineStyle(1, t.borderColor, 0.35);
      g.strokeRect(cx - w / 2, cy - h / 2, w, h);
    }
  }

  private redrawEffectCards(): void {
    for (let i = 0; i < EFFECT_DEFS.length; i++) {
      this.drawEffectCard(
        this.effectFrameGfxList[i],
        CARD_CX,
        EFFECT_CARD_Y[i],
        CARD_W,
        CARD_H,
        i === GameSettings.selectedEffect,
      );
    }
  }
}
