var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Player = require("./entities/player").Player;

var port = process.env.PORT;
var broadcastInterval = 60;
var playerCount = 0;
var sockets = {};

app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res) {
  res.render(__dirname + '/client/index.html', {});
});

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
  });
};

function onPlayerConnect(client) {
  console.log("new player connected with id " + client.id);
  setInterval(broadcastLoop, broadcastInterval);
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
  }
}

function onPlayerCount(msg) {
  if (msg != playerCount)
    io.to(this.id).emit("players", sockets);
}

function broadcastLoop() {
  if (playerCount > 0)
  {
    var updatedSockets = {};
    for (var tempSocket in sockets) {
      if (sockets[tempSocket][0])
      {
        updatedSockets[tempSocket] = [sockets[tempSocket][1], sockets[tempSocket][2], sockets[tempSocket][3], sockets[tempSocket][4]];
        sockets[tempSocket][0] = false;
      }
    }
    io.emit("player update", updatedSockets);
  }
}

init();
