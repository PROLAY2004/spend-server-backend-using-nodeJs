import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class RecordsController {
  addLedger = async (req, res, next) => {
    try {

      console.log(req.body);
      
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
}
