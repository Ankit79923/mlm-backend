const express = require('express');
const router = express.Router();

const { handleGetWeeklyPayoutsDetails, handleGetMonthlyPayoutsDetails, handleUpdateWeeklyPayoutStatus, handleGetAllWeeklyEarnings, handleGetAllMonthlyEarnings , handleBulkUpdateWeeklyPayoutStatus , updateUserRanks  , allUserRanks} = require('../controllers/payoutsController');
const { calculateWeekelyPayout } = require('../utils/calculatePayout');

router.get('/weekly/:id', handleGetWeeklyPayoutsDetails);
router.get('/monthly/:id', handleGetMonthlyPayoutsDetails);
// router.post('/calculate/:week', handleCalculateWeekelyPayout);

router.get('/updateWeeklyPayoutStatus/:userId/:payoutId', handleUpdateWeeklyPayoutStatus);
router.post('/updatebulkPayoutStatus',handleBulkUpdateWeeklyPayoutStatus);

router.get('/all-weekly-earnings', handleGetAllWeeklyEarnings);
router.get('/all-monthly-earnings', handleGetAllMonthlyEarnings);

// Test weekly calculation

router.get('/test-weekly-payout', calculateWeekelyPayout);
router.get('/rankachivers',updateUserRanks);
router.get('/allUserRanks',allUserRanks);


module.exports = router;