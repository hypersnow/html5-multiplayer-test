window.game = null;
window.socket = null;
window.loaded = false;

startGame();

function startGame() {
  game = new Phaser.Game(800, 600, Phaser.AUTO, '');
  socket = io();
  
  game.state.add('boot', require('./states/boot.js'));
  game.state.add('preload', require('./states/preload.js'));
  game.state.add('game', require('./states/game.js'));
    
  game.state.start('boot');
}