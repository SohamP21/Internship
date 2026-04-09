import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { ENV } from '../../config/env.js';

const generateToken = (id) =>
  jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

// ── Register ──────────────────────────────────────────────────
export const registerUser = async ({ name, email, password, role, judgeAccessCode }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  if (role === 'judge') {
    if (!judgeAccessCode || judgeAccessCode !== ENV.JUDGE_ACCESS_CODE) {
      throw new ApiError(403, 'Invalid judge access code');
    }
  }

  await User.create({ name, email, password, role });

  return { message: 'Registration successful. You can now log in.' };
};


// ── Login ─────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  // Hardcoded single admin login (coordinator role)
  if (email === ENV.ADMIN_EMAIL && password === ENV.ADMIN_PASSWORD) {
    let admin = await User.findOne({ email: ENV.ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        name: ENV.ADMIN_NAME,
        email: ENV.ADMIN_EMAIL,
        password: ENV.ADMIN_PASSWORD,
        role: 'coordinator',
      });
    }

    const token = generateToken(admin._id);
    return {
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

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

export const updateMe = async (userId, { name }) => {
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updated) throw new ApiError(404, 'User not found');

  return {
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  };
};