const { createGameState, movePlayer } = require('./game');
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
    client.on('rollDice', handleRollDice);
    client.on('playAgain', handlePlayAgain);

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

    function handleRollDice() {
        console.log('handleRollDice()')

        let roomCode = clientRooms[client.id];
        let playerID = playerIDs[client.id];

        // check that it is the correct player's turn
        if (states[roomCode].turn !== playerID) {
            return;
        }

        let diceValue = Math.floor(Math.random()*6)+1;
        io.to(roomCode).emit('rollDiceAnimation', diceValue);

        movePlayer(states[roomCode], diceValue);
        io.to(roomCode).emit('gameState', JSON.stringify(states[roomCode]));
    }

    function handleKeyDown(keyCode) {
        console.log('handleKeyDown()')

        var roomCode = clientRooms[client.id];

        if (!roomCode) {
            return;
        }

        if (!state[roomCode].started) {
            return;
        }

        updateGame(keyCode, roomCode);
    }

    function handlePlayAgain() {
        console.log('playAgain()')

        console.log('1()')
        var roomCode = clientRooms[client.id];
        if (!roomCode) {
            return;
        }

        console.log('2()')
        if (state[roomCode].started) {
            return;
        }

        console.log('newGame()')
        state[roomCode] = newGame(state[roomCode]);
        state[roomCode].started = true;
        io.to(roomCode).emit('gameState', JSON.stringify(state[roomCode]));
    }

    

    function updateGame(keyCode, roomCode) {
        console.log('updateGame()')

        if(client.id !== state[roomCode].player1.id && client.id !== state[roomCode].player2.id) {
            return;
        }

        if(client.id === state[roomCode].player1.id && state[roomCode].turn !== 1) {
            return;
        }
        else if (client.id === state[roomCode].player2.id && state[roomCode].turn !== 2) {
            return;
        }

        // game logic
        state[roomCode] = processGuess(keyCode, state[roomCode]);

        if (checkWordIsCorrect(state[roomCode])) {
            state[roomCode] = updateCorrectWord(state[roomCode]);
        }

        io.to(roomCode).emit('gameState', JSON.stringify(state[roomCode]));

        var winner = checkWinner(state[roomCode]);
        if (winner !== 0) {
            io.to(roomCode).emit('gameOver', winner);

            state[roomCode].started = false; // no more key-downs
            if (winner === 1) {
                state[roomCode].player1.wins++;
                state[roomCode].player2.losses++;
            }
            else if (winner === 2) {
                state[roomCode].player2.wins++;
                state[roomCode].player1.losses++;
            }

            state[roomCode].previousWords.push(state[roomCode].correctWord);
            io.to(roomCode).emit('gameState', JSON.stringify(state[roomCode]));
        }
        
    }


});