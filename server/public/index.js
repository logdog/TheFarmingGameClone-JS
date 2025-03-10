$(document).ready(function () {
    console.log("document ready");
    $("#game-board").html(boardTemplate());
    init();
});

// some callbacks for the shiftKey
let shiftKeyDown = false;
$(document).on('keydown', function (e) {
    if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
        shiftKeyDown = true;
    }
});
$(document).on('keyup', function (e) {
    if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
        shiftKeyDown = false;
    }
});

// SOCKET IO connections
//const socket = io('http://localhost:3000');
const socket = io();
socket.on('init', handleInit);
socket.on('roomCode', handleRoomCode);
socket.on('startGame', handleStartGame);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('unknownGame', handleunknownGame);
socket.on('tooManyPlayers', handletooManyPlayers);
socket.on('morePlayersJoined', handleMorePlayersJoined);

socket.on('takenAvatars', handleTakenAvatars);
socket.on('rollPositionDiceAnimation', handleRollPositionDiceAnimation);
socket.on('rollHarvestDiceAnimation', handleRollHarvestDiceAnimation);
socket.on('rollMtStHelensDiceAnimation', handleRollMtStHelensDiceAnimation);
socket.on('positionCard', handlePositionCard);
socket.on('drawOTB', handleDrawOTB);
socket.on('drawFarmersFate', handleDrawFarmersFate);
socket.on('drawOperatingExpense', handleDrawOperatingExpense);

socket.on('requirePayment', handleRequirePayment);
socket.on('harvestSummary', handleHarvestSummary);

socket.on('errorBuy', handleErrorBuy);

// SET UP THE ROOM
const screen1 = $('#screen-1');
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
const buyHayButton = $('#Buy-Hay');
const buyGrainButton = $('#Buy-Grain');
const buyCowsButton = $('#Buy-Cows')
const buyFruitButton = $('#Buy-Fruit');
const buyTractorButton = $('#Buy-Tractor');
const buyHarvesterButton = $('#Buy-Harvester');
const buyAhtanumRidgeButton = $('#Buy-Ahtanum');
const buyRattlesnakeRidgeButton = $('#Buy-Rattlesnake');
const buyCascadesButton = $('#Buy-Cascades');
const buyToppenishRidgeButton = $('#Buy-Toppenish');
const paybackDebtButton = $('#Btn-Payback-Debt');
const paybackAllDebtButton = $('#Btn-Payback-All-Debt');

const sellHayButton = $('#Sell-Hay');
const sellGrainButton = $('#Sell-Grain');
const sellCowsButton = $('#Sell-Cows')
const sellFruitButton = $('#Sell-Fruit');
const sellTractorButton = $('#Sell-Tractor');
const sellHarvesterButton = $('#Sell-Harvester');
const sellAhtanumRidgeButton = $('#Sell-Ahtanum');
const sellRattlesnakeRidgeButton = $('#Sell-Rattlesnake');
const sellCascadesButton = $('#Sell-Cascades');
const sellToppenishRidgeButton = $('#Sell-Toppenish');
const takeLoanButton = $('#Btn-Take-Loan');
const declareBankruptButton = $('#Btn-Declare-Bankrupt');

const buyTab = $('#buy-tab');
const sellTab = $('#sell-tab');
const buyWrapper = $('#buy-wrapper');
const sellWrapper = $('#sell-wrapper');

// price tables
const hayTab = $('#hay-tab');
const grainTab = $('#grain-tab');
const fruitTab = $('#fruit-tab');
const livestockTab = $('#livestock-tab');

const hayTable = $('#hay-table');
const grainTable = $('#grain-table');
const fruitTable = $('#fruit-table');
const livestockTable = $('#livestock-table');


