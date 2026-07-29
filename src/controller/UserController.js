import puppeteer from 'puppeteer';

import invoice from '../models/invoiceModel.js';
import record from '../models/recordsModel.js';
import user from '../models/userModel.js';

import invoiceTemplate from '../templates/invoiceTemplate.js';
import SendEmailService from '../services/sendMailService.js';

const mailer = new SendEmailService();

export default class UserController {
  contact = async (req, res, next) => {
    try {
      const { name, email, message } = req.body;

      mailer.contactMailer(name, email, message);

      res.status(200).json({
        message: 'Response Submitted Successfully',
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  generate = async (req, res, next) => {
    try {
      const invoiceId = req.params.invoiceId;

      if (!invoiceId) {
        res.status(400);
        throw new Error('Invoice ID is required');
      }

      const invoiceDetails = await invoice
        .findOne({
          _id: invoiceId,
          isDeleted: false,
        })
        .lean();

      if (!invoiceDetails) {
        res.status(404);
        throw new Error('Invoice not found');
      }

      const [userData, records] = await Promise.all([
        user
          .findOne({
            _id: invoiceDetails.userId,
          })
          .lean(),

        record
          .find({
            _id: { $in: invoiceDetails.recordData },
            userId: invoiceDetails.userId,
            isDeleted: false,
          })
          .sort({ date: 1 })
          .lean(),
      ]);

      const html = invoiceTemplate({
        invoiceDetails,
        userData,
        records,
      });


      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      await browser.close();

      res.status(200).json({
        message: 'Invoice PDF Generated Successfully',
        success: true,
        data: {
          fileName: `${invoiceDetails.invoiceName}.pdf`,
          pdfData: pdfBase64,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
