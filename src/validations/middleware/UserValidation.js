import UserSchema from '../schema/UserSchema.js';
import { ValidationError } from 'yup';

const schema = new UserSchema();

export default class UserValidation {
  contactRequest = async (req, res, next) => {
    try {
      await schema.contactSchema.validate(req.body, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };

  otpRequest = async (req, res, next) => {
    try {
      await schema.emailSchema.validate(req.params, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };

  loginRequest = async (req, res, next) => {
    try {
      await schema.otpSchema.validate(req.body, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}
