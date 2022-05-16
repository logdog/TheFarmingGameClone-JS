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

const FF_IRS_INDEX = 4;
const FF_HALF_WHEAT_INDEX = 9;

module.exports = {
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
    shouldPlayerHarvest,
    performHarvest,
    performBuy,
    performPaybackDebt,
    checkPositionForDoubleYield,
    performLoan,
    performSellAsset,
    performBankrupt,
    shouldChangePosition,
    DRAW_OTB,
    DRAW_FARMERS_FATE,
}

function createPlayer(name, color) {
    return {
        Name: name,
        Color: color,
        Position: 0,
        Year: 0,
        NetWorth: 40000,
        Cash: 5000,
        Debt: 5000,
        shouldMove: true,
        shouldHarvest: false,
        IRS: false,
        Hay: {
            Acres: 10,
            DoubleHay: false,
        },
        Grain : {
            Acres: 10,
            DoubleCorn: false,
            HalfWheat: false
        },
        Fruit : {
            Acres: 0,
        },
        Livestock : {
            Farm: 0,
            AhtanumRidge: 0,
            RattlesnakeRidge: 0,
            Cascades: 0,
            ToppenishRidge: 0,
            Total: 0,
        },
        Tractors: 0,
        Harvesters: 0,
        OTB: {
            Hay: 0,
            Grain: 0,
            Cows: 0,
            Fruit: 0,
            Tractor: 0,
            Harvester: 0,
            AhtanumRidge: 0,
            RattlesnakeRidge: 0,
            Cascades: 0,
            ToppenishRidge: 0,
        },
        CompletedHarvests: {
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

function performBuy(state, playerID, item, downPayment) {

    const player = state.players[playerID];
    console.log('buy');
    
    // invalid item
    if (!item in PURCHASE_PRICES) {
        return 0;
    }

    // insufficient funds
    if (player.Cash < downPayment) {
        return 0;
    }

    // did not put 20% down
    const itemPrice = PURCHASE_PRICES[item];
    const minimumDownPayment = 0.2*itemPrice;
    if (downPayment < minimumDownPayment) {
        return 0;
    }


    // too much debt
    let loanAmount = itemPrice - downPayment;
    if (loanAmount + player.Debt > MAX_DEBT) {
        return 0;
    }

    // don't have the OTB
    if (!player.OTB[item]) {
        return 0;
    }

    // player cannot have more than 20 cattle on their farm
    if (player.Livestock.Farm >= 20) {
        return 0;
    }

    // only one player can lease these properties
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

    if (item === 'AhtanumRidge' && ahtanumRidgeTaken ||
    item === 'RattlesnakeRidge' && rattlesnakeRidgeTaken ||
    item === 'Cascades' && cascadesTaken ||
    item === 'ToppenishRidge' && toppennishRidgeTaken) {
        return 0;
    }

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
    calculateNetWorth(state, playerID);
    
    return 1;
}

// player can choose to payoff debt
function performPaybackDebt(state, playerID, downPayment) {
    const player = state.players[playerID];
    console.log('payback debt()');

    // tried to rob the bank
    if (downPayment < 0) {
        return 0;
    }

    // trying to pay more than they have
    if (downPayment > player.Cash) {
        return 0;
    }

    // pay off debt
    if (downPayment > player.Debt) {
        downPayment = player.Debt;
    }

    player.Debt -= downPayment;
    player.Cash -= downPayment;

    calculateNetWorth(state, playerID);
    return 1;
}

function createGameState(avatarIDs) {
    return {
        turn: Math.floor(Math.random() * avatarIDs.length),
        OTBDeck: createOTBDeck(),
        FarmersFateDeck: createFarmersFateDeck(),
        OperatingExpenseDeck: createOperatingExpenseDeck(),
        players: avatarIDs.map(id => createPlayer(avatarNames[id], avatarColors[id])),
    };
}

function checkNewYear(state, playerID, oldPosition) {

    const player = state.players[playerID];

    // new year, get $5000
    if (player.Position < oldPosition) {

        // add Farmer's Fate cards back to the deck
        if (player.IRS) {
            state.FarmersFateDeck[FF_IRS_INDEX]++;
        }
        if (player.Grain.HalfWheat) {
            state.FarmersFateDeck[FF_HALF_WHEAT_INDEX]++;
        }
       
        player.Cash += 5000;
        player.Year++;
        player.Hay.DoubleHay = false;
        player.Grain.DoubleCorn = false;
        player.Grain.HalfWheat = false;
        player.IRS = false;

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

        return true;
    }
    return false;
}


// move the player to a new position
function movePlayer(state, playerID, diceValue) {
    const player = state.players[playerID];
    player.Position += diceValue;
    player.Position %= (MAX_POSITION+1);
    player.shouldMove = false;
}

// move the player to a specific position
function movePlayerTo(state, playerID, position) {
    const player = state.players[playerID];
    player.Position = position;
    player.shouldMove = false;
}

function shouldChangePosition(state, playerID) {
    const player = state.players[playerID];
    const position = player.Position;

    switch(position) {
        case 7: return [true, 14];  // Feb 3 -> Spring Planting
        case 11: return [true, 2];  // Mar 3 -> Jan 2
        case 28: return [true, 36]; // July 3 -> Harvest Moon
        case 30: return [true, 8];  // Aug 1 -> Feb 4
        case 34: {
            if (player.Tractors) {
                return [true, 45]; // Sep 1 -> Nov 3
            }
            return [false, null];
        }
        default: return [false, null];
    }
}

function collectAmount(state, playerID, amount) {
    const player = state.players[playerID];
    player.Cash += amount; 
}

function payAmount(state, playerID, amount) {

    const player = state.players[playerID];
    
    // pay the amount
    if (player.Cash >= amount) {
        player.Cash -= amount;
        calculateNetWorth(state, playerID);
        return true;
    }

    // player did not have enough cash on hand,
    // so they will be charged an overdraft fee
    player.Cash -= amount;
    player.Cash -= OVERDRAFT_FEE;
    calculateNetWorth(state, playerID);
    return false;

    // // can we borrow the entire loan from the bank? (Cannot take out more than $50k)

    // // player should take loan from the bank if they can
    // // 
    // let projectedDebt = player.Debt + OVERDRAFT_FEE + amount;

    // if (projectedDebt <= MAX_DEBT) {
    //     player.Debt  = projectedDebt;
    //     return 2;
    // }

    // let amountOverMaxDebt = projectedDebt - MAX_DEBT;
    
    // // can we max out our debt and pay the remaining balance?
    // if (player.Cash >= amountOverMaxDebt) {
    //     player.Cash -= amountOverMaxDebt;
    //     player.Debt = MAX_DEBT;
    //     return 3;
    // }

    // // do we have enough in assets?
    // if (amountOverMaxDebt < player.Cash + calculateAssets(state, state.turn)/2) {
    //     // require player to sell assets
    //     player.MustSellAssets = true;
    //     return 4;
    // }

    // // bankrupt
    // return 5;
}

// the player can take a loan from the bank only if
// they don't exceed $50k debt
function performLoan(state, playerID, loanAmount) {
    const player = state.players[playerID];
    const projectedDebt = player.Debt + loanAmount;
    if (projectedDebt <= MAX_DEBT) {
        player.Cash += loanAmount;
        player.Debt += loanAmount;
        return true;
    }
    return false;
}

// sell an asset
function performSellAsset(state, playerID, item) {
    const player = state.players[playerID];

    // invalid item
    if (!item in PURCHASE_PRICES) {
        return false;
    }

    // check player has item to sell
    let hasItem = false;
    switch(item) {
        case 'Hay': hasItem = player.Hay.Acres >= 10; break
        case 'Grain': hasItem = player.Grain.Acres >= 10; break;
        case 'Fruit': hasItem = player.Fruit.Acres >= 5; break;
        case 'Tractor': hasItem = player.Tractors >= 1; break;
        case 'Harvester': hasItem = player.Harvester >= 1; break;
        
        /* livestock */
        case 'Cows': hasItem = player.Livestock.Farm >= 10; break;
        case 'AhtanumRidge': hasItem = player.Livestock.AhtanumRidge >= 20; break;
        case 'RattlesnakeRidge': hasItem = player.Livestock.RattlesnakeRidge >= 30; break;
        case 'Cascades': hasItem = player.Livestock.Cascades >= 40; break;
        case 'ToppenishRidge': hasItem = player.Livestock.ToppenishRidge >= 50; break;

        default: break;
    }

    if (!hasItem) {
        return false;
    }

    const itemPrice = PURCHASE_PRICES[item];
    player.Cash += itemPrice/2;
    
    switch(item) {
        case 'Hay': player.Hay.Acres -= 10; break;
        case 'Grain': player.Grain.Acres -= 10; break;
        case 'Fruit': player.Fruit.Acres -= 5; break;
        case 'Tractor': player.Tractors--; break;
        case 'Harvester': player.Harvester--; break;
        
        /* livestock */
        case 'Cows': player.Livestock.Farm -= 10; player.Livestock.Total -= 10; break;
        case 'AhtanumRidge': player.Livestock.AhtanumRidge -= 20; player.Livestock.Total -= 20; break;
        case 'RattlesnakeRidge': player.Livestock.RattlesnakeRidge -= 30; player.Livestock.Total -= 30; break;
        case 'Cascades': player.Livestock.Cascades -= 40; player.Livestock.Total -= 40; break;
        case 'ToppenishRidge': player.Livestock.ToppenishRidge -= 50; player.Livestock.Total -= 50; break;

        default: break;
    }
    calculateNetWorth(state, playerID);
    return true;
}

function performBankrupt(state, playerID) {
    const player = state.players[playerID];
    
    // return any cards back to the deck
    for (const item in player.OTB) {
        state.OTBDeck[item] += player.OTB[item];
    }

    if (player.IRS) {
        state.FarmersFateDeck[FF_IRS_INDEX]++;
    }
    if (player.Grain.HalfWheat) {
        state.FarmersFateDeck[FF_HALF_WHEAT_INDEX]++;
    }

    const name = player.Name;
    const color = player.Color;
    
    // player starts the game over again
    state.players[playerID] = createPlayer(name, color);
}


function checkPositionForDoubleYield(state, playerID) {
    const player = state.players[playerID];
    switch(player.Position) {
        case 4: player.Hay.DoubleHay = true; break;     // Jan 4
        case 14: player.Grain.DoubleCorn = true; break; // Spring Planting
        default: break;
    }
}

function checkPositionForDrawingCard(state, playerID) {
    const player = state.players[playerID];
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

function checkPositionForBalances(state, playerID) {
    const player = state.players[playerID];
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
        // case 28: return 500; // go to harvest moon

        // Wheat Harvest
        case 29: return 50*player.Grain.Acres; // July 4. Add $50 per acre to paycheck
        case 31: return player.Harvesters > 0 ? 1000 : 0; // collect 1000 if harvester
        case 32: return 500;
        case 33: return -50*player.Grain.Acres; // Lose 50 per acre to paycheck

        // 3rd Hay Cutting

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
        return null;
    }

    const val = Math.floor(Math.random()*total + 1);

    let accumulated = 0;
    for(let i=0; i<deck.length; i++) {
        accumulated += deck[i];
        if (val <= accumulated) {
            return i;
        }
    }
}

function drawOTB(state, playerID) {
    const player = state.players[playerID];
    const id = drawRandomCardFromDeck(state.OTBDeck);

    if (id === null) {
        return null;
    }

    state.OTBDeck[id]--;
    player.OTB[OTB_ITEM_MAP[id]]++;
    return OTBCards[id];
}

function drawFarmersFate(state, playerID) {
    const player = state.players[playerID];
    let id = drawRandomCardFromDeck(state.FarmersFateDeck);

    console.log('drawFarmersFate');
    console.log(id)

    // if the draw stack is empty, reshuffle
    if (id === null) {
        state.FarmersFateDeck = createFarmersFateDeck();
        id = drawRandomCardFromDeck(state.FarmersFateDeck);
    }

    console.log(id)

    if (id === FF_IRS_INDEX) {
        player.IRS = true;
    }
    else if (id === FF_HALF_WHEAT_INDEX) {
        player.Grain.HalfWheat = true;
    }

    state.FarmersFateDeck[id]--;
    return [FarmersFateCards[id], id];
}

function drawOperatingExpense(state, playerID) {
    const id = drawRandomCardFromDeck(state.OperatingExpenseDeck);

    // if the draw stack is empty, reshuffle
    if (id === null) {
        state.OperatingExpenseDeck = createOperatingExpenseDeck();
        id = drawRandomCardFromDeck(state.OperatingExpenseDeck);
    }
    console.log('drawOpExpense()')
    console.log(state);
    console.log(id)

    state.OperatingExpenseDeck[id]--;
    return [OperatingExpenseCards[id], operatingExpenseCosts(state, playerID, id)];
}

function operatingExpenseCosts(state, playerID, id) {
    const player = state.players[playerID];
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

function shouldPlayerHarvest(state, playerID) {
    const player = state.players[playerID];
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
        player.Cash >= 0 &&
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


function performHarvest(state, playerID, diceValue) {

    console.log('performHarvest()');

    const player = state.players[playerID];
    const position = player.Position;


    if(!shouldPlayerHarvest(state, playerID)) {
        return 0;
    }
    
    const typeOfHarvest = typeOfHarvestSquare(position);
    let payout = 0;

    if (typeOfHarvest === '1stHay' || typeOfHarvest === '2ndHay' || 
        typeOfHarvest === '3rdHay' || typeOfHarvest === '4thHay') {
        payout = calculateHayHarvest(player.Hay.Acres, diceValue);

        if (player.Hay.DoubleHay) {
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
        if (player.Grain.HalfWheat) {
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

        if (player.Grain.DoubleCorn) {
            payout *= 2;
        }
    }
    else if (typeOfHarvest === 'Livestock') {
        payout = calculateLivestockHarvest(player.Livestock.Total, diceValue);

        if (position === 37) {
            payout /= 2;
        }
    }

    // IRS garnishes wages
    if (player.IRS) {
        payout = 0;
    }

    // pay the player
    player.Cash += payout;
    calculateNetWorth(state, playerID);

    // record that the Harvest was performed
    state.shouldHarvest = false;
    player.CompletedHarvests[typeOfHarvest] = true;
}