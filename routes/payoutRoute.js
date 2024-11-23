const express = require('express');
const router = express.Router();

const { handleGetWeeklyPayoutsDetails, handleGetMonthlyPayoutsDetails, handleUpdateWeeklyPayoutStatus } = require('../controllers/payoutsController');


router.get('/weekly/:id', handleGetWeeklyPayoutsDetails);
router.get('/monthly/:id', handleGetMonthlyPayoutsDetails);
// router.post('/calculate/:week', handleCalculateWeekelyPayout);

router.get('/updateWeeklyPayoutStatus/:userId/:payoutId', handleUpdateWeeklyPayoutStatus);
module.exports = router;