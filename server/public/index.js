$(document).ready(function () {
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
socket.on('rollHarvestDiceAnimation', handleRollHarvestDiceAnimation);
socket.on('drawOTB', handleDrawOTB);
socket.on('drawFarmersFate', handleDrawFarmersFate);
socket.on('drawOperatingExpense', handleDrawOperatingExpense);

socket.on('paymentRequired', handlePaymentRequired);
socket.on('harvestSummary', handleHarvestSummary);

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


function createPlayerTotal(player) {

    const doubleCornText = player.Grain.DoubleCorn ? " (Double Corn)" : "";
    const doubleHayText = player.Hay.DoubleHay ? " (Double Hay)" : "";
    const halfWheatText = player.Grain.HalfWheat ? " (Half Wheat)" : "";

    return `<label>${player.Name}</label>
    <label>Net Worth: $${player.NetWorth}</label>
    <label>Cash: $${player.Cash}</label>
    <label>Debt: $${player.Debt}</label>
    <label>Hay: ${player.Hay.Acres} Acres${doubleHayText}</label>
    <label>Grain: ${player.Grain.Acres} Acres${doubleCornText}${halfWheatText}</label>
    <label>Fruit: ${player.Fruit.Acres} Acre</label>
    <label>Cows: ${player.Livestock.Total}</label>
    <label>Tractors: ${player.Tractors}</label>
    <label>Harvesters: ${player.Harvesters}</label>`
}

// tells us who we are
let myPlayerID = null;
let numPlayersReady = null;
let totalPlayers = 1;
let lastState = null;

let shiftKeyDown = false;

function keyDown(e) {
    // console.log('key down', e.key)
    socket.emit('keyDown', e.key)
}

function keyClick() {
    // console.log('key click')
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

    // color the game board
    //$('#game-board').css('border-color', state.players[myPlayerID].Color);

    // if game is playing

    const me = state.players[myPlayerID];
    const myColor = me.Color;


    // player totals
    $("#player-totals").empty();
    $("#player-totals").append(createPlayerTotal(me));

    // make the dice my color
    // $('.pip').css('background-color', myColor);
    // if (myColor === 'White') {
    //     $('.face').css('background-color', 'gray');
    // }
    // else {
    //     $('.face').css('background-color', 'White');
    // }

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
    console.log(me.OTB);
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


    // roll the dice button
    $('#position-dice-container').removeClass('spinning-dice').off('click');
    $('#harvest-dice-container').removeClass('spinning-dice').off('click');

    $("#roll-dice-div").empty();
    if (state.turn === myPlayerID && me.shouldMove) {

        // do cool animation, press space bar or click to roll
        $('#position-dice-container').addClass('spinning-dice').click(rollPositionDice);
        $(document).keydown(function(e) {
            if (e.code === 'Space') {
                $(document).off('keydown');
                rollPositionDice();
            }
        });

        function rollPositionDice() {
            $('#position-dice-container').removeClass('spinning-dice').off('click');
            
            socket.emit('rollPositionDice');
        }
    }
    else if (state.turn === myPlayerID && me.shouldHarvest) {
        $('#harvest-dice-container').addClass('spinning-dice').click(rollHarvestDice);
        $(document).keydown(function(e) {
            if (e.code === 'Space') {
                $(document).off('keydown');
                rollHarvestDice();
            }
        });

        function rollHarvestDice() {
            $('#harvest-dice-container').removeClass('spinning-dice').off('click');
            socket.emit('rollHarvestDice');
        }
    }
    else if (state.turn === myPlayerID) {
        $("#roll-dice-div").append(`<button id="roll-dice-btn">End Your Turn</button>`);
        $('#roll-dice-btn').click(function () {
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

function init() {

    screen2.css('display', 'none');
    screen3.css('display', 'none');

    initShopButtons();
    initAvatarSelection();

    $("#position-dice-container").html(createDice());
    $("#harvest-dice-container").html(createDice());
    $("#mtsthelens-dice-container").html(createDice());

    // create new game
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
    // console.log('handle create room')
    // console.log(msg)

    // turn off the first screen and show the room code
    screen1.css('display', 'none');
    screen2Code.html(msg);
    screen2.css('display', 'flex');
    screen3.css('display', 'flex');
}

function handleInit(number) {
    // console.log('handleInit')
    myPlayerID = number;
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

function handleGameState(gameState) {

    console.log('handleGameState')
    gameState = JSON.parse(gameState);
    requestAnimationFrame(() => {
        paintGame(gameState);
        lastState = gameState;
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
    // console.log('invalid room')
    // console.log(msg);
    enterCodeInput.style.color = 'red';
}

function handletooManyPlayers(msg) {
    // console.log('handletooManyPlayers()')
    // console.log(msg)
}

function handleRollPositionDiceAnimation(diceValue) {

    const diceContainer = $('#position-dice-container');
    const oldClass = diceContainer.attr('class');
    diceContainer.removeClass();

    if (oldClass && oldClass.slice(-1) === 'a') {
        diceContainer.addClass(`show-${diceValue}b`);
    }
    else {
        diceContainer.addClass(`show-${diceValue}a`);
    }
}

function handleRollHarvestDiceAnimation(diceValue) {

    const diceContainer = $('#harvest-dice-container');
    const oldClass = diceContainer.attr('class');
    diceContainer.removeClass();

    if (oldClass && oldClass.slice(-1) === 'a') {
        diceContainer.addClass(`show-${diceValue}b`);
    }
    else {
        diceContainer.addClass(`show-${diceValue}a`);
    }
}

function handleHarvestSummary(summaryArray) {
    console.log('handleHarvestSummary')
    console.log(JSON.parse(summaryArray))

    const container = $('#harvest-container');
    container.append(createHarvestCard(JSON.parse(summaryArray)));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            container.empty();
        }
        else {
            $(this).parent().remove();
        }
    });

}

function handleDrawOTB(card) {
    const container = $('#OTB-container');
    container.append(createOTBCard(card));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    console.log('handleDrawOTB')
    console.log(card)


    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            container.empty();
        }
        else {
            $(this).parent().remove();
        }
    });

}

function handleDrawFarmersFate(card) {
    const container = $('#FF-container');
    container.append(createFarmersFateCard(card));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    console.log('handleDrawFarmersFate')
    console.log(card)


    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            container.empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}

function handleDrawOperatingExpense(card) {
    const container = $('#OP-container');
    container.append(createOperatingExpenseCard(card));
    container.children().last().css('border-color', lastState.players[lastState.turn].Color);

    console.log('handleDrawOperatingExpense')
    console.log(card)

    // functional close button
    $('.close-btn').click(function () {
        if (shiftKeyDown) {
            container.empty();
        }
        else {
            $(this).parent().remove();
        }
    });
}

function handlePaymentRequired() {
    alert('Your bank balance is too low. Take a loan, sell assets, or declare bankrupcy to continue.')

    buyWrapper.css('display', 'none');
    sellWrapper.css('display', 'block');
    buyTab.removeClass('selected');
    sellTab.addClass('selected');
}