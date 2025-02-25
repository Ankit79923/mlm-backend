const User = require("../models/user-models/users");
const BVPoints = require("../models/user-models/bvPoints");

// 1. Calculates weekly Payout
// const calculateWeekelyPayout = async (req, res) => {
//   try {
//     // Get the current week's date
//     const todayDate = new Date();

//     // Find all users and process their BV points for payout calculation
//     const users = await BVPoints.find();

//     // Iterate through each user and calculate payout based on their BV points
//     for (const user of users) {
//       const { leftBV, rightBV } = user.currentWeekBV;
//       const {leftTeamBV, rightTeamBV} = user.totalBV;

      
//       const matchedBonus = leftTeamBV + rightTeamBV;
//       const teamSalesBonus = matchedBonus * 0.1;
//       // Calculate matched BV & payout
//       const matchedBV = Math.min(leftBV, rightBV);
//       const directSalesBonus = matchedBV * 0.1;
//       const payoutAmount = directSalesBonus + teamSalesBonus;
//       // Calculate weeklyBV
//       const weeklyBV = matchedBonus + matchedBV;

//       // Create a new weekly earning entry
//       const newEarning = {
//         week: todayDate,
//         matchedBV,
//         directSalesBonus,
//         teamSalesBonus,
//         weeklyBV,
//         payoutAmount
//       };

//       // Update the user's weekly earnings and carry-forward BV
//       user.weeklyEarnings.push(newEarning);
//       user.currentWeekBV.leftBV -= weeklyBV;
//       user.currentWeekBV.rightBV -= weeklyBV;
//       await user.save();
//     }

