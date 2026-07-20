import payer from "../models/payerModel.js";

export default class PayerController {
  addPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;
      const user = req.user;

      await payer.create({
        name,
        mobile,
        userId : user._id
      })

      res.status(200).json({
        message: 'New Payer Added Successfully',
        success: true,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
