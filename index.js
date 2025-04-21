const blessed = require('blessed');

// Create a screen object.
const screen = blessed.screen({
  autoPadding: true, // Added for potentially better layout
  smartCSR: true,
  title: 'Tetris CLI'
});

// --- Game Constants & Data ---

// Game board dimensions (in blocks)
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Tetromino shapes and their rotations
const TETROMINOES = {
  'I': [
    [[0, 1], [1, 1], [2, 1], [3, 1]], // Rotation 0
    [[1, 0], [1, 1], [1, 2], [1, 3]], // Rotation 1
    [[0, 2], [1, 2], [2, 2], [3, 2]], // Rotation 2 (same as 0 for rendering purposes)
    [[2, 0], [2, 1], [2, 2], [2, 3]]  // Rotation 3 (same as 1 for rendering purposes)
  ],
  'L': [
    [[0, 1], [1, 1], [2, 1], [2, 0]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 2], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ],
  'J': [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  'T': [
    [[0, 1], [1, 1], [2, 1], [1, 0]],
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 0], [1, 2]]
  ],
  'S': [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]], // Same as 0 for render
    [[0, 0], [0, 1], [1, 1], [1, 2]]  // Same as 1 for render
  ],
  'Z': [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]], // Same as 0 for render
    [[1, 0], [0, 1], [1, 1], [0, 2]]  // Same as 1 for render
  ],
  'O': [
    [[0, 0], [1, 0], [0, 1], [1, 1]] // Only one rotation
  ]
};

// --- Game State ---

// Initialize the game board (2D array filled with 0s)
let board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

let currentPiece = null; // Holds the current falling piece { type, rotation, x, y }
let score = 0;

// Game loop interval timer
let gameInterval = null;
const GAME_SPEED = 1000; // Milliseconds per tick (adjust for difficulty)

// List of tetromino types for random selection
const PIECE_TYPES = Object.keys(TETROMINOES);

// Create a box for the game board
const gameBox = blessed.box({
  parent: screen,
  top: 1,
  left: 'center',
  width: BOARD_WIDTH * 2 + 2, // Each block is 2 characters wide + 2 for borders
  height: BOARD_HEIGHT + 2, // + 2 for borders
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'black',
    border: {
      fg: '#f0f0f0'
    }
  }
});

// --- Rendering Functions ---

// Creates a temporary board copy for drawing the current piece
function createDisplayBoard() {
  // Deep copy the board
  const displayBoard = board.map(row => [...row]);

  // Draw the current piece onto the temporary board
  if (currentPiece) {
    const shape = TETROMINOES[currentPiece.type][currentPiece.rotation];
    shape.forEach(([dx, dy]) => {
      const x = currentPiece.x + dx;
      const y = currentPiece.y + dy;
      // Make sure it's within bounds (though collision should prevent out of bounds)
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        displayBoard[y][x] = 1; // Use 1 for active piece for now (can use piece type/color later)
      }
    });
  }
  return displayBoard;
}

function drawGame() {
  const displayBoard = createDisplayBoard();
  let content = '';
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (displayBoard[y][x]) {
        content += '[]'; // Represent a filled block (can add color later)
      } else {
        content += ' .'; // Represent an empty cell
      }
    }
    // Add newline unless it's the last row to prevent extra space at bottom
    if (y < BOARD_HEIGHT - 1) {
       content += '\n';
    }
  }
  gameBox.setContent(content.trim());
  screen.render(); // Re-render the screen after drawing
}

// --- Collision Detection ---

function isValidMove(piece, nextX, nextY, nextRotation) {
  // Ensure piece and its rotation exist before trying to access them
  if (!piece || !TETROMINOES[piece.type] || !TETROMINOES[piece.type][nextRotation]) {
      console.error("Invalid piece data in isValidMove:", piece, nextRotation);
      return false; // Should not happen with valid piece data
  }
  const shape = TETROMINOES[piece.type][nextRotation];
  for (const [dx, dy] of shape) {
    const x = nextX + dx;
    const y = nextY + dy;

    // 1. Check wall collision
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) {
      return false;
    }
    // 2. Check floor collision (only relevant when moving down)
    // (Handled by the wall check y >= BOARD_HEIGHT)

    // 3. Check collision with existing blocks on the board
    // Make sure we don't check collision for parts of the piece above the board (y < 0)
    if (y >= 0 && board[y][x] !== 0) {
      return false;
    }
  }
  return true;
}

