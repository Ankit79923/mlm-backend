const express = require('express');
const router = express.Router();

const { handleGetWeeklyPayoutsDetails, handleGetMonthlyPayoutsDetails, handleUpdateWeeklyPayoutStatus, rankclaimstatus, handleGetAllWeeklyEarnings, handleGetAllMonthlyEarnings , handleBulkUpdateWeeklyPayoutStatus , updateUserRanks  , allUserRanks , getUserRankStatus} = require('../controllers/payoutsController');
const { calculateWeekelyPayout , calculateMonthlyPayout } = require('../utils/calculatePayout');

router.get('/weekly/:id', handleGetWeeklyPayoutsDetails);
router.get('/monthly/:id', handleGetMonthlyPayoutsDetails);
// router.post('/calculate/:week', handleCalculateWeekelyPayout);

router.get('/updateWeeklyPayoutStatus/:userId/:payoutId', handleUpdateWeeklyPayoutStatus);
router.post('/updatebulkPayoutStatus',handleBulkUpdateWeeklyPayoutStatus);

router.get('/all-weekly-earnings', handleGetAllWeeklyEarnings);
router.get('/all-monthly-earnings', handleGetAllMonthlyEarnings);

// Test weekly calculation

router.get('/test-weekly-payout', calculateWeekelyPayout);
router.get('/test-monthly-payout', calculateMonthlyPayout);
router.get('/rankachivers',updateUserRanks);
router.get('/allUserRanks',allUserRanks);
router.get('/getUserRankStatus/:userId', getUserRankStatus);

router.put('/rankachieverstatus/:rankId/claim/:userId', rankclaimstatus);

module.exports = router;