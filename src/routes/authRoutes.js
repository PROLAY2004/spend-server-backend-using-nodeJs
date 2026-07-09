import express from 'express';

import AuthController from '../controller/AuthController.js';
import UserValidation from '../validations/middleware/UserValidation.js';

const router = express.Router();
const auth = new AuthController();
const userValidation = new UserValidation();

router.get('/send-otp', userValidation.otpRequest, auth.sendOtp);
router.post('/login', userValidation.loginRequest, auth.login);

export default router;
