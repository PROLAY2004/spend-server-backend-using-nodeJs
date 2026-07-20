import express from 'express';

import PayerController from '../controller/PayerController.js';
import FormValidation from '../validations/middleware/FormValidation.js';

const router = express.Router();
const payer = new PayerController();
const validation = new FormValidation();

router.post('/payer', validation.addPayerRequest, payer.addPayer);
router.put('/payer/:payerId', validation.addPayerRequest, payer.editPayer);
router.delete('/payer/:payerId', payer.deletePayer);
router.post('/fetch-payers', payer.fetchPayer);

export default router;
