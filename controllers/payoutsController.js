
const User = require("../models/user-models/users");
const KYC = require("../models/user-models/kyc");
const BVPoints = require("../models/user-models/bvPoints");
const mongoose = require("mongoose");
const { countLeftChild, countRightChild } = require('../utils/placeInBinaryTree');


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
        currentBVPoints: {
          currentLeftBV: 0,
          currentLeftBV: 0
        },
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

    // const currentBVPoints = {
    //   currentLeftBV: bvPoints.currentWeekBV.leftBV,
    //   currentRightBV: bvPoints.currentWeekBV.rightBV
    // }

    const teamSalesMatched = Math.min(bvPoints.totalBV.leftBV, bvPoints.totalBV.rightBV);
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

    const rank = calculateRank(totalBVPoints);

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
      myTotalBV,
      totalDirectBV,
      totalDirectTeam,
      directSalesBonus,
      teamSalesBonus,
      totalWeeklyEarnings,
      totalPersonalBVPoints,
      rank
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function calculateRank(totalBVPoints){
  if(totalBVPoints >= 25000){
    return "STAR⭐";
  } else if(totalBVPoints >= 50000){
    return "Double Star⭐⭐";
  } else if(totalBVPoints >= 75000){
    return "Super Star🌟";
  } else if(totalBVPoints >= 100000){
    return "Mega Star✨";
  } else if(totalBVPoints >= 150000){
    return "Udbhab Bronze Club🥉";
  } else if(totalBVPoints >= 300000){
    return "Udbhab Silver Club🥈";
  } else if(totalBVPoints >= 600000){
    return "Udbhab Pearl Club🦪";
  } else if(totalBVPoints >= 1200000){
    return "Udbhab Gold Club🥇";
  } else if(totalBVPoints >= 3000000){
    return "Udbhab Platinum Club";
  } else if(totalBVPoints >= 3500000){
    return "Udbhab Diamond Club";
  } else if(totalBVPoints >= 4500000){
    return "Udbhab Blue Diamond Club";
  } else if(totalBVPoints >= 5000000){
    return "Udbhab White Diamond Club";
  } else if(totalBVPoints >= 10000000){
    return "Udbhab Purple Diamond Club";
  } else if(totalBVPoints >= 20000000){
    return "Udbhab Royal Diamond Club";
  } else if(totalBVPoints >= 50000000){
    return "Udbhab Crown Diamond Club";
  } else if(totalBVPoints >= 100000000){
    return "Udbhab Unicorn Diamond Club";
  } else {
    return "Independent Distributor";
  }
}

// const handleGetDashboardData = async (req, res) => {
//   try {
//     // Find user from received sponsorId
//     const user = await User.findOne({ mySponsorId: req.body.sponsorId });
//     console.log(user);
//     if (!user) {
//       return res.status(404).json({ message: 'Incorrect sponsorId' });
//     }

//     // Initialize earnings variables
//     let weeklyEarning = 0;
//     let monthlyEarning = 0;
//     let lifetimeEarning = 0;
//     let directSalesBonus = 0;
//     let teamSalesBonus = 0;
//     let totalPersonalBVPoints = 0;
    
//     // Consider user as root or head & then find total number of users in left and right tree
//     let leftTreeUsersCount = await countLeftChild(user);
//     let rightTreeUsersCount = await countRightChild(user);

//     // Handle activeDate when it is null
//     // const activeDate = user.activeDate ? user.activeDate.toISOString().split('T')[0] : "Not active";
//     const activeDate = user.isActive ? "Active" : "Inactive";
//     let kycStatus;

//     // Fetch KYC status from the KYC document for the given userId
//     const kyc = await KYC.findOne({ 'userDetails.mySponsorId': user.mySponsorId });
//     if (kyc) {
//       kycStatus = kyc.kycApproved;
//     } else {
//       kycStatus = "KYC Details not submitted.";
//     }


