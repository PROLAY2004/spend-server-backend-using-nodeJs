import { ValidationError } from 'yup';

import PayerSchema from '../schema/PayerSchema.js';
import RecordSchema from '../schema/RecordSchema.js';

const payer = new PayerSchema();
const record = new RecordSchema();
export default class FormValidation {
  addPayerRequest = async (req, res, next) => {
    try {
      await payer.payerSchema.validate(req.body, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };

  addLedgerRequest = async (req, res, next) => {
    try {
      await record.addRecordSchema.validate(req.body, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };

  bulkLedgerRequest = async (req, res, next) => {
    try {
      await record.bulkActionSchema.validate(req.body, {
        abortEarly: true, // don't return all validation errors
        stripUnknown: true, // remove unexpected fields
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}