function createPlayerTotal(player, isYou) {

    const doubleCornText = player.Grain.DoubleCorn ? " (Double Corn)" : "";
    const doubleHayText = player.Hay.DoubleHay ? " (Double Hay)" : "";
    const halfWheatText = player.Grain.HalfWheat ? " (Half Wheat)" : "";
    const IRSFilter = player.IRS;
    const totalAcerage = player.Hay.Acres + player.Grain.Acres + player.Fruit.Acres;

    const name = player.Name + (isYou ? " (Me)" : "");
    console.log(name)

    return `<table><tbody>
    <tr>
        <td rowspan="6" colspan="2" class="player-profile-icon" style="background-image: url(${player.Path})"></td>
        <td>Net Worth</td>
        <td class="right">$${new Intl.NumberFormat().format(player.NetWorth)}</td>
    </tr>
    <tr>
        <td>Cash</td>
        <td class="right">$${new Intl.NumberFormat().format(player.Cash)}</td>
    </tr>
    <tr>
        <td>Debt</td>
        <td class="right">$${new Intl.NumberFormat().format(player.Debt)}</td>
    </tr>
    <tr>
        <td>Tractors</td>
        <td class="right">${player.Tractors}</td>
    </tr>
    <tr>
        <td>Harvesters</td>
        <td class="right">${player.Harvesters}</td>
    </tr>
    <tr>
        <td>Cows on Farm</td>
        <td class="right">${player.Livestock.Farm}</td>
    </tr>
    <tr>
        <td colspan="2" class="centered bold">${name}</td>
        <td>Ahtanum</td>
        <td class="right">${player.Livestock.AhtanumRidge}</td>
    </tr>
    <tr>
        <td>Hay${doubleHayText}</td>
        <td class="right">${player.Hay.Acres}</td>
        <td>Rattlesnake</td>
        <td class="right">${player.Livestock.RattlesnakeRidge}</td>
    </tr>
    <tr>
        <td>Grain${doubleCornText}${halfWheatText}</td>
        <td class="right">${player.Grain.Acres}</td>
        <td>Casade</td>
        <td class="right">${player.Livestock.Cascades}</td>
    </tr>
    <tr>
        <td>Fruit</td>
        <td class="right">${player.Fruit.Acres}</td>
        <td>Toppenish</td>
        <td class="right">${player.Livestock.ToppenishRidge}</td>
    </tr>
    <tr>
        <td class="bold">Total Acreage</td>
        <td class="right">${totalAcerage}</td>
        <td class="bold">Total Cows</td>
        <td class="right">${player.Livestock.Total}</td>
    </tr>
    </tbody></table>
    `;

    // return `<label>${player.Name}</label>
    // <label>Net Worth: $${player.NetWorth}</label>
    // <label>Cash: $${player.Cash}</label>
    // <label>Debt: $${player.Debt}</label>
    // <label>Hay: ${player.Hay.Acres} Acres${doubleHayText}</label>
    // <label>Grain: ${player.Grain.Acres} Acres${doubleCornText}${halfWheatText}</label>
    // <label>Fruit: ${player.Fruit.Acres} Acre</label>
    // <label>Cows: ${player.Livestock.Total}</label>
    // <label>Tractors: ${player.Tractors}</label>
    // <label>Harvesters: ${player.Harvesters}</label>`
}

// tells us who we are
let myPlayerID = null;
let numPlayersReady = null;
let totalPlayers = 1;
let lastState = null;

// TODO: update all of the values above on a player reconnect

function keyDown(e) {
    // console.log('key down', e.key)
    socket.emit('keyDown', e.key)
}

function keyClick() {
    // console.log('key click')
    socket.emit('keyDown', this.id.split('-')[1]);
}

