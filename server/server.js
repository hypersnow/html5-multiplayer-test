var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Player = require("./entities/player").Player;

var port = process.env.PORT;
var broadcastInterval = 60;
var coinInterval = 30000;
var playerCount = 0;
var sockets = {};
var coins = {};
var coinCount = 0;

app.use(express.static('../client'));

http.listen(port, function() {
  console.log('listening on ' + port);
});

function init() {
  setEventHandlers();
}

var setEventHandlers = function() {
  io.on("connection", function(client) {
    onPlayerConnect(client);
    client.on("disconnect", onPlayerDisconnect);
    client.on("player init", onPlayerInit);
    client.on("player update", onPlayerUpdate);
    client.on("player count", onPlayerCount);
    client.on("player hit", onPlayerHit);
    client.on("bullet", onBullet);
    client.on("got coin", onGotCoin);
  });
};

function onPlayerConnect(client) {
  console.log("new player connected with id " + client.id);
  setInterval(broadcastLoop, broadcastInterval);
  setInterval(coinLoop, coinInterval);
}

function onPlayerDisconnect() {
  console.log("player has disconnected with id " + this.id);
  this.broadcast.emit("player disconnect", this.id);
  if (sockets[this.id] != null)
    playerCount--;
  delete sockets[this.id];
}

function onPlayerInit(msg) {
  sockets[this.id] = msg;
  io.to(this.id).emit("players", sockets);
  this.broadcast.emit("player connect", sockets[this.id]);
  playerCount++;
}

function onPlayerUpdate(msg) {
  if (sockets[this.id] != null)
  {
    sockets[this.id][0] = msg[0];
    sockets[this.id][2] = msg[1];
    sockets[this.id][3] = msg[2];
    sockets[this.id][4] = msg[3];
    sockets[this.id][7] = msg[4];
    sockets[this.id][8] = msg[5];
    sockets[this.id][9] = msg[6];
  }
}

function onPlayerCount(msg) {
  if (msg != playerCount)
    io.to(this.id).emit("players", sockets);
}

function onPlayerHit(msg) {
  io.emit("coin", [msg[0], msg[1], getRandomInt(-300, 300), getRandomInt(-800, -400), coinCount]);
  coins[coinCount] = false;
  coinCount++;
  sockets[this.id][9]--;
}

function onGotCoin(msg) {
  if (coins[msg] != null && !coins[msg])
  {
    coins[msg] = true;
    io.emit("destroy coin", msg);
    io.to(this.id).emit("got coin", 0);
    sockets[this.id][9]++;
  }
}

function onBullet(msg) {
  this.broadcast.emit("bullet", msg);
}

function broadcastLoop() {
  if (playerCount > 0)
  {
    var updatedSockets = {};
    for (var tempSocket in sockets) {
      if (sockets[tempSocket][0])
      {
        updatedSockets[tempSocket] = [sockets[tempSocket][1], sockets[tempSocket][2], sockets[tempSocket][3], sockets[tempSocket][4], sockets[tempSocket][7], sockets[tempSocket][8], sockets[tempSocket][9]];
        sockets[tempSocket][0] = false;
      }
    }
    io.emit("player update", updatedSockets);
  }
}

function coinLoop() {
  if (playerCount > 0)
  {
    io.emit("coin", [getRandomInt(0, 2000), getRandomInt(0, 2000), getRandomInt(-800, 800), getRandomInt(-800, 800), coinCount]);
    coins[coinCount] = false;
    coinCount++;
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

init();
