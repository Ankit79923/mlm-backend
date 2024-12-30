const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/multer');

const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');
const { handleViewProducts, handleGetProductById, handleAddProductsToCart, handleAddProductToWishlist, handleAddProductToCart, handleGetMyOrders } = require('../controllers/productController');
const { handleGetSponsorChildrens, handleExtremeLeft, handleExtremeRight, handleGetAllReferrals, handleSearchSpecificUser } = require('../controllers/authController');
const { handleGetDashboardData } = require('../controllers/payoutsController');
const { handleSubmitKycDetails, handleGetKYCStatus } = require('../controllers/kycController');
const { handleGetAllFranchises } = require('../controllers/franchiseController');



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

router.get('/getAllFranchies', handleGetAllFranchises);
router.post('/myOrders', handleGetMyOrders);

router.post('/getDashboardData', handleGetDashboardData);
router.post('/submitKycDetails', upload.fields([
    { name: 'panCardFront', maxCount: 1 },
    { name: 'aadharCardFront', maxCount: 1 },
    { name: 'aadharCardBack', maxCount: 1 },
    { name: 'bankCard', maxCount: 1 },
    { name: 'profilephoto', maxCount: 1 }
  ]), 
  handleSubmitKycDetails
);
router.get('/kyc-status/:mySponsorId', handleGetKYCStatus);




module.exports = router;