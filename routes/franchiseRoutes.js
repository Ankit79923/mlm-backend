const express = require('express');
const router = express.Router();
const { handleGetFranchiesInventory } = require('../controllers/franchiseController');



// Franchise routes
router.get('/:franchiseId/inventory', handleGetFranchiesInventory);





module.exports = router;



// /:franchiseId/inventory