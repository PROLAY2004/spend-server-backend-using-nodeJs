import { toolresults_v1beta3 } from 'googleapis';
import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class RecordsController {
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
          payerId: req.body.payerId,
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
      const { recordId, payerId } = req.body;

      if (!recordId || !payerId) {
        res.status(404);
        throw new Error('Some Important IDs are Missing');
      }

      const updatedLedger = await record.findOneAndUpdate(
        {
          _id: req.body.recordId,
          payerId: req.body.payerId,
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

  bulkDeleteLedgers = async (req, res, next) => {
    try {
      const { recordIds } = req.body;

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        res.status(404);
        throw new Error('No Records Selected');
      }

      // Update all selected records to isDeleted: true
      const updatedRecord = await record.updateMany(
        { _id: { $in: recordIds }, userId: req.user._id, isDeleted: false },
        { $set: { isDeleted: true } }
      );

      if (!updatedRecord) {
        res.status(404);
        throw new Error('No Records Found');
      }

      res.status(200).json({
        success: true,
        message: `${recordIds.length} records deleted successfully`,
      });
    } catch (err) {
      next(err);
    }
  };

  bulkStatusLedgers = async (req, res, next) => {
    try {
      const { recordIds } = req.body;

      if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
        res.status(404);
        throw new Error('Record ID not Found');
      }

      // Find the first record to determine the current status
      const sampleRecord = await record.findOne({
        _id: recordIds[0],
        userId: req.user._id,
        isDeleted: false,
      });

      if (!sampleRecord) {
        res.status(404);
        throw new Error('No Records Selected');
      }

      // Toggle the status
      const newStatus = sampleRecord.status === 'paid' ? 'non-paid' : 'paid';

      // Apply new status to all selected records
      const updatedRecord = await record.updateMany(
        { _id: { $in: recordIds }, userId: req.user._id, isDeleted: false },
        { $set: { status: newStatus } }
      );

      if (!updatedRecord) {
        res.status(404);
        throw new Error('No Records Found');
      }

      res.status(200).json({
        success: true,
        message: `Status updated to ${newStatus} for selected records`,
      });
    } catch (err) {
      next(err);
    }
  };
}
