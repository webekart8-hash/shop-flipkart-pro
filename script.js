const socket = io();
const board = document.getElementById('board');
const rollDiceBtn = document.getElementById('rollDice');
const diceDisplay = document.getElementById('dice');
const currentPlayerDisplay = document.getElementById('currentPlayer');

let gameState = {};
const colors = ['red', 'blue', 'green', 'yellow'];

// Simplified board positions (cross-shaped, but linear for paths)
const positions = [];
for (let i = 0; i < 15; i++) {
  for (let j = 0; j < 15; j++) {
    if ((i >= 6 && i <= 8) || (j >= 6 && j <= 8)) {
      positions.push({ x: i * 40, y: j * 40, type: 'path' });
    } else {
      positions.push({ x: i * 40, y: j * 40, type: 'home' });
    }
  }
}

positions.forEach(pos => {
  const div = document.createElement('div');
  div.className = pos.type;
  div.style.left = `${pos.x}px`;
  div.style.top = `${pos.y}px`;
  board.appendChild(div);
});

socket.on('update', (state) => {
  gameState = state;
  diceDisplay.textContent = `Dice: ${state.dice}`;
  currentPlayerDisplay.textContent = `Current Player: ${colors[state.currentPlayer]}`;
  updatePieces();
});

socket.on('win', (playerId) => {
  alert(`${colors[playerId]} wins!`);
});

rollDiceBtn.addEventListener('click', () => {
  socket.emit('rollDice');
});

function updatePieces() {
  document.querySelectorAll('.piece').forEach(p => p.remove());
  gameState.players.forEach((player, pId) => {
    player.pieces.forEach((pos, idx) => {
      if (pos > 0) {
        const piece = document.createElement('div');
        piece.className = `piece ${colors[pId]}`;
        // Map pos to board coordinates (simplified)
        const x = (pos % 15) * 40 + 5;
        const y = Math.floor(pos / 15) * 40 + 5;
        piece.style.left = `${x}px`;
        piece.style.top = `${y}px`;
        piece.addEventListener('click', () => {
          if (pId === gameState.currentPlayer && gameState.dice > 0) {
            socket.emit('movePiece', { playerId: pId, pieceIndex: idx });
          }
        });
        board.appendChild(piece);
      }
    });
  });
}
