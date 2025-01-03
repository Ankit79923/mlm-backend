const User = require('../models/user-models/users');
const BVPoints = require('../models/user-models/bvPoints');



// 1. Calculates weekly Payout
const calculateWeekelyPayout = async (req, res) => {
  try {
    // Get the current week's date
    const todayDate = new Date();

    // Find all users and process their BV points for payout calculation
    const users = await BVPoints.find();

    // Iterate through each user and calculate payout based on their BV points
    for (const user of users) {
      const { leftBV, rightBV } = user.currentWeekBV;
      const {leftTeamBV, rightTeamBV} = user.totalBV;

      
      const matchedBonus = leftTeamBV + rightTeamBV;
      const teamSalesBonus = matchedBonus * 0.1;
      // Calculate matched BV & payout
      const matchedBV = Math.min(leftBV, rightBV);
      const directSalesBonus = matchedBV * 0.1;
      const payoutAmount = directSalesBonus + teamSalesBonus;
      // Calculate weeklyBV
      const weeklyBV = matchedBonus + matchedBV;

      // Create a new weekly earning entry
      const newEarning = {
        week: todayDate,
        matchedBV,
        directSalesBonus,
        teamSalesBonus,
        weeklyBV,
        payoutAmount
      };

      // Update the user's weekly earnings and carry-forward BV
      user.weeklyEarnings.push(newEarning);
      user.currentWeekBV.leftBV -= weeklyBV;
      user.currentWeekBV.rightBV -= weeklyBV;
      await user.save();
    }

    console.log('Payout calculated successfully for the week');
  } catch (err) {
    console.error("Error calculating payouts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



// 2. Calculate Monthly Payout
const calculateMonthlyPayout = async function (req, res) {
    try {
      // Get the today's date
      const todayDate = new Date();
        
      // Find all users
      const users = await BVPoints.find();

      // Iterate through each user and calculate MONTHLY payout
      for (const user of users) {
      const { leftBV, rightBV } = user.currentMonthBV;
      const {leftTeamBV, rightTeamBV} = user.totalBV;


        const matchedBonus = Math.min(leftTeamBV, rightTeamBV);
        const teamSalesBonus = Math.round(matchedBonus * 0.1);
        // Calculate Monthly payoutAmount
        const matchedBV = leftBV + rightBV; // Calculate total BV
        const directSalesBonus = matchedBV * 0.1;
        const payoutAmount = Math.round(directSalesBonus + teamSalesBonus);

        // Calculate monthly BV
        const monthlyBV = matchedBonus + matchedBV;

        // Create & save new monthly earning entry
        const newMonthlyEarning = { month: todayDate, payoutAmount };
        user.monthlyEarnings.push(newMonthlyEarning);
        // Reset user's currentMonthBV
        user.currentMonthBV.leftBV -= monthlyBV;
        user.currentMonthBV.rightBV -= monthlyBV;
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
