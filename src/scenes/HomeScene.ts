import Phaser from 'phaser';
export class HomeScene extends Phaser.Scene {
  constructor() { super({ key: 'HomeScene' }); }
  create() { this.scene.start('GameScene', { pregame: true }); }
}
