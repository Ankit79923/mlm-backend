const express = require('express');
const router = express.Router();

const { generateToken, verifyTokenMiddleware, isAdminMiddleware } = require('../middlewares/jwt');
const { handleViewProducts, handleGetProductById, handleAddProductsToCart, handleAddProductToWishlist, handleAddProductToCart } = require('../controllers/productController');



router.get('/viewProducts', handleViewProducts);
router.get('/getProductById/:id', handleGetProductById);
router.post('/addToCart', handleAddProductsToCart);
// handleAddProductToCart
router.post('/addProductToCart', verifyTokenMiddleware, handleAddProductToCart);
router.post('/addProductToWishlist', verifyTokenMiddleware, handleAddProductToWishlist);


module.exports = router;