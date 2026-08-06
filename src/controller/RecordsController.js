import { toolresults_v1beta3 } from 'googleapis';
import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class RecordsController {
  fetchLedger = async (req, res, next) => {
    try {
      const userId = String(req.user._id);
      const {
        page = 1,
        limit = 10,
        searchQuery,
        statusFilter,
        dateFrom,
        dateTo,
        payerId,
      } = req.body;

      let query = { userId: userId, isDeleted: false };

      if (statusFilter && statusFilter !== 'All') {
        query.status = statusFilter.toLowerCase();
      }

      if (payerId) {
        query.payerId = payerId;
      }

      if (dateFrom || dateTo) {
        query.date = {};
        if (dateFrom) query.date.$gte = new Date(dateFrom);
        if (dateTo) query.date.$lte = new Date(dateTo);
      }

      if (searchQuery) {
        query.$or = [
          { category: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;
      const ledgers = await record
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const [formattedLedgers, totalRecords, dueAmountAggregation] =
        await Promise.all([
          // Promise 1: Map and format the ledgers
          Promise.all(
            ledgers.map(async (item) => {
              let payerName = 'Unknown';
              let payerMobile = 'Unknown';

              if (item.payerId) {
                const payerInfo = await payer
                  .findById(item.payerId)
                  .select('name mobile')
                  .lean();

                if (payerInfo) {
                  payerName = payerInfo.name;
                  payerMobile = payerInfo.mobile;
                }
              }

              const plainItem = item.toObject ? item.toObject() : item;

              return {
                ...plainItem,
                payerName,
                payerMobile,
                payerId: item.payerId,
              };
            })
          ),

          // Promise 2: Count total records
          record.countDocuments(query),

          // Promise 3: Aggregate the total due amount
          record.aggregate([
            { $match: { ...query, status: 'non-paid' } },
            {
              $group: {
                _id: null,
                totalDue: { $sum: '$dueAmount' },
              },
            },
          ]),
        ]);

      const totalDueAmount =
        dueAmountAggregation.length > 0 ? dueAmountAggregation[0].totalDue : 0;
      const payersList = await payer
        .find({ userId, isDeleted: false })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          ledgers: formattedLedgers,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
          totalDueAmount,
          payersList,
          currentPage: page,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  addLedger = async (req, res, next) => {
    try {
      const selectedDate = new Date(req.body.date);
      const now = new Date();

      selectedDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      await record.create({
        ...req.body,
        date: selectedDate,
        userId: req.user._id,
      });

      res.status(201).json({
        message: 'New Ledger Added Successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  editLedger = async (req, res, next) => {
    try {
      const recordId = req.params.recId;

      if (!recordId) {
        res.status(404);
        throw new Error('Record Id not found');
      }

      const selectedDate = new Date(req.body.date);
      const now = new Date();

      selectedDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds()
      );

      const updatedLedger = await record.findOneAndUpdate(
        {
          _id: recordId,
          userId: req.user._id,
          isDeleted: false,
        },
        {
          $set: {
            ...req.body,
            date: selectedDate,
            userId: req.user._id,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedLedger) {
        res.status(404);
        throw new Error('No Ledger Found.');
      }

      res.status(200).json({
        message: 'Ledger Updated Successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  deleteLedger = async (req, res, next) => {
    try {
      const { recordId } = req.body;

      if (!recordId) {
        res.status(404);
        throw new Error('Record Id is Missing');
      }

      const updatedLedger = await record.findOneAndUpdate(
        {
          _id: req.body.recordId,
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

      if (!updatedLedger) {
        res.status(404);
        throw new Error('No Ledger Found.');
      }

      res.status(200).json({
        message: 'Ledger Deleted Successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  bulkActionLedgers = async (req, res, next) => {
    try {
      const { action, records } = req.body;
      const recordIds = records.map((record) => record.id);
      const statuses = [...new Set(records.map((record) => record.status))];
      let updatedRecord = [];

      if (statuses.length > 1 && action !== 'delete') {
        res.status(400);
        throw new Error('Please Select Records With the Same Status.');
      }

      if (action === 'delete') {
        updatedRecord = await record.updateMany(
          {
            _id: { $in: recordIds },
            userId: req.user._id,
            isDeleted: false,
          },
          {
            $set: { isDeleted: true },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } else if (action === 'status') {
        const currentStatus = statuses[0];
        const newStatus = currentStatus === 'paid' ? 'non-paid' : 'paid';

        updatedRecord = await record.updateMany(
          {
            _id: { $in: recordIds },
            userId: req.user._id,
            isDeleted: false,
          },
          {
            $set: { status: newStatus },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }

      if (!updatedRecord) {
        res.status(404);
        throw new Error('No Records Found');
      }

      res.status(200).json({
        success: true,
        message: `${recordIds.length} Records ${action === 'delete' ? 'Deleted' : 'Updated'} Successfully`,
      });
    } catch (err) {
      next(err);
    }
  };
}
