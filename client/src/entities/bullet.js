var Bullet = function(x, y, direction, control) {
    Phaser.Sprite.call(this, game, x, y, 'bullet', 0);
    game.physics.arcade.enable(this);
    this.control = control;
    this.anchor.setTo(0.5, 0.5);
    this.speed = 1000;
    switch(direction)
    {
      case 'left':
        this.body.velocity.x = -this.speed;
        this.angle = 180;
        break;
      case 'right':
        this.body.velocity.x = this.speed;
        break;
      case 'up':
        this.body.velocity.y = -this.speed;
        this.angle = 270;
        break;
      case 'down':
        this.body.velocity.y = this.speed;
        this.angle = 90;
        break;
    }
    this.dead = false;
    this.dieInterval = setInterval(this.die.bind(this), 300);
    this.addHitEffect(this.x, this.y);
    game.add.existing(this);
};

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

Bullet.prototype.moveUpdate = function(otherPlayers, platforms) {
  this.bringToTop();
  if (this.control)
    game.physics.arcade.overlap(this, otherPlayers, this.hitOtherPlayer, null, this);
  if (this.game.physics.arcade.overlap(this, platforms))
    this.die();
  return this.dead;
};

Bullet.prototype.die = function() {
  this.dead = true;
  this.addHitEffect(this.x, this.y);
  clearInterval(this.dieInterval);
};

Bullet.prototype.hitOtherPlayer = function(bullet, otherPlayer) {
  otherPlayer.body.velocity.x += bullet.body.velocity.x;
  otherPlayer.body.velocity.y += bullet.body.velocity.y;
  this.dead = true;
};

Bullet.prototype.addHitEffect = function(x, y) {
  var hitEffect = game.add.sprite(x, y, 'hit');
  hitEffect.anchor.setTo(0.5, 0.5);
  hitEffect.animations.add('anim');
  hitEffect.play('anim', 60, false, true);
}

module.exports = Bullet;