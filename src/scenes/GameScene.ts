import Phaser from 'phaser';
import * as C from '../config';
import { theme, GameSettings, GameStats } from '../state';

export class GameScene extends Phaser.Scene {
  // Player state
  private playerX = C.PLAY_X + C.PLAY_W / 2;
  private playerY = C.PLAY_Y + C.PLAY_H * 0.55;
  private playerGfx!: Phaser.GameObjects.Graphics;
  private playerAngle = -Math.PI / 2; // radians; -π/2 = pointing up
  private targetAngle = -Math.PI / 2;

  // Bullet state: parallel arrays (no per-bullet speed — all use BULLET_FIXED_SPEED)
  private bulletObjs: Phaser.GameObjects.Arc[] = [];
  private bulletReady: boolean[] = []; // false while spawn animation is running

  // Item state
  private itemObjs: Phaser.GameObjects.Arc[] = [];

  // Run state
  private survivalTime = 0;
  private bulletsDestroyed = 0;
  private dead = false;
  private isPaused = false;
  private pregame = false;
  private gameStarted = false;

  // Input (global window pointer state)
  private ptrDown = false;
  private lastClientX = 0;
  private lastClientY = 0;

  // Timers
  private bulletTimer!: Phaser.Time.TimerEvent;
  private itemTimer!: Phaser.Time.TimerEvent;

  // Play-area graphics (hidden in pregame, fade in on drag-to-play)
  private playAreaGfx!: Phaser.GameObjects.Graphics;
  private separatorGfx!: Phaser.GameObjects.Graphics;

  // HUD
  private pauseBtn!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  // Pause overlay (pre-created, hidden until needed)
  private pauseOverlay!: Phaser.GameObjects.Rectangle;
  private pauseText!: Phaser.GameObjects.Text;
  private pauseSubText!: Phaser.GameObjects.Text;
  private pauseRetryBtn!: Phaser.GameObjects.Rectangle;
  private pauseRetryLabel!: Phaser.GameObjects.Text;
  private pauseHomeBtn!: Phaser.GameObjects.Rectangle;
  private pauseHomeLabel!: Phaser.GameObjects.Text;

  // Home UI state
  private homeUIElements: Phaser.GameObjects.GameObject[] = [];
  private homeBtnAreas: { x: number; y: number; r: number }[] = [];

  // -------------------------------------------------------------------
  // Global pointer handlers — stored as class properties so the same
  // function reference is passed to both addEventListener and
  // removeEventListener.
  // -------------------------------------------------------------------

  private readonly onGlobalPtrDown = (e: PointerEvent) => {
    if (!e.isPrimary) return;

    const rect = this.game.canvas.getBoundingClientRect();
    const gx = (e.clientX - rect.left) * (C.PLAYFIELD_W / rect.width);
    const gy = (e.clientY - rect.top) * (C.PLAYFIELD_H / rect.height);

    if (this.isPaused && !this.dead) {
      const onRetry = this.pauseRetryBtn.visible
        && Math.abs(gx - this.pauseRetryBtn.x) <= this.pauseRetryBtn.width / 2 + 8
        && Math.abs(gy - this.pauseRetryBtn.y) <= this.pauseRetryBtn.height / 2 + 8;
      const onHome = this.pauseHomeBtn.visible
        && Math.abs(gx - this.pauseHomeBtn.x) <= this.pauseHomeBtn.width / 2 + 8
        && Math.abs(gy - this.pauseHomeBtn.y) <= this.pauseHomeBtn.height / 2 + 8;
      if (onRetry) { this.scene.start('GameScene', { pregame: false }); return; }
      if (onHome)  { this.scene.start('GameScene', { pregame: true });  return; }
      this.resumeGame();
      return;
    }

    if (this.pregame) {
      const onBtn = this.homeBtnAreas.some(a =>
        Phaser.Math.Distance.Between(gx, gy, a.x, a.y) <= a.r
      );
      if (onBtn) return;
    }

    this.ptrDown = true;
    this.lastClientX = e.clientX;
    this.lastClientY = e.clientY;
  };