function paintGame(state) {

    console.log("paintGame()")

    if (myPlayerID === null) {
        return;
    }

    const me = state.players[myPlayerID];
    const myColor = me.Color;

    for (let i = 0; i < state.players.length; i++) {
        $(`#player-grid-${i}`).html(createPlayerTotal(state.players[i], myPlayerID === i));
    }

    // player totals
    // $("#player-totals").empty();
    // $("#player-totals").append();

    let ahtanumRidgeTaken = false;
    let rattlesnakeRidgeTaken = false;
    let cascadesTaken = false;
    let toppennishRidgeTaken = false;
    for (let player of state.players) {
        ahtanumRidgeTaken |= (player.Livestock.AhtanumRidge > 0);
        rattlesnakeRidgeTaken |= (player.Livestock.RattlesnakeRidge > 0);
        cascadesTaken |= (player.Livestock.Cascades > 0);
        toppennishRidgeTaken |= (player.Livestock.ToppenishRidge > 0);
    }

    // shop: buy
    // console.log(me.OTB);
    buyHayButton.removeClass('no-OTB');
    buyGrainButton.removeClass('no-OTB');
    buyCowsButton.removeClass('no-OTB');
    buyFruitButton.removeClass('no-OTB');
    buyAhtanumRidgeButton.removeClass('no-OTB');
    buyRattlesnakeRidgeButton.removeClass('no-OTB');
    buyCascadesButton.removeClass('no-OTB');
    buyToppenishRidgeButton.removeClass('no-OTB');
    buyTractorButton.removeClass('no-OTB');
    buyHarvesterButton.removeClass('no-OTB');
    if (!me.OTB['Hay']) {
        buyHayButton.addClass('no-OTB');
    }
    if (!me.OTB['Grain']) {
        buyGrainButton.addClass('no-OTB');
    }
    if (!me.OTB['Cows'] || me.Livestock.Farm >= 20) {
        buyCowsButton.addClass('no-OTB');
    }
    if (!me.OTB['Fruit']) {
        buyFruitButton.addClass('no-OTB');
    }
    if (!me.OTB['AhtanumRidge'] || ahtanumRidgeTaken) {
        buyAhtanumRidgeButton.addClass('no-OTB');
    }
    if (!me.OTB['RattlesnakeRidge'] || rattlesnakeRidgeTaken) {
        buyRattlesnakeRidgeButton.addClass('no-OTB');
    }
    if (!me.OTB['Cascades'] || cascadesTaken) {
        buyCascadesButton.addClass('no-OTB');
    }
    if (!me.OTB['ToppenishRidge'] || toppennishRidgeTaken) {
        buyToppenishRidgeButton.addClass('no-OTB');
    }
    if (!me.OTB['Tractor']) {
        buyTractorButton.addClass('no-OTB');
    }
    if (!me.OTB['Harvester']) {
        buyHarvesterButton.addClass('no-OTB');
    }

    // shop: sell
    sellHayButton.removeClass('no-sell');
    sellGrainButton.removeClass('no-sell');
    sellCowsButton.removeClass('no-sell');
    sellFruitButton.removeClass('no-sell');
    sellAhtanumRidgeButton.removeClass('no-sell');
    sellRattlesnakeRidgeButton.removeClass('no-sell');
    sellCascadesButton.removeClass('no-sell');
    sellToppenishRidgeButton.removeClass('no-sell');
    sellTractorButton.removeClass('no-sell');
    sellHarvesterButton.removeClass('no-sell');
    if (!me.Hay.Acres) {
        sellHayButton.addClass('no-sell');
    }
    if (!me.Grain.Acres) {
        sellGrainButton.addClass('no-sell');
    }
    if (!me.Livestock.Total) {
        sellCowsButton.addClass('no-sell');
    }
    if (!me.Fruit.Acres) {
        sellFruitButton.addClass('no-sell');
    }
    if (!me.Livestock.AhtanumRidge) {
        sellAhtanumRidgeButton.addClass('no-sell');
    }
    if (!me.Livestock.RattlesnakeRidge) {
        sellRattlesnakeRidgeButton.addClass('no-sell');
    }
    if (!me.Livestock.Cascades) {
        sellCascadesButton.addClass('no-sell');
    }
    if (!me.Livestock.ToppenishRidge) {
        sellToppenishRidgeButton.addClass('no-sell');
    }
    if (!me.Tractors) {
        sellTractorButton.addClass('no-sell');
    }
    if (!me.Harvesters) {
        sellHarvesterButton.addClass('no-sell');
    }

    // draw the game tokens on the board
    $(".player").remove();
    for (let player of state.players) {
        $(`#cell-${player.Position} > .players-on-me`).append(`<div class="player ${player.Color}" title="${player.Name}"></div>`);
    }

    // roll the dice button
    $('#position-dice-container').off('click');
    $('#harvest-dice-container').off('click');
    $('#mtsthelens-dice-container').off('click');
    $("#roll-dice-div").empty();

    if (state.MtStHelens.happening) {
        console.log('paint game mt st helens')
        if (state.MtStHelens.turn === myPlayerID) {
            console.log('spinning mt st helens');

            // make the dice spin
            const diceContainer = $('#mtsthelens-dice-container');
            diceContainer.css('animation', 'spinning 1s linear infinite');

            // press space bar or click to roll
            let hasRolled = false;
            diceContainer.click(rollMtStHelensDice);
            $(document).keydown(function (e) {
                if (e.code === 'Space' && !hasRolled) {
                    rollMtStHelensDice();
                }
            });

            function rollMtStHelensDice() {
                hasRolled = true;
                diceContainer.off('click');
                socket.emit('rollMtStHelensDice');
            }
        }
        return;
    }

    console.log("state.turn: ", state.turn, "myPlayerID: ", myPlayerID, "me.shouldMove", me.shouldMove);
    if (state.turn === myPlayerID && me.shouldMove) {

        // make the dice spin
        const diceContainer = $('#position-dice-container');
        diceContainer.css('animation', 'spinning 1s linear infinite');

        // press space bar or click to roll
        let hasRolled = false;
        diceContainer.click(rollPositionDice);
        $(document).keydown(function (e) {
            if (e.code === 'Space' && !hasRolled) {
                rollPositionDice();
            }
        });

        function rollPositionDice() {
            hasRolled = true;
            diceContainer.off('click');
            socket.emit('rollPositionDice');
        }
    }
    else if (state.turn === myPlayerID && me.shouldHarvest) {

        // make the dice spin
        const diceContainer = $('#harvest-dice-container');
        diceContainer.css('animation', 'spinning 1s linear infinite');

        // press space bar or click to roll
        let hasRolled = false;
        diceContainer.click(rollHarvestDice);
        $(document).keydown(function (e) {
            if (e.code === 'Space' && !hasRolled) {
                rollHarvestDice();
            }
        });

        function rollHarvestDice() {
            hasRolled = true;
            diceContainer.off('click');
            socket.emit('rollHarvestDice');
        }

    }
    else if (state.turn === myPlayerID) {
        console.log("You have already moved and harvested. End your turn by clicking the button.");
        $("#roll-dice-div").append(`<button id="roll-dice-btn">End Your Turn</button>`);
        $('#roll-dice-btn').click(function () {
            socket.emit('endTurn');
            $(this).remove();
        });
    }
    else {
        console.log("it must not be your turn!");
        console.log("state: ", state);
        console.log("myPlayerID: ", myPlayerID);
    }
}

