import * as yup from 'yup';

export default class UserSchema {
  contactSchema = yup.object({
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

    email: yup
      .string()
      .trim()
      .lowercase()
      .email('Enter a Valid Email Address.')
      .matches(
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        'Enter a Valid Email Address.'
      )
      .required('Please Enter Your Email.')
      .max(100, 'Email Cannot Exceed 100 Characters.'),

    message: yup
      .string()
      .trim()
      .required('Please Enter Your Message.')
      .min(10, 'Message Must be at Least 10 Characters.')
      .max(1000, 'Message Cannot Exceed 1000 Characters.'),
  });
}
