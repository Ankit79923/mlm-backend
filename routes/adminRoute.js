const express = require('express');
const router = express.Router();
const { isAdminMiddleware } = require('../middlewares/jwt');
const { handleAdminLogin, handleCreateAdmin} = require('../controllers/adminController');
const { handleAddProduct, handleEditProduct, handleDeleteProduct, handleViewProducts } = require('../controllers/productController');   

const upload = require('../middlewares/multer'); 


// Authentication Routes
router.post('/create', handleCreateAdmin);  
router.post('/login', handleAdminLogin);


// Product Routes
router.post('/addProduct', isAdminMiddleware, upload.single('picture'), handleAddProduct);
router.post('/editProduct/:id', isAdminMiddleware, upload.single('picture'), handleEditProduct);         // DONE
router.delete('/deleteProduct/:id', isAdminMiddleware, handleDeleteProduct);
router.get('/viewProducts', isAdminMiddleware, handleViewProducts);




module.exports = router;