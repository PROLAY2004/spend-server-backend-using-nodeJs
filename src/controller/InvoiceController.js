import { v4 as uuidv4 } from 'uuid';

import invoice from '../models/invoiceModel.js';
import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';
import TokenGenerator from '../utils/TokenGenerator.js';

const genToken = new TokenGenerator();

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
        res.status(400);
        throw new Error(
          'One or more selected records are invalid or have been deleted.'
        );
      }

      if (!payerDetails) {
        res.status(404);
        throw new Error('Payer does not exist or has been deleted.');
      }

      const statuses = new Set(records.map((record) => record.status));

      if (statuses.size > 1) {
        res.status(400);
        throw new Error('Please select records with the same payment status.');
      }

      const invoiceData = await invoice.create({
        userId,
        payerId,
        invoiceName: `Invoice-${uuidv4()}`,
        payerName: payerDetails.name,
        payerMobile: payerDetails.mobile,
        status: records[0].status,
        recordData: recordIds,
      });

      res.status(201).json({
        success: true,
        message: 'Invoice Generated Successfully',
        data: {
          invoiceId: invoiceData._id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  getData = async (req, res, next) => {
    try {
      const userId = req.user._id;

      // Extract parameters from frontend payload
      const {
        page = 1,
        limit = 5,
        search = '',
        filter = 'All',
        sort = 'Newest First',
      } = req.body;

      // 1. Base Query
      const query = {
        userId,
        isDeleted: false,
      };

      // 2. Status Filter
      if (filter === 'Paid') query.status = 'paid';
      if (filter === 'Pending') query.status = 'non-paid';
      if (filter === 'Partially Paid') query.status = 'partially-paid';

      // 3. Search Logic (Payer Name & Mobile)
      if (search) {
        // Escape special characters to prevent Regex crashes (e.g., ?, *, +)
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedSearch, 'i');
        const searchConditions = [{ payerName: searchRegex }];

        // Only add mobile to search if the original search term is a valid number
        if (!isNaN(search) && search.trim() !== '') {
          searchConditions.push({
            $expr: {
              $regexMatch: {
                input: { $toString: '$payerMobile' },
                regex: escapedSearch,
                options: 'i',
              },
            },
          });
        }

        query.$or = searchConditions;
      }

      // 4. Sort Logic
      let sortQuery = { createdAt: -1 };
      if (sort === 'Oldest First') sortQuery = { createdAt: 1 };
      if (sort === 'Amount: High to Low') sortQuery = { dueAmount: -1 };
      if (sort === 'Amount: Low to High') sortQuery = { dueAmount: 1 };

      // 5. Pagination calculation
      const totalInvoices = await invoice.countDocuments(query);
      const totalPages = Math.ceil(totalInvoices / limit) || 1;
      const skip = (page - 1) * limit;

      // 6. Fetch paginated data
      const invoices = await invoice
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // 7. Dynamic Record Recalculation (Only for the fetched page)
      const recordIds = [
        ...new Set(invoices.flatMap((invoice) => invoice.recordData)),
      ];

      const records = await record
        .find({
          userId,
          _id: { $in: recordIds },
          isDeleted: false,
        })
        .lean();

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
                $set: { status, dueAmount },
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

      // Fetch active payers for the "Generate Invoice" dropdown
      const payersList = await payer
        .find({
          userId,
          isDeleted: false,
        })
        .select('_id name mobile');

      return res.status(200).json({
        success: true,
        message: 'Invoice Data Fetched Successfully',
        data: {
          invoices: invoiceData,
          payersList,
          totalPages,
          currentPage: Number(page),
          totalInvoices,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  viewInvoice = async (req, res, next) => {
    try {
      const { invoiceId, page = 1, limit = 5 } = req.body;
      const userId = req.user._id;

      if (!invoiceId) {
        res.status(404);
        throw new Error('Invoice Id not found');
      }

      const invoiceDetails = await invoice
        .findOne({
          _id: invoiceId,
          userId,
          isDeleted: false,
        })
        .lean();

      if (!invoiceDetails) {
        res.status(404);
        throw new Error('Invoice not found');
      }

      // 2. Calculate pagination on the recordData array
      const totalRecords = await record.find({
        _id: { $in: invoiceDetails.recordData },
        isDeleted: false,
      });
      const totalPages = Math.ceil(totalRecords.length / limit) || 1;
      const skip = (page - 1) * limit;
      const paginatedIds = totalRecords.slice(skip, skip + limit);

      // 4. Fetch only the records for those sliced IDs
      const records = await record
        .find({
          _id: { $in: paginatedIds },
          userId,
          isDeleted: false,
        })
        .sort({ createdAt: -1 }) // Sorts ledgers by newest date first
        .lean();

      return res.status(200).json({
        success: true,
        message: 'Invoice Data Fetched Successfully',
        data: {
          records,
          totalPages,
          currentPage: Number(page),
          totalRecords,
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

  updateInvoiceStatuses = async (req, res, next) => {
    try {
      const { invoiceId, updates } = req.body;

      if (!invoiceId || !Array.isArray(updates) || updates.length === 0) {
        res.status(400);
        throw new Error('Invoice ID and an array of updates are required.');
      }

      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.recordId, isDeleted: false },
          update: {
            $set: {
              status: update.status.toLowerCase(),
            },
          },
        },
      }));

      await record.bulkWrite(bulkOps);

      res.status(200).json({
        success: true,
        message: 'Statuses updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req, res, next) => {
    try {
      const invoiceId = req.body.invoiceId;

      if (!invoiceId) {
        res.status(400);
        throw new Error('Invoice ID is required');
      }

      const updatedInvoice = await invoice.findOneAndUpdate(
        {
          _id: invoiceId,
          userId: req.user._id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedInvoice) {
        res.status(404);
        throw new Error('Invoice Not Found');
      }

      res.status(200).json({
        success: true,
        message: 'Invoice Deleted Successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}