function initShopButtons() {

    /* Buy */
    const downPaymentInput = $('#down-payment');

    buyHayButton.click(function () {
        console.log('Buy Hay');
        socket.emit('buy', 'Hay', downPaymentInput.val());
    });

    buyGrainButton.click(function () {
        console.log('Buy Grain');
        socket.emit('buy', 'Grain', downPaymentInput.val());
    });

    buyCowsButton.click(function () {
        console.log('Buy Cows');
        socket.emit('buy', 'Cows', downPaymentInput.val());
    });

    buyFruitButton.click(function () {
        console.log('Buy Cows');
        socket.emit('buy', 'Fruit', downPaymentInput.val());
    });

    buyTractorButton.click(function () {
        console.log('Buy Tractor');
        socket.emit('buy', 'Tractor', downPaymentInput.val());
    });

    buyHarvesterButton.click(function () {
        console.log('Buy Harvester');
        socket.emit('buy', 'Harvester', downPaymentInput.val());
    });

    buyAhtanumRidgeButton.click(function () {
        console.log('Buy AhtanumRidge');
        socket.emit('buy', 'AhtanumRidge', downPaymentInput.val());
    });

    buyRattlesnakeRidgeButton.click(function () {
        console.log('Buy RattlesnakeRidge');
        socket.emit('buy', 'RattlesnakeRidge', downPaymentInput.val());
    });

    buyCascadesButton.click(function () {
        console.log('Buy buyCascadesButton');
        socket.emit('buy', 'Cascades', downPaymentInput.val());
    });

    buyToppenishRidgeButton.click(function () {
        console.log('Buy buyToppenishRidge');
        socket.emit('buy', 'ToppenishRidge', downPaymentInput.val());
    });

    paybackDebtButton.click(function () {
        console.log('payback debt');


        const cash = lastState.players[myPlayerID].Cash;
        if (cash < downPaymentInput.val()) {
            alert(`You do not have enough cash ($${cash}) to pay off this loan ($${downPaymentInput.val()}).`);
            return;
        }

        socket.emit('paybackDebt', downPaymentInput.val());
    });

    paybackAllDebtButton.click(function () {
        console.log('payback all debt');
        const debt = lastState.players[myPlayerID].Debt;
        
        if (debt < 0) { 
            return;
        }

        const cash = lastState.players[myPlayerID].Cash;
        if (cash < debt) {
            alert(`You do not have enough cash ($${cash}) to pay off your total debt ($${debt}).`);
            return;
        }

        downPaymentInput.val(debt);
        socket.emit('paybackDebt', downPaymentInput.val());
    });


    /* sell */
    const loanAmountInput = $('#loan-amount');

    sellHayButton.click(function () {
        socket.emit('sell', 'Hay');
    });

    sellGrainButton.click(function () {
        socket.emit('sell', 'Grain');
    });

    sellCowsButton.click(function () {
        socket.emit('sell', 'Cows');
    });

    sellFruitButton.click(function () {
        socket.emit('sell', 'Fruit');
    });

    sellAhtanumRidgeButton.click(function () {
        socket.emit('sell', 'AhtanumRidge');
    });

    sellRattlesnakeRidgeButton.click(function () {
        socket.emit('sell', 'RattlesnakeRidge');
    });

    sellCascadesButton.click(function () {
        socket.emit('sell', 'Cascades');
    });

    sellToppenishRidgeButton.click(function () {
        socket.emit('sell', 'ToppenishRidge');
    });

    sellTractorButton.click(function () {
        socket.emit('sell', 'Tractor');
    });

    sellHarvesterButton.click(function () {
        socket.emit('sell', 'Harvester');
    });

    takeLoanButton.click(function () {
        socket.emit('takeLoan', loanAmountInput.val());
    });

    /* buy-sell tabs*/
    buyTab.click(function () {
        buyWrapper.css('display', 'block');
        sellWrapper.css('display', 'none');
        buyTab.addClass('selected');
        sellTab.removeClass('selected');
    });

    sellTab.click(function () {
        buyWrapper.css('display', 'none');
        sellWrapper.css('display', 'block');
        buyTab.removeClass('selected');
        sellTab.addClass('selected');
    });

    declareBankruptButton.click(function () {
        const yes = confirm('If you declare bankruptcy, you will lose ALL OF YOUR ASSETS and will start the game over. This action CANNOT be undone. Are you sure you want to declare bankruptcy?');
        if (yes) {
            socket.emit('bankrupt');
        }
    });

    /* payout table */
    hayTab.click(function () {
        hayTab.addClass('selected');
        grainTab.removeClass('selected');
        fruitTab.removeClass('selected');
        livestockTab.removeClass('selected');

        hayTable.addClass('visible');
        grainTable.removeClass('visible');
        fruitTable.removeClass('visible');
        livestockTable.removeClass('visible');
    });

    grainTab.click(function () {
        hayTab.removeClass('selected');
        grainTab.addClass('selected');
        fruitTab.removeClass('selected');
        livestockTab.removeClass('selected');

        hayTable.removeClass('visible');
        grainTable.addClass('visible');
        fruitTable.removeClass('visible');
        livestockTable.removeClass('visible');
    });

    fruitTab.click(function () {
        hayTab.removeClass('selected');
        grainTab.removeClass('selected');
        fruitTab.addClass('selected');
        livestockTab.removeClass('selected');

        hayTable.removeClass('visible');
        grainTable.removeClass('visible');
        fruitTable.addClass('visible');
        livestockTable.removeClass('visible');
    });

    livestockTab.click(function () {
        hayTab.removeClass('selected');
        grainTab.removeClass('selected');
        fruitTab.removeClass('selected');
        livestockTab.addClass('selected');

        hayTable.removeClass('visible');
        grainTable.removeClass('visible');
        fruitTable.removeClass('visible');
        livestockTable.addClass('visible');
    });

}

