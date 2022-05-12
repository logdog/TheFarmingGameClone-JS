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
const DRAW_FARMERS_FATE = 2;

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
    drawOperatingExpense,
    calculateNetWorth,
    shouldPlayerHarvest,
    performHarvest,
    DRAW_OTB,
    DRAW_FARMERS_FATE,
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

        state.players[state.turn].CompletedHarvests = {
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

        // TODO: remove IRS card, other Farmers Fate end of the year cards
        // and put it back into the deck
        const fate = state.players[state.turn].Fate;
        for(let fateCard of fate) {
            state.FarmersFateDeck[fateCard]++;
        }
        state.players[state.turn].Fate = [];

        return true;
    }
    return false;
}

function movePlayer(state, diceValue) {

    state.players[state.turn].Position += diceValue;
    state.players[state.turn].Position %= (MAX_POSITION+1);

    if (isHarvestSquare(state.players[state.turn].Position)) {
        state.shouldHarvest = true;
    }

    state.shouldMove = false;
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
    let id = drawRandomCardFromDeck(state.FarmersFateDeck);

    // if the draw stack is empty, reshuffle
    if (id === -1) {
        state.FarmersFateDeck = createFarmersFateDeck();
        id = drawRandomCardFromDeck(state.FarmersFateDeck);
    }

    state.FarmersFateDeck[id]--;
    state.players[state.turn].Fate.push(id);
    return FarmersFateCards[id];
}

function drawOperatingExpense(state) {
    const id = drawRandomCardFromDeck(state.OperatingExpenseDeck);

    // if the draw stack is empty, reshuffle
    if (id === -1) {
        state.OperatingExpenseDeck = createOperatingExpenseDeck();
        id = drawRandomCardFromDeck(state.OperatingExpenseDeck);
    }

    state.OperatingExpenseDeck[id]--;
    return [OperatingExpenseCards[id], operatingExpenseCosts(state, id)];
}

