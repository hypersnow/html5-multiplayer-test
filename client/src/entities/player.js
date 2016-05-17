var Bullet = require("./bullet");

var Player = function(control, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'player', 0);
    game.physics.arcade.enable(this);
    this.control = control;
    if (control)
      this.body.gravity.y = 3500;
    this.updatedX = x;
    this.updatedY = y;
    this.animations.add('run', [1, 2], 10, true);
    this.anchor.setTo(0.5, 1);
    this.scale.x = 2;
    this.scale.y = 2;
    this.body.setSize(10, 30, 0, 0);
    this.tint = '0x' + (Math.round(Math.random()*Math.pow(2, 24))).toString(16);
    this.nickname = "Player " + String(game.rnd.integerInRange(1000, 9999));
    this.nicknameText = game.add.text(x + 32, y - 16, this.nickname, { fontSize: '16px', fill: '#000' })
    this.jumping = false;
    this.jump = 600;
    this.jumpPrevious = 0;
    this.jumpAmount = 0;
    this.jumpLimit = 8;
    this.moveTimer = 0;
    this.canShoot = true;
    this.shootPower = 400;
    this.shootInterval = setInterval(this.reshoot.bind(this), 120);
    this.bullets = game.add.group();
    this.bullets.classType = Bullet;
    this.bullets.enableBody = true;
    game.add.existing(this);
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.moveUpdate = function(otherPlayers, platforms, cursors) {
  game.physics.arcade.collide(this, platforms);
  if (this.control)
  {
    if (game.input.keyboard.isDown(Phaser.Keyboard.A))
      this.body.velocity.x -= 50;
    if (game.input.keyboard.isDown(Phaser.Keyboard.D))
      this.body.velocity.x += 50;
    if (!game.input.keyboard.isDown(Phaser.Keyboard.A) && !game.input.keyboard.isDown(Phaser.Keyboard.D) && !cursors.left.isDown && !cursors.right.isDown)
    {
      if (this.body.velocity.x > 0)
        this.body.velocity.x -= 50;
      else if (this.body.velocity.x < 0)
        this.body.velocity.x += 50;
      if (Math.abs(this.body.velocity.x) <= 100)
        this.body.velocity.x = 0;
    }
    if (this.body.velocity.x > 800)
      this.body.velocity.x = 800;
    else if (this.body.velocity.x < -800)
      this.body.velocity.x = -800;
    if (this.body.velocity.x > 400)
      this.body.velocity.x -= 100;
    else if (this.body.velocity.x < -400)
      this.body.velocity.x += 100;
      
    if (!this.jumping && game.input.keyboard.isDown(Phaser.Keyboard.W) && this.body.touching.down)
    {
      this.jumping = true;
      this.jumpAmount = 0;
    }
    if (this.jumping)
    {
      this.body.velocity.y = -this.jump;
      if (game.input.keyboard.isDown(Phaser.Keyboard.W) && this.jumpAmount <= this.jumpLimit)
        this.jumpAmount++;
      else
        this.jumping = false;
    }
    this.jumpPrevious = this.y;
    
    if (this.canShoot)
    {
      this.addBullet(true, this.x, this.y - 32, cursors.left.isDown, cursors.right.isDown, cursors.up.isDown, cursors.down.isDown, this.shootPower);
      if (cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.down.isDown)
      {
        socket.emit("bullet", [this.x, this.y - 32, cursors.left.isDown, cursors.right.isDown, cursors.up.isDown, cursors.down.isDown]);
        this.canShoot = false;
      }
    }
    
    if (this.body.velocity.y != 0 && !this.body.touching.down)
    {
      this.animations.stop();
      this.frame = 3;
    }
    else if (this.body.velocity.x != 0)
    {
      this.animations.play('run');
    }
    else
    {
      this.animations.stop();
      this.frame = 0;
    }
    
    if (this.body.velocity.x == 0 && this.body.velocity.y == 0)
    {
      if (this.moveTimer > 0)
        this.moveTimer--;
    }
    else
      this.moveTimer = 120;
      
    game.physics.arcade.overlap(this, this.bullets, this.hitBullet, null, this);
  }
  else
  {
    if (game.physics.arcade.distanceToXY(this, this.updatedX, this.updatedY) > 64)
    {
      this.x = this.updatedX;
      this.y = this.updatedY;
    }
    game.physics.arcade.moveToXY(this, this.updatedX, this.updatedY, 300, 60);
  }
  
  if (this.body.velocity.x != 0)
  {
    if (this.body.velocity.x > 0)
      this.scale.x = 2;
    else
      this.scale.x = -2;
  }
  
  var xBorder = 12;
  var yBorder = 64;
  if (this.x < -xBorder)
    this.x = game.world.width + xBorder;
  else if (this.x > game.world.width + xBorder)
    this.x = -xBorder;
    
  if (this.y < -yBorder)
    this.y = game.world.height + yBorder;
  else if (this.y > game.world.height + yBorder)
    this.y = -yBorder;
    
  this.bringToTop();
  this.nicknameText.bringToTop();
  this.nicknameText.text = this.nickname;
  this.nicknameText.x = this.x - 46;
  this.nicknameText.y = this.y - 84;
  
  this.bullets.forEach(function(bullet) {
    if (bullet.moveUpdate(otherPlayers, platforms))
      this.bullets.remove(bullet, true);
  }, this);
};

Player.prototype.destroy = function() {
  this.nicknameText.destroy();
  Phaser.Sprite.prototype.destroy.call(this);
};

Player.prototype.reshoot = function() {
  this.canShoot = true;
};

Player.prototype.addBullet = function(control, x, y, left, right, up, down, shootPower) {
  if (left)
  {
    if (control)
      this.body.velocity.x += shootPower;
    this.bullets.add(new Bullet(x, y, 'left', control));
  }
  if (right)
  {
    if (control)
      this.body.velocity.x -= shootPower;
    this.bullets.add(new Bullet(x, y, 'right', control));
  }
  if (up)
  {
    if (control)
      this.body.velocity.y += shootPower;
    this.bullets.add(new Bullet(x, y, 'up', control));
  }
  if (down)
  {
    if (control)
      this.body.velocity.y -= shootPower;
    this.bullets.add(new Bullet(x, y, 'down', control));
  }
};

Player.prototype.hitBullet = function(player, bullet) {
  if (!bullet.control)
  {
    this.body.velocity.x += bullet.body.velocity.x;
    this.body.velocity.y += bullet.body.velocity.y;
    bullet.destroy();
  }
};

module.exports = Player;

