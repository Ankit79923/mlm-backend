const Franchise = require("../models/franchise-models/franchise");

async function generateUniquePupId() {
    let isUnique = false;
    let randomNumber;

    while(!isUnique){
        randomNumber = generateRandomNumber();

        const userExists = await Franchise.findOne({franchiseId: `PUP${randomNumber}`});

        if(!userExists){
            isUnique = true;
        }
    }

    return `PUP${randomNumber}`;
}


// Generate 7digit random number
function generateRandomNumber(){
    const min = 1000000;
    const max = 9999999;

    return Math.floor(Math.random() * (max - min +1)) + min;
}

module.exports = generateUniquePupId;