  private readonly onGlobalPtrMove = (e: PointerEvent) => {
    if (!this.ptrDown || this.dead || this.isPaused || !e.isPrimary) return;

    const rect = this.game.canvas.getBoundingClientRect();
    const rx = C.PLAYFIELD_W / rect.width;
    const ry = C.PLAYFIELD_H / rect.height;
    const dx = (e.clientX - this.lastClientX) * rx * GameSettings.sensitivity;
    const dy = (e.clientY - this.lastClientY) * ry * GameSettings.sensitivity;

    this.playerX = Phaser.Math.Clamp(
      this.playerX + dx,
      C.PLAY_X + C.PLAYER_HIT_RADIUS,
      C.PLAY_X + C.PLAY_W - C.PLAYER_HIT_RADIUS,
    );
    this.playerY = Phaser.Math.Clamp(
      this.playerY + dy,
      C.PLAY_Y + C.PLAYER_HIT_RADIUS,
      C.PLAY_Y + C.PLAY_H - C.PLAYER_HIT_RADIUS,
    );

    const moveLen = Math.sqrt(dx * dx + dy * dy);
    if (this.pregame && !this.gameStarted && moveLen > 2) {
      this.launchFromHome();
    }
    if (moveLen > 0.5) {
      this.targetAngle = Math.atan2(dy, dx);
    }
    // In pregame, update() is skipped so we must redraw the player here
    if (this.pregame) {
      this.playerAngle = this.targetAngle; // snap angle instantly (no dt lerp in pregame)
      this.drawPlayer();
    }

    this.lastClientX = e.clientX;
    this.lastClientY = e.clientY;
  };

