import axios from 'axios';

import otp from '../models/otpModel.js';
import user from '../models/userModel.js';
import otpGenerator from '../utils/genOtp.js';
import genAuthToken from '../utils/tokenGenerator.js';
import oauth2Client from '../utils/googleClient.js';

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

  google = async (req, res, next) => {
    try {
      const googleCode = req.query.code;

      if (!googleCode) {
        res.status(404);
        throw new Error('No Authentication Code Found.');
      }

      const googleResponse = await oauth2Client.getToken(googleCode);
      oauth2Client.setCredentials(googleResponse.tokens);

      const userResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`
      );

      const email = userResponse.data.email;
      const userInfo = await user.findOneAndUpdate(
        { email },
        {
          $set: {
            lastLogin: Date.now(),
          },
          $setOnInsert: {
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
        message: 'Google Login Successful.',
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
