const canvas = document.getElementById('tetris-board');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const nextPieceContext = nextPieceCanvas.getContext('2d');
const holdPieceCanvas = document.getElementById('hold-piece-canvas');
const holdPieceContext = holdPieceCanvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

context.canvas.width = COLS * BLOCK_SIZE;
context.canvas.height = ROWS * BLOCK_SIZE;

nextPieceContext.canvas.width = 4 * BLOCK_SIZE;
nextPieceContext.canvas.height = 4 * BLOCK_SIZE;

holdPieceCanvas.width = 4 * BLOCK_SIZE;
holdPieceCanvas.height = 4 * BLOCK_SIZE;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

let score = 0;

const COLORS = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // I
    '#0DFF72', // O
    '#F538FF', // L
    '#FF8E0D', // J
    '#FFE138', // S
    '#3877FF', // Z
];

const SHAPES = {
    'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'I': [
        [0, 0, 0, 0],
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    'O': [
        [3, 3],
        [3, 3]
    ],
    'L': [
        [0, 4, 0],
        [0, 4, 0],
        [0, 4, 4]
    ],
    'J': [
        [0, 5, 0],
        [0, 5, 0],
        [5, 5, 0]
    ],
    'S': [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0]
    ],
    'Z': [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
};

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

let piece = {
    x: 0,
    y: 0,
    shape: null,
};

let nextPiece = {
    shape: null,
};

let heldPiece = {
    shape: null,
};
let canHold = true;

let particles = [];

function draw3DBlock(x, y, color) {
    // Main block color
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);

    // Lighter shade for top and left edges (Highlight)
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.fillRect(x, y, 1, 0.1); // Top edge
    context.fillRect(x, y, 0.1, 1); // Left edge

    // Darker shade for bottom and right edges (Shadow)
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(x, y + 0.9, 1, 0.1); // Bottom edge
    context.fillRect(x + 0.9, y, 0.1, 1); // Right edge
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + 0.5, // Start from the center of the block
            y: y + 0.5,
            vx: (Math.random() - 0.5) * 0.3, // Random horizontal velocity
            vy: (Math.random() - 0.5) * 0.3, // Random vertical velocity
            life: 30, // Lifetime in frames (approx. 0.5 seconds)
            color: color,
            size: Math.random() * 0.2 + 0.05, // Random size
        });
    }
}


function draw() {
    context.fillStyle = '#34495e';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                draw3DBlock(x, y, COLORS[value]);
            }
        });
    });

    // Draw Ghost Piece
    if (piece.shape) {
        const ghostPiece = JSON.parse(JSON.stringify(piece));
        
        // Move ghost piece down until it collides
        while (!isColliding(ghostPiece)) {
            ghostPiece.y++;
        }
        ghostPiece.y--; // Move back up one step

        context.fillStyle = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent white
        ghostPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    context.fillRect(ghostPiece.x + x, ghostPiece.y + y, 1, 1);
                }
            });
        });
    }

    if (piece.shape) {
        const color = COLORS[piece.shape.flat().find(v => v > 0)];
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    draw3DBlock(piece.x + x, piece.y + y, color);
                }
            });
        });
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            context.fillStyle = p.color;
            context.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}

function drawNextPiece() {
    nextPieceContext.fillStyle = '#34495e';
    nextPieceContext.fillRect(0, 0, nextPieceContext.canvas.width, nextPieceContext.canvas.height);

    if (nextPiece.shape) {
        const shape = nextPiece.shape;
        const color = COLORS[shape[1][1] || shape[0][0] || shape[1][0] || shape[0][1]];
        const shapeSize = shape.length;
        const scale = BLOCK_SIZE;
        const offsetX = (nextPieceCanvas.width / scale - shapeSize) / 2;
        const offsetY = (nextPieceCanvas.height / scale - shapeSize) / 2;

        nextPieceContext.fillStyle = color;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const blockX = (offsetX + x) * scale;
                    const blockY = (offsetY + y) * scale;

                    // Main block color
                    nextPieceContext.fillStyle = color;
                    nextPieceContext.fillRect(blockX, blockY, scale, scale);

                    // Highlight
                    nextPieceContext.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    nextPieceContext.fillRect(blockX, blockY, scale, scale * 0.1);
                    nextPieceContext.fillRect(blockX, blockY, scale * 0.1, scale);

                    // Shadow
                    nextPieceContext.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    nextPieceContext.fillRect(blockX, blockY + scale * 0.9, scale, scale * 0.1);
                    nextPieceContext.fillRect(blockX + scale * 0.9, blockY, scale * 0.1, scale);
                }
            });
        });
    }
}

