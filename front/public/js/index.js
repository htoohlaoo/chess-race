
let gameHasStarted = false;
let ready = false;
var board = null
var game = new Chess()
var $status = $('#status')
var $pgn = $('#pgn')
let $timer = $('#timer')
let timeOver = false;
let gameOver = false;

const duration = 10;
$('#startBtn').click(function startClick(){
    console.log('start btn works')
    gameHasStarted = true;
    socket.emit('startGame')
    startGame()
    updateStatus()
})
console.log('start',$('#start'))


function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false
    if (!gameHasStarted) return false;
    if (gameOver) return false;
    if ((playerColor === 'black' && piece.search(/^w/) !== -1) || (playerColor === 'white' && piece.search(/^b/) !== -1)) {
        return false;
    }

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return falseupdateStatus
    }
}

function onDrop (source, target) {
    let theMove = {
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
    };
    // see if the move is legal
    var move = game.move(theMove);
    // illegal move
    if (move === null) return 'snapback'

    socket.emit('move', theMove);
    console.log('moved')
    updateStatus()
}

socket.on('newMove', function(move) {
    game.move(move);
    board.position(game.fen());
    resetTimer();
    updateStatus();
});

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus () {
    var status = ''
    
    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }
    else if (ready && !gameHasStarted) {
        status = 'Both players have connected, Ready to play!'
    }

    else if (gameOver && timeOver) {
        const failPlayer={"b":"Black",'w':"White"};
        const winPlayer ={"b":"White",'w':"Black"};
        status = failPlayer[game.turn()]+' failed to move,'+winPlayer[game.turn()]+ ' win!'
    }
    else if (gameOver && !timeOver) {
        status = 'Opponent disconnected, you win!'
    }

    else if (!gameHasStarted) {
        status = 'Waiting for black to join'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
        
    }

    $status.html(status)
    $pgn.html(game.pgn())
}

let config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
}
board = Chessboard('myBoard', config)
if (playerColor == 'black') {
    board.flip();
}

updateStatus()

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) {
    socket.emit('joinGame', {
        code: urlParams.get('code')
    });
}

let timeLeft=duration;

function updateTimerStatus() {
    if(timeLeft>0){
        timeLeft-=0.5;
        $timer.html(timeLeft+" s");
        runTimer()
    }else{
        timeOver = true
        gameOver = true
        updateStatus()
    }
    
}
function runTimer(){
    console.log('timer start')
    setTimeout(updateTimerStatus,500)
}
function resetTimer(){
    timeLeft=duration;
}

function startGame(){
    gameHasStarted = true;
    runTimer()
}
socket.on('ready', function() {
    ready = true;
    updateStatus()
});
socket.on('startGame', function() {
    startGame();
    updateStatus()
});


socket.on('timeover', function() {
    gameOver = true;
    updateStatus()
});

socket.on('gameOverDisconnect', function() {
    gameOver = true;
    updateStatus()
});