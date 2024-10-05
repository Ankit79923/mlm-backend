const express = require('express');
const router = express.Router();
const { handleGetFranchiesInventory, handleLoginFranchise, handleCalculateTotalBill } = require('../controllers/franchiseController');
const { isFranchiseMiddleware } = require('../middlewares/jwt');



// Franchise routes
router.get('/:franchiseId/inventory', handleGetFranchiesInventory);
router.post('/login', handleLoginFranchise);
router.post('/calculateTotalBill', handleCalculateTotalBill)



module.exports = router;



// /:franchiseId/inventory