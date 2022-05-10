function createCell(cell) {
    id = cell["index"];
    date = cell["Date"];
    text = cell["Text"];
    harvest = cell["Harvest"];
    return `<div class="cell ${harvest}" id="cell-${id}">
    <span class="date">${date}</span>
    <span class="description">${text}</span>
    <div class="players-on-me"></div>
    </div>`;
}
    
function createCellCorner(cell) {
    id = cell["index"];
    date = cell["Date"];
    text = cell["Text"];
    harvest = cell["Harvest"];
    return `<div class="cell-corner ${harvest}" id="cell-${id}">
        <span class="date">${date}</span>
        <span class="description">${text}</span>
        <div class="players-on-me"></div>
    </div>`;
}

function endDiv() {
    return `</div>`;
}

function boardTemplate() {
    let master_str = '';

    // create row one
    master_str += '<div id="row-1" class="top-row">';
    master_str += createCellCorner(data[0]);
    for (let id=1; id < 14; id++) {
        master_str += createCell(data[id]);
    }
    master_str += createCellCorner(data[14]);
    master_str += endDiv();

    // create row 2
    master_str += '<div id="row-2"> <div id="column-left" class="side-row">'
    for (let id=37; id < 49; id++) {
        master_str += createCell(data[id]);
    }
    master_str += endDiv();
    master_str += '<canvas></canvas><div id="column-right" class="side-row">'

    for (let id=15; id < 25; id++) {
        master_str += createCell(data[id]);
    }
    master_str += endDiv();
    master_str += endDiv();

    // create row 3
    master_str += '<div id="row-3" class="top-row">'
    master_str += createCellCorner(data[25])
    for (let id=26; id < 36; id++) {
        master_str += createCell(data[id]);
    }
    master_str += createCellCorner(data[36])
    master_str += endDiv();

    return master_str;
}


