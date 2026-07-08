import * as yup from 'yup';

export default class UserSchema {
  contactSchema = yup.object({
    name: yup
      .string()
      .trim()
      .required('Please enter your name.')
      .min(3, 'Name must be at least 3 characters.')
      .max(50, 'Name cannot exceed 50 characters.')
      .matches(
        /^[A-Za-z\s.'-]+$/,
        'Name can only contain letters, spaces, apostrophes, periods, and hyphens.'
      ),

    email: yup
      .string()
      .trim()
      .lowercase()
      .email('Enter a valid email address.')
      .required('Please enter your email.')
      .max(100, 'Email cannot exceed 100 characters.'),

    message: yup
      .string()
      .trim()
      .required('Please enter your message.')
      .min(10, 'Message must be at least 10 characters.')
      .max(1000, 'Message cannot exceed 1000 characters.'),
  });
}
