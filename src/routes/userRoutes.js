import express from 'express';

import UserController from '../controller/UserController.js';
import UserValidation from '../validations/middleware/UserValidation.js';

const router = express.Router();
const userCtrl = new UserController();
const userValidation = new UserValidation();

router.post('/contact', userValidation.contactRequest, userCtrl.contact);
router.get('/download-invoice/:invoiceId', userCtrl.generate);

export default router;