//     console.log('Payout calculated successfully for the week');
//   } catch (err) {
//     console.error("Error calculating payouts:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const calculateWeekelyPayout = async () => {
  try {
    const todayDate = new Date();
    const users = await BVPoints.find(); // Fetch all users with BVPoints

    for (const user of users) {
      // Safely destructure with default values
      const { currentWeekBV = {}, totalBV = {} } = user;

      const leftBV = Number(currentWeekBV.leftBV) || 0;
      const rightBV = Number(currentWeekBV.rightBV) || 0;
      const leftTeamBV = Number(totalBV.leftBV) || 0;
      const rightTeamBV = Number(totalBV.rightBV) || 0;

      // Calculate bonuses
      const matchedBonus = leftTeamBV + rightTeamBV;
      const teamSalesBonus = matchedBonus * 0.1;
      const matchedBV = Math.min(leftBV, rightBV);
      const directSalesBonus = matchedBV * 0.1;
      const payoutAmount = directSalesBonus + teamSalesBonus;
      // Calculate weeklyBV
      const weeklyBV = matchedBonus + matchedBV;
      // Handle invalid or NaN values
      if (isNaN(payoutAmount) || isNaN(teamSalesBonus)) {
        console.error(`Invalid calculation for user ID: ${user.userId}`);
        continue; // Skip processing for this user
      }

      // Save earnings and reset BV
      user.weeklyEarnings.push({
        week: todayDate,
        matchedBV,
        directSalesBonus,
        teamSalesBonus,
        weeklyBV,
        payoutAmount
        
      });
      user.currentWeekBV.leftBV = leftBV - matchedBV; // Carry forward remaining BV
      user.currentWeekBV.rightBV = rightBV - matchedBV; // Carry forward remaining BV

      await user.save(); // Save the updated user data
    }

//     // Send success response
//     console.log(`Weekly payout calculated successfully.`);

//     return true; // Return success
//   } catch (err) {
//     console.error(`Error calculating weekly payout`, err);
//     return false; // Return failure
//   }
// };

// 2. Calculate Monthly Payout
// const calculateMonthlyPayout = async function () {
//     try {
//       // Get the today's date
//       const todayDate = new Date();

//       // Find all users
//       const users = await BVPoints.find();

//       // Iterate through each user and calculate MONTHLY payout
//       for (const user of users) {
//       const { leftBV, rightBV } = user.currentMonthBV;
//       const {leftTeamBV, rightTeamBV} = user.totalBV;

//         const matchedBonus = Math.min(leftTeamBV, rightTeamBV);
//         const teamSalesBonus = Math.round(matchedBonus * 0.1);
//         // Calculate Monthly payoutAmount
//         const matchedBV = leftBV + rightBV; // Calculate total BV
//         const directSalesBonus = matchedBV * 0.1;
//         const payoutAmount = Math.round(directSalesBonus + teamSalesBonus);

//         // Calculate monthly BV
//         const monthlyBV = matchedBonus + matchedBV;

//         // Create & save new monthly earning entry
//         const newMonthlyEarning = { month: todayDate, payoutAmount };
//         user.monthlyEarnings.push(newMonthlyEarning);
//         // Reset user's currentMonthBV
//         user.currentMonthBV.leftBV -= monthlyBV;
//         user.currentMonthBV.rightBV -= monthlyBV;
//         // Save doc
//         await user.save();
//       }

//       console.log('Payout calculated successfully for this month.');
//       return true;
//     }catch (err) {

//         console.error('Error calculating weekly payout:', err);
//         return false; // Return failure

//     }
// }

const calculateWeekelyPayout = async () => {
  try {
    const todayDate = new Date();
    // const userId = "676e7a642b5bc486f0c65721";

    // Fetch user from DB
    const users = await BVPoints.find();
    for (const user of users) {
    

    // Extract or initialize BV data
    const { directBV = {}, totalBV = {}, currentWeekBV = {} , acumulatedBV = {} } = user;

    const directleftBV = Number(directBV.leftBV) || 0;
    const directrightBV = Number(directBV.rightBV) || 0;
    const leftTeamBV = Number(totalBV.leftBV) || 0;
    const rightTeamBV = Number(totalBV.rightBV) || 0;

    if (leftTeamBV === 0 || rightTeamBV === 0) {
      console.log("Payout is not available");
      continue;
    }

  if(leftTeamBV >= currentWeekBV.leftBV){
    user.acumulatedBV.leftBV += (leftTeamBV - currentWeekBV.leftBV);
  }else {
    user.acumulatedBV.leftBV += (currentWeekBV.leftBV - leftTeamBV) ;
  }

  if(rightTeamBV >= currentWeekBV.rightBV){
    user.acumulatedBV.rightBV += (rightTeamBV - currentWeekBV.rightBV);
  }else {
    user.acumulatedBV.rightBV += (currentWeekBV.rightBV - rightTeamBV) ;
  }



    let teamSalesBonus = 0; // Declare before use

    if (leftTeamBV >= rightTeamBV) {
      user.currentWeekBV.leftBV = leftTeamBV - rightTeamBV;
      user.currentWeekBV.rightBV = 0; // Reset right BV
      teamSalesBonus = Math.round(rightTeamBV * 0.1);
    } else {
      user.currentWeekBV.rightBV = rightTeamBV - leftTeamBV;
      user.currentWeekBV.leftBV = 0;
      teamSalesBonus = Math.round(leftTeamBV * 0.1);
    }

    // Calculate Direct Sales Bonus

    const totalDirectBonus = directleftBV + directrightBV;
    const directSalesBonus = Math.round(totalDirectBonus * 0.1);
    const totalAmount = directSalesBonus + teamSalesBonus;
    const tds = Math.round(totalAmount * 0.05); // 5% TDS
    const payoutAmount = Math.round(totalAmount - tds);

    const matchedBV = Math.min(leftTeamBV, rightTeamBV);
    const weeklyBV = totalDirectBonus + matchedBV;

    // user.acumulatedBV.leftBV = leftTeamBV;
    // user.acumulatedBV.rightBV = rightTeamBV;
    user.totalBV.leftBV =  currentWeekBV.leftBV ;
    user.totalBV.rightBV = currentWeekBV.rightBV ;
    // user.currentWeekBV.leftBV = 0;
    // user.currentWeekBV.rightBV = 0;

    user.directBV.leftBV = 0; // Reset direct BV
    user.directBV.rightBV = 0; // Reset direct BV

    console.log("Weekly payout calculated successfully.");
    console.log({
      todayDate,
      teamSalesBonus,
      directSalesBonus,
      leftBV: user.currentWeekBV.leftBV,
      rightBV: user.currentWeekBV.rightBV,
      payoutAmount,
      matchedBV,
      acumulatedBVleftbv: user.acumulatedBV.leftBV,
      acumulatedBVrightbv: user.acumulatedBV.rightBV,
      totalbvleftbv: user.totalBV.leftBV,
      totalbvrightbv: user.totalBV.rightBV,
      currentleftbv : user.currentWeekBV.leftBV,
      currentrightbv : user.currentWeekBV.rightBV,
      directleftBV: user.directBV.leftBV,
      directrightBV: user.directBV.rightBV
        
    });
    user.weeklyEarnings.push({
      week: todayDate,
      matchedBV,
      directSalesBonus,
      teamSalesBonus,
      weeklyBV,
      tds,
      payoutAmount,
    });
    await user.save();
  }
    return true;
  } catch (err) {
    console.error("Error calculating weekly payout:", err);
    return false;
  }
};

const calculateMonthlyPayout = async function () {
  try {
    // Get today's date
    const todayDate = new Date();

    // Find all users
    const users = await BVPoints.find();

      // Iterate through each user and calculate monthly payout
      for (const user of users) {
        const { currentWeekBV = {}, totalBV = {} } = user;

        const leftBV = Number(currentWeekBV.leftBV) || 0;
        const rightBV = Number(currentWeekBV.rightBV) || 0;
        const leftTeamBV = Number(totalBV.leftBV) || 0;
        const rightTeamBV = Number(totalBV.rightBV) || 0;

          
         

      const matchedBonus = Math.min(leftTeamBV, rightTeamBV);
      const teamSalesBonus = Math.round(matchedBonus * 0.1);

      // Calculate Monthly payoutAmount
      const matchedBV = leftBV + rightBV; // Calculate total BV
      const directSalesBonus = matchedBV * 0.1;

          // Make sure the payoutAmount is valid
          const payoutAmount = Math.round(directSalesBonus + teamSalesBonus);
          if (isNaN(payoutAmount)) {
              console.error('Invalid payoutAmount calculation for user:', user.userId);
              continue; // Skip this user and move to the next one
          }

          // Calculate monthly BV
          const monthlyBV = matchedBonus + matchedBV;
          if (isNaN(monthlyBV)) {
              console.error('Invalid monthlyBV calculation for user:', user.userId);
              continue; // Skip this user and move to the next one
          }

          // Create & save new monthly earning entry
          const newMonthlyEarning = { month: todayDate, payoutAmount };
          user.monthlyEarnings.push(newMonthlyEarning);

      // Reset user's currentMonthBV
      user.currentMonthBV.leftBV -= monthlyBV;
      user.currentMonthBV.rightBV -= monthlyBV;

      // Save the updated user document
      await user.save();
    }

      console.log('Payout calculated successfully for this month.');
      return true;
  } catch (err) {
      console.error('Error calculating monthly payout:', err);
      return false;
  }
};

module.exports = {
    calculateWeekelyPayout,
    calculateMonthlyPayout
};