data = [
    {
        "index": 0,
        "Date": "CHRISTMAS VACTACTION",
        "Harvest": null,
        "Text": "COLLECT $1000 Christmas bonus. Collect years wage of $5000 as you pass."
    },
    {
        "index": 1,
        "Date": "Jan 1",
        "Harvest": null,
        "Text": "Pay 10% interest on Bank Notes on hand."
    },
    {
        "index": 2,
        "Date": "Jan 2",
        "Harvest": null,
        "Text": "Hibernate. Draw OTB"
    },
    {
        "index": 3,
        "Date": "Jan 3",
        "Harvest": null,
        "Text": "Bitter cold spell. PAY $500 if you owns cows."
    },
    {
        "index": 4,
        "Date": "Jan 4",
        "Harvest": null,
        "Text": "Beautiful Days! Double all your Hay Harvests this year."
    },
    {
        "index": 5,
        "Date": "Feb 1",
        "Harvest": null,
        "Text": "Warm snap, you're in the field 2 weeks early. COLLECT $1000"
    },
    {
        "index": 6,
        "Date": "Feb 2",
        "Harvest": null,
        "Text": "Stuck in a muddy corral. Draw Farmer's Fate"
    },
    {
        "index": 7,
        "Date": "Feb 3",
        "Harvest": null,
        "Text": "Ground thaws. Start plowing early. Go directly to Spring Planting."
    },
    {
        "index": 8,
        "Date": "Feb 4",
        "Harvest": null,
        "Text": "Rainy day. Draw OTB"
    },
    {
        "index": 9,
        "Date": "Mar 1",
        "Harvest": null,
        "Text": "Becomes obvious your wheat has winter killed. PAY $2000 to replant."
    },
    {
        "index": 10,
        "Date": "Mar 2",
        "Harvest": null,
        "Text": "Start plowing late. Pay $500"
    },
    {
        "index": 11,
        "Date": "Mar 3",
        "Harvest": null,
        "Text": "Hurt your back. Go back to second week of January."
    },
    {
        "index": 12,
        "Date": "Mar 4",
        "Harvest": null,
        "Text": "Frost forces you to heat fruit. PAY $2000 if you own fruit."
    },
    {
        "index": 13,
        "Date": "Apr 1",
        "Harvest": null,
        "Text": "Done plowing. Take a day off. Draw OTB"
    },
    {
        "index": 14,
        "Date": "SPRING PLANTING",
        "Harvest": null,
        "Text": "Plant corn on time. Double Corn yield this year."
    },
    {
        "index": 15,
        "Date": "Apr 3",
        "Harvest": null,
        "Text": "More rain. Field work shut down. Pay $500"
    },
    {
        "index": 16,
        "Date": "Apr 4",
        "Harvest": null,
        "Text": "Equipment breakdown. Pay $1000"
    },
    {
        "index": 17,
        "Date": "May 1",
        "Harvest": null,
        "Text": "The whole Valley is grean. Collect $500"
    },
    {
        "index": 18,
        "Date": "May 2",
        "Harvest": null,
        "Text": "Windstorm makes you replant corn. Pay $500"
    },
    {
        "index": 19,
        "Date": "May 3",
        "Harvest": "First-Hay-Cutting",
        "Text": "Cut your hay just right. Collect $1000 bonus."
    },
    {
        "index": 20,
        "Date": "May 4",
        "Harvest": "First-Hay-Cutting",
        "Text": "Memorial Day weekend. Draw OTB"
    },
    {
        "index": 21,
        "Date": "June 1",
        "Harvest": "First-Hay-Cutting",
        "Text": "Rain storm ruins unbaled hay. Cut your harvest check in half."
    },
    {
        "index": 22,
        "Date": "June 2",
        "Harvest": "First-Hay-Cutting",
        "Text": "Good growing weather. Collect $500 bonus"
    },
    {
        "index": 23,
        "Date": "June 3",
        "Harvest": "Cherry-Harvest",
        "Text": "Rain splits your cherries. Cut your harvest check in half."
    },
    {
        "index": 24,
        "Date": "June 4",
        "Harvest": "Cherry-Harvest",
        "Text": "Dust storm. Draw Farmer's fate."
    },
    {
        "index": 25,
        "Date": "INDEPENDENCE DAY BASH",
        "Harvest": "Cherry-Harvest",
        "Text": "Party!"
    },
    {
        "index": 26,
        "Date": "July 1",
        "Harvest": "Second-Hay-Cutting",
        "Text": "Good weather for your second cutting of Hay. Double Hay harvest check."
    },
    {
        "index": 27,
        "Date": "July 2",
        "Harvest": "Second-Hay-Cutting",
        "Text": "Hot! Wish you were in the mountains. Draw OTB"
    },
    {
        "index": 28,
        "Date": "July 3",
        "Harvest": "Second-Hay-Cutting",
        "Text": "It's a cooker! 114 deggrees in the shape. Wipe your brow and go to Harvest Moon after getting Hay check."
    },
    {
        "index": 29,
        "Date": "July 4",
        "Harvest": "Wheat-Harvest",
        "Text": "85 degrees, wheat heads filling out beautifully. Add $50 per acre to your harvest check."
    },
    {
        "index": 30,
        "Date": "Aug 1",
        "Harvest": "Wheat-Harvest",
        "Text": "You're right on time and farming like a pro. Go to the fourth week of February. Collect your years wage of $5000"
    },
    {
        "index": 31,
        "Date": "Aug 2",
        "Harvest": "Wheat-Harvest",
        "Text": "Storm clouds brewing. Collect $1000, if you have a Harvester."
    },
    {
        "index": 32,
        "Date": "Aug 3",
        "Harvest": "Wheat-Harvest",
        "Text": "Finish wheat harvest with no break downs. Collect $500"
    },
    {
        "index": 33,
        "Date": "Aug 4",
        "Harvest": "Wheat-Harvest",
        "Text": "Rain sprouts unharvested wheat. Cut price $50 per acre on harvest check."
    },
    {
        "index": 34,
        "Date": "Sep 1",
        "Harvest": "Third-Hay-Cutting",
        "Text": "Tractor owners: bale Hay, then go to third week of November. Collect your $1000 there, then harvest your Fruit."
    },
    {
        "index": 35,
        "Date": "Sep 2",
        "Harvest": "Third-Hay-Cutting",
        "Text": "Sunny skies at the County Fair. Draw OTB"
    },
    {
        "index": 36,
        "Date": "HARVEST MOON",
        "Harvest": "Livestock-Sales",
        "Text": "smiles at you. Collect $500"
    },
    {
        "index": 37,
        "Date": "Sep 3",
        "Harvest": "Livestock-Sales",
        "Text": "Market collapses. Cut livestock check in half."
    },
    {
        "index": 38,
        "Date": "Sep 4",
        "Harvest": "Livestock-Sales",
        "Text": "Codling Moth damage to apples lowers fruit grade. Pay $2000 if you have fruit."
    },
    {
        "index": 39,
        "Date": "Oct 1",
        "Harvest": "Livestock-Sales",
        "Text": "Indian Summer. Collect $500"
    },
    {
        "index": 40,
        "Date": "Oct 2",
        "Harvest": "Fourth-Hay-Cutting",
        "Text": "Good Pheasant Hunting. Draw Farmers Fate"
    },
    {
        "index": 41,
        "Date": "Oct 3",
        "Harvest": "Fourth-Hay-Cutting",
        "Text": "Park your baler for the Winter. Draw OTB"
    },
    {
        "index": 42,
        "Date": "Oct 4",
        "Harvest": "Apple-Harvest",
        "Text": "Annual Deer Hunt. Draw Farmers Fate"
    },
    {
        "index": 43,
        "Date": "Nov 1",
        "Harvest": "Apple-Harvest",
        "Text": "Irrigation Season over. Draw OTB"
    },
    {
        "index": 44,
        "Date": "Nov 2",
        "Harvest": "Apple-Harvest",
        "Text": "Good weather, harvest winding up. Collect $500"
    },
    {
        "index": 45,
        "Date": "Nov 3",
        "Harvest": "Apple-Harvest",
        "Text": "Good weather holding. Collect $1000"
    },
    {
        "index": 46,
        "Date": "Nov 4",
        "Harvest": "Corn-Harvest",
        "Text": "Early freeze kills fruit buds. Pay $1000 if you have Fruit."
    },
    {
        "index": 47,
        "Date": "Dec 1",
        "Harvest": "Corn-Harvest",
        "Text": "Cold and dry, perfect Field Corn harvesting. Collect $500"
    },
    {
        "index": 48,
        "Date": "Dec 2",
        "Harvest": "Corn-Harvest",
        "Text": "First snow. Draw Farmer's Fate."
    }
]