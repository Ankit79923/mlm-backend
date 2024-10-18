const User = require('../models/user-models/users');
const BVPoints = require('../models/user-models/bvPoints');



// 1. Calculates weekly Payout
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




// ------------------------ 2. Calculate Monthly Payout --------------------------
const calculateMonthlyPayout = async function (req, res) {
    try {
      // Get the today's date
      const todayDate = getTodayDate();
        
      // Find all users
      const users = await BVPoints.find();

      // Iterate through each user and calculate MONTHLY payout based on
      for (const user of users) {
        const { leftBV, rightBV } = user.currentMonthBV;

        // Calculate Monthly payoutAmount
        const matchedBV = Math.min(leftBV, rightBV);
        const payoutAmount = matchedBV * 0.1;

        // Create & save new monthly earning entry
        const newMonthlyEarning = { month: todayDate, payoutAmount };
        user.monthlyEarnings.push(newMonthlyEarning);
        // Reset user's currentMonthBV
        user.currentMonthBV.leftBV -= matchedBV;
        user.currentMonthBV.rightBV -= matchedBV;
        // Save doc
        await user.save();
      }

      console.log('Payout calculated successfully for this month.');    
    }catch (err) {
        console.log(err.message);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
}



module.exports = {
    calculateWeekelyPayout,
    calculateMonthlyPayout
};