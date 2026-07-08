import express from 'express';

import userController from '../controller/UserController.js';

const router = express.Router();
const userCtrl = new userController();

router.post('/contact', userCtrl.contact);

export default router;
