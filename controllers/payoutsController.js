const User = require("../models/user-models/users");
const BVPoints = require("../models/user-models/bvPoints");
const mongoose = require("mongoose");
const { countLeftChild, countRightChild } = require('../utils/placeInBinaryTree');

// 1. Get weekly payout detaills
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
      weeklyEarnings: bvPoints.weeklyEarnings.map((earning) => ({
        week: earning.week.toISOString().split("T")[0], // Formatting date to "YYYY-MM-DD"
        matchedBV: earning.matchedBV,
        payoutAmount: earning.payoutAmount,
      })),
    });
  } catch (err) {
    console.error("Error fetching weekly payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};






const handleGetDashboardData = async (req, res) => {
  try {
    // Find user from received sponsorId
    const user = await User.findOne({ mySponsorId: req.body.sponsorId });
    if (!user) {
      return res.status(404).json({ message: 'Incorrect sponsorId' });
    }

    // Initialize earnings variables
    let weeklyEarning = 0;
    let monthlyEarning = 0;
    let lifetimeEarning = 0;

    // Consider user as root or head & then find total number of users in left and right tree
    let leftTreeUsersCount = await countLeftChild(user);
    let rightTreeUsersCount = await countRightChild(user);
    console.log(leftTreeUsersCount, rightTreeUsersCount);
    

    // Fetch the BVPoints document for the given userId
    const bvPoints = await BVPoints.findOne({ userId: user._id });
    if (!bvPoints) {
      // Return 0 earnings if bvPoints is not available
      return res.status(200).json({
        weeklyEarning,
        monthlyEarning,
        lifetimeEarning,
        leftTreeUsersCount,
        rightTreeUsersCount
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

    const totalDirectBV = {
      leftDirectBV: bvPoints.directBV.leftBV,
      rightDirectBV: bvPoints.directBV.rightBV
    }

    // const totalDirectTeam = {
    //   leftDirectTeam: 1,
    //   rightDirectTeam: 1,
    // }

    // Return the calculated earnings and tree user counts
    return res.status(200).json({
      weeklyEarning,
      monthlyEarning,
      lifetimeEarning,
      leftTreeUsersCount,
      rightTreeUsersCount,
      totalBVPointsEarned,
      totalDirectBV,
      // totalDirectTeam,
    });
  
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};










module.exports = {
  handleGetWeeklyPayoutsDetails,
  handleGetDashboardData,
};
