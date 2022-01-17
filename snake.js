var dimension = [30, 30];
var fullsize = [90, 90];
var unit = 'vh';
var idIndex = -1;
var frameNum = 0;
var score = 0;
var applesToDigest = 0;
var snakeIsDead = true;
var intervalID;
var gameIsPaused = false;

var msPerFrame = 100;

var PieceType = {
    NOTHING: 1,
    APPLE: 2,
    SNAKE: 3
}
Object.freeze(PieceType);

var UnitVector = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0]
};
Object.freeze(UnitVector);


var board; // Contains rows which contain elements of form: {type, id}

function initializeBoard() {
    board = [];
    for (let i = 0; i < dimension[0]; i++) {
        let row = [];
        board.push(row);
        for (let j = 0; j < dimension[1]; j++) {
            row.push({ type: PieceType.NOTHING, id: null });
        }
    }
}

initializeBoard();

function resetBoard() {
    for (let i = 0; i < dimension[0]; i++) {
        for (let j = 0; j < dimension[1]; j++) {
            if (whatIsAtPosition(i, j) != PieceType.NOTHING) {
                removePieceFromBoard(i, j);
            }
        }
    }
    snake = [];
    frameNum = 0;
    score = 0;
    gameIsPaused = false;
    displayStatus("", "white");
}

var snake = []; // Elements of form: [x, y, ID]
var snakeVelocity = UnitVector.DOWN;

function handleKeyPress(keyCode) {
    switch (keyCode) {
        case "KeyW":
            setSnakeVelocity("UP");
            break;
        case "KeyA":
            setSnakeVelocity("LEFT");
            break;
        case "KeyS":
            setSnakeVelocity("DOWN");
            break;
        case "KeyD":
            setSnakeVelocity("RIGHT");
            break;
        case "KeyP":
            pauseGame();
            break;
        case "KeyU":
            unpauseGame();
            break;
        default:
            break;
    }
}

function getColor(pieceType) {
    switch (pieceType) {
        case PieceType.NOTHING:
            return "black";
        case PieceType.APPLE:
            return "red";
        case PieceType.SNAKE:
            return "rgb(58, 116, 58)";
        default:
            return "white";
    }
}

function whatIsAtPosition(i, j) {
    // This will kill the snake if it goes out of bounds.
    if (i < 0 || dimension[0] - 1 < i || j < 0 || dimension[1] - 1 < j) {
        return PieceType.SNAKE;
    }
    return board[i][j].type;
}

function getNewID() {
    return ++idIndex;
}

function drawTestBlock(color, i, j) {
    var horizontalScale = fullsize[0] / dimension[0];
    var verticalScale = fullsize[1] / dimension[1];
    var id = getNewID();
    document.getElementById('board').innerHTML +=
        `<div id=${id} class='block' 
            style='background-color: ${color}; transform: translate(1vh, 1vh) scale(${horizontalScale}, ${verticalScale}) translate(${i}${unit}, ${j}${unit})'></div>`;
    return id;
}

function addPieceToBoard(type, x, y) {
    // Draws the piece.
    var id = drawTestBlock(getColor(type), x, y);
    // Adds the element to the board.
    board[x][y] = { type, id };
    return id;
}

function addPieceToSnake(x, y) {
    var id = addPieceToBoard(PieceType.SNAKE, x, y);
    snake.push([x, y, id]);
    return id;
}

function removePieceFromBoard(x, y) {
    // Deletes the element from the DOM.
    var id = board[x][y].id;
    document.getElementById(id).outerHTML = "";
    // Removes the piece from the board.
    board[x][y] = { type: PieceType.NOTHING, id: null };
}

function spawnSnake() {
    snakeIsDead = false;
    var x = Math.round(Math.random() * dimension[0]);
    var y = Math.round(Math.random() * dimension[1]);
    addPieceToSnake(x, y);
}

