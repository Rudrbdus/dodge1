import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ResultScene } from './scenes/ResultScene';
import { CharacterScene } from './scenes/CharacterScene';
import { PLAYFIELD_W, PLAYFIELD_H } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: PLAYFIELD_W,
  height: PLAYFIELD_H,
  backgroundColor: '#1e1e2e',
  parent: 'game-container',
  scene: [GameScene, SettingsScene, ResultScene, CharacterScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3,
  },
};

const game = new Phaser.Game(config);

// ── Viewport sync (mobile Safari standalone/PWA fix) ────────────────────────
// iOS Safari — especially standalone "Add to Home Screen" mode — can settle
// its true visible viewport (tracked by the `100dvh` CSS on #game-container)
// slightly after a `resize`/`orientationchange` event, or without one firing
// at all. Phaser caches the parent size and only re-measures it inside
// getParentBounds(), so an explicit re-measure + refresh is needed on these
// events to keep the canvas correctly fitted. This only affects outer canvas
// sizing — the internal fixed PLAYFIELD_W/H gameplay coordinate space and
// input mapping are untouched.
function syncViewport() {
  // getParentBounds() re-reads #game-container's actual box (already correctly
  // sized by the `100dvh` CSS rule) before refresh() re-fits the canvas to it —
  // the same order Phaser's own fullscreen/orientation handlers use internally.
  // refresh() alone re-fits against a cached parent size and would not pick up
  // the change on this call.
  game.scale.getParentBounds();
  game.scale.refresh();
}

window.addEventListener('resize', syncViewport);
window.addEventListener('orientationchange', syncViewport);
window.visualViewport?.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('scroll', syncViewport);

// iOS standalone mode can settle its true visible size slightly after the
// initial paint (post-launch-animation); re-sync once shortly after boot to
// catch that even when no resize event ever fires.
window.requestAnimationFrame(() => setTimeout(syncViewport, 50));
