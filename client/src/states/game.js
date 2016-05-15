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
    
    this.player = new Player(30, 30, true);
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
    
    this.stars = game.add.group();
    this.stars.enableBody = true;
    for (var i = 0; i < 12; i++)
    {
      var star = this.stars.create(i * 70, 0, 'star');
      star.body.gravity.y = 600;
      star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }
    
    this.cursors = game.input.keyboard.createCursorKeys();
    
    this.score = 0;
    this.scoreText = game.add.text(16, 16, 'Coins: 0', { fontSize: '32px', fill: '#000' });
    this.scoreText.fixedToCamera = true;
    
    /*this.overlay = game.add.sprite(0, 0, 'pixel');
    this.overlay.width = game.world.width;
    this.overlay.height = game.world.height;
    this.overlay.alpha = 0.25;*/
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
  },

  update: function() {
    this.player.moveUpdate(this.platforms, this.cursors);
    this.game.physics.arcade.collide(this.stars, this.platforms);
    this.game.physics.arcade.overlap(this.player, this.stars, this.collectStar, null, this);
    
    this.otherPlayers.forEach(function(otherPlayer) {
      otherPlayer.moveUpdate(this.platforms, this.cursors);
    }, this);
  },

  collectStar: function(player, star) {
    star.kill();
    
    this.score += 10;
    this.scoreText.text = 'Coins: ' + this.score;
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
    var newPlayer = this.otherPlayers.add(new Player(msg[2], msg[3], false));
    newPlayer.name = msg[1];
    newPlayer.frame = msg[4];
    newPlayer.nickname = msg[5];
    newPlayer.tint = msg[6];
    console.log("new player connected with id " + msg[1]);
  },

  onPlayerUpdate: function(msg) {
    for(var tempSocket in msg) {
      this.otherPlayers.forEach(function(otherPlayer) {
        if (msg[tempSocket][0] == otherPlayer.name)
        {
          otherPlayer.x = msg[tempSocket][1];
          otherPlayer.y = msg[tempSocket][2];
          otherPlayer.frame = msg[tempSocket][3];
        }
      }, this);
    }
  },

  onPlayerDisconnect: function(msg) {
    this.otherPlayers.forEach(function(otherPlayer) {
      if (msg == "/#" + otherPlayer.name)
      {
        otherPlayer.destroy();
        console.log("player dced");
      }
    }, this);
  },
  
  onPlayers: function(msg) {
    this.otherPlayers.removeAll(true);
    for(var tempSocket in msg) {
      if (msg[tempSocket][1] != this.player.name)
      {
        var otherPlayer = this.otherPlayers.add(new Player(msg[tempSocket][2], msg[tempSocket][3], false));
        otherPlayer.name = msg[tempSocket][1];
        otherPlayer.frame = msg[tempSocket][4];
        otherPlayer.nickname = msg[tempSocket][5];
        otherPlayer.tint = msg[tempSocket][6];
      }
    }
  },
  
  fixedSendLoop: function() {
    socket.emit("player update", [true, this.player.x, this.player.y, this.player.frame]);
    socket.emit("player count", this.otherPlayers.length + 1);
  },
  
  sendLoop: function() {
    if (this.initSend)
    {
      socket.emit("player init", [true, this.player.name, this.player.x, this.player.y, this.player.frame, this.player.nickname, this.player.tint]);
      this.initSend = false;
    }
    else if (this.player.body.velocity.x != 0 || this.player.body.velocity.y != 0)
      socket.emit("player update", [true, this.player.x, this.player.y, this.player.frame]);
  }
};