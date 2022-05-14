const {
    createGameState,
    movePlayer,
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
    performLoan,
    performSellAsset,
    performBankrupt,
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
        setTimeout(step2, 1000, roomCode, state, positionalDiceValue);
    }

    function step2(roomCode, state, positionalDiceValue) {
        // update the player position based on dice roll
        // and check if player needs to harvest later
        movePlayer(state, positionalDiceValue);

        // pay player for passing christmas vacation
        checkNewYear(state, positionalDiceValue);

        // check if we should double hay/corn for the year
        checkPositionForDoubleYield(state);

        // check for pay/collect money on square
        const balance = checkPositionForBalances(state);
        let paymentReceived = false;

        if (balance >= 0) {
            collectAmount(state, balance);
            paymentReceived = true;
        }
        else {
            paymentReceived = payAmount(state, -balance);
        }

        io.to(roomCode).emit('gameState', JSON.stringify(state));

        // proceed to draw a card, perform harvest, etc.
        if (paymentReceived) {
            step3(roomCode, state, positionalDiceValue);
        }
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

        const success = performSellAsset(state, playerID, loanAmount);
        if (success) {
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

    function step3(roomCode, state, positionalDiceValue) {

        const cardDrawType = checkPositionForDrawingCard(state);

        if (cardDrawType === DRAW_OTB) {
            const cardText = drawOTB(state);

            // the deck could be empty
            if (cardText === null) {
                return;
            }

            io.to(roomCode).emit('drawOTB', cardText);

            // now handle the action
            
            
        }
        else if (cardDrawType === DRAW_FARMERS_FATE) {
            const cardText = drawFarmersFate(state);
            io.to(roomCode).emit('drawFarmersFate', cardText);

            // now handle the action
        }



        io.to(roomCode).emit('gameState', JSON.stringify(state));
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
            const harvestCode = performHarvest(state, harvestDiceValue);
            io.to(roomCode).emit('gameState', JSON.stringify(state));

            // draw operating expense card
            const [cardText, charge] = drawOperatingExpense(state);
            payAmount(state, -charge);

            io.to(roomCode).emit('drawOperatingExpense', cardText);
            io.to(roomCode).emit('gameState', JSON.stringify(state));
        }
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
        
        if(player.shouldMove || player.shouldHarvest) {
            console.log(player);
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

        const buyCode = performBuy(state, item, downPayment);
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

        const code = performPaybackDebt(state, downPayment);
        // TODO: handle invalid buys
        io.to(roomCode).emit('gameState', JSON.stringify(state));
    }




});