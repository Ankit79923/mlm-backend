const express = require('express');
const router = express.Router();


const {handleRegisterUser, handleLoginUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleFindUser, handleRegisterFirstUser, handleVerifySponsor, handleAllUser, handleUserbyitsid , handleEditUserDetails , searchuser ,  handleforgotpassword, handleVerifyLinkSentOnEmail, handleUpdatePassword } = require('../controllers/authController');
const { searchproduct , category_product } = require('../controllers/productController');

router.post('/registerFirstUser', handleRegisterFirstUser);
router.post('/register', handleRegisterUser);
router.post('/registerLeft', handleRegisterUsingLeftLink);
router.post('/registerRight', handleRegisterUsingRightLink);
router.post('/login', handleLoginUser);
router.get('/findUser/:id', handleFindUser);            // R
router.post('/verifySponsor', handleVerifySponsor);     // R
router.get('/searchproduct', searchproduct);
router.get('/handleAllUser', handleAllUser);
router.get('/product/categoryproduct/:category', category_product);
router.put('/handleEditUserDetails', handleEditUserDetails);
router.get('/handleUserbyitsid/:id', handleUserbyitsid);
router.get('/searchuser', searchuser);
//forgot password
router.post('/forgotpassword', handleforgotpassword);
router.get('/verifysentemail', handleVerifyLinkSentOnEmail);
router.post('/updatepassword', handleUpdatePassword);


module.exports = router;