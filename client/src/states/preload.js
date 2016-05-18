var Preload = function() {}

module.exports = Preload;

Preload.prototype = {
  preload: function() {
    if (!loaded)
    {
      var loadingText = game.add.text(16, 16, 'Loading...', {fontSize: '24px', fill: '#FFFFFF'});
      var self = this;
      game.load.image('sky', '../assets/sky.png');
      game.load.image('ground', '../assets/platform.png');
      game.load.image('bullet', '../assets/bullet.png');
      game.load.image('pixel', '../assets/pixel.png');
      game.load.spritesheet('player', '../assets/player.png', 32, 32);
      game.load.spritesheet('coin', '../assets/coin.png', 32, 32)
      game.load.spritesheet('hit', '../assets/hit.png', 32, 32);
      game.load.onLoadComplete.add(function() {
        loaded = true;
        loadingText.destroy();
        self.connect();
      });
    }
    else
      this.connect();
  },

  connect: function() {
    var connectingText = game.add.text(16, 16, 'Connecting...', {fontSize: '24px', fill: '#FFFFFF'});
    socket = io.connect(process.env.PORT);
    socket.on("connect", function() {
      connectingText.destroy();
      game.state.start('game');
    });
  },
};