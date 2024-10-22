const express = require('express');
const router = express.Router();

const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');
const { handleViewProducts, handleGetProductById, handleAddProductsToCart, handleAddProductToWishlist, handleAddProductToCart } = require('../controllers/productController');
const { handleGetSponsorChildrens, handleExtremeLeft, handleExtremeRight, handleGetAllReferrals, handleSearchSpecificUser } = require('../controllers/authController');
const { handleGetDashboardData } = require('../controllers/payoutsController');



router.get('/viewProducts', handleViewProducts);            // RD
router.get('/getProductById/:id', handleGetProductById);    // RD
router.post('/addToCart', handleAddProductsToCart);         // RD

// handleAddProductToCart
router.post('/addProductToCart', verifyTokenMiddleware, handleAddProductToCart);
router.post('/addProductToWishlist', verifyTokenMiddleware, handleAddProductToWishlist);

router.get('/getSponsorChildrens/:id', handleGetSponsorChildrens);
router.post('/extremeLeft', handleExtremeLeft);
router.post('/extremeRight', handleExtremeRight);
router.post('/getDirectReferrals', handleGetAllReferrals);
router.get('/searchUserInGenealogyTree/:sponsorId', handleSearchSpecificUser);


router.post('/getDashboardData', handleGetDashboardData);


module.exports = router;