// --- Game Logic ---

function spawnPiece() {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  const rotation = 0;
  const pieceShape = TETROMINOES[type][rotation];
  // Calculate the starting x position to center the piece
  const pieceWidth = pieceShape.reduce((max, coord) => Math.max(max, coord[0]), 0) + 1;
  const x = Math.floor((BOARD_WIDTH - pieceWidth) / 2);
  // Adjust y start based on the lowest block in the shape to avoid spawning partially off-screen
  const pieceMinY = pieceShape.reduce((min, coord) => Math.min(min, coord[1]), Infinity);
  const y = -pieceMinY; // Start piece so its lowest block is at row 0

  const newPiece = { type, rotation, x, y };

  // Check if the new piece immediately collides (Game Over condition)
  if (!isValidMove(newPiece, x, y, rotation)) {
     // Check if game over was already called (e.g. by lockPiece)
     if(gameInterval) gameOver();
     return false; // Indicate spawning failed
  }
  currentPiece = newPiece; // Assign only if valid
  return true; // Indicate spawning succeeded
}

function lockPiece() {
  if (!currentPiece) return;
  const shape = TETROMINOES[currentPiece.type][currentPiece.rotation];
  let isGameOver = false;
  shape.forEach(([dx, dy]) => {
    const x = currentPiece.x + dx;
    const y = currentPiece.y + dy;
    // Only lock blocks that are actually on the board
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      board[y][x] = 1; // Lock the piece onto the board (use 1 for now)
    }
    // Check for game over condition: piece locked entirely above the visible board
    if (y < 0) {
       isGameOver = true;
    }
  });

  const lockedPieceY = currentPiece.y; // Store y before clearing
  currentPiece = null;

  // --- Check for cleared lines ---
  let linesCleared = 0;
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      // Check if the row is full (every cell is not 0)
      if (board[y].every(cell => cell !== 0)) {
          linesCleared++;
          // Remove the full row
          board.splice(y, 1);
          // Add a new empty row at the top
          board.unshift(Array(BOARD_WIDTH).fill(0));
          // Since rows shifted down, we need to check the current y index again
          y++;
      }
  }


  // Update score (simple scoring)
  if (linesCleared > 0) {
      // Basic score: 100 per line, bonus for multiple lines
      score += linesCleared * 100 * Math.pow(2, linesCleared - 1); // e.g., 1=100, 2=400, 3=1200, 4=3200
      // Maybe update score display here if you add one
  }

  // Check game over condition *after* locking
  if (isGameOver ) { // If piece locked entirely or partially above the board.
      if (gameInterval) gameOver();
      return true; // Indicate game should end
  }
  return false; // Indicate game continues
}

function resetGameTick() {
    // Clear existing interval and restart it
    if(gameInterval) clearInterval(gameInterval);
    // Only restart if game isn't over
    if (currentPiece !== null || spawnPiece()) { // Check if a piece exists or can be spawned
        gameInterval = setInterval(gameTick, GAME_SPEED);
    }
}

function gameTick() {
  if (!currentPiece) {
     // If spawn fails here, it means game over condition was met
    if (!spawnPiece()) {
        return; // Stop the tick
    }
  }

  // Check if the current piece (which might have just spawned) can move down
  if (currentPiece && isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1, currentPiece.rotation)) {
    currentPiece.y += 1;
    drawGame(); // Draw after moving down
  } else if (currentPiece) {
    // Cannot move down, lock the current piece
    const shouldEndGame = lockPiece();
    if (shouldEndGame) {
        return; // Stop tick if lockPiece detected game over
    }
    // Attempt to spawn the next piece immediately after locking
    if (!spawnPiece()) {
        // spawnPiece calls gameOver() if it fails
        return; // Stop tick
    }
    drawGame(); // Draw the newly spawned piece
  }
  // Note: drawGame() is called within move handlers now for responsiveness
}

