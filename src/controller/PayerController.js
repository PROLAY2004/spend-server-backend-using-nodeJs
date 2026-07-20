export default class PayerController {
  addPayer = async (req, res, next) => {
    try {
      const { name, mobile } = req.body;

      

      res.status(200).json({
        message: 'New Payer Added Successfully',
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
