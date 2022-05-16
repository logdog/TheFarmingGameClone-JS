const {
    createGameState,
    movePlayer,
    movePlayerTo,
    checkPositionForDrawingCard,
    checkPositionForBalances,
    checkNewYear,
    collectAmount,
    payAmount,
    drawOTB,
    drawFarmersFate,
    drawOperatingExpense,
    calculateNetWorth,
    performHarvest,
    performBuy,
    performPaybackDebt,
    checkPositionForDoubleYield,
    shouldPlayerHarvest,
    performLoan,
    performSellAsset,
    performBankrupt,
    shouldChangePosition,
    DRAW_OTB,
    DRAW_FARMERS_FATE,
} = require('./game');

const { makeid } = require('./utils');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:3000"
    }
});

app.use('/', express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});


// room code: game state
const states = {};

// room code: {player id: avatar id}
const avatars = {};

// client id: room code
const clientRooms = {};

// room code: array(client ids)
const roomClientIDs = {};

// client id: player id
const playerIDs = {};

// array of room codes
const roomCodes = [];

io.on('connection', client => {

    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('avatarSelection', handleAvatarSelection);
    client.on('startGame', handleStartGame);

    client.on('rollPositionDice', handleRollPositionDice);
    client.on('rollHarvestDice', handleRollHarvestDice);
    client.on('endTurn', handleEndTurn);

    client.on('buy', handleBuy);
    client.on('paybackDebt', handlePaybackDebt);
    client.on('loan', handleLoan);
    client.on('sell', handleSell);
    client.on('bankrupt', handleBankrupt);


    function handleNewGame() {
        console.log('handleNewGame()')

        // generate a unique room code
        let roomCode = null;
        do {
            roomCode = makeid(5);
        }
        while (roomCodes.includes(roomCode));
        roomCodes.push(roomCode);

        // add client to a room
        client.join(roomCode);
        clientRooms[client.id] = roomCode;
        roomClientIDs[roomCode] = [client.id];
        avatars[roomCode] = {};

        // send client the room code
        client.emit('roomCode', roomCode);

        // tell client who they are
        client.emit('init', 0);
        playerIDs[client.id] = 0;


        console.log('created a new room:', roomCode);
    }

    function handleJoinGame(roomCode) {

        console.log('handleJoinGame()', roomCode)
        const connectedPlayersInRoom = io.sockets.adapter.rooms.get(roomCode);

        let numClients = 0;
        if (connectedPlayersInRoom) {
            numClients = connectedPlayersInRoom.size;
        }

        if (numClients === 0) {
            console.log('unknownGame')
            client.emit('unknownGame');
            return;
        }
        else if (numClients >= 6) {
            console.log('tooManyPlayers')
            client.emit('tooManyPlayers');
            return;
        }
        else {
            console.log('Add you to the room')

            client.join(roomCode);
            clientRooms[client.id] = roomCode;
            roomClientIDs[roomCode].push(client.id);
            playerIDs[client.id] = roomClientIDs[roomCode].length - 1;

            client.emit('init', playerIDs[client.id]);
            client.emit('takenAvatars', avatars[roomCode]);
            io.to(roomCode).emit('morePlayersJoined', roomClientIDs[roomCode].length);
        }
    }

    function handleAvatarSelection(avatarID) {
        console.log('handleAvatarSelection', avatarID)
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];

        console.log(playerID);

        // if the avatar is not taken yet
        if (!Object.values(avatars[roomCode]).includes(avatarID)) {
            avatars[roomCode][playerID] = avatarID;
        }

        // return a dictionary of which player has which avatars
        console.log(avatars[roomCode]);
        io.to(roomCode).emit('takenAvatars', avatars[roomCode]);
    }

    function handleStartGame() {
        console.log('handleStartGame()')

        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];

        // check that each player has an avatar
        if (Object.keys(avatars[roomCode]).length !== Object.keys(roomClientIDs[roomCode]).length) {
            console.log('not enough players have chosen their avatar!')
            return;
        }

        // initialize the game
        states[roomCode] = createGameState(Object.values(avatars[roomCode]));
        io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
    }

    /* Gameplay */
    function handleRollPositionDice() {
        console.log('handleRollPositionDice()')

        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        // check that it is the correct player's turn, and they should move
        const player = state.players[playerID];
        if (state.turn !== playerID || !player.shouldMove) {
            return;
        }

        // roll the positional dice
        let positionalDiceValue = Math.floor(Math.random() * 6) + 1;
        io.to(roomCode).emit('rollPositionDiceAnimation', positionalDiceValue);

        // wait 1 second before revealing the answer
        setTimeout(function () {
            const oldPosition = state.players[playerID].Position;
            movePlayer(state, playerID, positionalDiceValue);
            movePlayerAftermath(roomCode, state, playerID, oldPosition, true);
        }, 1000);
    }

    function movePlayerAftermath(roomCode, state, playerID, oldPosition, newYearAllowed) {

        // pay player for passing christmas vacation
        if (newYearAllowed) {
            checkNewYear(state, playerID, oldPosition);
        }

        // check if we should double hay/corn for the year
        checkPositionForDoubleYield(state, playerID);

        // check for pay/collect money on square
        const balance = checkPositionForBalances(state, playerID);

        if (balance >= 0) {
            collectAmount(state, playerID, balance);
        }
        else {
            payAmount(state, playerID, -balance);
        }

        const player = state.players[playerID];
        player.shouldHarvest = shouldPlayerHarvest(state, playerID);

        if (player.shouldHarvest) {
            io.to(roomCode).emit('gameState', JSON.stringify(state));
        }
        else {
            // should player move because the square says so?
            // e.g. Mar 3, July 3, Aug 1, Sep 1 (conditional)
            step3(roomCode, state, playerID);
        }
    }

    function handleRollHarvestDice() {
        console.log('handleRollPositionDice()')

        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        const player = state.players[playerID];
        if (state.turn !== playerID || !player.shouldHarvest) {
            return;
        }

        // roll the harvest dice
        let harvestDiceValue = Math.floor(Math.random() * 6) + 1;
        io.to(roomCode).emit('rollHarvestDiceAnimation', harvestDiceValue);

        setTimeout(finishRollHarvestDice, 1000);
        function finishRollHarvestDice() {
            // harvest 
            const harvestCode = performHarvest(state, playerID, harvestDiceValue);
            io.to(roomCode).emit('gameState', JSON.stringify(state));

            // draw operating expense card
            const [cardText, charge] = drawOperatingExpense(state, playerID);
            console.log('operating expense: ')
            console.log(charge);
            payAmount(state, playerID, -charge);

            player.shouldHarvest = shouldPlayerHarvest(state, playerID);

            io.to(roomCode).emit('drawOperatingExpense', cardText);
            io.to(roomCode).emit('gameState', JSON.stringify(state));

            // should the player move because the square says so?
            // e.g. Mar 3, July 3, Aug 1, Sep 1 (conditional)
            step3(roomCode, state, playerID);
        }
    }

    // should the player move because of their current position??
    function step3(roomCode, state, playerID) {

        const [shouldMove, newPosition] = shouldChangePosition(state, playerID);

        if (shouldMove) {
            const oldPosition = state.players[playerID].Position;
            movePlayerTo(state, playerID, newPosition);
            // do not allow player to collect $5000 if they hurt their back
            movePlayerAftermath(roomCode, state, playerID, oldPosition, oldPosition !== 11);
        }
        else {
            // draw a farmer's fate or OTB card
            step4(roomCode, state, playerID);
        }
    }

    // draw a card, perform the action
    function step4(roomCode, state, playerID) {

        const cardDrawType = checkPositionForDrawingCard(state, playerID);

        if (cardDrawType === DRAW_OTB) {
            const cardText = drawOTB(state, playerID);

            // the deck could be empty
            if (cardText === null) {
                return;
            }

            io.to(roomCode).emit('drawOTB', cardText);
        }
        else if (cardDrawType === DRAW_FARMERS_FATE) {
            const [cardText, cardIndex] = drawFarmersFate(state, playerID);
            io.to(roomCode).emit('drawFarmersFate', cardText);

            // now handle the action
            const player = state.players[playerID];

            switch (cardIndex) {
                case 0: {
                    // no Tractor pay $3000
                    if (!player.Tractors) {
                        payAmount(state, playerID, 3000);
                    }
                    break;
                }
                case 1: {
                    // Go to christmas. Collect your $6000
                    const oldPosition = player.Position;
                    movePlayerTo(state, playerID, 0);
                    movePlayerAftermath(roomCode, state, playerID, oldPosition, true);
                    break;
                }
                case 2: {
                    // Go to 2nd week of January. Do not collect $5000
                    const oldPosition = player.Position;
                    movePlayerTo(state, playerID, 2);
                    movePlayerAftermath(roomCode, state, playerID, oldPosition, false);
                    break;
                }
                case 3: {
                    // Pay $2500 if you do not own your own Harvester
                    if (!player.Harvesters) {
                        payAmount(state, playerID, 2500);
                    }
                    break;
                }
                case 4: {
                    // IRS (already handled)
                    break;
                }
                case 5: {
                    // collect $2000
                    collectAmount(state, playerID, 2000);
                    break;
                }
                case 6: {
                    // Collect $1000
                    collectAmount(state, playerID, 1000);
                    break;
                }
                case 7: {
                    // Lose your whole herd on your "farm"
                    player.Livestock.Total -= player.Livestock.Farm;
                    player.Livestock.Farm = 0;
                    break;
                }
                case 8: {
                    //  Collect $100 per Grain acre.
                    collectAmount(state, playerID, 100*player.Grain.Acres); 
                    break;
                }
                case 9: {
                    // Lose half wheat crop for the year (already handled)
                    break;
                }
                case 10: {
                    // Pay $300 per Fruit acre.
                    payAmount(state, playerID, 300*player.Fruit.Acres);
                }
                case 11: {
                    // If you have a Harvester, collect $2000 from each player who has none.
                    if (player.Harvesters) {
                        for(let id=0; id<state.players.length; id++) {
                            const other = state.players[id];
                            if (other !== player && !other.Harvesters) {
                                payAmount(state, id, 2000);
                                collectAmount(state, playerID, 2000);
                            }
                        }
                    }
                    break;
                }
                case 12: {
                    // Pay $7000
                    payAmount(state, playerID, 7000);
                    break;
                }
                case 13: {
                    // Take home a free Harvester worth $10000
                    player.Harvesters++;
                    break;
                }
                case 14: {
                    // Mt. St. Helens
                    // TODO
                    break;
                }
                case 15: {
                    //  Collect $2000 if you have cows.
                    if (player.Livestock.Total) {
                        collectAmount(state, playerID, 2000);
                    }
                    break;
                }
                case 16: {
                    // leaves you a Tractor worth $10000
                    player.Tractors++;
                    break;
                }
                default: {
                    console.log('illegal FF card ID');
                    break;
                }
            }
        }

        // the net worths were updated
        for(let id=0; id<state.players.length; id++) {
            calculateNetWorth(state, id);
        }

        io.to(roomCode).emit('gameState', JSON.stringify(state));
    }

    function handleEndTurn() {
        console.log('handleEndTurn()');
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        if (state.turn !== playerID) {
            return;
        }
        // check that it is the correct player's turn, and they should move
        const player = state.players[playerID];

        if (player.shouldMove || player.shouldHarvest || player.Cash < 0) {
            console.log('unfinished business. cannot end turn yet')
            return;
        }

        state.turn++;
        state.turn %= state.players.length;

        // next player should move next
        state.players[state.turn].shouldMove = true;
        state.players[state.turn].shouldHarvest = false;

        io.to(roomCode).emit('gameState', JSON.stringify(state));
    }

    function handleBuy(item, downPayment) {
        console.log('handleBuy()');
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        // can only buy on your turn
        if (state.turn !== playerID) {
            return;
        }

        const buyCode = performBuy(state, playerID, item, downPayment);
        // TODO: handle invalid buys
        io.to(roomCode).emit('gameState', JSON.stringify(state));
    }

    function handlePaybackDebt(downPayment) {
        console.log('handlePaybackDebt()');
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        // can only buy on your turn
        if (state.turn !== playerID) {
            return;
        }

        const code = performPaybackDebt(state, playerID, downPayment);
        // TODO: handle invalid buys
        io.to(roomCode).emit('gameState', JSON.stringify(state));
    }

    function handleLoan(loanAmount) {
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        const success = performLoan(state, playerID, loanAmount);
        if (success) {
            player.shouldHarvest = shouldPlayerHarvest(state, playerID);
            io.to(roomCode).emit('gameState', JSON.stringify(state));
        }
        else {
            client.emit('ERROR_loan');
        }
    }

    function handleSell(item) {
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        const success = performSellAsset(state, playerID, item);
        if (success) {
            player.shouldHarvest = shouldPlayerHarvest(state, playerID);
            io.to(roomCode).emit('gameState', JSON.stringify(state));
        }
        else {
            client.emit('ERROR_sell');
        }
    }

    function handleBankrupt() {

        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];
        const state = states[roomCode];

        if (!state) {
            return;
        }

        performBankrupt(state, playerID);
        io.to(roomCode).emit('gameState', JSON.stringify(state));
    }




});