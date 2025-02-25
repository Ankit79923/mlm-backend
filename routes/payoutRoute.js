const express = require('express');
const router = express.Router();

const { handleGetWeeklyPayoutsDetails, handleGetMonthlyPayoutsDetails, handleUpdateWeeklyPayoutStatus, handleGetAllWeeklyEarnings, handleGetAllMonthlyEarnings } = require('../controllers/payoutsController');
const { calculateWeekelyPayout } = require('../utils/calculatePayout');

router.get('/weekly/:id', handleGetWeeklyPayoutsDetails);
router.get('/monthly/:id', handleGetMonthlyPayoutsDetails);
// router.post('/calculate/:week', handleCalculateWeekelyPayout);

router.get('/updateWeeklyPayoutStatus/:userId/:payoutId', handleUpdateWeeklyPayoutStatus);


router.get('/all-weekly-earnings', handleGetAllWeeklyEarnings);
router.get('/all-monthly-earnings', handleGetAllMonthlyEarnings);

// Test weekly calculation

router.get('/test-weekly-payout', calculateWeekelyPayout);




module.exports = router;