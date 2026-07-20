import PayerSchema from '../schema/PayerSchema.js'
import { ValidationError } from 'yup';

const schema = new PayerSchema();

export default class FormValidation {
  addPayerRequest = async (req, res, next) => {
    try {
      await schema.payerSchema.validate(req.body, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}
