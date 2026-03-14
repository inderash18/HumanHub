import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object().shape({
  username: yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed')
    .required('Username is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export const postSchema = yup.object().shape({
  title: yup.string().min(2).max(300).required('Provide a title for your post'),
  body: yup.string().min(10, 'Your genuine human post requires a little more volume than 10 chars.').required('Body is required'),
  communityId: yup.string().required('You must select a community to post in')
});
