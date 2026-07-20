import payer from '../models/payerModel.js';

export default class PayerController {
  addPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;

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
}
