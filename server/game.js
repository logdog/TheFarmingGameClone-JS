// as long as the server is running, use these words
const fs = require('fs');

try {
  OTBCards = fs.readFileSync('./OTB.txt', 'utf8').split('\r\n');
  FarmersFateCards = fs.readFileSync('./FarmersFate.txt', 'utf8').split('\r\n');
  OperatingExpenseCards = fs.readFileSync('./OperatingExpense.txt', 'utf8').split('\r\n');
} catch (err) {
  console.error(err);
}

console.log(OTBCards)
console.log(FarmersFateCards)
console.log(OperatingExpenseCards)

const DRAW_NOTHING = 0;
const DRAW_OTB = 1;
const DRAW_OPERATING_EXPENSE = 2;
const DRAW_FARMERS_FATE = 3;

module.exports = {
    createGameState,
    movePlayer,
    checkPositionForDrawingCard,
    checkPositionForBalances,
    checkNewYear,
    collectAmount,
    payAmount,
    drawOTB,
    drawFarmersFate,
    calculateNetWorth,
    DRAW_OTB,
    DRAW_FARMERS_FATE,
    DRAW_OPERATING_EXPENSE
}

function createPlayer(name, color) {
    return {
        "Name": name,
        "Color": color,
        "Position": 0,
        "Year": 0,
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
        "CompletedHarvests": {
            "1stHay": false,
            "2ndHay": false,
            "3rdHay": false,
            "4thHay": false,
            "Wheat": false,
            "Corn": false,
            "Cherry": false,
            "Apple": false,
            "Livestock": false,
        }
    };
}



function createOTBDeck() {
    return [5,5,5,5,3,3,2,2,2,2];
}

function createOperatingExpenseDeck() {
    return [2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1];
}

