import SendEmailService from '../services/sendMailService.js';

const mailer = new SendEmailService();

export default class AuthController {
  sendOtp = async (req, res, next) => {
    try {
      const email = req.params.email;

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
