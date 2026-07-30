import express from 'express';

import PayerController from '../controller/PayerController.js';
import RecordsController from '../controller/RecordsController.js';
import DashboardController from '../controller/DashboardController.js';
import InvoiceController from '../controller/InvoiceController.js';
import LedgerController from '../controller/LedgerController.js';
import FormValidation from '../validations/middleware/FormValidation.js';

const router = express.Router();
const payer = new PayerController();
const validation = new FormValidation();
const record = new RecordsController();
const dashboard = new DashboardController();
const invoice = new InvoiceController();3
const ledger = new LedgerController();

router.post('/overview', dashboard.getDashboardOverview);
router.get('/export', dashboard.exportDashboardExcel);

router.post('/payer', validation.addPayerRequest, payer.addPayer);
router.put('/payer/:payerId', validation.addPayerRequest, payer.editPayer);
router.delete('/payer/:payerId', payer.deletePayer);
router.post('/fetch-payers', payer.fetchPayer);

router.post('/fetch-ledger/', ledger.fetchLedger);

router.post('/records', validation.addLedgerRequest, record.addLedger);
router.put('/records/:recId', validation.addLedgerRequest, record.editLedger);
router.delete('/records', record.deleteLedger);
router.post('/bulk-action', validation.bulkLedgerRequest, record.bulkActionLedgers);

router.post('/invoice', validation.genInvoiceRequest, invoice.generate)
router.post('/fetch-invoice', invoice.getData);
router.post('/view-invoice', invoice.viewInvoice);
router.get('/share-invoice/:invoiceId', invoice.share)
router.put('/invoice', invoice.updateInvoiceStatuses);
router.delete('/invoice', invoice.deleteInvoice);

export default router;
