const User = require('../models/users');


async function findPositionAndAttach(sponsor, newUser) {
    // if (!sponsor.binaryPosition.left) {
    //     // attach new user at this position
    //     sponsor.binaryPosition.left = newUser._id;
    //     await sponsor.save();
    //     return sponsor;
    // } else if (!sponsor.binaryPosition.right) {
    //     // attach new user at this position
    //     sponsor.binaryPosition.right = newUser._id;
    //     await sponsor.save();
    //     return sponsor;
    // }
    // else {
    //     // recursively check the tree
    //     const nextSponsor = await User.findById(sponsor.binaryPosition.left);
    //     await findPositionAndAttach(nextSponsor, newUser);
    // }


    let leftChildCount = await countLeftChild(sponsor);
    let rightChildCount = await countRightChild(sponsor);

    if(leftChildCount === rightChildCount) {
        await placeInLeftSideOfTree(sponsor, newUser);
        return;
    }
    else if(leftChildCount > rightChildCount) {
        await placeInRightSideOfTree(sponsor, newUser);
        return;
    }
    else if(leftChildCount > rightChildCount) {
        placeInRightSideOfTree(sponsor, newUser);
        return;
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
            await placeInLeftSideOfTree(nextSponsor, newUser);
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
        await placeInRightSideOfTree(nextSponsor, newUser);
    }
}


async function countLeftChild(sponsor) {
    let count = 0;
    if (sponsor.binaryPosition.left) {
        const leftChild = await User.findById(sponsor.binaryPosition.left);
        count += 1 + await countLeftChild(leftChild);
    }
    return count;
}


async function countRightChild(sponsor) {
    let count = 0;
    if (sponsor.binaryPosition.right) {
        const rightChild = await User.findById(sponsor.binaryPosition.right);
        count += 1 + await countRightChild(rightChild);
    }
    return count;
}


module.exports = {
    findPositionAndAttach,
    placeInLeftSideOfTree,
    placeInRightSideOfTree
};
