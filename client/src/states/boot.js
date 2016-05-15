var Boot = function() {}

module.exports = Boot;

Boot.prototype = {
  create: function() {
    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 2000, 2000);
    game.stage.smoothed = false;
    
    game.state.start('preload');
  }
};