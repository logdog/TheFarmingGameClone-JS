// as long as the server is running, use these words
const fs = require('fs');
let words;

const MAX_MISTAKES = 11;
// const MAX_MISTAKES = 2;

try {
  words = fs.readFileSync('./words.txt', 'utf8').split('\r\n');
} catch (err) {
  console.error(err);
}

module.exports = {
    createGameState,
    processGuess,
    checkWordIsCorrect,
    updateCorrectWord,
    checkWinner,
    newGame,
}

function createPlayer(name, color) {
    return {
        "Name": name,
        "Color": color,
        "Position": 0,
        "NetWorth": 40000,
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
            "Acres": 0,
        },
        "Livestock" : {
            "Farm": 0,
            "Ahtanum": 0,
            "Rattlesnake": 0,
            "Toppenish": 0,
            "Cascades": 0,
            "Total": 0,
        },
        "Tractors": 0,
        "Harvesters": 0,
        "OTB": [],
        "Fate": [],
    };
}

const avatarNames = [
    "Wapato Willie",
    "Toppenish Tom",
    "Roza Ray",
    "Harrah Harry",
    "Sunnyside Sidney",
    "Satus Sam",
];

const avatarColors = [
    "Yellow",
    "Green",
    "Brown",
    "Black",
    "White",
    "Blue",
];

function createGameState(avatarIDs) {
    return {
        turn: 0,
        players: avatarIDs.map(id => createPlayer(avatarNames[id], avatarColors[id])),
    };
}

function processGuess(key, state) {
    // check if key is a valid character
    key = key.toUpperCase();
    if (!(key >= 'A' &&  key <= 'Z')) {
        return state;
    }

    // check if this character has already been guessed
    for (let guess of state.player1.guesses) {
        if (key == guess.letter) {
            return state;
        }
    }
    for (let guess of state.player2.guesses) {
        if (key == guess.letter) {
            return state;
        }
    }

    // game state logic
    if (state.correctWord.includes(key)) {

        // we guessed the a letter correctly
        if (state.turn === 1) {
            state.player1.guesses.push({letter: key, correct: true});
        }
        else if (state.turn === 2) {
            state.player2.guesses.push({letter: key, correct: true});
        }

        // update the guessedWord to include the guessed letter
        newGuessedWordArr = [];
        for (let i=0; i<state.correctWord.length; i++) {
            if (state.correctWord[i] === state.guessedWord[i]) {
                newGuessedWordArr.push(state.correctWord[i]);
            }
            else if (state.correctWord[i] === key) {
                newGuessedWordArr.push(state.correctWord[i]);
            }
            else {
                newGuessedWordArr.push(state.guessedWord[i]);
            }
        }
        state.guessedWord = newGuessedWordArr.join('');
    }
    else {
        // the letter was an incorrect guess
        if (state.turn === 1) {
            state.player1.guesses.push({letter: key, correct: false});
            state.player1.mistakes += 1;
        }
        else if (state.turn === 2) {
            state.player2.guesses.push({letter: key, correct: false});
            state.player2.mistakes += 1;
        }
    }

    // update the player's turn
    state.turn = state.turn % 2 + 1;
    return state;
}

function checkWordIsCorrect(state) {
    if (state.correctWord === state.guessedWord) {
        return true;
    }
    return false;
}

// updates the correct word and resets the guessed word
// also clears the keyboard
function updateCorrectWord(state) {
    state.previousWords.push(state.correctWord);

    // if we somehow had the crazy scenario where we got through all 750+ words...
    // allow us to start recyling old words.... in a FAT minute
    if (state.previousWords.length >= words.length) {
        state.previousWords = state.previousWords.slice(-words.length/2);
    }
    
    // ensure that we find a new word to use
    function findNewWord() {
        let newWord = words[Math.floor(Math.random()*words.length)].toUpperCase();

        for (let oldWord of state.previousWords) {
            if (newWord === oldWord) {
                return findNewWord();
            }
        }
        return newWord;
    }

    state.correctWord = findNewWord();
    state.guessedWord = '_'.repeat(state.correctWord.length);
    state.player1.guesses = [];
    state.player2.guesses = [];
    return state;
}

function checkWinner(state) {
    if (state.player1.mistakes >= MAX_MISTAKES) {
        return 2; // player 2 wins
    }
    else if (state.player2.mistakes >= MAX_MISTAKES) {
        return 1; // player 1 wins
    }
    return 0; // no winner yet
}

function newGame(state) {
    updateCorrectWord(state);
    state.player1.mistakes = 0;
    state.player2.mistakes = 0;
    return state;
}