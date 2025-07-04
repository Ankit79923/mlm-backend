const User = require("../models/user-models/users");
const BVPoints = require("../models/user-models/bvPoints");


// const calculateWeekelyPayout = async () => {
//   try {
//     const todayDate = new Date();
//     // const userId = "676e7a642b5bc486f0c65721";

//     // Fetch user from DB
//     const users = await BVPoints.find();
//     for (const user of users) {
    

//     // Extract or initialize BV data
//     const { directBV = {}, totalBV = {}, currentWeekBV = {} , acumulatedBV = {} } = user;

//     const directleftBV = Number(directBV.leftBV) || 0;
//     const directrightBV = Number(directBV.rightBV) || 0;
//     const leftTeamBV = Number(totalBV.leftBV) || 0;
//     const rightTeamBV = Number(totalBV.rightBV) || 0;

//     if (leftTeamBV === 0 || rightTeamBV === 0) {
      
//       console.log("Payout is not available");
//       continue;
//     }

// if(acumulatedBV.leftBV === 0 && acumulatedBV.rightBV === 0){
//   user.acumulatedBV.leftBV = leftTeamBV;
//   user.acumulatedBV.rightBV = rightTeamBV;
// }else{
//   if (leftTeamBV >= rightTeamBV) {
//     user.acumulatedBV.rightBV += rightTeamBV;
//   }else{
//     user.acumulatedBV.leftBV += leftTeamBV;
//   }
// }


//   // if(leftTeamBV >= supportiveBV.leftBV){
//   //   user.acumulatedBV.leftBV += (leftTeamBV - supportiveBV.leftBV);
//   // }else {
//   //   user.acumulatedBV.leftBV += (supportiveBV.leftBV - leftTeamBV) ;
//   // }

//   // if(rightTeamBV >= supportiveBV.rightBV){
//   //   user.acumulatedBV.rightBV += (rightTeamBV - supportiveBV.rightBV);
//   // }else {
//   //   user.acumulatedBV.rightBV += (supportiveBV.rightBV - rightTeamBV) ;
//   // }

//     let teamSalesBonus = 0; // Declare before use

//     if (leftTeamBV >= rightTeamBV) {
//       user.currentWeekBV.leftBV = leftTeamBV - rightTeamBV;
//       user.currentWeekBV.rightBV = 0; // Reset right BV
//       teamSalesBonus = Math.round(rightTeamBV * 0.1);
//     } else {
//       user.currentWeekBV.rightBV = rightTeamBV - leftTeamBV;
//       user.currentWeekBV.leftBV = 0;
//       teamSalesBonus = Math.round(leftTeamBV * 0.1);
//     }

//     // Calculate Direct Sales Bonus
//     const totalDirectBonus = directleftBV + directrightBV;
//     const directSalesBonus = Math.round(totalDirectBonus * 0.1);
//     const totalAmount = directSalesBonus + teamSalesBonus;
//     const tds = Math.round(totalAmount * 0.05); // 5% TDS
//     const payoutAmount = Math.round(totalAmount - tds);

//     const matchedBV = Math.min(leftTeamBV, rightTeamBV);
//     const weeklyBV = totalDirectBonus + matchedBV;

//     // user.acumulatedBV.leftBV = leftTeamBV;
//     // user.acumulatedBV.rightBV = rightTeamBV;
//     user.totalBV.leftBV =  currentWeekBV.leftBV ;
//     user.totalBV.rightBV = currentWeekBV.rightBV ;
//     // user.currentWeekBV.leftBV = 0;
//     // user.currentWeekBV.rightBV = 0;

//     user.directBV.leftBV = 0; // Reset direct BV
//     user.directBV.rightBV = 0; // Reset direct BV

