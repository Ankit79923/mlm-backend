const express = require('express');
const router = express.Router();


const {handleRegisterUser, handleLoginUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleFindUser, handleGetSponsorChildrens, handleRegisterFirstUser, handleVerifySponsor, handleExtremeLeft, handleExtremeRight} = require('../controllers/authController');


router.post('/registerFirstUser', handleRegisterFirstUser);
router.post('/register', handleRegisterUser);
router.post('/registerLeft', handleRegisterUsingLeftLink);
router.post('/registerRight', handleRegisterUsingRightLink);
router.post('/login', handleLoginUser);
router.get('/findUser/:id', handleFindUser);
router.post('/verifySponsor', handleVerifySponsor);

router.get('/getSponsorChildrens/:id', handleGetSponsorChildrens);
router.post('/extremeLeft', handleExtremeLeft);
router.post('/extremeRight', handleExtremeRight);

module.exports = router;