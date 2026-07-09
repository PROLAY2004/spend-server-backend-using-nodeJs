import crypto from 'crypto';

import otp from '../models/otpModel.js';
import user from '../models/userModel.js';
import otpGenerator from '../utils/genOtp.js';
import genAuthToken from '../utils/tokenGenerator.js';

export default class AuthController {
  sendOtp = async (req, res, next) => {
    try {
      const email = req.query.email;

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
      const email = req.body.email;
      const newOtp = req.body.otp;
      const uuid = crypto.randomUUID();

      const latestOtp = await otp.findOne({ email }).sort({ createdAt: -1 });
      const otpTime = new Date(latestOtp.createdAt);

      if (latestOtp.otp !== newOtp) {
        res.status(400);
        throw new Error('Invalid OTP Entered.');
      }

      if (Date.now() - otpTime > 900000) {
        res.status(400);
        throw new Error('The OTP has Expired.');
      }

      const userInfo = await user.findOneAndUpdate(
        { email },
        {
          $set: {
            lastLogin: Date.now(),
          },
          $setOnInsert: {
            name: `Guest-${uuid}`,
            email,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      const tokens = await genAuthToken(userInfo._id);

      res.status(200).json({
        message: 'User Login Successful.',
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
