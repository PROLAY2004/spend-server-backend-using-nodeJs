export default class AuthController {
  sendOtp = async (req, res, next) => {
    try {
      const email = req.params.email;

      mailer.contactMailer(name, email, message);

      res.status(200).json({
        message: 'Response Submitted Successfully',
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
