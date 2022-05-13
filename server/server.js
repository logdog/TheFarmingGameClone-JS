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
    shouldPlayerHarvest,
    performHarvest,
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
            playerIDs[client.id] = roomClientIDs[roomCode].length-1;

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

    function handleRollPositionDice() {
        console.log('handleRollPositionDice()')

        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];

        if (!states[roomCode]) {
            return;
        }

        // check that it is the correct player's turn, and they should move
        if (states[roomCode].turn !== playerID || !states[roomCode].shouldMove) {
            return;
        }

        // roll the positional dice
        let positionalDiceValue = Math.floor(Math.random()*6)+1;
        io.to(roomCode).emit('rollPositionDiceAnimation', positionalDiceValue);

        // wait 1 second before revealing the answer
        setTimeout(finishRollPositionDice, 1000);
        function finishRollPositionDice() {

            console.log(states[roomCode])
            movePlayer(states[roomCode], positionalDiceValue);
            console.log('move()')
            console.log(states[roomCode])
            
            const cardDrawType = checkPositionForDrawingCard(states[roomCode]);
            

            switch(cardDrawType) {
                case DRAW_OTB: {
                    const cardText = drawOTB(states[roomCode]);
                    
                    // the deck could be empty
                    if (cardText !== null) {
                        io.to(roomCode).emit('drawOTB', cardText);
                    }
                    break;
                }
                case DRAW_FARMERS_FATE: {
                    // the deck cannot be empty
                    const cardText = drawFarmersFate(states[roomCode]);
                    io.to(roomCode).emit('drawFarmersFate', cardText);
                    break;
                }
            }
            
            io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
            
            // is this a new year?
            if (checkNewYear(states[roomCode], positionalDiceValue)) {
                console.log("happy new year")
                client.emit('happyNewYear'); // an animation later?
                io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
            }
            
            // collect money or pay up
            const moneyToCollect = checkPositionForBalances(states[roomCode]);
            console.log('moneyToCollect', moneyToCollect);
            if (moneyToCollect > 0) {
                collectAmount(states[roomCode], moneyToCollect);
            }
            else {
                const paymentCode = payAmount(states[roomCode], -moneyToCollect);

                switch(paymentCode) {
                    case 3: break; // requires player to sell their assets
                    case 4: break; // player is bankrupt... game over?
                }
            }
            
            // calculate net worth
            calculateNetWorth(states[roomCode], states[roomCode].turn);
            
            // does the player need to harvest?
            states[roomCode].shouldHarvest = shouldPlayerHarvest(states[roomCode]);
            
            io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
        }
    }

    function handleRollHarvestDice() {
        console.log('handleRollPositionDice()')
        
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];

        if (!states[roomCode]) {
            return;
        }

        // check that it is the correct player's turn, and they should move
        if (states[roomCode].turn !== playerID || !states[roomCode].shouldHarvest) {
            return;
        }

        // roll the harvest dice
        let harvestDiceValue = Math.floor(Math.random()*6)+1;
        io.to(roomCode).emit('rollHarvestDiceAnimation', harvestDiceValue);
        
        setTimeout(finishRollHarvestDice, 1000);
        function finishRollHarvestDice() {
            // harvest 
            const harvestCode = performHarvest(states[roomCode], harvestDiceValue);
            io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
    
            // draw operating expense card
            const [cardText, charge] = drawOperatingExpense(states[roomCode]);
            payAmount(states[roomCode], -charge);
    
            io.to(roomCode).emit('drawOperatingExpense', cardText);
            io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
        }
    }

    function handleEndTurn() {
        console.log('handleEndTurn()');
        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];

        if (!states[roomCode]) {
            return;
        }

        // check that it is the correct player's turn, and they should move
        if (states[roomCode].turn !== playerID || states[roomCode].shouldMove || states[roomCode].shouldHarvest) {
            return;
        }

        console.log('done')

        states[roomCode].turn++;
        states[roomCode].turn %= states[roomCode].players.length;
        states[roomCode].shouldMove = true;
        states[roomCode].shouldHarvest = false;
        io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));

    }

});