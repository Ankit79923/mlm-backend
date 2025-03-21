
const User = require("../models/user-models/users");
const KYC = require("../models/user-models/kyc");
const BVPoints = require("../models/user-models/bvPoints");
const UserRank = require("../models/user-models/rank-achivers");
const UserOrder = require("../models/user-models/userOrders");
const mongoose = require("mongoose");
const { countLeftChild, countRightChild } = require('../utils/placeInBinaryTree');
const { calculateWeekelyPayout, calculateMonthlyPayout } = require('../utils/calculatePayout')


// 1. Get Dashboard data
const handleGetDashboardData = async (req, res) => {
  try {
    // Find user from received sponsorId
    const user = await User.findOne({ mySponsorId: req.body.sponsorId });
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: 'Incorrect sponsorId' });
    }

    // Initialize earnings variables
    let weeklyEarning = 0;
    let monthlyEarning = 0;
    let lifetimeEarning = 0;
    let directSalesBonus = 0;
    let teamSalesBonus = 0;
    let totalWeeklyEarnings = 0;
    let totalPersonalBVPoints = 0;
    
    // Consider user as root or head & then find total number of users in left and right tree
    let leftTreeUsersCount = await countLeftChild(user);
    let rightTreeUsersCount = await countRightChild(user);

    // Handle activeDate when it is null
    // const activeDate = user.activeDate ? user.activeDate.toISOString().split('T')[0] : "Not active";
    const activeDate = user.isActive ? "Active" : "Inactive";
    let kycStatus;

    // Fetch KYC status from the KYC document for the given userId
    const kyc = await KYC.findOne({ 'userDetails.mySponsorId': user.mySponsorId });
    if (kyc) {
      kycStatus = kyc.kycApproved;
    } else {
      kycStatus = "KYC Details not submitted.";
    }


    // Fetch the BVPoints document for the given userId
    const bvPoints = await BVPoints.findOne({ userId: user._id });
    if (!bvPoints) {
      // Return 0 earnings if bvPoints is not available
      return res.status(200).json({
        activeDate,
        kycStatus,
        weeklyEarning,
        monthlyEarning,
        lifetimeEarning,
        leftTreeUsersCount,
        rightTreeUsersCount,
        totalBVPointsEarned: {
          leftBV: 0,
          rightBV: 0
        },
        // currentBVPoints: {
        //   currentLeftBV: 0,
        //   currentLeftBV: 0
        // },
        myTotalBV: 0,
        totalDirectBV: {
          leftDirectBV: 0,
          rightDirectBV: 0
        },
        totalDirectTeam: {
          leftDirectTeam: 0,
          rightDirectTeam: 0
        },
        directSalesBonus,
        teamSalesBonus,
        totalWeeklyEarnings,
        totalPersonalBVPoints,
        rank: "Independent Distributor"
      });
    }

    // Calculate weekly earnings from the most recent week
    if (bvPoints.weeklyEarnings && bvPoints.weeklyEarnings.length > 0) {
      const lastWeeklyEarning = bvPoints.weeklyEarnings[bvPoints.weeklyEarnings.length - 1];
      weeklyEarning = lastWeeklyEarning.payoutAmount;
    }

    // Calculate monthly earnings from the most recent month
    if (bvPoints.monthlyEarnings && bvPoints.monthlyEarnings.length > 0) {
      const lastMonthlyEarning = bvPoints.monthlyEarnings[bvPoints.monthlyEarnings.length - 1];
      monthlyEarning = lastMonthlyEarning.payoutAmount;
    }

    // Calculate lifetime earnings as the sum of all monthly earnings
    if (bvPoints.monthlyEarnings && bvPoints.monthlyEarnings.length > 0) {
      lifetimeEarning = bvPoints.monthlyEarnings.reduce((acc, earning) => acc + earning.payoutAmount, 0);
    }

    const totalBVPointsEarned = {
      leftBV: bvPoints.totalBV.leftBV,
      rightBV: bvPoints.totalBV.rightBV
    }
    const totalaccumulatedbv ={
      leftBV: bvPoints.acumulatedBV.leftBV,
      rightBV: bvPoints.acumulatedBV.rightBV
    }

    const teamSalesMatched = Math.min(bvPoints.currentWeekBV.leftBV, bvPoints.currentWeekBV.rightBV);
    teamSalesBonus = Math.round(teamSalesMatched * 0.1);


    const myTotalBV = bvPoints.totalBV.leftBV + bvPoints.totalBV.rightBV;

    const totalDirectBV = {
      leftDirectBV: bvPoints.directBV.leftBV,
      rightDirectBV: bvPoints.directBV.rightBV,
      total: bvPoints.directBV.leftBV + bvPoints.directBV.rightBV
    }

    const directSalesMatched = bvPoints.directBV.leftBV + bvPoints.directBV.rightBV;
    directSalesBonus = Math.round(directSalesMatched * 0.1);

    const totalDirectTeam = {
      leftDirectTeam: await calculateDirectLeftTeam(user, user.mySponsorId),
      rightDirectTeam: await calculateDirectRightTeam(user, user.mySponsorId)
    }
    totalPersonalBVPoints = bvPoints.personalBV || 0;
    // const totalPersonalBVPoints = bvPoints ? bvPoints.personalBV : 0;

    // Calculate matched BV points

    totalWeeklyEarnings = Math.round(directSalesBonus + teamSalesBonus);
    const totalBVPoints = Math.min(bvPoints.totalBV.leftBV, bvPoints.totalBV.rightBV);

    // Calculate rank based on total BV points

    const rank = calculateRank(totalaccumulatedbv.leftBV, totalaccumulatedbv.rightBV);
    let totalMatchedBV = 0;
    if (bvPoints && bvPoints.weeklyEarnings && Array.isArray(bvPoints.weeklyEarnings)) {
      bvPoints.weeklyEarnings.forEach(week => {
        totalMatchedBV += week.matchedBV || 0; // Sum matchedBV safely
      });
    }
    // Return the calculated earnings and tree user counts
    return res.status(200).json({
      activeDate,
      kycStatus,
      weeklyEarning,
      monthlyEarning,
      lifetimeEarning,
      leftTreeUsersCount,
      rightTreeUsersCount,
      totalBVPointsEarned,
      totalaccumulatedbv,
      // currentBVPoints,
      myTotalBV,
      totalDirectBV,
      totalDirectTeam,
      directSalesBonus,
      teamSalesBonus,
      totalWeeklyEarnings,
      totalPersonalBVPoints,
      totalMatchedBV,
      rank
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

///////////////////////////////////promotion tour achievement wala bv
const handleGetSponsorBVTree = async (req, res) => {
  try {
    // Find sponsor
    const sponsor = await User.findOne({ _id: req.params.id });
    if (!sponsor) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Define time range (custom or default)
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date("2025-02-22T00:00:00.000Z");
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date("2025-03-22T23:59:59.999Z");
    // Call both APIs in parallel
    const [treeWithTimeLimit, treeWithoutTimeLimit] = await Promise.all([
      fetchTimeLimitBV(sponsor, startDate, endDate),
      fetchBVWithoutTimeLimit(sponsor)
    ]);
    // Return response with both results
    return res.status(200).json({
      withTimeLimit: treeWithTimeLimit,
      withoutTimeLimit: treeWithoutTimeLimit
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const fetchTimeLimitBV = async (user, startDate, endDate) => {
  if (!user) return null; // Base case: If no user, return null
  // Fetch all orders for this user
  const allOrders = await UserOrder.find({ "userDetails.user": user._id });
  //console.log(`\nUser ${user._id} - Total Orders Found: ${allOrders.length}`);
  // Filter orders within the date range
  const userOrders = allOrders.filter(order => {
    const orderDate = new Date(order.orderDetails.orderDate);
    //console.log(`Order Date: ${orderDate.toISOString()}`); // Log order date
    return orderDate >= startDate && orderDate <= endDate;
  });
  //console.log(`User ${user._id} - Orders in Range (22 Feb - 22 Mar): ${userOrders.length}`);
  // Calculate total BV points for this user
  const totalBV = userOrders.reduce((sum, order) => {
    const bv = order.orderDetails.totalBVPoints || 0; // Ensure it's a number
    //console.log(`Order ${order._id} - BV: ${bv}`); // Debugging
    return sum + bv;
  }, 0);
  //console.log(`User ${user._id} - Total BV Points: ${totalBV}`);
  // Create user node
  const userNode = {
    _id: user._id,
    value: user.name,
    mySponsorId: user.mySponsorId,
    isActive: user.isActive,
    totalBV,        // Store total BV points
    totalBVLeft: 0,  // Initialize left BV sum
    totalBVRight: 0, // Initialize right BV sum
    leftChild: null,
    rightChild: null
  };
  // Fetch left child and accumulate left BV
  if (user.binaryPosition?.left) {
    const leftChild = await User.findById(user.binaryPosition.left);
    userNode.leftChild = await fetchTimeLimitBV(leftChild, startDate, endDate);
    // Accumulate left BV (own + left subtree)
    userNode.totalBVLeft =
      (userNode.leftChild?.totalBV || 0) +
      (userNode.leftChild?.totalBVLeft || 0) +
      (userNode.leftChild?.totalBVRight || 0);
  }
  // Fetch right child and accumulate right BV
  if (user.binaryPosition?.right) {
    const rightChild = await User.findById(user.binaryPosition.right);
    userNode.rightChild = await fetchTimeLimitBV(rightChild, startDate, endDate);
    // Accumulate right BV (own + right subtree)
    userNode.totalBVRight =
      (userNode.rightChild?.totalBV || 0) +
      (userNode.rightChild?.totalBVLeft || 0) +
      (userNode.rightChild?.totalBVRight || 0);
  }
  // console.log(`User ${user._id} - Left BV: ${userNode.totalBVLeft}, Right BV: ${userNode.totalBVRight}`);
  return userNode;
};
const fetchBVWithoutTimeLimit = async (user) => {
  if (!user) return null; // Base case: If no user, return null
  // Fetch all orders for this user (no time filter)
  const allOrders = await UserOrder.find({ "userDetails.user": user._id });
  // Calculate total BV points for this user
  const totalBV = allOrders.reduce((sum, order) => {
      return sum + (order.orderDetails.totalBVPoints || 0);
  }, 0);
  // Initialize BV values
  let totalBVLeft = 0;
  let totalBVRight = 0;
  // Fetch left child and accumulate left BV
  if (user.binaryPosition?.left) {
      const leftChild = await User.findById(user.binaryPosition.left);
      const leftChildNode = await fetchBVWithoutTimeLimit(leftChild);
      if (leftChildNode) {
          totalBVLeft = leftChildNode.totalBV + leftChildNode.totalBVLeft + leftChildNode.totalBVRight;
      }
  }
  // Fetch right child and accumulate right BV
  if (user.binaryPosition?.right) {
      const rightChild = await User.findById(user.binaryPosition.right);
      const rightChildNode = await fetchBVWithoutTimeLimit(rightChild);
      if (rightChildNode) {
          totalBVRight = rightChildNode.totalBV + rightChildNode.totalBVLeft + rightChildNode.totalBVRight;
      }
  }
  // Return only required fields
  return {
      _id: user._id,
      value: user.name,
      mySponsorId: user.mySponsorId,
      isActive: user.isActive,
      totalBV,
      totalBVLeft,
      totalBVRight
  };
};















//for rankachiver 

async function updateUserRanks() {
  try {
    const users = await BVPoints.find(); // Fetch all users with BV Points

    for (const user of users) {
        const accumulatedLeftBV = user.acumulatedBV?.leftBV || 0;
        const accumulatedRightBV = user.acumulatedBV?.rightBV || 0;
        
        const rank = calculateRank(accumulatedLeftBV, accumulatedRightBV);
        
        // Fetch user details from User model
        const userDetails = await User.findOne({ _id: user.userId });
        
        if (!userDetails) continue; // Skip if user details are not found
        
        await UserRank.findOneAndUpdate(
            { rank: rank },
             // Find the rank entry
            {
                $addToSet: {
                    users: {
                        objectId: user._id,
                        name: userDetails.name,
                        userId: userDetails.mySponsorId,
                        achievedAt: new Date()
                    }
                }
            },
            { upsert: true, new: true }
        );
    }

    console.log("User ranks updated successfully.");
} catch (error) {
    console.error("Error updating user ranks:", error);
}
}
const allUserRanks = async (req, res) => {
  try {
    // Fetch all user ranks with full details
    const userRanks = await UserRank.find()

    res.json({
      success: true,
      data: userRanks,
    });
  } catch (error) {
    console.error("Error fetching user ranks:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user ranks",
      error: error.message,
    });
  }
};

//particular one user rank
const getUserRankStatus = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from request params

    // Find the rank where the user exists in the users array
    const userrank = await UserRank.findOne({ "users.userId": userId });

    if (!userrank) {
      return res.status(404).json({ success: false, message: "User rank not found" });
    }
    // Find the specific user within the rank's users array
    const user = userrank.users.find(user => user.userId === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in rank" });
    }
    console.log(user);
    res.status(200).json({
      success: true,
      rank: userrank.rank,
      user: {
        isclaimed: user.isclaimed,
      }
    });

  } catch (error) {
    console.error("Error fetching user rank status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user rank status",
      error: error.message,
    });
  }
};

////////
//rank achievers claim status
const rankclaimstatus = async (req, res) => {
  try {
    const { rankId, userId } = req.params;
    
    // Find the rank achiever document
    const rankAchiever = await UserRank.findById(rankId);
    if (!rankAchiever) {
      return res.status(404).json({ success: false, message: 'Rank Achiever not found' });
    }

    // Find the specific user within the rank achiever's users array
    const user = rankAchiever.users.find(user => user.userId === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isclaimed) {
      return res.status(400).json({ success: false, message: 'Reward already claimed' });
    }

    // Update claim status
    user.isclaimed = true;
    
    // Mark the users array as modified
    rankAchiever.markModified('users');
    
    // Save the updated document
    await rankAchiever.save();

    return res.status(200).json({ success: true, message: 'Reward claimed successfully', rankAchiever });
  } catch (error) {
    console.error("Error in rank claim API:", error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


//
function calculateRank(leftBV, rightBV) {
  const commonBV = Math.min(leftBV, rightBV); // The common BV to determine the rank

  if (commonBV >= 1085000000) {
    return "Udbhab Unicorn Diamond Club";
  } else if (commonBV >= 985000000) {
    return "Udbhab Crown Diamond Club";
  } else if (commonBV >= 485000000) {
    return "Udbhab Royal Diamond Club";
  } else if (commonBV >= 285000000) {
    return "Udbhab Purple Diamond Club";
  } else if (commonBV >= 185000000) {
    return "Udbhab White Diamond Club";
  } else if (commonBV >= 13500000) {
    return "Udbhab Blue Diamond Club";
  } else if (commonBV >= 9000000) {
    return "Udbhab Diamond Club";
  } else if (commonBV >= 5500000) {
    return "Udbhab Platinum Club";
  } else if (commonBV >= 2500000) {
    return "Udbhab Gold Club🥇";
  } else if (commonBV >= 1300000) {
    return "Udbhab Pearl Club🦪";
  } else if (commonBV >= 700000) {
    return "Udbhab Silver Club🥈";
  } else if (commonBV >= 400000) {
    return "Udbhab Bronze Club🥉";
  } else if (commonBV >= 250000) {
    return "Mega Star✨";
  } else if (commonBV >= 150000) {
    return "Super Star🌟";
  } else if (commonBV >= 75000) {
    return "Double Star⭐⭐";
  } else if (commonBV >= 25000) {
    return "STAR⭐";
  } else {
    return "Independent Distributor";
  }
}



async function calculateDirectLeftTeam(rootuser, rcvdSponsorId) {
  if (!rootuser || !rootuser.binaryPosition || !rootuser.binaryPosition.left) return 0;

  let count = 0;
  if (rootuser.binaryPosition.left) {
    const leftUser = await User.findById(rootuser.binaryPosition.left);
    if (leftUser.sponsorId === rcvdSponsorId) {
      count += 1;
    }
    count += await calculateDirectLeftTeam(leftUser, rcvdSponsorId) + await calculateDirectRightTeam(leftUser, rcvdSponsorId);
  }

  return count;
}



async function calculateDirectRightTeam(rootuser, rcvdSponsorId) {
  if (!rootuser || !rootuser.binaryPosition || !rootuser.binaryPosition.right) return 0;

  let count = 0;
  if (rootuser.binaryPosition.right) {
    const rightUser = await User.findById(rootuser.binaryPosition.right);
    if (rightUser.sponsorId === rcvdSponsorId) {
      count += 1;
    }
    count += await calculateDirectLeftTeam(rightUser, rcvdSponsorId) + await calculateDirectRightTeam(rightUser, rcvdSponsorId);
  }

  return count;
}



// 2. Get weekly payout detaills
const handleGetWeeklyPayoutsDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findOne({ _id: id });
    if (!user) { return res.status(404).json({ message: "User not found" }); }


    // Fetch the BVPoints document for the given userId
    const bvPoints = await BVPoints.findOne({ userId: id })
      .select("weeklyEarnings userId") // Only selecting needed fields
      .exec();


    // Check if BVPoints data exists for the user
    if (!bvPoints) { return res.status(404).json({ message: "No BV points available." }); }

    // Check if the user has any weekly earnings
    if (bvPoints.weeklyEarnings.length === 0) { return res.status(404).json({ message: "No weekly earnings data available" }); }

    // Format and return the response
    res.status(200).json({
      userId: bvPoints.userId,
      // weeklyEarnings2: bvPoints.weeklyEarnings,
      weeklyEarnings: bvPoints.weeklyEarnings.map((earning) => ({
        week: earning.week.toISOString().split("T")[0], // Formatting date to "YYYY-MM-DD"
        matchedBV: earning.matchedBV,
        directSalesBonus: earning.directSalesBonus,
        teamSalesBonus: earning.teamSalesBonus,
        weeklyBV: earning.weeklyBV,
        tds: earning.tds,
        payoutAmount: earning.payoutAmount,
        _id: earning._id,
        paymentStatus: earning.paymentStatus,
      })),
    });
  } catch (err) {
    console.error("Error fetching weekly payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// 3. Get All Month payout detaills
const handleGetMonthlyPayoutsDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findOne({ _id: id });
    if (!user) { return res.status(404).json({ message: "User not found" }); }


    // Fetch the BVPoints document for the given userId
    const bvPoints = await BVPoints.findOne({ userId: id }).select("monthlyEarnings userId"); // Only selecting needed fields

    // Check if BVPoints data exists for the user
    if (!bvPoints) { return res.status(404).json({ message: "No monthly earnings." }); }


    // Check if the user has any weekly earnings
    if (bvPoints.monthlyEarnings.length === 0) { return res.status(404).json({ message: "No monthly earnings data available." }); }


    // Format and return the response
    res.status(200).json({
      userId: bvPoints.userId,
      monthlyEarnings: bvPoints.monthlyEarnings
    });
  } catch (err) {
    console.error("Error fetching weekly payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// 4. Update Weekly Payout Status
const handleUpdateWeeklyPayoutStatus = async (req, res) => {
  try {
    const { userId, payoutId } = req.params;
    if (!userId || !payoutId) { return res.status(400).json({ message: "Both userId and payoutId is required." }); }

    // Find the BVPoints document for the given userId
    const bvPoints = await BVPoints.findOne({ userId: userId });
    if (!bvPoints) { return res.status(404).json({ message: "BV points not found. No Earning found for this user." }); }

    // bvPoints is an object, extract weeklyEarnings Array from bvPoints
    const weeklyEarnings = bvPoints.weeklyEarnings;

    // Iterate over each weekly earnings
    let i;
    for (i = 0; i < weeklyEarnings.length; i++) {
      const earning = weeklyEarnings[i];
      if (earning._id.toString() === payoutId) {
        if (earning.paymentStatus === 'Paid') {
          return res.status(400).json({ message: "Payout for this week has already been Paid." });
        }
        // Mark the payout as Paid
        earning.paymentStatus = 'Paid';
        break;
      }
    }
    if (i === weeklyEarnings.length) {
      return res.status(404).json({ message: "Payout not found for the given payoutId." });
    }

    await bvPoints.save();
    res.status(200).json({ message: "Weekly payout updated successfully.", earnings: bvPoints.weeklyEarnings });
  } catch (e) {
    console.error("Error updating weekly payout:", e.message);
    res.status(500).json({ message: "Internal server error", error: e.message });
  }
};


//bulk update payout status
const handleBulkUpdateWeeklyPayoutStatus = async (req, res) => {
  try {
    const { userPayouts } = req.body; // Expecting an array of { userId, payoutId }

    if (!userPayouts || !Array.isArray(userPayouts) || userPayouts.length === 0) {
      return res.status(400).json({ message: "An array of userId and payoutId is required." });
    }

    const updatedUsers = [];

    for (const { userId, payoutId } of userPayouts) {
      // Find BVPoints document for each user
      const bvPoints = await BVPoints.findOne({ userId });
      if (!bvPoints) continue; // Skip if not found

      const earning = bvPoints.weeklyEarnings.find(e => e._id.toString() === payoutId);
      if (!earning || earning.paymentStatus === 'Paid') continue; // Skip if already paid

      earning.paymentStatus = 'Paid';
      await bvPoints.save(); // Save changes for each user
      updatedUsers.push(userId);
    }

    if (updatedUsers.length === 0) {
      return res.status(400).json({ message: "No payouts updated. Either already paid or invalid IDs." });
    }

    res.status(200).json({ message: "Weekly payouts updated successfully.", updatedUsers });
  } catch (e) {
    console.error("Error updating weekly payouts:", e.message);
    res.status(500).json({ message: "Internal server error", error: e.message });
  }
};

// 5. Get all weekly earnings
// const handleGetAllWeeklyEarnings = async (req, res) => {
//   try {
//     const allWeeklyEarnings = await BVPoints.find(
//       { weeklyEarnings: { $ne: [] } }, // Exclude documents with empty weeklyEarnings
//       'userId weeklyEarnings'
//     ).populate('userId', 'name email');

//     // Transform data
//     const formattedData = allWeeklyEarnings.map((entry) => ({
//       userId: entry.userId._id,
//       userName: entry.userId.name || 'N/A', 
//       userEmail: entry.userId.email || 'N/A',
//       weeklyEarnings: entry.weeklyEarnings.map((earning) => ({
//         _id: earning._id,
//         week: earning.week.toISOString().split('T')[0], 
//         matchedBV: earning.matchedBV,
//         payoutAmount: earning.payoutAmount,
//         paymentStatus: earning.paymentStatus,
//       })),
//     }));

//     res.status(200).json({ success: true, message: 'Weekly earnings data fetched successfully', data: formattedData });
//   } catch (error) {
//     console.error('Error fetching weekly earnings data:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// }
const handleGetAllWeeklyEarnings = async (req, res) => {
  try {
    const allWeeklyEarnings = await BVPoints.find(
      { "weeklyEarnings.payoutAmount": { $gt: 0 } }, // Only include documents with non-zero payoutAmount
      'userId weeklyEarnings'
    ).populate('userId', ' mySponsorId name email');

    // Transform data
    const formattedData = allWeeklyEarnings.map((entry) => {
      const filteredEarnings = entry.weeklyEarnings.filter(
        (earning) => earning.payoutAmount > 0 // Exclude entries with payoutAmount of 0
      );

      return {
        userobjectid : entry.userId._id,
        userId: entry.userId.mySponsorId,
        userName: entry.userId.name || 'N/A', 
        userEmail: entry.userId.email || 'N/A',
        weeklyEarnings: filteredEarnings.map((earning) => ({
          _id: earning._id,
          week: earning.week.toISOString().split('T')[0],
          matchedBV: earning.matchedBV,
          directSalesBonus : earning.directSalesBonus,
          teamSalesBonus: earning.teamSalesBonus,
          tds: earning.tds,
          payoutAmount: earning.payoutAmount,
          paymentStatus: earning.paymentStatus,
        })),
      };
    });

    res.status(200).json({ success: true, message: 'Filtered weekly earnings data fetched successfully', data: formattedData });
  } catch (error) {
    console.error('Error fetching filtered weekly earnings data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// 5. Get all monthly earnings
const handleGetAllMonthlyEarnings = async (req, res) => {
  try {
    // Fetch all BVPoints documents, selecting only weeklyEarnings and userId fields
    const allMonthlyEarnings = await BVPoints.find({ monthlyEarnings: { $ne: [] } }, 'userId monthlyEarnings').populate('userId', 'name email'); // Populate user details

    // console.log('Printing: ', allMonthlyEarnings);
    
    if (allMonthlyEarnings.length == 0) {
      return res.status(200).json({ message: 'No monthly earnings data found.' });
    }

    // Transform data
    const formattedData = allMonthlyEarnings.map((entry) => ({
      userId: entry.userId._id,
      userName: entry.userId.name || 'N/A',
      userEmail: entry.userId.email || 'N/A',
      monthlyEarnings: entry.monthlyEarnings.map((earning) => ({
        month: earning.month.toISOString().split('T')[0], // Format date
        payoutAmount: earning.payoutAmount
      })),
    }));

    res.status(200).json({ success: true, message: 'Monthly earnings data fetched successfully', data: formattedData });
  } catch (error) {
    console.error('Error fetching weekly earnings data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

const handleExecutePayoutForUser = async(req, res) => {
  const {userId} = req.params;

  try {
    const weeklyPayoutSuccess = await calculateWeekelyPayout(userId);
    const monthlyPayoutSuccess = await calculateMonthlyPayout(userId);

    if(weeklyPayoutSuccess && monthlyPayoutSuccess) {
      return res.status(200).json({success: true, message: "Payout executed successfully"});
    } else {
      return res.status(500).json({success: false, message: 'Error executing payout for user:'});
    }
  } catch (error) {
    console.error('Error executing payout for user', error);
    res.status(500).json({success: false, message: 'Internal server error'});
  }
}

module.exports = {
  handleGetDashboardData,
  handleGetWeeklyPayoutsDetails,
  handleGetMonthlyPayoutsDetails,
  handleUpdateWeeklyPayoutStatus,
  handleGetAllWeeklyEarnings,
  handleGetAllMonthlyEarnings,
  handleExecutePayoutForUser,
  handleBulkUpdateWeeklyPayoutStatus,
  updateUserRanks,
  allUserRanks,
  rankclaimstatus,
  getUserRankStatus,
  handleGetSponsorBVTree
};
