import payer from '../models/payerModel.js';
import record from '../models/recordsModel.js';

export default class PayerController {
  addPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;

      const existingPayer = await payer.findOne({
        userId: req.user._id,
        mobile,
        isDeleted: false,
      });

      if (existingPayer) {
        res.status(400);
        throw new Error('Payer Mobile No. Already Exists.');
      }

      await payer.create({
        name,
        mobile,
        userId: req.user._id,
      });

      res.status(200).json({
        message: 'New Payer Added Successfully',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  editPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;
      const payerId = req.params.payerId;

      // Check if mobile already exists for another payer
      const existingPayer = await payer.findOne({
        _id: { $ne: payerId }, // Exclude the current payer
        userId: req.user._id,
        mobile,
        isDeleted: false,
      });

      if (existingPayer) {
        res.status(409);
        throw new Error('Mobile number already exists.');
      }

      const updatedPayer = await payer.findOneAndUpdate(
        {
          _id: payerId,
          userId: req.user._id,
          isDeleted: false,
        },
        {
          $set: {
            name,
            mobile,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedPayer) {
        res.status(404);
        throw new Error('Payer does not exist.');
      }

      res.status(200).json({
        success: true,
        message: 'Payer Updated Successfully',
        data: updatedPayer,
      });
    } catch (err) {
      next(err);
    }
  };

  fetchPayer = async (req, res, next) => {
    try {
      const user = req.user;
      const payerDetails = await payer
        .find({ userId : user._id, isDeleted: false })
        .sort({ createdAt: -1 });

      const updatedPayerDetails = await Promise.all(
        payerDetails.map(async (payerData) => {
          const recordDetails = await record.find({
            userId: user._id,
            payerId: payerData._id,
            isDeleted: false,
            status: 'non-paid',
          });

          const totalDue = recordDetails.reduce(
            (sum, item) => sum + item.dueAmount,
            0
          );

          return {
            ...payerData.toObject(),
            totalDue,
          };
        })
      );

      res.status(200).json({
        message: 'Payers Fetched Successfully',
        success: true,
        data: {
          user,
          payerDetails: updatedPayerDetails,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
