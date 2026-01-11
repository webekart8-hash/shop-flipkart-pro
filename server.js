const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Ludo board paths (simplified linear paths for each color, 57 steps to home)
const paths = {
  red: Array.from({length: 57}, (_, i) => i + 1),
  blue: Array.from({length: 57}, (_, i) => i + 14), // Offset for blue path
  green: Array.from({length: 57}, (_, i) => i + 27),
  yellow: Array.from({length: 57}, (_, i) => i + 40)
};

let gameState = {
  players: [
    { id: 0, color: 'red', pieces: [0,0,0,0], home: false }, // 0: home, 1-57: path positions
    { id: 1, color: 'blue', pieces: [0,0,0,0], home: false },
    { id: 2, color: 'green', pieces: [0,0,0,0], home: false },
    { id: 3, color: 'yellow', pieces: [0,0,0,0], home: false }
  ],
  currentPlayer: 0,
  dice: 0,
  board: {} // Track occupied positions for cutting
};

io.on('connection', (socket) => {
  socket.emit('update', gameState);

  socket.on('rollDice', () => {
    gameState.dice = Math.floor(Math.random() * 6) + 1;
    io.emit('update', gameState);
  });

  socket.on('movePiece', (data) => {
    const { playerId, pieceIndex } = data;
    if (playerId !== gameState.currentPlayer || gameState.dice === 0) return;

    const player = gameState.players[playerId];
    const piece = player.pieces[pieceIndex];
    const steps = gameState.dice;

    if (piece === 0 && steps !== 6) return; // Must roll 6 to exit

    let newPos = piece === 0 ? 1 : piece + steps;
    if (newPos > 57) newPos = 57; // Cap at home

    // Check for cutting (if another player's piece is at newPos, send it back)
    for (let p of gameState.players) {
      if (p.id !== playerId) {
        p.pieces.forEach((pos, idx) => {
          if (pos === newPos) {
            p.pieces[idx] = 0; // Send back to home
          }
        });
      }
    }

    player.pieces[pieceIndex] = newPos;

    // Check win
    if (player.pieces.every(p => p === 57)) {
      player.home = true;
      io.emit('win', playerId);
    }

    // Next player (skip if rolled 6)
    if (steps !== 6) {
      gameState.currentPlayer = (gameState.currentPlayer + 1) % 4;
    }
    gameState.dice = 0; // Reset dice
    io.emit('update', gameState);
  });
});

server.listen(3000, () => console.log('Server on port 3000'));