function initAvatarSelection() {

    // tell the server what's up

    for (let i = 0; i < 6; i++) {
        $(`#avatar${i}`).click(function () {
            socket.emit('avatarSelection', i);
        });
    }

    startGameButton.click(function () {
        socket.emit('startGame');
    });
}

async function init() {

    screen1.css('display', 'none');
    screen2.css('display', 'none');
    screen3.css('display', 'none');

    initShopButtons();
    initAvatarSelection();

    $("#position-dice-container").html(createDice());
    $("#harvest-dice-container").html(createDice());
    $("#mtsthelens-dice-container").html(createDice());

    // check if the player has had a turn update in the last idk, 5 minute?
    lastStateChangeTime_ms = parseInt(localStorage.getItem("lastStateChange"));
    myPlayerID = parseInt(localStorage.getItem("playerID"));
    const roomCode = localStorage.getItem("roomCode");

    if (lastStateChangeTime_ms != NaN && Date.now() - lastStateChangeTime_ms <= 5 * 60 * 1000 &&
        myPlayerID != NaN && roomCode != null) {
        // check with the server that a game with this room code is still active

        socket.emit("checkIfPlayerCanRejoinGame", { playerID: myPlayerID, roomCode: roomCode });

        // at this point, we should probably wait for a response from the server, indicating 
        // whether or not the player could rejoin the game.
        let response = null;
        try {
            response = await new Promise((resolve, reject) => {
                socket.on("checkIfPlayerCanRejoinGameResponse", (response) => {
                    resolve(response);
                });
                setTimeout(() => {reject("No response from server"); }, 5000);
            });
        }
        catch (err) {
            console.log("[playerReconnectReponse]:", err);
        }

        // process the response
        if (response != null && response.canRejoin) {
            const choice = confirm(`It looks like you were disconnected from the game. Would you like to rejoin?                
Room Code: ${roomCode}, Player ID: ${myPlayerID}` );
            if (choice) {
                console.log("rejoining game");
                socket.emit("rejoinGame", { playerID: myPlayerID, roomCode: roomCode });
                // TODO? verify that the player successfully rejoins the game so that
                // they do not get stuck waiting forever. Will only fix if it becomes an issue.
                return;
            }
        }
        
    }

    // the player did not want to rejoin the game
    screen1.css('display', 'flex');

    newGameButton.click(function () {
        socket.emit('newGame');
        console.log('newGame');
    });

    goButton.click(function () {
        var code = enterCodeInput.val();
        console.log('sending', code)
        socket.emit('joinGame', code);
        screen2Code.html(code);
    });
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

    // save the player's room code in case they get disconnected
    localStorage.setItem("roomCode", msg);

}

