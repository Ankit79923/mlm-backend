const express = require('express');
const router = express.Router();

const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');
const { handleViewProducts, handleGetProductById, handleAddProductsToCart, handleAddProductToWishlist } = require('../controllers/productController');



router.get('/viewProducts', handleViewProducts);
router.get('/getProductById/:id', handleGetProductById);
router.post('/addToCart', handleAddProductsToCart);
router.post('/addProductToWishlist', verifyTokenMiddleware, handleAddProductToWishlist);


module.exports = router;