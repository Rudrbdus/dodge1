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

new Phaser.Game(config);
