var Player = require("../entities/player");

var Game = function() {};

module.exports = Game;

Game.prototype = {
  sendIntervalTime: 60,
  fixedSendIntervalTime: 600,
  initSend: false,
  buddydistancetimer: 0,
  
  create: function() {
    this.onSocketConnect();
    this.setEventHandlers();
    
    var sky = game.add.sprite(0, 0, 'sky');
    sky.width = game.world.width;
    sky.height = game.world.height;
    
    this.player = new Player(true, 30, 30);
    this.player.name = socket.id;
    game.camera.follow(this.player, Phaser.Camera.FOLLOW_PLATFORMER);
    this.initSend = true;
    
    this.otherPlayers = game.add.group();
    this.otherPlayers.classType = Player;
    this.otherPlayers.enableBody = true;
    
    this.platforms = game.add.group();
    this.platforms.enableBody = true;
    this.addPlatform(0, game.world.height - 64, 2, 2);
    this.addPlatform(400, 400, 200, 2);
    this.addPlatform(0, 250, 1, 1);
    this.addPlatform(600, 300, 1, 1);
    this.addPlatform(800, 1500, 1, 1);
    this.addPlatform(1200, 900, 1, 1);
    
    this.coins = game.add.group();
    this.coins.enableBody = true;
    
    this.cursors = game.input.keyboard.createCursorKeys();
    
    this.coinCount = 10;
    this.coinText = game.add.text(16, 16, 'Coins: ' + this.coinCount, { fontSize: '32px', fill: '#000' });
    this.coinText.fixedToCamera = true;
  },
  
  addPlatform: function(x, y, width, height) {
    var platform = this.platforms.create(x, y, 'ground');
    platform.scale.setTo(width, height);
    platform.body.immovable = true;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
    platform.body.checkCollision.down = false;
  },
  
  setEventHandlers: function() {
    socket.on("connect", this.onSocketConnect.bind(this));
    socket.on("disconnect", this.onSocketDisconnect.bind(this));
    socket.on("player connect", this.onPlayerConnect.bind(this));
    socket.on("player update", this.onPlayerUpdate.bind(this));
    socket.on("player disconnect", this.onPlayerDisconnect.bind(this));
    socket.on("players", this.onPlayers.bind(this));
    socket.on("player count", this.onPlayers.bind(this));
    socket.on("bullet", this.onBullet.bind(this));
    socket.on("coin", this.onCoin.bind(this));
    socket.on("destroy coin", this.onDestroyCoin.bind(this));
    socket.on("got coin", this.onGotCoin.bind(this));
  },

  update: function() {
    this.player.moveUpdate(this, this.otherPlayers, this.platforms, this.cursors);
    this.game.physics.arcade.collide(this.coins, this.platforms);
    this.game.physics.arcade.overlap(this.player, this.coins, this.collectCoin, null, this);
    
    this.otherPlayers.forEach(function(otherPlayer) {
      otherPlayer.moveUpdate(this, this.otherPlayers, this.platforms, this.cursors);
    }, this);
    
    this.coins.forEach(function(coin) {
      var xBorder = 6;
      var yBorder = 64;
      if (coin.x < -xBorder)
        coin.x = game.world.width + xBorder;
      else if (coin.x > game.world.width + xBorder)
        coin.x = -xBorder;
        
      if (coin.y < -yBorder)
        coin.y = game.world.height + yBorder;
      else if (coin.y > game.world.height + yBorder)
        coin.y = -yBorder;
        
      if (coin.body.velocity.x > 0)
        coin.body.velocity.x -= 2;
      else if (coin.body.velocity.x < 0)
        coin.body.velocity.x += 2;
    }, this);
  },

  collectCoin: function(player, coin) {
    socket.emit("got coin", coin.name);
  },

  onSocketConnect: function() {
    console.log("connected to server");
    this.sendInterval = setInterval(this.sendLoop.bind(this), this.sendIntervalTime);
    this.sendInterval = setInterval(this.fixedSendLoop.bind(this), this.fixedSendIntervalTime);
  },

  onSocketDisconnect: function() {
    console.log("disconnected from server");
    clearInterval(this.sendInterval);
    game.state.start('preload');
  },

  onPlayerConnect: function(msg) {
    this.addOtherPlayer(msg);
    console.log("new player connected with id " + msg[1]);
  },

  onPlayerUpdate: function(msg) {
    for(var tempSocket in msg) {
      this.otherPlayers.forEach(function(otherPlayer) {
        if (msg[tempSocket][0] == otherPlayer.name)
        {
          otherPlayer.updatedX = msg[tempSocket][1];
          otherPlayer.updatedY = msg[tempSocket][2];
          otherPlayer.frame = msg[tempSocket][3];
          otherPlayer.body.velocity.x = msg[tempSocket][4];
          otherPlayer.body.velocity.y = msg[tempSocket][5];
          otherPlayer.coinCount = msg[tempSocket][6];
        }
        else if (msg[tempSocket][0] == this.player.name)
          this.player.coinCount = msg[tempSocket][6];
      }, this);
    }
  },

  onPlayerDisconnect: function(msg) {
    this.otherPlayers.forEach(function(otherPlayer) {
      if (msg == "/#" + otherPlayer.name)
      {
        this.otherPlayers.remove(otherPlayer);
        otherPlayer.destroy();
        console.log("player dced");
      }
    }, this);
  },
  
  onPlayers: function(msg) {
    this.otherPlayers.removeAll(true);
    for(var tempSocket in msg) {
      if (msg[tempSocket][1] != this.player.name)
        this.addOtherPlayer(msg[tempSocket]);
    }
  },
  
  onBullet: function(msg) {
    this.player.addBullet(false, msg[0], msg[1], msg[2], msg[3], msg[4], msg[5], this.player.shootPower);
  },
  
  onCoin: function(msg) {
    this.addCoin(msg[0], msg[1], msg[2], msg[3], msg[4]);
  },
  
  onDestroyCoin: function(msg) {
    this.coins.forEach(function(coin) {
      if (coin.name == msg)
      {
        this.coins.remove(coin);
        coin.destroy();
        this.addHitEffect(coin.x, coin.y);
      }
    }, this);
  },
  
  onGotCoin: function(msg) {
    this.coinCount++;
    this.coinText.text = 'Coins: ' + this.coinCount;
    this.sendPlayerUpdate();
  },
  
  fixedSendLoop: function() {
    this.sendPlayerUpdate();
    socket.emit("player count", this.otherPlayers.length + 1);
  },
  
  sendLoop: function() {
    if (this.initSend)
    {
      socket.emit("player init", [true, this.player.name, this.player.x, this.player.y, this.player.frame, this.player.nickname, this.player.tint, this.player.body.velocity.x, this.player.body.velocity.y, this.coinCount]);
      this.initSend = false;
    }
    else if (this.player.body.velocity.x != 0 || this.player.body.velocity.y != 0 || this.player.moveTimer > 0)
      this.sendPlayerUpdate();
  },
  
  sendPlayerUpdate: function() {
    socket.emit("player update", [true, this.player.x, this.player.y, this.player.frame, this.player.body.velocity.x, this.player.body.velocity.y, this.coinCount]);
  },
  
  addOtherPlayer: function(msg) {
    var otherPlayer = this.otherPlayers.add(new Player(false, msg[2], msg[3]));
    otherPlayer.name = msg[1];
    otherPlayer.frame = msg[4];
    otherPlayer.nickname = msg[5];
    otherPlayer.tint = msg[6];
    otherPlayer.body.velocity.x = msg[7];
    otherPlayer.body.velocity.y = msg[8];
  },
  
  addHitEffect: function(x, y) {
    var hitEffect = game.add.sprite(x, y, 'hit');
    hitEffect.anchor.setTo(0.5, 0.5);
    hitEffect.animations.add('anim');
    hitEffect.play('anim', 60, false, true);
  },
  
  addCoin: function(x, y, dx, dy, id) {
    var coin = this.coins.create(x, y, 'coin');
    coin.name = id;
    coin.anchor.setTo(0.5, 0.5);
    coin.animations.add('spin');
    coin.animations.play('spin', 40, true);
    coin.body.gravity.y = 1000;
    coin.body.bounce.y = 0.7;
    coin.body.velocity.x = dx;
    coin.body.velocity.y = dy;
  }
};