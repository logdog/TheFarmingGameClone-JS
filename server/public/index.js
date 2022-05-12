$(document).ready(function() {
    console.log("document ready");
    $("#game-board").html(boardTemplate());
    init();
});

// SOCKET IO connections
const socket = io('http://localhost:3000');
socket.on('init', handleInit);
socket.on('roomCode', handleRoomCode);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('unknownGame', handleunknownGame);
socket.on('tooManyPlayers', handletooManyPlayers);
socket.on('morePlayersJoined', handleMorePlayersJoined);

socket.on('takenAvatars', handleTakenAvatars);
socket.on('rollPositionDiceAnimation', handleRollPositionDiceAnimation);
socket.on('drawOTB', handleDrawOTB);
socket.on('drawFarmersFate', handleDrawFarmersFate);
socket.on('drawOperatingExpense', handleDrawOperatingExpense);

// SET UP THE ROOM
const screen1 =$('#screen-1');
const newGameButton = $('#new-game-btn');
const enterCodeInput = $('#enter-code-input');
const goButton = $('#go-btn');
const screen2 = $('#screen-2');
const screen2Code = $('#screen-2-code');
const gameWrapper = $('#game-wrapper');
const screen3 = $('#screen-3');

// CHOOSE YOUR CHARACTER
const startGameButton = $('#Btn-Start-Game');

// SHOP BUTTONS
const buyHayButton = $('#Btn-Hay');
const buyGrainButton = $('#Btn-Grain');
const buyCowsButton = $('#Btn-Cows')
const buyTractorButton = $('#Btn-Tractor');
const buyHarvesterButton = $('#Btn-Harvester');
const buyAhtanumRidgeButton = $('#Btn-Ahtanum-Ridge');
const buyRattlesnakeRidgeButton = $('#Btn-Rattlesnake-Ridge');
const buyCascadesButton = $('#Btn-Cascades');
const buyToppenishRidgeButton = $('#Btn-Toppenish-Ridge');


function createPlayerTotal(player) {

    const doubleCornText = player.Grain.DoubleCorn ? " (Double Corn)" : "";
    const doubleHayText = player.Hay.DoubleHay ? " (Double Hay)" : "";

    return `<label>${player.Name}</label>
    <label>Net Worth: $${player.NetWorth}</label>
    <label>Cash: $${player.Cash}</label>
    <label>Debt: $${player.Debt}</label>
    <label>Hay: ${player.Hay.Acres} Acres${doubleHayText}</label>
    <label>Grain: ${player.Grain.Acres} Acres${doubleCornText}</label>
    <label>Cows: ${player.Livestock.Total}</label>
    <label>Tractors: ${player.Tractors}</label>
    <label>Harvesters: ${player.Harvesters}</label>`
}

// tells us who we are
let myPlayerID = null;
let numPlayersReady = null;
let totalPlayers = 1;
let lastState = null;

function keyDown(e) {
    console.log('key down', e.key)
    socket.emit('keyDown', e.key)
}

function keyClick() {
    console.log('key click')
    socket.emit('keyDown', this.id.split('-')[1]);
}

function paintGame(state) {

    if (myPlayerID === null) {
        return;
    }

    screen1.css('display', 'none');
    screen2.css('display', 'none');
    screen3.css('display', 'none');
    gameWrapper.css('display', 'flex');
    
    // if game is playing
    console.log(state);

    // player totals
    $("#player-totals").empty();
    $("#player-totals").append(createPlayerTotal(state.players[myPlayerID]));

    // roll the dice button
    $("#roll-dice-div").empty();
    if (state.turn === myPlayerID && state.shouldMove) {
        $("#roll-dice-div").append( `<button id="roll-dice-btn">Roll for Position!</button>` );
        $('#roll-dice-btn').click(function() {
            socket.emit('rollPositionDice');
            $(this).remove();
        });
    }
    else if (state.turn === myPlayerID && state.shouldHarvest) {
        $("#roll-dice-div").append( `<button id="roll-dice-btn">Roll for Harvest!</button>` );
        $('#roll-dice-btn').click(function() {
            socket.emit('rollHarvestDice');
            $(this).remove();
        });
    }
    else {
        $("#roll-dice-div").append( `<button id="roll-dice-btn">End Your Turn</button>` );
        $('#roll-dice-btn').click(function() {
            socket.emit('endTurn');
            $(this).remove();
        });
    }

    // draw the game tokens on the board
    $(".player").remove();
    for (let player of state.players) {
        $(`#cell-${player.Position} > .players-on-me`).append(`<div class="player ${player.Color}" title="${player.Name}"></div>`);
    }
}

