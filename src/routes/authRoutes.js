import express from 'express';

import AuthController from '../controller/AuthController.js';

const router = express.Router();
const auth = new AuthController();

router.post('/send-otp', auth.sendOtp);

export default router;
