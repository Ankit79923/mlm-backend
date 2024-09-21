const express = require('express');
const router = express.Router();


const {handleRegisterUser, handleLoginUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink} = require('../controllers/authController');


router.post('/register', handleRegisterUser);
router.post('/registerLeft', handleRegisterUsingLeftLink);
router.post('/registerRight', handleRegisterUsingRightLink);
router.post('/login', handleLoginUser);



module.exports = router;