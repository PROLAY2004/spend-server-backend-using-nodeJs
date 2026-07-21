import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class RecordsController {
  addLedger = async (req, res, next) => {
    try {
      await record.create({
        ...req.body,
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
}
