import * as yup from 'yup';

export default class RecordSchema {
  addRecordSchema = yup.object({
    date: yup
      .date()
      .required('Date is Required.')
      .typeError('Please Select a Valid Date.'),

    payerId: yup.string().trim().required('Please Select a Payer.'),

    category: yup
      .string()
      .oneOf(
        [
          'Bills & Utilities',
          'Food & Dining',
          'Medicine & Healthcare',
          'Money Transfer',
          'Shopping',
          'Travel & Transport',
          'Income or Cashback',
          'Fuel',
          'Grocerry',
          'Entertelment & Subscription',
          'Investment',
          'Others',
        ],
        'Please Select a Valid Category.'
      )
      .required('Category is Required.'),

    spendAmount: yup
      .number()
      .typeError('Spend Amount Must be a Number.')
      .min(0, 'Spend Amount Cannot be Negative.')
      .required('Spend Amount is Required.'),

    originalAmount: yup
      .number()
      .typeError('Original Amount Must be a Number.')
      .min(0, 'Original Amount Cannot be Negative.')
      .required('Original Amount is Required.'),

    dueAmount: yup
      .number()
      .typeError('Due Amount Must be a Number.')
      .min(0, 'Due Amount Cannot be Negative.')
      .required('Due Amount is Required.'),

    status: yup
      .string()
      .oneOf(['paid', 'non-paid'], 'Please Select a Valid Status.')
      .required('Status is Required.'),

    description: yup.string().trim().required('Status is Required.'),
  });
}
