import otpGenerator from '../utils/genOtp.js';

export default class AuthController {
  sendOtp = async (req, res, next) => {
    try {
      const email = req.params.email;

      await otpGenerator(res, email);

      res.status(200).json({
        message: 'OTP Sent to Email.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      await otpGenerator(res, email);

      res.status(200).json({
        message: 'User Login Successful.',
        success: true,
      });
    } catch (err) {
      next(err);
    }
  };
}
