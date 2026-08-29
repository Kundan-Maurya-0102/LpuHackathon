const express = require('express');
const authController = require('../controllers/authController');
const { authValidator, validate } = require('../validators/authValidator');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', validate(authValidator.signup), authController.signup);
router.post('/login', validate(authValidator.login), authController.login);
router.post('/send-otp', validate(authValidator.sendOtp), authController.sendOtp);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
