$(document).ready(function() {
    console.log("document ready");
    $("#game-board").html(boardTemplate());
    init();
});




const whoAmI = 0;

const state = {
    players: [
        {
            "Name": "Wapato Willie",
            "Color": "Yellow",
            "Position": 0,
            "Cash": 5000,
            "Debt": 5000,
            "Hay": {
                "Acres": 10,
                "DoubleHay": false,
            },
            "Grain" : {
                "Acres": 10,
                "DoubleCorn": false,
            },
            "Fruit" : {
                "Acres": 5,
            },
            "Livestock" : {
                "Farm": 20,
                "Ahtanum": 0,
                "Rattlesnake": 0,
                "Toppenish": 0,
                "Cascades": 0,
            },
            "Tractors": 0,
            "Harvesters": 0,
            "OTB": [],
            "Fate": [],
        },
        {
            "Name": "Toppenish Tom",
            "Color": "Green",
            "Position": 0,
            "Cash": 2500,
            "Debt": 12000,
            "Hay": {
                "Acres": 40,
                "DoubleHay": true,
            },
            "Grain" : {
                "Acres": 10,
                "DoubleCorn": false,
            },
            "Fruit" : {
                "Acres": 5,
            },
            "Livestock" : {
                "Farm": 10,
                "Ahtanum": 0,
                "Rattlesnake": 30,
                "Toppenish": 50,
                "Cascades": 0,
            },
            "Tractors": 1,
            "Harvesters": 1,
            "OTB": [],
            "Fate": [],
        },
        {
            "Name": "Roza Ray",
            "Color": "Brown",
            "Position": 35,
            "Cash": 6900,
            "Debt": 12000,
            "Hay": {
                "Acres": 20,
                "DoubleHay": false,
            },
            "Grain" : {
                "Acres": 10,
                "DoubleCorn": true,
            },
            "Fruit" : {
                "Acres": 15,
            },
            "Livestock" : {
                "Farm": 30,
                "Ahtanum": 0,
                "Rattlesnake": 0,
                "Toppenish": 0,
                "Cascades": 40,
            },
            "Tractors": 0,
            "Harvesters": 1,
            "OTB": [],
            "Fate": [],
        },
        {
            "Name": "Harrah Harry",
            "Color": "Black",
            "Position": 35,
            "Cash": 12300,
            "Debt": 20000,
            "Hay": {
                "Acres": 20,
                "DoubleHay": false,
            },
            "Grain" : {
                "Acres": 10,
                "DoubleCorn": true,
            },
            "Fruit" : {
                "Acres": 15,
            },
            "Livestock" : {
                "Farm": 30,
                "Ahtanum": 0,
                "Rattlesnake": 0,
                "Toppenish": 0,
                "Cascades": 40,
            },
            "Tractors": 0,
            "Harvesters": 1,
            "OTB": [],
            "Fate": [],
        },
        {
            "Name": "Sunnyside Sidney",
            "Color": "White",
            "Position": 23,
            "Cash": 12300,
            "Debt": 20000,
            "Hay": {
                "Acres": 20,
                "DoubleHay": false,
            },
            "Grain" : {
                "Acres": 10,
                "DoubleCorn": true,
            },
            "Fruit" : {
                "Acres": 15,
            },
            "Livestock" : {
                "Farm": 30,
                "Ahtanum": 0,
                "Rattlesnake": 0,
                "Toppenish": 0,
                "Cascades": 40,
            },
            "Tractors": 0,
            "Harvesters": 1,
            "OTB": [],
            "Fate": [],
        },
        {
            "Name": "Satus Sam",
            "Color": "Blue",
            "Position": 17,
            "Cash": 12300,
            "Debt": 20000,
            "Hay": {
                "Acres": 20,
                "DoubleHay": false,
            },
            "Grain" : {
                "Acres": 10,
                "DoubleCorn": true,
            },
            "Fruit" : {
                "Acres": 15,
            },
            "Livestock" : {
                "Farm": 30,
                "Ahtanum": 0,
                "Rattlesnake": 0,
                "Toppenish": 0,
                "Cascades": 40,
            },
            "Tractors": 0,
            "Harvesters": 1,
            "OTB": [],
            "Fate": [],
        }

    ]
};

const screen1 = document.getElementById('screen-1');
const newGameButton = document.getElementById('new-game-btn');
const enterCodeInput = document.getElementById('enter-code-input');
const goButton = document.getElementById('go-btn');
const screen2 = document.getElementById('screen-2');
const screen2Code = document.getElementById('screen-2-code');
const gameWrapper = document.getElementById('game-wrapper');


const socket = io('http://localhost:3000');

socket.on('init', handleInit);
socket.on('gameCode', handleGameCode);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);

socket.on('unknownGame', handleunknownGame);
socket.on('tooManyPlayers', handletooManyPlayers);

lastState = null;

// player 1
var myPlayerID = 1;

function keyDown(e) {
    console.log('key down', e.key)
    socket.emit('keyDown', e.key)
}

function keyClick() {
    console.log('key click')
    socket.emit('keyDown', this.id.split('-')[1]);
}

function paintGame(state) {

    console.log('hi')

    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');

    // if game is playing
    console.log(state);


    $(".player").remove();
    for (let player of state.players) {
        $(`#cell-${player.Position} > .players-on-me`).append(`<div class="player ${player.Color}" title="${player.Name}"></div>`);
    }
}

function init() {

    // initially hide the screen
    // newGameButton.addEventListener('click', () => {
    //     socket.emit('newGame');
    // });

    // goButton.addEventListener('click', () => {
    //     var code = enterCodeInput.value;
    //     socket.emit('joinGame', code);
    // });

    // playAgainButton.addEventListener('click', () => {
    //     socket.emit('playAgain');
    // });
    paintGame(state);
}

function handleGameState(gameState) {
    console.log(gameState)
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => {
        paintGame(gameState);
        lastState = gameState;
        // console.log(gameState);
    });
}

function handleGameOver(msg) {
    if (msg === myPlayerID) {
        gameOverSpan.innerHTML = 'You Win!';
        gameOverSpan.classList = 'winner';
    }
    else if (msg !== myPlayerID) {
        gameOverSpan.innerHTML = 'You Lose';
        gameOverSpan.classList = 'loser';
    }
}

function handleunknownGame(msg) {
    console.log('invalid room')
    console.log(msg);
    enterCodeInput.style.color = 'red';
}

function handleGameCode(msg) {
    console.log('handle create room')
    console.log(msg)

    // turn off the first screen and show the room code
    screen1.style.display = 'none';
    screen2Code.innerHTML = msg;
    screen2.style.display = 'flex';
}

function handleInit(number) {
    console.log('handleInit')
    myPlayerID = number;
}

function handletooManyPlayers(msg) {
    console.log('handletooManyPlayers()')
    console.log(msg)
}