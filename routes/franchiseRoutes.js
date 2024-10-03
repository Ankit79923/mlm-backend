const express = require('express');
const router = express.Router();
const { handleGetFranchiesInventory, handleLoginFranchise } = require('../controllers/franchiseController');
const { isFranchiseMiddleware } = require('../middlewares/jwt');



// Franchise routes
router.get('/:franchiseId/inventory', handleGetFranchiesInventory);
router.post('/login', handleLoginFranchise);




module.exports = router;



// /:franchiseId/inventory