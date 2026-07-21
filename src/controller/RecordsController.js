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

      if(!recordId){
        res.status(404);
        throw new Error("Record Id not found");
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

      if(!updatedLedger){
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
}