  private readonly onGlobalPtrUp = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    this.ptrDown = false;
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { pregame?: boolean }) {
    // Reset time and tween state in case we're restarting from a paused run
    this.time.paused = false;
    this.tweens.resumeAll();

    const t = theme();

    // pregame=true when data is undefined (first launch) OR data.pregame===true
    // pregame=false when data.pregame===false (RETRY / direct game start)
    this.pregame = data?.pregame !== false;
    this.gameStarted = !this.pregame;
    this.homeUIElements = [];
    this.homeBtnAreas = [];

    // Reset run state
    this.playerX = C.PLAY_X + C.PLAY_W / 2;
    this.playerY = C.PLAY_Y + C.PLAY_H * 0.55;
    this.playerAngle = -Math.PI / 2;
    this.targetAngle = -Math.PI / 2;
    this.bulletObjs = [];
    this.bulletReady = [];
    this.itemObjs = [];
    this.survivalTime = 0;
    this.bulletsDestroyed = 0;
    this.dead = false;
    this.isPaused = false;
    this.ptrDown = false;

    // ----------------------------------------------------------------
    // Backgrounds
    // ----------------------------------------------------------------

    // Outer (HUD) background fills the full canvas
    this.add.rectangle(
      C.PLAYFIELD_W / 2,
      C.PLAYFIELD_H / 2,
      C.PLAYFIELD_W,
      C.PLAYFIELD_H,
      t.outerBg,
    ).setDepth(0);

    // Thin separator line between HUD bar and play area
    this.separatorGfx = this.add.graphics().setDepth(1);
    this.separatorGfx.lineStyle(1, t.borderColor, 0.8);
    this.separatorGfx.beginPath();
    this.separatorGfx.moveTo(0, C.HUD_H);
    this.separatorGfx.lineTo(C.PLAYFIELD_W, C.HUD_H);
    this.separatorGfx.strokePath();

    // Play area fill + border
    this.playAreaGfx = this.add.graphics().setDepth(1);
    this.playAreaGfx.fillStyle(t.playBg, 1);
    this.playAreaGfx.fillRect(C.PLAY_X, C.PLAY_Y, C.PLAY_W, C.PLAY_H);
    this.playAreaGfx.lineStyle(1.5, t.borderColor, 0.7);
    this.playAreaGfx.strokeRect(C.PLAY_X, C.PLAY_Y, C.PLAY_W, C.PLAY_H);

    if (this.pregame) {
      this.playAreaGfx.setAlpha(0);
      this.separatorGfx.setAlpha(0);
    }

    // ----------------------------------------------------------------
    // Player
    // ----------------------------------------------------------------

    this.playerGfx = this.add.graphics().setDepth(5);
    this.drawPlayer();

    // ----------------------------------------------------------------
    // HUD (within 54px bar)
    // ----------------------------------------------------------------

    const hudStyle = { fontSize: '17px', color: t.textColor, fontFamily: 'Arial, sans-serif' };
    const hudY = C.HUD_H / 2;

    // Pause button — left side
    this.pauseBtn = this.add
      .text(18, hudY, '||', { ...hudStyle, fontSize: '20px' })
      .setOrigin(0, 0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    // disableInteractive() while paused so a tap on || cannot resume+re-pause in one event
    this.pauseBtn.on('pointerup', () => {
      if (!this.dead && !this.isPaused) this.pauseGame();
    });
    this.events.on('pause-state', (paused: boolean) => {
      paused ? this.pauseBtn.disableInteractive() : this.pauseBtn.setInteractive({ useHandCursor: true });
    });

    // Score — right side (TIME removed; score = survival seconds)
    this.scoreText = this.add
      .text(C.PLAYFIELD_W - 18, hudY, '0', hudStyle)
      .setOrigin(1, 0.5)
      .setDepth(10);

    if (this.pregame) {
      this.pauseBtn.setVisible(false);
      this.scoreText.setVisible(false);
    }

    // ----------------------------------------------------------------
    // Pause overlay (hidden until paused)
    // ----------------------------------------------------------------

    const overlayCx = C.PLAY_X + C.PLAY_W / 2;
    const overlayCy = C.PLAY_Y + C.PLAY_H / 2;

    this.pauseOverlay = this.add
      .rectangle(overlayCx, overlayCy, C.PLAY_W, C.PLAY_H, 0x000000, 0.45)
      .setDepth(20)
      .setVisible(false);

    this.pauseText = this.add
      .text(C.PLAYFIELD_W / 2, overlayCy - 60, 'PAUSED', {
        fontSize: '32px',
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(21)
      .setVisible(false);

    this.pauseSubText = this.add
      .text(C.PLAYFIELD_W / 2, overlayCy - 20, 'TAP TO RESUME', {
        fontSize: '14px',
        color: '#CCCCCC',
        fontFamily: 'Arial, sans-serif',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(21)
      .setVisible(false);

    const pauseBtnStyle = { fontSize: '14px', color: t.btnText, fontFamily: 'Arial, sans-serif', letterSpacing: 2 };

    this.pauseRetryBtn = this.add
      .rectangle(overlayCx - 70, overlayCy + 50, 110, 44, t.btnBg)
      .setDepth(22).setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.pauseRetryLabel = this.add
      .text(overlayCx - 70, overlayCy + 50, 'RETRY', pauseBtnStyle)
      .setOrigin(0.5).setDepth(23).setVisible(false);

    this.pauseHomeBtn = this.add
      .rectangle(overlayCx + 70, overlayCy + 50, 110, 44, t.btnBg)
      .setDepth(22).setVisible(false)
      .setInteractive({ useHandCursor: true });

    this.pauseHomeLabel = this.add
      .text(overlayCx + 70, overlayCy + 50, 'HOME', pauseBtnStyle)
      .setOrigin(0.5).setDepth(23).setVisible(false);

    // ----------------------------------------------------------------
    // Input
    // ----------------------------------------------------------------

    window.addEventListener('pointerdown', this.onGlobalPtrDown);
    window.addEventListener('pointermove', this.onGlobalPtrMove);
    window.addEventListener('pointerup', this.onGlobalPtrUp);

    // Safety reset for canvas-level pointerup (e.g. pointer released inside canvas)
    this.input.on('pointerup', () => { this.ptrDown = false; });

    // Wire shutdown cleanup
    this.events.once('shutdown', this.shutdown, this);

    // ----------------------------------------------------------------
    // Start or show home UI
    // ----------------------------------------------------------------

    if (this.pregame) {
      this.buildHomeUI(t);
    } else {
      this.startGame();
    }
  }

  // -------------------------------------------------------------------
  // Home UI
  // -------------------------------------------------------------------

  private buildHomeUI(t: ReturnType<typeof theme>): void {
    const cx = C.PLAYFIELD_W / 2;
    const H = C.PLAYFIELD_H;

    // 1. Bullet color dots row at y=110
    const numDots = C.BULLET_COLORS.length;
    const dotSpacing = 30;
    const startDotX = cx - ((numDots - 1) * dotSpacing) / 2;
    for (let i = 0; i < numDots; i++) {
      const dot = this.add.circle(startDotX + i * dotSpacing, 110, 8, C.BULLET_COLORS[i]).setDepth(2);
      this.homeUIElements.push(dot);
    }

    // 2. Title texts
    const title1 = this.add.text(cx, 185, 'BULLET', {
      fontSize: '42px', fontStyle: 'bold', letterSpacing: 6,
      color: t.textColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5).setDepth(2);
    const title2 = this.add.text(cx, 238, 'DODGE', {
      fontSize: '42px', fontStyle: 'bold', letterSpacing: 6,
      color: t.textColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5).setDepth(2);
    this.homeUIElements.push(title1, title2);

    // 3. Best score text
    const bestText = this.add.text(cx, 310, `BEST  ${GameStats.bestScore}`, {
      fontSize: '16px', color: t.dimColor, fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5).setDepth(2);
    this.homeUIElements.push(bestText);

    // 4. Thin divider line
    const divGfx = this.add.graphics().setDepth(2);
    divGfx.lineStyle(1, t.borderColor, 0.5);
    divGfx.lineBetween(cx - 60, 340, cx + 60, 340);
    this.homeUIElements.push(divGfx);

    // 5. DRAG TO START hint
    const hintText = this.add.text(cx, 620, 'DRAG TO START', {
      fontSize: '13px', color: t.dimColor, fontFamily: 'Arial, sans-serif', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(2);
    this.homeUIElements.push(hintText);

    // 6. Four icon buttons at y = H - 80 = 764
    const btnY = H - 80;
    const btnPositions = [cx - 112, cx - 37, cx + 37, cx + 112];
    const btnIcons = ['▲', '≡', '♡', '⚙'];

    for (let i = 0; i < 4; i++) {
      const bx = btnPositions[i];

      // a. Circle outline
      const g = this.add.graphics().setDepth(2);
      g.lineStyle(1.5, t.borderColor, 0.8);
      g.strokeCircle(bx, btnY, 32);

      // b. Icon text
      const iconText = this.add.text(bx, btnY, btnIcons[i], {
        fontSize: '18px', color: t.textColor, fontFamily: 'Arial, sans-serif',
      }).setOrigin(0.5).setDepth(2);

      // c. Hit circle (invisible, interactive)
      const hitCircle = this.add.circle(bx, btnY, 32, 0, 0).setDepth(2).setInteractive({ useHandCursor: true });

      // d. Register button area
      this.homeBtnAreas.push({ x: bx, y: btnY, r: 40 });

      // Settings action on btn 3 (index 3 = ⚙)
      if (i === 3) {
        hitCircle.on('pointerup', () => {
          if (!this.pregame || this.gameStarted) return;
          this.scene.start('SettingsScene');
        });
      }

      this.homeUIElements.push(g, iconText, hitCircle);
    }
  }

  // -------------------------------------------------------------------
  // Game start
  // -------------------------------------------------------------------

  private startGame(): void {
    this.spawnBullet(); // first bullet spawns immediately
    this.scheduleBulletSpawn();
    this.itemTimer = this.time.addEvent({
      delay: C.ITEM_SPAWN_INTERVAL_MS,
      callback: this.spawnItem,
      callbackScope: this,
      loop: true,
    });
  }

  private launchFromHome(): void {
    this.gameStarted = true;
    // Fade in play area simultaneously with home UI fade-out
    this.tweens.add({
      targets: [this.playAreaGfx, this.separatorGfx],
      alpha: 1,
      duration: 300,
      ease: 'Linear',
    });
    this.tweens.add({
      targets: this.homeUIElements,
      alpha: 0,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        for (const el of this.homeUIElements) {
          (el as Phaser.GameObjects.GameObject).destroy();
        }
        this.homeUIElements = [];
        this.pregame = false;
        this.pauseBtn.setVisible(true);
        this.scoreText.setVisible(true);
        this.startGame();
      },
    });
  }

  // -------------------------------------------------------------------
  // Phaser lifecycle override — cleans up global window listeners
  // -------------------------------------------------------------------

  shutdown(): void {
    window.removeEventListener('pointerdown', this.onGlobalPtrDown);
    window.removeEventListener('pointermove', this.onGlobalPtrMove);
    window.removeEventListener('pointerup', this.onGlobalPtrUp);
  }

  // -------------------------------------------------------------------
  // Pause / Resume
  // -------------------------------------------------------------------

  private pauseGame(): void {
    if (this.pregame) return;
    this.isPaused = true;
    this.time.paused = true;
    this.tweens.pauseAll();
    this.pauseOverlay.setVisible(true);
    this.pauseText.setVisible(true);
    this.pauseSubText.setVisible(true);
    this.pauseRetryBtn.setVisible(true);
    this.pauseRetryLabel.setVisible(true);
    this.pauseHomeBtn.setVisible(true);
    this.pauseHomeLabel.setVisible(true);
    this.events.emit('pause-state', true);
  }

  private resumeGame(): void {
    this.isPaused = false;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.pauseOverlay.setVisible(false);
    this.pauseText.setVisible(false);
    this.pauseSubText.setVisible(false);
    this.pauseRetryBtn.setVisible(false);
    this.pauseRetryLabel.setVisible(false);
    this.pauseHomeBtn.setVisible(false);
    this.pauseHomeLabel.setVisible(false);
    this.events.emit('pause-state', false);
  }

  // -------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------

  private drawPlayer(dt = 0): void {
    const g = this.playerGfx;
    g.clear();
    g.x = this.playerX;
    g.y = this.playerY;

    // dt-based exponential-decay rotation so turn speed is frame-rate-independent
    const angleDiff = Phaser.Math.Angle.Wrap(this.targetAngle - this.playerAngle);
    const lerpFactor = 1 - Math.exp(-12 * dt); // 12 = rotation speed (tunable)
    this.playerAngle = Phaser.Math.Angle.Wrap(this.playerAngle + angleDiff * lerpFactor);
    g.setRotation(this.playerAngle);

    // Airship/rocket shape — nose pointing right (+X) in local space.
    // When rotation = -π/2 the nose points up (default idle pose).

    // Wings (drawn behind body)
    g.fillStyle(0xF5A623, 1);
    g.beginPath(); g.moveTo(-4, -4); g.lineTo(-8, -12); g.lineTo(-11, -4); g.closePath(); g.fillPath();
    g.beginPath(); g.moveTo(-4,  4); g.lineTo(-8,  12); g.lineTo(-11,  4); g.closePath(); g.fillPath();

    // Main body
    g.fillStyle(0xF5A623, 1);
    g.lineStyle(1.5, 0xBB6600, 1);
    g.beginPath();
    g.moveTo(13, 0);   // nose tip
    g.lineTo(5, -6);   // upper shoulder
    g.lineTo(-8, -4);  // upper back
    g.lineTo(-11, 0);  // tail
    g.lineTo(-8, 4);   // lower back
    g.lineTo(5, 6);    // lower shoulder
    g.closePath();
    g.fillPath();
    g.strokePath();

    // Cockpit / shine
    g.fillStyle(0xFFD060, 0.75);
    g.fillEllipse(3, 0, 9, 5);
  }

  // -------------------------------------------------------------------
  // Spawning
  // -------------------------------------------------------------------

  private scheduleBulletSpawn(): void {
    if (this.dead) return;
    const delay = Math.max(
      C.BULLET_SPAWN_MIN_MS,
      C.BULLET_SPAWN_START_MS - this.survivalTime * C.BULLET_SPAWN_ACCEL,
    );
    this.bulletTimer = this.time.delayedCall(delay, () => {
      if (this.dead) return;
      this.spawnBullet();
      this.scheduleBulletSpawn();
    });
  }

  private spawnBullet(): void {
    if (this.dead) return;

    // Pick a random position within the play area, retrying if too close to player
    const m = C.BULLET_SPAWN_MARGIN;
    let bx = 0;
    let by = 0;
    let attempts = 0;
    do {
      bx = Phaser.Math.FloatBetween(C.PLAY_X + m, C.PLAY_X + C.PLAY_W - m);
      by = Phaser.Math.FloatBetween(C.PLAY_Y + m, C.PLAY_Y + C.PLAY_H - m);
      attempts++;
    } while (
      Phaser.Math.Distance.Between(bx, by, this.playerX, this.playerY) < C.BULLET_SPAWN_MIN_DIST
      && attempts < 10
    );

    const color = C.BULLET_COLORS[Phaser.Math.Between(0, C.BULLET_COLORS.length - 1)];
    // Start at scale 0; tween grows it to 1 with a pop overshoot
    const bullet = this.add.circle(bx, by, C.BULLET_RADIUS, color).setDepth(3).setScale(0);

    this.bulletObjs.push(bullet);
    this.bulletReady.push(false);

    // No collision fires until the tween completes (bulletReady stays false)
    this.tweens.add({
      targets: bullet,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 480,
      ease: 'Back.easeOut',
      onComplete: () => {
        const i = this.bulletObjs.indexOf(bullet);
        if (i >= 0) this.bulletReady[i] = true;
      },
    });
  }

  private spawnItem(): void {
    if (this.dead) return;

    const ix = Phaser.Math.FloatBetween(C.PLAY_X + 60, C.PLAY_X + C.PLAY_W - 60);
    const iy = Phaser.Math.FloatBetween(C.PLAY_Y + 60, C.PLAY_Y + C.PLAY_H - 60);

    const item = this.add.circle(ix, iy, C.ITEM_RADIUS, 0xFFFDE7).setDepth(4);
    item.setStrokeStyle(2.5, 0xFFAA00, 1);

    this.tweens.add({
      targets: item,
      scaleX: 1.25, scaleY: 1.25,
      yoyo: true, repeat: -1,
      duration: 480,
      ease: 'Sine.easeInOut',
    });

    this.itemObjs.push(item);

    // Evaporate after ITEM_LIFETIME_MS if not collected
    this.time.delayedCall(C.ITEM_LIFETIME_MS, () => {
      if (this.dead) return; // scene is shutting down
      const idx = this.itemObjs.indexOf(item);
      if (idx < 0) return; // already collected
      this.tweens.killTweensOf(item);
      this.tweens.add({
        targets: item,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 500,
        ease: 'Back.easeIn',
        onComplete: () => {
          const i2 = this.itemObjs.indexOf(item);
          if (i2 >= 0) this.itemObjs.splice(i2, 1);
          item.destroy();
        },
      });
    });
  }

  // -------------------------------------------------------------------
  // Collision
  // -------------------------------------------------------------------

  private checkBulletHit(): boolean {
    const threshold = C.PLAYER_HIT_RADIUS + C.BULLET_RADIUS * C.BULLET_HIT_FACTOR;
    for (let i = 0; i < this.bulletObjs.length; i++) {
      if (!this.bulletReady[i]) continue; // skip bullets still in spawn animation
      const b = this.bulletObjs[i];
      if (Phaser.Math.Distance.Between(this.playerX, this.playerY, b.x, b.y) <= threshold) {
        return true;
      }
    }
    return false;
  }

  private checkItems(): void {
    for (let i = this.itemObjs.length - 1; i >= 0; i--) {
      const item = this.itemObjs[i];
      const d = Phaser.Math.Distance.Between(this.playerX, this.playerY, item.x, item.y);
      if (d <= C.PLAYER_HIT_RADIUS + C.ITEM_HIT_RADIUS) {
        // Destroy ALL bullets (including those still in spawn animation)
        for (const b of this.bulletObjs) {
          this.tweens.killTweensOf(b);
          b.destroy();
        }
        const destroyed = this.bulletObjs.length;
        this.bulletsDestroyed += destroyed;
        this.bulletObjs = [];
        this.bulletReady = [];

        this.tweens.killTweensOf(item);
        item.destroy();
        this.itemObjs.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------

  update(_time: number, delta: number): void {
    if (this.pregame) return;
    if (this.dead || this.isPaused) return;

    const dt = delta / 1000;
    this.survivalTime += dt;

    // Move only ready bullets toward the player (all at fixed speed)
    for (let i = 0; i < this.bulletObjs.length; i++) {
      if (!this.bulletReady[i]) continue;
      const b = this.bulletObjs[i];
      const dx = this.playerX - b.x;
      const dy = this.playerY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        b.x += (dx / dist) * C.BULLET_FIXED_SPEED * dt;
        b.y += (dy / dist) * C.BULLET_FIXED_SPEED * dt;
      }
    }

    this.drawPlayer(dt);

    // HUD update — score equals survival seconds
    const intTime = Math.floor(this.survivalTime);
    this.scoreText.setText(`${intTime}`);

    // Bullet collision takes priority — check before item collection
    if (this.checkBulletHit()) {
      this.triggerDeath();
      return;
    }

    this.checkItems();
  }

  // -------------------------------------------------------------------
  // Death
  // -------------------------------------------------------------------

  private triggerDeath(): void {
    this.dead = true;
    this.bulletTimer?.remove();
    this.itemTimer?.remove();

    this.cameras.main.shake(250, 0.012);

    // Flash red circle at player position
    this.playerGfx.clear();
    this.playerGfx.x = this.playerX;
    this.playerGfx.y = this.playerY;
    this.playerGfx.setRotation(0);
    this.playerGfx.fillStyle(0xFF4444, 1);
    this.playerGfx.fillCircle(0, 0, C.PLAYER_HIT_RADIUS + 4);

    this.time.delayedCall(700, () => {
      this.scene.start('ResultScene', {
        time: Math.floor(this.survivalTime),
        coins: this.bulletsDestroyed,
      });
    });
  }
}
