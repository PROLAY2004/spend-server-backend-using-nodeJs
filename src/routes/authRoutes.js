import express from 'express';

import AuthController from '../controller/AuthController.js';
import UserValidation from '../validations/middleware/UserValidation.js';
import TokenValidation from '../validations/middleware/TokenValidation.js';

const router = express.Router();
const auth = new AuthController();
const userValidation = new UserValidation();
const validation = new TokenValidation();

router.get('/send-otp', userValidation.otpRequest, auth.sendOtp);
router.post('/login', userValidation.loginRequest, auth.login);
router.get('/google', auth.google);
router.get('/refresh', validation.refreshTokenValidator, auth.refresh);

export default router;
