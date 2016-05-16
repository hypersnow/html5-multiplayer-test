var Bullet = function(x, y, direction) {
    Phaser.Sprite.call(this, game, x, y, 'bullet', 0);
    game.physics.arcade.enable(this);
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
    setInterval(this.die.bind(this), 300);
    game.add.existing(this);
};

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

Bullet.prototype.moveUpdate = function(platforms) {
  this.bringToTop();
  return (this.game.physics.arcade.overlap(this, platforms) || this.dead);
};

Bullet.prototype.die = function() {
  this.dead = true;
}

module.exports = Bullet;