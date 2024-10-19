const express = require('express');
const router = express.Router();

const { handleGetWeeklyPayoutsDetails, handleGetMonthlyPayoutsDetails  } = require('../controllers/payoutsController');


router.get('/weekly/:id', handleGetWeeklyPayoutsDetails);
router.get('/monthly/:id', handleGetMonthlyPayoutsDetails);
// router.post('/calculate/:week', handleCalculateWeekelyPayout);


module.exports = router;