//     console.log("Weekly payout calculated successfully.");
//     console.log({
//       todayDate,
//       teamSalesBonus,
//       directSalesBonus,
//       leftBV: user.currentWeekBV.leftBV,
//       rightBV: user.currentWeekBV.rightBV,
//       payoutAmount,
//       matchedBV,
//       acumulatedBVleftbv: user.acumulatedBV.leftBV,
//       acumulatedBVrightbv: user.acumulatedBV.rightBV,
//       totalbvleftbv: user.totalBV.leftBV,
//       totalbvrightbv: user.totalBV.rightBV,
//       currentleftbv : user.currentWeekBV.leftBV,
//       currentrightbv : user.currentWeekBV.rightBV,
//       directleftBV: user.directBV.leftBV,
//       directrightBV: user.directBV.rightBV
        
//     });
//     user.weeklyEarnings.push({
//       week: todayDate,
//       matchedBV,
//       directSalesBonus,
//       teamSalesBonus,
//       weeklyBV,
//       tds,
//       payoutAmount,
//     });
//     await user.save();
//   }
//     return true;
//   } catch (err) {
//     console.error("Error calculating weekly payout:", err);
//     return false;
//   }
// };



// ------------------------------------------------------------------------//

const calculateWeekelyPayout = async () => {
  try {
    const todayDate = new Date();
    // const userId = "676e7a642b5bc486f0c65721";
    // Fetch user from DB
    const users = await BVPoints.find();
    for (const user of users) {
      // Extract or initialize BV data
      const {
        directBV = {},
        totalBV = {},
        supportiveBV = {},
        acumulatedBV = {},
      } = user;
      const directleftBV = Number(directBV.leftBV) || 0;
      const directrightBV = Number(directBV.rightBV) || 0;
      const leftTeamBV = Number(totalBV.leftBV) || 0;
      const rightTeamBV = Number(totalBV.rightBV) || 0;
      const totalDirectBV = directleftBV + directrightBV;
      if (leftTeamBV === 0 || rightTeamBV === 0) {
        if (totalDirectBV === 0) {
          console.log("Payout is not available");
          continue;
        }
        const directSalesBonus = Math.round(totalDirectBV * 0.1);
        const tds = Math.round(directSalesBonus * 0.05);
        const payoutAmount = Math.round(directSalesBonus - tds);
        user.directBV.leftBV = 0;
        user.directBV.rightBV = 0;
        user.weeklyEarnings.push({
          week: todayDate,
          matchedBV: 0,
          directSalesBonus,
          teamSalesBonus: 0,
          weeklyBV: totalDirectBV,
          tds,
          payoutAmount,
        });
        await user.save();
        console.log('Direct payout calculated successfully');
        continue;
      }
      if (leftTeamBV >= supportiveBV.leftBV) {
        user.acumulatedBV.leftBV += leftTeamBV - supportiveBV.leftBV;
      } else {
        user.acumulatedBV.leftBV += supportiveBV.leftBV - leftTeamBV;
      }
      if (rightTeamBV >= supportiveBV.rightBV) {
        user.acumulatedBV.rightBV += rightTeamBV - supportiveBV.rightBV;
      } else {
        user.acumulatedBV.rightBV += supportiveBV.rightBV - rightTeamBV;
      }
      let teamSalesBonus = 0; // Declare before use
      if (leftTeamBV >= rightTeamBV) {
        user.supportiveBV.leftBV = leftTeamBV - rightTeamBV;
        user.supportiveBV.rightBV = 0; // Reset right BV
        teamSalesBonus = Math.round(rightTeamBV * 0.1);
      } else {
        user.supportiveBV.rightBV = rightTeamBV - leftTeamBV;
        user.supportiveBV.leftBV = 0;
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
      user.totalBV.leftBV = supportiveBV.leftBV;
      user.totalBV.rightBV = supportiveBV.rightBV;
      // user.supportiveBV.leftBV = 0;
      // user.supportiveBV.rightBV = 0;
      user.directBV.leftBV = 0; // Reset direct BV
      user.directBV.rightBV = 0; // Reset direct BV
      console.log("Weekly payout calculated successfully.");
      console.log({
        todayDate,
        teamSalesBonus,
        directSalesBonus,
        leftBV: user.supportiveBV.leftBV,
        rightBV: user.supportiveBV.rightBV,
        payoutAmount,
        matchedBV,
        acumulatedBVleftbv: user.acumulatedBV.leftBV,
        acumulatedBVrightbv: user.acumulatedBV.rightBV,
        totalbvleftbv: user.totalBV.leftBV,
        totalbvrightbv: user.totalBV.rightBV,
        currentleftbv: user.supportiveBV.leftBV,
        currentrightbv: user.supportiveBV.rightBV,
        directleftBV: user.directBV.leftBV,
        directrightBV: user.directBV.rightBV,
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


const calculateMonthlyPayout = async () => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 5 = Friday
    // Ensure this function only runs on Fridays
    if (dayOfWeek !== 5) {
      console.log("Not Friday, skipping monthly payout calculation.");
      return false;
    }
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    // Find the last Friday of the current month
    const lastDayOfMonth = new Date(thisYear, thisMonth + 1, 0);
    let lastFriday = new Date(lastDayOfMonth);
    while (lastFriday.getDay() !== 5) {
      lastFriday.setDate(lastFriday.getDate() - 1);
    }
    const users = await BVPoints.find();
    for (const user of users) {
      let monthlyPayout = 0;
      // Calculate Monthly Earnings from Weekly Earnings
      user.weeklyEarnings.forEach((entry) => {
        const entryDate = new Date(entry.week);
        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();
        // Include weeks that started in the previous month but ended in the current month
        if (
          (entryYear === thisYear && entryMonth === thisMonth) ||
          (entryDate < today && entryDate >= new Date(thisYear, thisMonth, 1))
        ) {
          monthlyPayout += entry.payoutAmount;
        }
      });
      // Check if there's already an entry for this month
      let existingMonthlyEntry = user.monthlyEarnings.find(
        (entry) => entry.month.getMonth() === thisMonth && entry.month.getFullYear() === thisYear
      );
      if (existingMonthlyEntry) {
        existingMonthlyEntry.payoutAmount = monthlyPayout;
      } else {
        user.monthlyEarnings.push({
          month: new Date(thisYear, thisMonth, 1),
          payoutAmount: monthlyPayout,
          weeklyDetails: [],
        });
      }
      // Add Weekly Details (Only week and payoutAmount)
      let monthlyEntry = user.monthlyEarnings.find(
        (entry) => entry.month.getMonth() === thisMonth && entry.month.getFullYear() === thisYear
      );
      monthlyEntry.weeklyDetails = user.weeklyEarnings
        .filter((entry) => {
          const entryDate = new Date(entry.week);
          return (
            (entryDate.getFullYear() === thisYear && entryDate.getMonth() === thisMonth) ||
            (entryDate < today && entryDate >= new Date(thisYear, thisMonth, 1))
          );
        })
        .map((entry) => ({
          week: entry.week,
          payoutAmount: entry.payoutAmount,
        }));
      // Reset Monthly Earnings on the Last Friday of the Month
      if (today.toDateString() === lastFriday.toDateString()) {
        user.monthlyEarnings.push({
          month: new Date(thisYear, thisMonth + 1, 1), // Next Month Start
          payoutAmount: 0,
          weeklyDetails: [],
        });
      }
      await user.save();
      console.log(`Monthly payout updated for user ${user.userId}:`, {
        monthlyPayout,
        weeklyDetails: monthlyEntry.weeklyDetails,
      });
    }
    console.log("Monthly payouts processed successfully.");
    return true;
  } catch (err) {
    console.error("Error calculating monthly payout:", err);
    return false;
  }
};

module.exports = {
    calculateWeekelyPayout,
    calculateMonthlyPayout
};