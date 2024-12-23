const express = require('express');
const router = express.Router();


const {handleRegisterUser, handleLoginUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleFindUser, handleRegisterFirstUser, handleVerifySponsor, handleAllUser, handleUserbyitsid  } = require('../controllers/authController');
const { searchproduct } = require('../controllers/productController');

router.post('/registerFirstUser', handleRegisterFirstUser);
router.post('/register', handleRegisterUser);
router.post('/registerLeft', handleRegisterUsingLeftLink);
router.post('/registerRight', handleRegisterUsingRightLink);
router.post('/login', handleLoginUser);
router.get('/findUser/:id', handleFindUser);            // R
router.post('/verifySponsor', handleVerifySponsor);     // R
router.get('/searchproduct', searchproduct);
router.get('/searchproduct', searchproduct);
router.get('/handleAllUser', handleAllUser);
router.get('/handleUserbyitsid/:id', handleUserbyitsid);


module.exports = router;