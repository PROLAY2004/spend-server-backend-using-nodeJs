import SendEmailService from '../services/sendMailService.js';

const mailer = new SendEmailService();

export default class UserController {
  contact = async (req, res, next) => {
    try {
      const { name, email, message } = req.body;

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
