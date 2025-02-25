const cron = require('node-cron');
const { calculateWeekelyPayout, calculateMonthlyPayout } = require('./calculatePayout');


// Calculating weekly payouts - on every saturday 12:00 AM
// cron.schedule('0 0 * * 6', () => { 
//     console.log('Running function to calculate weekly payout'); 
//     calculateWeekelyPayout(); 
// }, { scheduled: true, timezone: "IST" });



// calculate mothly payouts - on 1st of every month
// cron.schedule('0 0 1 * *', () => { 
//     console.log('Running function to calculate monthly payout'); 
//     calculateMonthlyPayout(); 
// }, { scheduled: true, timezone: "IST" });






// cron.schedule('* * * * *', () => { 
//     console.log('Running function to calculate monthly payout'); 
//     calculateMonthlyPayout(); 
// }, { scheduled: true, timezone: "IST" });

// cron.schedule('* * * * *', () => { 
//     console.log('Running function to calculate weekly payout'); 
//     calculateWeekelyPayout(); 
// }, { scheduled: true, timezone: "IST" });


