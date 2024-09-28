const express = require('express');
const router = express.Router();


const {handleRegisterUser, handleLoginUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleFindUser, handleGetSponsorChildrens, handleRegisterFirstUser} = require('../controllers/authController');


router.post('/registerFirstUser', handleRegisterFirstUser);
router.post('/register', handleRegisterUser);
router.post('/registerLeft', handleRegisterUsingLeftLink);
router.post('/registerRight', handleRegisterUsingRightLink);
router.post('/login', handleLoginUser);
router.get('/findUser/:id', handleFindUser);

router.get('/getSponsorChildrens/:id', handleGetSponsorChildrens);
// router.get('/mlm-tree/:id', handleGetSponsorTree);

module.exports = router;