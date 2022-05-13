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
    performBuy,
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
            "AhtanumRidge": 0,
            "RattlesnakeRidge": 0,
            "Cascades": 0,
            "ToppenishRidge": 0,
            "Total": 0,
        },
        "Tractors": 0,
        "Harvesters": 0,
        "OTB": {
            'Hay': 0,
            'Grain': 0,
            'Cows': 0,
            'Fruit': 0,
            'Tractor': 0,
            'Harvester': 0,
            'AhtanumRidge': 0,
            'RattlesnakeRidge': 0,
            'Cascades': 0,
            'ToppenishRidge': 0,
        },
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

const PURCHASE_PRICES = {
    'Hay': 20000,
    'Grain': 20000,
    'Cows': 5000,
    'Fruit': 25000,
    'Tractor': 10000,
    'Harvester': 10000,
    'AhtanumRidge': 20000,
    'RattlesnakeRidge': 30000,
    'Cascades': 40000,
    'ToppenishRidge': 50000,
}

const OTB_ITEM_MAP = ['Hay', 'Grain', 'Cows', 'Fruit', 'Tractor', 'Harvester',
    'AhtanumRidge', 'RattlesnakeRidge', 'Cascades', 'ToppenishRidge'];

function performBuy(state, item, downPayment) {

    const player = state.players[state.turn];
    console.log('buy');
    
    // invalid item
    if (!item in PURCHASE_PRICES) {
        return 0;
    }

    console.log('1');

    // insufficient funds
    if (player.Cash < downPayment) {
        return 0;
    }

    console.log('2');

    // did not put 20% down
    const itemPrice = PURCHASE_PRICES[item];
    const minimumDownPayment = 0.2*itemPrice;
    if (downPayment < minimumDownPayment) {
        return 0;
    }

    console.log('3');

    // too much debt
    let loanAmount = itemPrice - downPayment;
    if (loanAmount + player.Debt > MAX_DEBT) {
        return 0;
    }

    console.log('4');

    // don't have the OTB
    if (!player.OTB[item]) {
        return 0;
    }

    console.log('5');

    // if the player tries to pay too much
    if (downPayment > itemPrice) {
        downPayment = itemPrice;
        loanAmount = 0;
    }

    // make the purchase
    player.Cash -= downPayment;
    player.Debt += loanAmount;
    player.OTB[item]--;
    
    switch(item) {
        /* basic items */
        case 'Hay': player.Hay.Acres += 10; break;
        case 'Grain': player.Grain.Acres += 10; break;
        case 'Fruit': player.Fruit.Acres += 5; break;
        case 'Tractor': player.Tractors++; break;
        case 'Harvester': player.Harvester++; break;

        /* livestock */
        case 'Cows': player.Livestock.Farm += 10; player.Livestock.Total += 10; break;
        case 'AhtanumRidge': player.Livestock.AhtanumRidge += 20; player.Livestock.Total += 20; break;
        case 'RattlesnakeRidge': player.Livestock.RattlesnakeRidge += 30; player.Livestock.Total += 30; break;
        case 'Cascades': player.Livestock.Cascades += 40; player.Livestock.Total += 40; break;
        case 'ToppenishRidge': player.Livestock.ToppenishRidge += 50; player.Livestock.Total += 50; break;

        default: break;
    }

    // update player net worth
    calculateNetWorth(state, state.turn);
    
    return 1;
}

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

    const player = state.players[state.turn];

    // new year, get $5000
    if (player.Position >= 0 && player.Position - positionalDiceValue < 0) {
        player.Cash += 5000;
        player.Year++;
        player.Hay.DoubleHay = false;
        player.Grain.DoubleCorn = false;

        player.CompletedHarvests = {
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
        const fate = player.Fate;
        for(let fateCard of fate) {
            state.FarmersFateDeck[fateCard]++;
        }
        player.Fate = [];

        return true;
    }
    return false;
}

function movePlayer(state, diceValue) {

    const player = state.players[state.turn];

    player.Position += diceValue;
    player.Position %= (MAX_POSITION+1);

    if (isHarvestSquare(player.Position)) {
        state.shouldHarvest = true;
    }

    state.shouldMove = false;
}