function startGame() {
  board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0)); // Reset board
  score = 0;
  currentPiece = null;
  // Stop any existing game loop
  if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
  }

  console.log('Starting game...');
  // Try to spawn the first piece
  if (spawnPiece()) {
    drawGame(); // Draw the initial state
    gameInterval = setInterval(gameTick, GAME_SPEED);
    console.log('Game started!');
  } else {
      // Game over immediately if first piece cannot spawn
      console.log('Initial spawn failed - Game Over.');
      // No need to call gameOver() here, spawnPiece already did
  }
}

function gameOver() {
   console.log('Executing gameOver function...');
   if (gameInterval) {
       clearInterval(gameInterval);
       gameInterval = null; // Ensure interval is cleared
   }
   currentPiece = null; // Stop trying to move the piece
   gameBox.setContent('\n\n    GAME OVER!\n\n   Score: ' + score + '\n\n Press R to restart');
   screen.render();
   console.log('Game Over displayed!');
}

// --- Key Bindings ---

// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  if (gameInterval) clearInterval(gameInterval); // Stop game loop
  return process.exit(0);
});

// Restart game
screen.key(['r', 'R'], function(ch, key) {
    console.log('Restart key pressed');
    startGame();
});

// Player Controls
screen.key(['left', 'h'], function(ch, key) {
  if (!currentPiece || !gameInterval) return; // No piece or game over
  const nextX = currentPiece.x - 1;
  if (isValidMove(currentPiece, nextX, currentPiece.y, currentPiece.rotation)) {
    currentPiece.x = nextX;
    drawGame();
  }
});

screen.key(['right', 'l'], function(ch, key) {
  if (!currentPiece || !gameInterval) return;
  const nextX = currentPiece.x + 1;
  if (isValidMove(currentPiece, nextX, currentPiece.y, currentPiece.rotation)) {
    currentPiece.x = nextX;
    drawGame();
  }
});

screen.key(['down', 'j'], function(ch, key) {
  if (!currentPiece || !gameInterval) return;
  const nextY = currentPiece.y + 1;
  if (isValidMove(currentPiece, currentPiece.x, nextY, currentPiece.rotation)) {
    currentPiece.y = nextY;
    drawGame();
    // Resetting the tick makes soft drop feel more responsive and potentially award points later
    resetGameTick();
  } else {
    // If pressing down results in collision, lock the piece immediately
    const shouldEndGame = lockPiece();
    if (!shouldEndGame) {
        if (!spawnPiece()) return; // Spawn next piece, stop if game over
    }
    drawGame(); // Draw locked piece / new piece / game over
    resetGameTick(); // Reset tick for the new piece
  }
});

screen.key(['up', 'k'], function(ch, key) {
  if (!currentPiece || !gameInterval) return;
  const pieceRotations = TETROMINOES[currentPiece.type].length;
  // Ensure current rotation is valid before calculating next
  if (typeof currentPiece.rotation !== 'number' || currentPiece.rotation < 0 || currentPiece.rotation >= pieceRotations) {
      console.error("Invalid current rotation:", currentPiece);
      currentPiece.rotation = 0; // Attempt to reset rotation
  }
  const nextRotation = (currentPiece.rotation + 1) % pieceRotations;

  if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, nextRotation)) {
    currentPiece.rotation = nextRotation;
    drawGame();
  } // TODO: Add wall kick logic here later if desired
});

screen.key(['space'], function(ch, key) {
    if (!currentPiece || !gameInterval) return;
    // Hard drop: find lowest valid position and move there
    let hardDropY = currentPiece.y;
    while (isValidMove(currentPiece, currentPiece.x, hardDropY + 1, currentPiece.rotation)) {
        hardDropY++;
    }

    let pieceMoved = false;
    if (hardDropY > currentPiece.y) {
        currentPiece.y = hardDropY;
        pieceMoved = true;
    }

    // Lock piece immediately after hard drop, check if it ends the game
    const shouldEndGame = lockPiece();
    drawGame(); // Draw the piece in its final position / game over screen

    if (!shouldEndGame) {
        if(!spawnPiece()) return; // Spawn next piece, stop if game over
        drawGame(); // Draw the new piece
        resetGameTick(); // Reset tick for the new piece
    }
});


// --- Initial Setup ---

screen.render(); // Render the screen initially (shows the empty box)
startGame(); // Start the game loop

console.log('Tetris game started. Use Arrow Keys (or HJKL) to move/rotate, Space to drop, R to restart, Esc/Q/Ctrl+C to quit.');
