const User = require('../models/user-models/users');


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

            // Update new user parentSponsorId
            newUser.parentSponsorId = sponsor.mySponsorId;
            await newUser.save();

            return sponsor;
        } else {
            // recursively check the tree
            const nextSponsor = await User.findById(sponsor.binaryPosition.left);
            await placeInLeftSideOfTree(nextSponsor, newUser);
        }
}


async function placeInRightSideOfTree(sponsor, newUser ) {
    if (!sponsor.binaryPosition.right) {
        // attach new user at this position
        sponsor.binaryPosition.right = newUser._id;
        await sponsor.save();

        // Update new user parentSponsorId
        newUser.parentSponsorId = sponsor.mySponsorId;
        await newUser.save();

        return sponsor;
    } else {
        // recursively check the tree
        const nextSponsor = await User.findById(sponsor.binaryPosition.right);
        await placeInRightSideOfTree(nextSponsor, newUser);
    }
}



const countLeftChild = async (user) => {
    let count = 0;
  
    // Recursive helper function to traverse only the left side of the tree
    const countLeftSubtree = async (currentUser) => {
      if (!currentUser) return;
  
      // Increment count for the current user
      count++;
  
      // If there is a left child, keep counting in the left subtree
      if (currentUser.binaryPosition.left) {
        const leftChild = await User.findById(currentUser.binaryPosition.left); 
        if (leftChild) {
          await countLeftSubtree(leftChild); // Recursively count the left subtree
        }
      }
  
      // If there is a right child, also count in the right subtree (still part of left tree)
      if (currentUser.binaryPosition.right) {
        const rightChild = await User.findById(currentUser.binaryPosition.right);
        if (rightChild) {
          await countLeftSubtree(rightChild); // Recursively count the right subtree
        }
      }
    };
  
    // Start counting from the left child of the user
    if (user.binaryPosition.left) {
      const leftChild = await User.findById(user.binaryPosition.left);
      if (leftChild) {
        await countLeftSubtree(leftChild);
      }
    }
  
    return count;
};
  
  
const countRightChild = async (user) => {
    let count = 0;
  
    // Recursive helper function to traverse the right subtree only
    const countRightSubtree = async (currentUser) => {
      if (!currentUser) return;
  
      // Increment the count for the current user
      count++;
  
      // If there is a right child, keep counting in the right subtree
      if (currentUser.binaryPosition.right) {
        const rightChild = await User.findById(currentUser.binaryPosition.right);
        if (rightChild) {
          await countRightSubtree(rightChild); // Recursively count the right subtree
        }
      }
  
      // If there is a left child of the right subtree, count it as well
      if (currentUser.binaryPosition.left) {
        const leftChild = await User.findById(currentUser.binaryPosition.left);
        if (leftChild) {
          await countRightSubtree(leftChild); // Recursively count the left subtree in right tree
        }
      }
    };
  
    // Start counting from the right child of the user
    if (user.binaryPosition.right) {
      const rightChild = await User.findById(user.binaryPosition.right);
      if (rightChild) {
        await countRightSubtree(rightChild);
      }
    }
  
    return count;
};




// async function countLeftChild(sponsor) {
//     let count = 0;
//     if (sponsor.binaryPosition.left) {
//         const leftChild = await User.findById(sponsor.binaryPosition.left);
//         count += 1 + await countLeftChild(leftChild);
//     }
//     return count;
// }


// async function countRightChild(sponsor) {
//     let count = 0;
//     if (sponsor.binaryPosition.right) {
//         const rightChild = await User.findById(sponsor.binaryPosition.right);
//         count += 1 + await countRightChild(rightChild);
//     }
//     return count;
// }


module.exports = {
    findPositionAndAttach,
    placeInLeftSideOfTree,
    placeInRightSideOfTree,
    countLeftChild,
    countRightChild
};
