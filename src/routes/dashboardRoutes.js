import express from 'express';

import PayerController from '../controller/PayerController.js';
import FormValidation from '../validations/middleware/FormValidation.js';

const router = express.Router();
const payer = new PayerController();
const validation = new FormValidation();

router.post('/add-payer', validation.addPayerRequest, payer.addPayer);

export default router;
