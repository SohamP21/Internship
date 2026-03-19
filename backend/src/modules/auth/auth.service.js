import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { ENV } from '../../config/env.js';

const generateToken = (id) =>
  jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

// ── Register ──────────────────────────────────────────────────
export const registerUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  await User.create({ name, email, password, role });

  return { message: 'Registration successful. You can now log in.' };
};


// ── Login ─────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken(user._id);

  return {
    token,
    user: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  };
};