function spawnApple() {
    var x = -1;
    var y = -1;
    // Will be an infinite loop when you win the game, if the snake doesn't die.
    while (whatIsAtPosition(x, y) !== PieceType.NOTHING) {
        x = Math.round(Math.random() * dimension[0]);
        y = Math.round(Math.random() * dimension[1]);
    }
    addPieceToBoard(PieceType.APPLE, x, y);
}

function setSnakeVelocity(vectorName) {
    var vector = UnitVector[vectorName];
    // Prevents the snake from backing into its neck.
    if (snake.length > 1) {
        var neck = snake[snake.length - 2];
        var head = snake[snake.length - 1];
        if (head[0] + vector[0] == neck[0] && head[1] + vector[1] == neck[1]) {
            return;
        }
    }
    snakeVelocity = vector;
    document.getElementById('direction').innerText = vectorName;
}

function getSnakeVelocity() {
    return snakeVelocity;
}

function contractSnakeTail() {
    // Gets the position of the tail.
    var tail = snake[0];
    var x = tail[0];
    var y = tail[1];
    // Removes the tail from the board.
    removePieceFromBoard(x, y);
    // Removes the piece from the snake.
    snake.shift();
}

// Digests an apple, if there is one to digest.
// Returns true if an apple was digested. Else, false.
function digestAnyApples() {
    if (applesToDigest > 0) {
        applesToDigest--;
        return true;
    } else {
        return false;
    }
}

function killSnake() {
    snakeIsDead = true;
    if (intervalID) {
        clearInterval(intervalID);
        intervalID = null;
        displayStatus("Snake is Dead :(", "red");
    }
}

function advanceToNextFrame() {
    if (snakeIsDead) return;
    var velocity = getSnakeVelocity();
    // Calculates the new position of the head.
    var curHead = snake[snake.length - 1];
    var newHead = [curHead[0] + velocity[0], curHead[1] + velocity[1]];
    // If no apple is digested...
    if (!digestAnyApples()) {
        // Contract the tail.
        contractSnakeTail();
    }
    // Gets the type of piece at this position.
    var pieceTypeAtPosition = whatIsAtPosition(newHead[0], newHead[1]);
    // If the snake is at this position, it dies.
    if (pieceTypeAtPosition == PieceType.SNAKE) {
        killSnake();
        return;
    }
    // If the apple is at this position, eat it.
    var appleEaten = false;
    if (pieceTypeAtPosition == PieceType.APPLE) {
        removePieceFromBoard(newHead[0], newHead[1]);
        appleEaten = true;
        applesToDigest++;
        score++;
    }
    // Add the snake head to this position.
    addPieceToSnake(newHead[0], newHead[1]);
    // If the apple was eaten, spawn a new one.
    if (appleEaten) {
        spawnApple();
    }
    frameNum++;
    document.getElementById("time").innerHTML = frameNum;
    document.getElementById("score").innerHTML = score;
}

function startGame() {
    if (!snakeIsDead) return;
    resetBoard();
    spawnSnake();
    spawnApple();
    snakeVelocity = UnitVector.DOWN;
    intervalID = setInterval(advanceToNextFrame, msPerFrame);
}

function pauseGame() {
    if (snakeIsDead || gameIsPaused) return;
    if (intervalID) {
        clearInterval(intervalID)
        intervalID = null;
        gameIsPaused = true;
        displayStatus("Paused", "white");
    }
}

function unpauseGame() {
    if (intervalID || snakeIsDead || !gameIsPaused) return;
    displayStatus("", "white");
    gameIsPaused = false;
    intervalID = setInterval(advanceToNextFrame, msPerFrame);
}

function displayStatus(message, color) {
    document.getElementById('status-message').innerHTML =
        `<span style='color:${color}'>${message}</span>`
}

// drawTestBlock('blue', 0, 0);
// drawTestBlock('blue', 1, 0);
// drawTestBlock('blue', 1, 0);