function createFarmersFateDeck() {
    return [2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
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

function isHarvestSquare(position) {
    return position >= 19 && position <= 48;
}

const MAX_POSITION = 48;
const MAX_DEBT = 50000;
const OVERDRAFT_FEE = 1000;

const HAY_VALUE_PER_ACRE = 2000;
const WHEAT_VALUE_PER_ACRE = 2000;
const COW_VALUE_PER_HEAD = 500;
const FRUIT_VALUE_PER_ACRE = 5000;
const TRACTOR_VALUE = 10000;
const HARVESTER_VALUE = 10000;

function createGameState(avatarIDs) {
    return {
        turn: Math.floor(Math.random() * avatarIDs.length),
        shouldMove: true,
        shouldHarvest: false,
        OTBDeck: createOTBDeck(),
        FarmersFateDeck: createFarmersFateDeck(),
        OperatingExpenseDeck: createOperatingExpenseDeck(),
        players: avatarIDs.map(id => createPlayer(avatarNames[id], avatarColors[id])),
    };
}

function checkNewYear(state, positionalDiceValue) {

    // new year, get $5000
    if (state.players[state.turn].Position >= 0 && state.players[state.turn].Position - positionalDiceValue < 0) {
        state.players[state.turn].Cash += 5000;
        state.players[state.turn].Year++;
        state.players[state.turn].Hay.DoubleHay = false;
        state.players[state.turn].Grain.DoubleCorn = false;

        return true;
    }
    return false;
}

function movePlayer(state, diceValue) {

    state.players[state.turn].Position += diceValue;
    state.players[state.turn].Position %= (MAX_POSITION+1);

    if (isHarvestSquare(state.players[state.turn].Position)) {
        state.players[state.turn].shouldHarvest = true;
    }

    state.players[state.turn].shouldMove = false;
}

function payAmount(state, amount) {

    // pay the amount
    if (state.players[state.turn].Cash >= amount) {
        state.players[state.turn].Cash -= amount;
        return 0;
    }

    // can we borrow the entire loan from the bank? (Cannot take out more than $50k)
    let projectedLoanBalance = state.players[state.turn].Debt + OVERDRAFT_FEE + amount;

    if (projectedLoanBalance <= MAX_DEBT) {
        state.players[state.turn].Debt  = projectedLoanBalance;
        return 1;
    }

    let amountOverMaxDebt = projectedLoanBalance - 50000;

    // can we max out our debt and pay the remaining balance?
    if (state.players[state.turn].Cash >= amountOverMaxDebt) {
        state.players[state.turn].Cash -= amountOverMaxDebt;
        state.players[state.turn].Debt = MAX_DEBT;
        return 2;
    }

    // do we have enough in assets?
    if (amountOverMaxDebt < state.players[state.turn].Cash + calculateAssets(state, state.turn)/2) {
        // TODO: begin to sell assets
        return 3;
    }

    // bankrupt
    return 4;
}

function collectAmount(state, amount) {
    state.players[state.turn].Cash += amount; 
}

function checkPositionForDrawingCard(state) {
    switch(state.players[state.turn].Position) {
        case 2: return DRAW_OTB; // Jan 2
        case 6: return DRAW_FARMERS_FATE; // Feb 2
        case 8: return DRAW_OTB; // Feb 4
        case 11: return DRAW_OTB; // go back to Jan 2, draw OTB
        case 13: return DRAW_OTB; // Apr 1
        case 20: return DRAW_OTB; // May 4
        case 24: return DRAW_FARMERS_FATE; // June 4
        case 27: return DRAW_OTB; // July 2
        case 30: return DRAW_OTB; // go to Feb 4, draw OTB
        case 35: return DRAW_OTB; // Sep 2
        case 40: return DRAW_FARMERS_FATE; // Oct 2
        case 41: return DRAW_OTB; // Oct 3
        case 42: return DRAW_FARMERS_FATE; // Oct 4
        case 43: return DRAW_OTB; // Nov 1
        case 48: return DRAW_FARMERS_FATE; // Dec 2

        default: return DRAW_NOTHING;
    }
}

function checkPositionForBalances(state) {
    switch(state.players[state.turn].Position) {

        // positive numbers COLLECT 
        // negative numbers PAY

        case 0: return 1000;
        case 1: return -0.1*state.players[state.turn].Debt; // pay 10% interest
        case 3: return state.players[state.turn].Livestock > 0 ? -500 : 0; // pay $500 if you have cows
        case 5: return 1000;
        case 9: return state.players[state.turn].Grain.Acres > 0 ? -2000 : 0; // pay $2000 if you have wheat
        case 10: return -500;
        case 12: return state.players[state.turn].Fruit.Acres > 0 ? -2000 : 0; // pay $2000 if you own fruit
        case 15: return -500;
        case 16: return -1000;
        case 17: return 500;
        case 18: return -500;

        // 1st Hay Cutting
        case 19: return 1000; 
        case 22: return 500;

        // 2nd Hay Cutting
        case 28: return 500; // go to harvest moon

        // Wheat Harvest
        case 29: return 50*state.players[state.turn].Grain.Acres; // July 4. Add $50 per acre to paycheck
        case 30: return 5000; // go to 4th week of february and collect $5000
        case 31: return state.players[state.turn].Harvesters > 0 ? 1000 : 0; // collect 1000 if harvester
        case 32: return 500;
        case 33: return -50*state.players[state.turn].Grain.Acres; // Lose 50 per acre to paycheck

        // 3rd Hay Cutting
        case 34: return state.players[state.turn].Tractors > 0 ? 1000 : 0; // if tractor, go to Nov 3 and collect 1000 

        // Livestock
        case 36: return 500;
        case 38: return state.players[state.turn].Fruit.Acres > 0 ? -2000 : 0; // pay $2000 if you own fruit 
        case 39: return 500;

        // Apple
        case 44: return 500;
        case 45: return 1000;
        case 46: return state.players[state.turn].Fruit.Acres > 0 ? -1000 : 0; // pay $1000 if you own fruit
        case 47: return 500;

        default: return 0;
    }
}

// returns the type of card that is drawn from the deck
function drawRandomCardFromDeck(deck) {
    const total = deck.reduce((a, b) => a + b, 0);
    if (total === 0) {
        return -1;
    }

    const val = Math.floor(Math.random()*total + 1);

    let accumulated = 0;
    for(let i=0; i<deck.length; i++) {
        accumulated += deck[i];
        if (val < accumulated) {
            return i;
        }
    }
}

function drawOTB(state) {
    const i = drawRandomCardFromDeck(state.OTBDeck);

    if (i === -1) {
        return null;
    }

    state.OTBDeck[i]--;
    state.players[state.turn].OTB.push(i);
    return OTBCards[i];
}

function drawFarmersFate(state) {
    let i = drawRandomCardFromDeck(state.FarmersFateDeck);

    // if the draw stack is empty, reshuffle
    if (i === -1) {
        state.FarmersFateDeck = createFarmersFateDeck();
        i = drawRandomCardFromDeck(state.FarmersFateDeck);
    }

    state.FarmersFateDeck[i]--;
    state.players[state.turn].Fate.push(i);
    return FarmersFateCards[i];
}

function drawOperatingExpense(state) {
    const i = drawRandomCardFromDeck(state.OperatingExpenseDeck);
    state.OperatingExpenseDeck[i]--;

    switch(i) {
        case 0: return -0.1*state.players[state.turn].Debt; // pay 10% interest
        case 1: return -3000; 
        case 2: return -500;
        case 3: return -1000;
        case 4: return -500;
        case 5: return state.players[state.turn].Harvesters == 0 ? -2000 : 0; // pay 2000 no harvester
        case 6: return -500;
        case 7: return -1000;
        case 8: return -100*state.players[state.turn].Fruit.Acres; // pay $100 per fruit acre
        case 9: return state.players[state.turn].Tractors == 0 ? -2000 : 0; // pay 2000 no tractor
        case 10: return -100*state.players[state.turn].Grain.Acres; // pay $100 per grain acre
        case 11: return -500;
        // TODO
    }
}

function calculateAssets(state, playerID) {
    let assets = 0;

    assets += state.players[playerID].Hay.Acres * HAY_VALUE_PER_ACRE;
    assets += state.players[playerID].Grain.Acres * WHEAT_VALUE_PER_ACRE;
    assets += state.players[playerID].Fruit.Acres * FRUIT_VALUE_PER_ACRE;
    assets += state.players[playerID].Livestock.Total * COW_VALUE_PER_HEAD;
    assets += state.players[playerID].Tractors * TRACTOR_VALUE;
    assets += state.players[playerID].Harvesters * HARVESTER_VALUE;

    return assets;
}

// calculate the net worth for the current player
function calculateNetWorth(state, playerID) {
    let netWorth = calculateAssets(state, playerID);
    netWorth += state.players[playerID].Cash;
    netWorth -= state.players[playerID].Debt;
    state.players[playerID].NetWorth = netWorth;
}