function payAmount(state, amount) {

    const player = state.players[state.turn];

    // pay the amount
    if (player.Cash >= amount) {
        player.Cash -= amount;
        return 0;
    }

    // can we borrow the entire loan from the bank? (Cannot take out more than $50k)
    let projectedDebt = player.Debt + OVERDRAFT_FEE + amount;

    if (projectedDebt <= MAX_DEBT) {
        player.Debt  = projectedDebt;
        return 1;
    }

    let amountOverMaxDebt = projectedDebt - 50000;

    // can we max out our debt and pay the remaining balance?
    if (player.Cash >= amountOverMaxDebt) {
        player.Cash -= amountOverMaxDebt;
        player.Debt = MAX_DEBT;
        return 2;
    }

    // do we have enough in assets?
    if (amountOverMaxDebt < player.Cash + calculateAssets(state, state.turn)/2) {
        // TODO: begin to sell assets
        return 3;
    }

    // bankrupt
    return 4;
}

function collectAmount(state, amount) {
    const player = state.players[state.turn];
    player.Cash += amount; 
}

function checkPositionForDrawingCard(state) {
    const player = state.players[state.turn];
    switch(player.Position) {
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
    const player = state.players[state.turn];
    switch(player.Position) {

        // positive numbers COLLECT 
        // negative numbers PAY

        case 0: return 1000;
        case 1: return -0.1*player.Debt; // pay 10% interest
        case 3: return player.Livestock > 0 ? -500 : 0; // pay $500 if you have cows
        case 5: return 1000;
        case 9: return player.Grain.Acres > 0 ? -2000 : 0; // pay $2000 if you have wheat
        case 10: return -500;
        case 12: return player.Fruit.Acres > 0 ? -2000 : 0; // pay $2000 if you own fruit
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
        case 29: return 50*player.Grain.Acres; // July 4. Add $50 per acre to paycheck
        case 30: return 5000; // go to 4th week of february and collect $5000
        case 31: return player.Harvesters > 0 ? 1000 : 0; // collect 1000 if harvester
        case 32: return 500;
        case 33: return -50*player.Grain.Acres; // Lose 50 per acre to paycheck

        // 3rd Hay Cutting
        case 34: return player.Tractors > 0 ? 1000 : 0; // if tractor, go to Nov 3 and collect 1000 

        // Livestock
        case 36: return 500;
        case 38: return player.Fruit.Acres > 0 ? -2000 : 0; // pay $2000 if you own fruit 
        case 39: return 500;

        // Apple
        case 44: return 500;
        case 45: return 1000;
        case 46: return player.Fruit.Acres > 0 ? -1000 : 0; // pay $1000 if you own fruit
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
    const player = state.players[state.turn];
    const i = drawRandomCardFromDeck(state.OTBDeck);

    if (i === -1) {
        return null;
    }

    state.OTBDeck[i]--;
    player.OTB[OTB_ITEM_MAP[i]]++;
    return OTBCards[i];
}

function drawFarmersFate(state) {
    const player = state.players[state.turn];
    let id = drawRandomCardFromDeck(state.FarmersFateDeck);

    // if the draw stack is empty, reshuffle
    if (id === -1) {
        state.FarmersFateDeck = createFarmersFateDeck();
        id = drawRandomCardFromDeck(state.FarmersFateDeck);
    }

    state.FarmersFateDeck[id]--;
    player.Fate.push(id);
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
    const player = state.players[state.turn];
    switch(id) {
        case 0: return -0.1*player.Debt; // pay 10% interest
        case 1: return -3000; 
        case 2: return -500;
        case 3: return -1000;
        case 4: return -500;
        case 5: return player.Harvesters == 0 ? -2000 : 0; // pay 2000 no harvester
        case 6: return -500;
        case 7: return -1000;
        case 8: return -100*player.Fruit.Acres; // pay $100 per fruit acre
        case 9: return player.Tractors == 0 ? -2000 : 0; // pay 2000 no tractor
        case 10: return -100*player.Grain.Acres; // pay $100 per grain acre
        case 11: return -500;
        case 12: return -3000;
        case 13: return -100*(player.Hay.Acres + player.Grain.Acres + player.Fruit.Acres);
        case 14: return -1500;
        case 15: return -100*player.Livestock.Total;
        default: return 0;
    }
}

function calculateAssets(state, playerID) {
    const player = state.players[playerID];
    let assets = 0;

    assets += player.Hay.Acres * HAY_VALUE_PER_ACRE;
    assets += player.Grain.Acres * WHEAT_VALUE_PER_ACRE;
    assets += player.Fruit.Acres * FRUIT_VALUE_PER_ACRE;
    assets += player.Livestock.Total * COW_VALUE_PER_HEAD;
    assets += player.Tractors * TRACTOR_VALUE;
    assets += player.Harvesters * HARVESTER_VALUE;

    return assets;
}

// calculate the net worth for the current player
function calculateNetWorth(state, playerID) {
    let netWorth = calculateAssets(state, playerID);
    const player = state.players[playerID];

    netWorth += player.Cash;
    netWorth -= player.Debt;
    player.NetWorth = netWorth;
}

function shouldPlayerHarvest(state) {
    const player = state.players[state.turn];
    const position = player.Position;
    const completedHarvests = player.CompletedHarvests;
    const typeOfHarvest = typeOfHarvestSquare(position);

    let hasThisAsset = false;
    if (typeOfHarvest === 'Livestock') {
        hasThisAsset = player.Livestock.Total > 0;
    }
    else if (typeOfHarvest === '1stHay' || typeOfHarvest === '2ndHay' ||
    typeOfHarvest === '3rdHay' || typeOfHarvest === '4thHay') {
        hasThisAsset = player.Hay.Acres > 0;
    }
    else if (typeOfHarvest === 'Corn' || typeOfHarvest === 'Wheat') {
        hasThisAsset = player.Grain.Acres > 0;
    }
    else if (typeOfHarvest === 'Apple' || typeOfHarvest === 'Cherry') {
        hasThisAsset = player.Fruit.Acres > 0;
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
    const player = state.players[state.turn];

    const position = player.Position;
    const doubleHay = player.Hay.DoubleHay;
    const doubleCorn = player.Grain.DoubleCorn;

    if(!shouldPlayerHarvest(state)) {
        return 0;
    }
    
    const typeOfHarvest = typeOfHarvestSquare(position);
    let payout = 0;

    if (typeOfHarvest === '1stHay' || typeOfHarvest === '2ndHay' || 
        typeOfHarvest === '3rdHay' || typeOfHarvest === '4thHay') {
        payout = calculateHayHarvest(player.Hay.Acres, diceValue);

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
        payout = calculateFruitHarvest(player.Fruit.Acres, diceValue);

        if (position === 23) {
            payout /= 2;
        }
    }
    else if (typeOfHarvest === 'Apple') {
        payout = calculateFruitHarvest(player.Fruit.Acres, diceValue);
    }
    else if (typeOfHarvest === 'Wheat') {
        payout = calculateGrainHarvest(player.Grain.Acres, diceValue);

        // half the wheat harvest
        if (player.Fate.includes(9)) {
            payout /= 2;
        }

        if (position === 29) {
            payout += 50*player.Grain.Acres;
        }
        else if (position === 33) {
            payout -= 50*player.Grain.Acres;
        }
    }
    else if (typeOfHarvest === 'Corn') {
        payout = calculateGrainHarvest(player.Grain.Acres, diceValue);
    }
    else if (typeOfHarvest === 'Livestock') {
        payout = calculateLivestockHarvest(player.Livestock.Total, diceValue);

        if (position === 37) {
            payout /= 2;
        }
    }

    // IRS garnishes wages
    if (player.Fate.includes(4)) {
        payout = 0;
    }

    // pay the player
    player.Cash += payout;
    calculateNetWorth(state, state.turn);

    // record that the Harvest was performed
    state.shouldHarvest = false;
    player.CompletedHarvests[typeOfHarvest] = true;
}