import * as yup from 'yup';

export default class PayerSchema {
  payerSchema = yup.object({
    name: yup
      .string()
      .trim()
      .required('Please Enter Your Name.')
      .min(3, 'Name Must be at Least 3 Characters.')
      .max(50, 'Name Cannot Exceed 50 Characters.')
      .matches(
        /^[A-Za-z\s.'-]+$/,
        'Name Can Only Contain Letters, Spaces, Apostrophes, Periods, and Hyphens.'
      ),

    mobile: yup
      .string()
      .trim()
      .required('Please Enter Your Mobile Number.')
      .matches(
        /^(?!1234567890$)(?!9876543210$)[6-9]\d{9}$/,
        'Enter a Valid 10-Digit Mobile Number.'
      ),
  });
}