function handleInit(number) {
    console.log('handleInit');
    console.log('Setting myPlayerID to: ', number);
    myPlayerID = number;

    // save the player's ID in case they get disconnected
    localStorage.setItem("playerID", myPlayerID);
}

function handleMorePlayersJoined(numPlayers) {
    // console.log('morePlayersJoined')
    // console.log(numPlayers)

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

function handleStartGame(state) {

    console.log('handleStartGame')
    state = JSON.parse(state);
    lastState = state;

    // create divs for player totals
    for (let i = 0; i < state.players.length; i++) {
        console.log(i)
        $('#player-grid-wrapper').append(`<div class="player-grid" id="player-grid-${i}"></div>`);
    }

    // create player total tabs
    let i = 0;
    for (let player of state.players) {
        $("#player-totals>.tabs").append(`<div class="player-tab tab" id="player-tab-${i}"><span>${player.Name}</span></div>`);

        // when clicked, highlight
        $(`#player-tab-${i}`).click(function () {

            // highlight the correct tab
            $('#player-totals>.tabs>.tab').removeClass('selected');
            console.log($(this))
            $(this).addClass('selected');

            const id = parseInt($(this).attr('id').split('-').slice(-1)[0]);

            // show the correct table
            $('.player-grid').removeClass('visible');
            $(`#player-grid-${id}`).addClass('visible');

            // change back the other ones
            $('.player-tab').css('background-color', 'gray');
            $('.player-tab').css('color', 'white');

            // show the correct color
            $(this).css('background-color', lastState.players[id].Color);
            if (lastState.players[id].Color === 'White') {
                $(this).css('color', 'Black');
            }
        });

        i++;
    }


    // select us
    console.log(lastState);

    $(`#player-tab-${myPlayerID}`).addClass('selected').css('background-color', lastState.players[myPlayerID].Color);
    if (lastState.players[myPlayerID].Color === 'White') {
        $(`#player-tab-${myPlayerID}`).css('color', 'Black');
    }
    $(`#player-grid-${myPlayerID}`).addClass('visible');


    // display 
    screen1.css('display', 'none');
    screen2.css('display', 'none');
    screen3.css('display', 'none');
    gameWrapper.css('display', 'flex');

    // paint game
    paintGame(state);
}

function handleGameState(state) {
    console.log('handleGameState')
    state = JSON.parse(state);
    requestAnimationFrame(() => {
        paintGame(state);
        lastState = state;
    });

    // make note of the last time a state change occurred
    // which returns a time in ms since the 1970 epoch
    localStorage.setItem("lastStateChange", Date.now());
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
    // console.log('invalid room')
    // console.log(msg);
    enterCodeInput.style.color = 'red';
}

function handletooManyPlayers(msg) {
    // console.log('handletooManyPlayers()')
    // console.log(msg)
}

function handleRollPositionDiceAnimation(diceValue) {

    // close the previous cards
    $('.card-container').empty();

    console.log("diceValue: ", diceValue)

    // roll the dice to the correct value
    const diceContainer = $('#position-dice-container');
    diceContainer.css('animation', `rotate-to-${diceValue} 1s linear forwards`);
}

function handleRollHarvestDiceAnimation(diceValue) {

    const diceContainer = $('#harvest-dice-container');
    diceContainer.css('animation', `rotate-to-${diceValue} 1s linear forwards`);
}

function handleRollMtStHelensDiceAnimation(diceValue) {

    const diceContainer = $('#mtsthelens-dice-container');
    diceContainer.css('animation', `rotate-to-${diceValue} 1s linear forwards`);
}

function handlePositionCard(card) {
    const container = $('#POS-container');
    container.append(createPositionCard(JSON.parse(card)));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            $('.card-container').empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}

function handleHarvestSummary(summaryArray) {
    const container = $('#harvest-container');
    container.append(createHarvestCard(JSON.parse(summaryArray)));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            $('.card-container').empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}

function handleDrawOperatingExpense(card) {
    const container = $('#harvest-container');
    container.append(createOperatingExpenseCard(JSON.parse(card)));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            $('.card-container').empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}


function handleDrawOTB(card) {
    const container = $('#OTB-FF-container');
    console.log('handleDrawOTB')
    console.log(card)
    container.append(createOTBCard(JSON.parse(card)));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            $('.card-container').empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}

function handleDrawFarmersFate(card) {
    const container = $('#OTB-FF-container');
    container.append(createFarmersFateCard(card));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            $('.card-container').empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}

function handleRequirePayment() {
    alert('Your bank balance is too low. Take a loan, sell assets, or declare bankrupcy to continue.')

    buyWrapper.css('display', 'none');
    sellWrapper.css('display', 'block');
    buyTab.removeClass('selected');
    sellTab.addClass('selected');
}

function handleErrorBuy(msg) {
    alert(msg)
}