import * as yup from 'yup';

export default class InvoiceSchema {
  generateInvoiceSchema = yup.object({
    payerId: yup.string().trim().required('Payer is required.'),

    recordIds: yup
      .array()
      .of(yup.string().trim().required('Invalid record ID.'))
      .min(1, 'Please select at least one record.')
      .required('Please select at least one record.'),
  });
}
