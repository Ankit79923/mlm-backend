const express = require('express');
const router = express.Router();


const {handleRegisterUser, handleLoginUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleFindUser, handleRegisterFirstUser, handleVerifySponsor } = require('../controllers/authController');


router.post('/registerFirstUser', handleRegisterFirstUser);
router.post('/register', handleRegisterUser);
router.post('/registerLeft', handleRegisterUsingLeftLink);
router.post('/registerRight', handleRegisterUsingRightLink);
router.post('/login', handleLoginUser);
router.get('/findUser/:id', handleFindUser);            // R
router.post('/verifySponsor', handleVerifySponsor);     // R



module.exports = router;