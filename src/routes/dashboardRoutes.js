import express from 'express';

import PayerController from '../controller/PayerController.js';
import RecordsController from '../controller/RecordsController.js';
import FormValidation from '../validations/middleware/FormValidation.js';

const router = express.Router();
const payer = new PayerController();
const validation = new FormValidation();
const record = new RecordsController();

router.post('/payer', validation.addPayerRequest, payer.addPayer);
router.put('/payer/:payerId', validation.addPayerRequest, payer.editPayer);
router.delete('/payer/:payerId', payer.deletePayer);
router.post('/fetch-payers', payer.fetchPayer);
router.post('/fetch-payer-ledger/:payerId', payer.fetchLedger);

router.post('/records', validation.addLedgerRequest, record.addLedger);
router.put('/records/:recId', validation.addLedgerRequest, record.editLedger);
router.delete('/records', record.deleteLedger);

export default router;