function initShopButtons() {
    buyHayButton.click(function() {
        console.log('Buy Hay');
        socket.emit('buyHay');
    });

    buyGrainButton.click(function() {
        console.log('Buy Grain');
        socket.emit('buyGrain');
    });

    buyCowsButton.click(function() {
        console.log('Buy Cows');
        socket.emit('buyCows');
    });

    buyTractorButton.click(function() {
        console.log('Buy Tractor');
        socket.emit('buyTractor');
    });

    buyHarvesterButton.click(function() {
        console.log('Buy Harvester');
        socket.emit('buyHarvester');
    });

    buyAhtanumRidgeButton.click(function () {
        console.log('Buy AhtanumRidge');
        socket.emit('buyAhtanumRidge');
    });

    buyRattlesnakeRidgeButton.click(function () {
        console.log('Buy RattlesnakeRidge');
        socket.emit('buyRattlesnakeRidge');
    });

    buyCascadesButton.click(function () {
        console.log('Buy buyCascadesButton');
        socket.emit('buyCascades');
    });

    buyToppenishRidgeButton.click(function () {
        console.log('Buy buyToppenishRidge');
        socket.emit('buyToppenishRidge');
    });
}

function initAvatarSelection() {

    // tell the server what's up

    for(let i=0; i<6;i++) {
        $(`#avatar${i}`).click(function() {
            socket.emit('avatarSelection', i);
        });
    }

    startGameButton.click(function() {
        socket.emit('startGame');
    });
}

function init() {

    screen2.css('display', 'none');
    screen3.css('display', 'none');

    initShopButtons();
    initAvatarSelection();

    // create new game
    newGameButton.click(function() {
        socket.emit('newGame');
        console.log('newGame');
    });

    goButton.click(function() {
        var code = enterCodeInput.val();
        console.log('sending', code)
        socket.emit('joinGame', code);
        screen2Code.html(code);
    });

    // playAgainButton.addEventListener('click', () => {
    //     socket.emit('playAgain');
    // });
    paintGame(state);
}

function updateStartButton() {
    $('#num-players-ready').html(`${numPlayersReady}/${totalPlayers} Players Ready!`);
    if (numPlayersReady == totalPlayers) {
        startGameButton.css('display', 'block');
    } else {
        startGameButton.css('display', 'none');
    }
}

function handleRoomCode(msg) {
    console.log('handle create room')
    console.log(msg)

    // turn off the first screen and show the room code
    screen1.css('display', 'none');
    screen2Code.html(msg);
    screen2.css('display', 'flex');
    screen3.css('display', 'flex');
}

function handleInit(number) {
    console.log('handleInit')
    myPlayerID = number;
}

function handleMorePlayersJoined(numPlayers) {
    console.log('morePlayersJoined')
    console.log(numPlayers)

    totalPlayers = numPlayers;

    screen1.css('display', 'none');
    screen2.css('display', 'flex');
    screen3.css('display', 'flex');

    updateStartButton();
}

function handleTakenAvatars(avatars) {   
    $(`.avatarProfile`).removeClass('mySelection');
    $(`.avatarProfile`).removeClass('otherSelection');

    for (const playerID in avatars) {
        if (playerID == myPlayerID) {
            $(`#avatar${avatars[playerID]}`).addClass('mySelection');
        } else {
            $(`#avatar${avatars[playerID]}`).addClass('otherSelection');
        }
    }

    numPlayersReady = Object.keys(avatars).length;
    numPlayersReady = numPlayersReady !== null ? numPlayersReady : 0;
    updateStartButton();
}

function handleGameState(gameState) {

    console.log(gameState)
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => {
        paintGame(gameState);
        lastState = gameState;
        console.log(gameState);
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

function handletooManyPlayers(msg) {
    console.log('handletooManyPlayers()')
    console.log(msg)
}

function handleRollPositionDiceAnimation(diceValue) {
    console.log('Dice Value: ', diceValue)
}

function handleDrawOTB(card) {
    $('#card-container').append(createOTBCard(card));
    $('#card-container').last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function() {
        $(this).parent().remove();
    });

}

function handleDrawFarmersFate(card) {
    $('#card-container').append(createFarmersFateCard(card));
    $('#card-container').last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function() {
        $(this).parent().remove();
    });
}

function handleDrawOperatingExpense(card) {
    $('#card-container').append(createOperatingExpenseCard(card));
    $('#card-container').last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function() {
        $(this).parent().remove();
    });
}