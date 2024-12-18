const express = require('express');
const router = express.Router();
const { handleGetFranchiesInventory, handleLoginFranchise, handleCalculateTotalBill, handleGetAllUsers, handleGetAllOrdersCreatedByFranchise } = require('../controllers/franchiseController');
const { isFranchiseMiddleware } = require('../middlewares/jwt');
const { handleGetFranchiseDashboardData } = require('../controllers/franchiseController');



// Franchise routes
router.get('/:franchiseId/inventory', handleGetFranchiesInventory);
router.post('/login', handleLoginFranchise);
router.post('/calculateTotalBill', handleCalculateTotalBill);
router.get('/getAllUsers', handleGetAllUsers);
router.get('/:franchiseId/dashboardData', handleGetFranchiseDashboardData);
router.post('/createdOrders', handleGetAllOrdersCreatedByFranchise);


module.exports = router;



// /:franchiseId/inventory