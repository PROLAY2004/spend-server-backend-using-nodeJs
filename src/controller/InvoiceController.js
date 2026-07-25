import { v4 as uuidv4 } from 'uuid';

import invoice from '../models/invoiceModel.js';
import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class InvoiceController {
  generate = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const { payerId, recordIds } = req.body;

      const [records, payerDetails] = await Promise.all([
        record
          .find({
            _id: { $in: recordIds },
            userId,
            payerId,
            isDeleted: false,
          })
          .lean(),

        payer
          .findOne({
            _id: payerId,
            userId,
            isDeleted: false,
          })
          .lean(),
      ]);

      if (records.length !== recordIds.length) {
        return res.status(400).json({
          success: false,
          message:
            'One or more selected records are invalid or have been deleted.',
        });
      }

      if (!payerDetails) {
        return res.status(404).json({
          success: false,
          message: 'Invalid Payer ID',
        });
      }

      const statuses = new Set(records.map((record) => record.status));

      if (statuses.size > 1) {
        return res.status(400).json({
          success: false,
          message: 'Please select records with the same payment status.',
        });
      }

      await invoice.create({
        userId,
        invoiceName: `Invoice-${uuidv4()}`,
        payerName: payerDetails.name,
        payerMobile: payerDetails.mobile,
        status: records[0].status,
        recordData: recordIds,
      });

      return res.status(201).json({
        success: true,
        message: 'Invoice Generated Successfully',
      });
    } catch (err) {
      next(err);
    }
  };

  getData = async (req, res, next) => {
    try {
      const userId = req.user._id;
      const invoices = await invoice
        .find({
          userId,
          isDeleted: false,
        })
        .lean()
        .sort({ createdAt: -1 });

      // Collect all unique record IDs
      const recordIds = [
        ...new Set(invoices.flatMap((invoice) => invoice.recordData)),
      ];

      // Fetch all active records once
      const records = await record
        .find({
          userId,
          _id: { $in: recordIds },
          isDeleted: false,
        })
        .lean();

      // Create record lookup map
      const recordMap = new Map(
        records.map((record) => [String(record._id), record])
      );

      const bulkOperations = [];

      const invoiceData = invoices.map((invoiceItem) => {
        let paidCount = 0;
        let unpaidCount = 0;
        let dueAmount = 0;

        for (const recordId of invoiceItem.recordData) {
          const recordData = recordMap.get(String(recordId));

          // Skip deleted or missing records
          if (!recordData) continue;

          if (recordData.status === 'paid') {
            paidCount++;
          } else {
            unpaidCount++;
            dueAmount += recordData.dueAmount;
          }
        }

        let status = 'non-paid';

        if (paidCount > 0 && unpaidCount === 0) {
          status = 'paid';
        } else if (paidCount > 0 && unpaidCount > 0) {
          status = 'partially-paid';
        }

        if (
          invoiceItem.status !== status ||
          invoiceItem.dueAmount !== dueAmount
        ) {
          bulkOperations.push({
            updateOne: {
              filter: { _id: invoiceItem._id },
              update: {
                $set: {
                  status,
                  dueAmount,
                },
              },
            },
          });
        }

        return {
          ...invoiceItem,
          status,
          dueAmount,
        };
      });

      if (bulkOperations.length) {
        await invoice.bulkWrite(bulkOperations);
      }

      return res.status(200).json({
        success: true,
        message: 'Invoice Data Fetched Successfully',
        data: {
          user: req.user,
          invoices: invoiceData,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