//     // Fetch the BVPoints document for the given userId
//     const bvPoints = await BVPoints.findOne({ userId: user._id });
//     if (!bvPoints) {
//       // Return 0 earnings if bvPoints is not available
//       return res.status(200).json({
//         activeDate,
//         kycStatus,
//         weeklyEarning,
//         monthlyEarning,
//         lifetimeEarning,
//         leftTreeUsersCount,
//         rightTreeUsersCount,
//         totalBVPointsEarned: {
//           leftBV: 0,
//           rightBV: 0
//         },
//         myTotalBV: 0,
//         totalDirectBV: {
//           leftDirectBV: 0,
//           rightDirectBV: 0
//         },
//         totalDirectTeam: {
//           leftDirectTeam: 0,
//           rightDirectTeam: 0
//         },
//         directSalesBonus,
//         teamSalesBonus,
//         totalPersonalBVPoints,
//       });
//     }

//     // Calculate weekly earnings from the most recent week
//     if (bvPoints.weeklyEarnings && bvPoints.weeklyEarnings.length > 0) {
//       const lastWeeklyEarning = bvPoints.weeklyEarnings[bvPoints.weeklyEarnings.length - 1];
//       weeklyEarning = lastWeeklyEarning.payoutAmount;
//     }

//     // Calculate monthly earnings from the most recent month
//     if (bvPoints.monthlyEarnings && bvPoints.monthlyEarnings.length > 0) {
//       const lastMonthlyEarning = bvPoints.monthlyEarnings[bvPoints.monthlyEarnings.length - 1];
//       monthlyEarning = lastMonthlyEarning.payoutAmount;
//     }

//     // Calculate lifetime earnings as the sum of all monthly earnings
//     if (bvPoints.monthlyEarnings && bvPoints.monthlyEarnings.length > 0) {
//       lifetimeEarning = bvPoints.monthlyEarnings.reduce((acc, earning) => acc + earning.payoutAmount, 0);
//     }

//     const totalBVPointsEarned = {
//       leftBV: bvPoints.totalBV.leftBV,
//       rightBV: bvPoints.totalBV.rightBV
//     }

//     const teamSalesMatched = Math.min(bvPoints.totalBV.leftBV, bvPoints.totalBV.rightBV);
//     teamSalesBonus = Math.round(teamSalesMatched * 0.1);


//     const myTotalBV = bvPoints.totalBV.leftBV + bvPoints.totalBV.rightBV;

    
//     const totalDirectBV = {
//       leftDirectBV: bvPoints.directBV.leftBV,
//       rightDirectBV: bvPoints.directBV.rightBV,
//       total: bvPoints.directBV.leftBV + bvPoints.directBV.rightBV
//     }

//     const directSalesMatched = bvPoints.directBV.leftBV + bvPoints.directBV.rightBV;
//     directSalesBonus = Math.round(directSalesMatched * 0.1);

//     const totalDirectTeam = {
//       leftDirectTeam: await calculateDirectLeftTeam(user, user.mySponsorId),
//       rightDirectTeam: await calculateDirectRightTeam(user, user.mySponsorId)
//     }
//     totalPersonalBVPoints = bvPoints.personalBV || 0;
//     // const totalPersonalBVPoints = bvPoints ? bvPoints.personalBV : 0;

//     // Return the calculated earnings and tree user counts
//     return res.status(200).json({
//       activeDate,
//       kycStatus,
//       weeklyEarning,
//       monthlyEarning,
//       lifetimeEarning,
//       leftTreeUsersCount,
//       rightTreeUsersCount,
//       totalBVPointsEarned,
//       myTotalBV,
//       totalDirectBV,
//       totalDirectTeam,
//       directSalesBonus,
//       teamSalesBonus,
//       totalPersonalBVPoints
//     });

//   } catch (error) {
//     console.error("Error fetching dashboard data:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };



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


module.exports = {
  handleGetDashboardData,
  handleGetWeeklyPayoutsDetails,
  handleGetMonthlyPayoutsDetails,
  handleUpdateWeeklyPayoutStatus,
  handleGetAllWeeklyEarnings,
  handleGetAllMonthlyEarnings
};
