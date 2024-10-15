const User = require("../models/user-models/users");
const BVPoints = require("../models/user-models/bvPoints");
const mongoose = require("mongoose");

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
        carryForwardBV: {
          left: earning.carryForwardBV.left,
          right: earning.carryForwardBV.right,
        },
      })),
    });
  } catch (err) {
    console.error("Error fetching weekly payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// 2. Calculate the weekely payout - POST /api/payouts/calculate/{week}
const handleCalculateWeekelyPayout = async (req, res) => {
  try {
    const { week } = req.params;
    const weekDate = new Date(week);
    // console.log(week);
    // console.log(weekDate);
    
    // Validate if the provided week is a valid date
    if (isNaN(weekDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Find all users and process their BV points for payout calculation
    const users = await BVPoints.find().exec();

    // Iterate through each user and calculate payout based on their BV points
    for (const user of users) {
      const { leftBV, rightBV } = user;

      // Calculate matched BV, payout, and carry-forward BV
      const { matchedBV, payoutAmount, carryForwardBV } = calculatePayout( leftBV, rightBV);

      // Create a new weekly earning entry
      const newEarning = {
        week: weekDate,
        matchedBV,
        payoutAmount,
        carryForwardBV,
      };

      // Update the user's weekly earnings and carry-forward BV
      user.weeklyEarnings.push(newEarning);
      user.leftBV = carryForwardBV.left;
      user.rightBV = carryForwardBV.right;

      // Save the updated user document
      await user.save();
    }

    // Send success response
    res.status(200).json({
      message: `Payout calculated successfully for the week`,
      week: week,
    });
  } catch (err) {
    console.error("Error calculating payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Helper function to calculate the payout and carry-forward BV
const calculatePayout = (leftBV, rightBV) => {
  const matchedBV = Math.min(leftBV, rightBV);
  const payoutAmount = matchedBV * 0.1; // Payout is 10% of the matched BV
  const carryForwardBV = {
    left: leftBV - matchedBV,
    right: rightBV - matchedBV,
  };

  return {
    matchedBV,
    payoutAmount,
    carryForwardBV,
  };
};







module.exports = {
  handleGetWeeklyPayoutsDetails,
  handleCalculateWeekelyPayout
};