function operatingExpenseCosts(state, id) {
    switch(id) {
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
        case 12: return -3000;
        case 13: return -100*(state.players[state.turn].Hay.Acres + state.players[state.turn].Grain.Acres + state.players[state.turn].Fruit.Acres);
        case 14: return -1500;
        case 15: return -100*state.players[state.turn].Livestock.Total;
        default: return 0;
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

function shouldPlayerHarvest(state) {
    const position = state.players[state.turn].Position;
    const completedHarvests = state.players[state.turn].CompletedHarvests;
    const typeOfHarvest = typeOfHarvestSquare(position);

    let hasThisAsset = false;
    if (typeOfHarvest === 'Livestock') {
        hasThisAsset = state.players[state.turn].Livestock.Total > 0;
    }
    else if (typeOfHarvest === '1stHay' || typeOfHarvest === '2ndHay' ||
    typeOfHarvest === '3rdHay' || typeOfHarvest === '4thHay') {
        hasThisAsset = state.players[state.turn].Hay.Acres > 0;
    }
    else if (typeOfHarvest === 'Corn' || typeOfHarvest === 'Wheat') {
        hasThisAsset = state.players[state.turn].Grain.Acres > 0;
    }
    else if (typeOfHarvest === 'Apple' || typeOfHarvest === 'Cherry') {
        hasThisAsset = state.players[state.turn].Fruit.Acres > 0;
    }

    return isHarvestSquare(position) && hasThisAsset &&
        completedHarvests[typeOfHarvestSquare(position)] == false;
}

function isHarvestSquare(position) {
    return position >= 19 && position <= 48;
}


// what kind of harvest?
function typeOfHarvestSquare(position) {
    if (position >= 19 && position <= 22) {
        return '1stHay';
    }
    if (position >= 23 && position <= 25) {
        return 'Cherry';
    }
    if (position >= 26 && position <= 28) {
        return '2ndHay';
    }
    if (position >= 29 && position <= 33) {
        return 'Wheat';
    }
    if (position >= 34 && position <= 35) {
        return '3rdHay';
    }
    if (position >= 36 && position <= 39) {
        return 'Livestock';
    }
    if (position >= 40 && position <= 41) {
        return '4thHay';
    }
    if (position >= 42 && position <= 45) {
        return 'Apple';
    }
    if (position >= 46 && position <= 48) {
        return 'Corn';
    }
    return null;
}

function calculateHayHarvest(acerage, diceRoll) {
    const payoutPerAcre = [40,60,100,150,220,300];
    return acerage * payoutPerAcre[diceRoll-1];
}

function calculateGrainHarvest(acerage, diceRoll) {
    const payoutPerAcre = [80,150,250,375,525,700];
    let payout = acerage * payoutPerAcre[diceRoll-1];
    if (diceRoll == 4 || diceRoll == 5) {
        if (acerage % 20 !== 0) {
            // 10 acres, 30 acres, 50 acres, etc...
            payout += 50;
        }
    }
    return payout;
}

function calculateFruitHarvest(acerage, diceRoll) {
    const payoutPerAcre = [400,700,1200,1800,2600,3500];
    return acerage * payoutPerAcre[diceRoll-1];
}

function calculateLivestockHarvest(heads, diceRoll) {
    const payoutPerHead = [140,200,280,380,500,750];
    return heads * payoutPerHead[diceRoll-1];
}


function performHarvest(state, diceValue) {
    const playerID = state.turn;
    const position = state.players[playerID].Position;
    const doubleHay = state.players[playerID].Hay.DoubleHay;
    const doubleCorn = state.players[playerID].Grain.DoubleCorn;

    if(!shouldPlayerHarvest(state)) {
        return 0;
    }
    
    const typeOfHarvest = typeOfHarvestSquare(position);
    let payout = 0;

    if (typeOfHarvest === '1stHay' || typeOfHarvest === '2ndHay' || 
        typeOfHarvest === '3rdHay' || typeOfHarvest === '4thHay') {
        payout = calculateHayHarvest(state.players[playerID].Hay.Acres, diceValue);

        if (doubleHay) {
            payout *= 2;
        }

        switch(position) {
            case 21: payout /= 2; break;
            case 26: payout *= 2; break;
            default: break;
        }
    }
    else if (typeOfHarvest === 'Cherry') {
        payout = calculateFruitHarvest(state.players[playerID].Fruit.Acres, diceValue);

        if (position === 23) {
            payout /= 2;
        }
    }
    else if (typeOfHarvest === 'Apple') {
        payout = calculateFruitHarvest(state.players[playerID].Fruit.Acres, diceValue);
    }
    else if (typeOfHarvest === 'Wheat') {
        payout = calculateGrainHarvest(state.players[playerID].Grain.Acres, diceValue);

        // half the wheat harvest
        if (state.players[playerID].Fate.includes(9)) {
            payout /= 2;
        }

        if (position === 29) {
            payout += 50*state.players[playerID].Grain.Acres;
        }
        else if (position === 33) {
            payout -= 50*state.players[playerID].Grain.Acres;
        }
    }
    else if (typeOfHarvest === 'Corn') {
        payout = calculateGrainHarvest(state.players[playerID].Grain.Acres, diceValue);
    }
    else if (typeOfHarvest === 'Livestock') {
        payout = calculateLivestockHarvest(state.players[playerID].Livestock.Total, diceValue);

        if (position === 37) {
            payout /= 2;
        }
    }

    // IRS garnishes wages
    if (state.players[playerID].Fate.includes(4)) {
        payout = 0;
    }

    // pay the player
    state.players[playerID].Cash += payout;
    calculateNetWorth(state, playerID);

    // record that the Harvest was performed
    state.shouldHarvest = false;
    state.players[playerID].CompletedHarvests[typeOfHarvest] = true;
}