function drawHoldPiece() {
    holdPieceContext.fillStyle = '#34495e';
    holdPieceContext.fillRect(0, 0, holdPieceCanvas.width, holdPieceCanvas.height);

    if (heldPiece.shape) {
        const shape = heldPiece.shape;
        const color = COLORS[shape.flat().find(v => v > 0)];
        const shapeSize = shape.length;
        const scale = BLOCK_SIZE;
        const offsetX = (holdPieceCanvas.width / scale - shapeSize) / 2;
        const offsetY = (holdPieceCanvas.height / scale - shapeSize) / 2;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const blockX = (offsetX + x) * scale;
                    const blockY = (offsetY + y) * scale;

                    // Main block color
                    holdPieceContext.fillStyle = color;
                    holdPieceContext.fillRect(blockX, blockY, scale, scale);

                    // Highlight
                    holdPieceContext.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    holdPieceContext.fillRect(blockX, blockY, scale, scale * 0.1);
                    holdPieceContext.fillRect(blockX, blockY, scale * 0.1, scale);

                    // Shadow
                    holdPieceContext.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    holdPieceContext.fillRect(blockX, blockY + scale * 0.9, scale, scale * 0.1);
                    holdPieceContext.fillRect(blockX + scale * 0.9, blockY, scale * 0.1, scale);
                }
            });
        });
    }
}

function getRandomPiece() {
    const shapes = 'TIOLJSZ';
    const randShape = shapes[Math.floor(Math.random() * shapes.length)];
    return SHAPES[randShape];
}

function resetPiecePosition() {
    piece.y = 0;
    piece.x = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
}

function spawnNewPiece() {
    piece.shape = nextPiece.shape;
    nextPiece.shape = getRandomPiece();
    piece.y = 0;
    piece.x = Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2);
    drawNextPiece();
    if (isColliding()) {
        // Game Over
        board.forEach(row => row.fill(0));
        score = 0;
        updateScore();
        alert('게임 오버!');
    }
    canHold = true;
}

function isColliding(p = piece) {
    for (let y = 0; y < p.shape.length; y++) {
        for (let x = 0; x < p.shape[y].length; x++) {
            if (p.shape[y][x] > 0) {
                let newX = p.x + x;
                let newY = p.y + y;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (board[newY] && board[newY][newX] > 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePieceToBoard() {
    piece.shape.forEach((row, y) => {
        const color = COLORS[piece.shape.flat().find(v => v > 0)];
        row.forEach((value, x) => {
            if (value > 0) {
                createParticles(piece.x + x, piece.y + y, 5, color);
                board[piece.y + y][piece.x + x] = value;
            }
        });
    });
}

function rotate() {
    const shape = piece.shape;
    const N = shape.length;
    const newShape = Array.from({ length: N }, () => Array(N).fill(0));

    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            newShape[x][N - 1 - y] = shape[y][x];
        }
    }
    
    const oldShape = piece.shape;
    piece.shape = newShape;
    if (isColliding()) {
        piece.shape = oldShape; // revert if collision
    }
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        // Create line clear effect before removing the line
        for (let x = 0; x < COLS; x++) {
            createParticles(x, y, 8, COLORS[board[y][x]]);
        }

        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++; // re-check the same row index
        linesCleared++;
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        updateScore();
    }
}

function updateScore() {
    scoreElement.innerText = score;
}

let dropCounter = 0;
let dropInterval = 1000; // 1 second
let lastTime = 0;

function gameLoop(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        piece.y++;
        if (isColliding()) {
            piece.y--;
            mergePieceToBoard();
            clearLines();
            spawnNewPiece();
        }
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        piece.x--;
        if (isColliding()) piece.x++;
    } else if (event.key === 'ArrowRight') {
        piece.x++;
        if (isColliding()) piece.x--;
    } else if (event.key === 'ArrowDown') {
        piece.y++;
        if (isColliding()) piece.y--;
    } else if (event.key === 'ArrowUp') {
        rotate();
    } else if (event.key === ' ') { // Space for hard drop
        while (!isColliding()) {
            piece.y++;
        }
        piece.y--;
        mergePieceToBoard();
        clearLines();
        spawnNewPiece();
    } else if (event.key === 'c' || event.key === 'C') {
        if (!canHold) return;

        if (heldPiece.shape === null) {
            heldPiece.shape = piece.shape;
            spawnNewPiece();
        } else {
            [piece.shape, heldPiece.shape] = [heldPiece.shape, piece.shape]; // Swap
            resetPiecePosition();
        }
        drawHoldPiece();
        canHold = false;
    }
});

drawHoldPiece();
nextPiece.shape = getRandomPiece();
spawnNewPiece();
updateScore();
gameLoop();
