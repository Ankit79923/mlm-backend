const User = require('../models/users');


async function findPositionAndAttach(sponsor, newUser) {
    if (!sponsor.binaryPosition.left) {
        // attach new user at this position
        sponsor.binaryPosition.left = newUser._id;
        await sponsor.save();
        return sponsor;
    } else if (!sponsor.binaryPosition.right) {
        // attach new user at this position
        sponsor.binaryPosition.right = newUser._id;
        await sponsor.save();
        return sponsor;
    }
    else {
        // recursively check the tree
        const nextSponsor = await User.findById(sponsor.binaryPosition.left);
        await findPositionAndAttach(nextSponsor, newUser);
    }
}


async function placeInLeftSideOfTree(sponsor, newUser) {
        if (!sponsor.binaryPosition.left) {
            // attach new user at this position
            sponsor.binaryPosition.left = newUser._id;
            await sponsor.save();
            return sponsor;
        } else {
            // recursively check the tree
            const nextSponsor = await User.findById(sponsor.binaryPosition.left);
            await findPositionAndAttach(nextSponsor, newUser);
        }
}


async function placeInRightSideOfTree(sponsor, newUser) {
    if (!sponsor.binaryPosition.right) {
        // attach new user at this position
        sponsor.binaryPosition.right = newUser._id;
        await sponsor.save();
        return sponsor;
    } else {
        // recursively check the tree
        const nextSponsor = await User.findById(sponsor.binaryPosition.right);
        await findPositionAndAttach(nextSponsor, newUser);
    }
}



module.exports = {
    findPositionAndAttach,
    placeInLeftSideOfTree,
    placeInRightSideOfTree
};
