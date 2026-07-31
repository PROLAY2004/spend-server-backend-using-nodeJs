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

  publicInvoice = async (req, res, next) => {
    try {
      const { page = 1, limit = 5 } = req.body;
      const invoiceDetails = req.invoice;
      const totalRecords = await record.find({
        _id: { $in: invoiceDetails.recordData },
        isDeleted: false,
      });
      const totalPages = Math.ceil(totalRecords.length / limit) || 1;
      const skip = (page - 1) * limit;
      const paginatedIds = totalRecords.slice(skip, skip + limit);

      const [records, userDetails, allRecordStatuses] = await Promise.all([
        record
          .find({
            _id: { $in: paginatedIds },
            userId: invoiceDetails.userId,
            isDeleted: false,
          })
          .sort({ createdAt: -1 })
          .lean(),

        user
          .findOne({
            _id: invoiceDetails.userId,
          })
          .lean(),

        record
          .find(
            {
              _id: { $in: invoiceDetails.recordData },
              userId: invoiceDetails.userId,
              isDeleted: false,
            },
            { status: 1 }
          )
          .lean(),
      ]);

      const paidCount = allRecordStatuses.filter(
        (item) => item.status === 'paid'
      ).length;

      let actualInvoiceStatus;

      if (paidCount === 0) {
        actualInvoiceStatus = 'Non-Paid';
      } else if (paidCount === allRecordStatuses.length) {
        actualInvoiceStatus = 'Paid';
      } else {
        actualInvoiceStatus = 'Partially Paid';
      }

      if (invoiceDetails.status !== actualInvoiceStatus) {
        await invoice.updateOne(
          { _id: invoiceDetails._id },
          {
            $set: {
              status: actualInvoiceStatus,
            },
          }
        );

        invoiceDetails.status = actualInvoiceStatus;
      }

      const totalAmount = records.reduce(
        (sum, item) => sum + (item.spendAmount || 0),
        0
      );

      const dueAmount = records.reduce(
        (sum, item) =>
          item.status !== 'Paid' ? sum + (item.dueAmount || 0) : sum,
        0
      );

      return res.status(200).json({
        success: true,
        message: 'Invoice Data Fetched Successfully',
        data: {
          invoiceDetails,
          userDetails,
          records,
          totalPages,
          currentPage: Number(page),
          totalAmount,
          dueAmount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  share = async (req, res, next) => {
    try {
      const invoiceId = req.params.invoiceId;

      if (!invoiceId) {
        res.status(400);
        throw new Error('Invoice ID is required');
      }

      const token = await genToken.genInvoiceToken(invoiceId);

      res.status(200).json({
        message: 'Sharing Link Generated. Redirecting... ',
        success: true,
        data: {
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
