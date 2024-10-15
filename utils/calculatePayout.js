const User = require('../models/user-models/users');
const BVPoints = require('../models/user-models/bvPoints');



// Calculates weekly Payout
const calculateWeekelyPayout = async (req, res) => {
  try {
    // Get the current week's date
    const todayDate = getTodayDate();

    // Find all users and process their BV points for payout calculation
    const users = await BVPoints.find();

    // Iterate through each user and calculate payout based on their BV points
    for (const user of users) {
      const { leftBV, rightBV } = user;

      // Calculate matched BV, payout, and carry-forward BV
      const { matchedBV, payoutAmount, carryForwardBV } = calculatePayout(leftBV, rightBV);

      // Create a new weekly earning entry
      const newEarning = {
        week: todayDate,
        matchedBV,
        payoutAmount,
        carryForwardBV
      };

      // Update the user's weekly earnings and carry-forward BV
      user.weeklyEarnings.push(newEarning);
      user.leftBV = carryForwardBV.left;
      user.rightBV = carryForwardBV.right;

      // Save the updated user document
      await user.save();
    }

    console.log('Payout calculated successfully for the week');
  } catch (err) {
    console.error("Error calculating payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Get Today's date: DD-MM-YYYY
const getTodayDate = function() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
};



// Helper function to calculate payout and carry-forward BV
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
    calculateWeekelyPayout,
};