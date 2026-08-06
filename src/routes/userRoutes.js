import express from 'express';

import UserController from '../controller/UserController.js';
import UserValidation from '../validations/middleware/UserValidation.js';
import TokenValidation from '../validations/middleware/TokenValidation.js';

const router = express.Router();
const userCtrl = new UserController();
const userValidation = new UserValidation();
const token = new TokenValidation();

router.post('/contact', userValidation.contactRequest, userCtrl.contact);
router.get('/download-invoice/:invoiceId', userCtrl.generate);
router.post('/invoice', token.invoiceTokenValidator, userCtrl.publicInvoice);

export default router;
