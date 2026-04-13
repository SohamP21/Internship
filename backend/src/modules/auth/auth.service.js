import jwt from 'jsonwebtoken';
import User from '../users/user.model.js';
import ApiError from '../../utils/ApiError.js';
import { ENV } from '../../config/env.js';
import { sendRegistrationWelcomeEmail } from '../../services/email/mailNotifications.js';
import { saveUserAvatarFromDataUrl } from '../../utils/saveUserAvatar.js';

const generateToken = (id) =>
  jwt.sign({ id }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

const normalizeEmail = (e) => (e || '').trim().toLowerCase();

export const getUserByIdPublic = async (userId) => {
  const doc = await User.findById(userId);
  if (!doc) throw new ApiError(404, 'User not found');
  return toPublicUser(doc);
};

export const toPublicUser = (userDoc) => {
  const u = userDoc?.toObject ? userDoc.toObject() : userDoc;
  if (!u) return null;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? '',
    gender: u.gender ?? '',
    collegeName: u.collegeName ?? '',
    avatarUrl: u.avatarUrl ?? '',
  };
};

// ── Register ──────────────────────────────────────────────────
export const registerUser = async ({
  name,
  email,
  password,
  role,
  judgeAccessCode,
  phone,
  collegeName,
  gender,
  profilePhoto,
}) => {
  if (normalizeEmail(email) === normalizeEmail(ENV.ADMIN_EMAIL)) {
    throw new ApiError(
      403,
      'This email is reserved for the coordinator account. Sign in with the admin password instead of registering.'
    );
  }

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  if (role === 'judge') {
    if (!judgeAccessCode || judgeAccessCode !== ENV.JUDGE_ACCESS_CODE) {
      throw new ApiError(403, 'Invalid judge access code');
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone: phone != null ? String(phone).trim() : '',
    collegeName: collegeName != null ? String(collegeName).trim() : '',
    ...(gender ? { gender } : {}),
  });

  if (profilePhoto && String(profilePhoto).trim()) {
    try {
      const avatarUrl = await saveUserAvatarFromDataUrl(user._id, profilePhoto);
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save();
      }
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      throw err instanceof ApiError ? err : new ApiError(400, err?.message || 'Invalid profile photo');
    }
  }

  sendRegistrationWelcomeEmail({ name, email, role }).catch((err) => {
    console.error('[email] registration welcome failed (user still registered):', err?.message || err);
  });

  return { message: 'Registration successful. You can now log in.' };
};


// ── Login ─────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  const adminEmail = normalizeEmail(ENV.ADMIN_EMAIL);
  const adminPassword = String(ENV.ADMIN_PASSWORD ?? '');

  // Hardcoded coordinator “admin” login (validated body email is already lowercased by Zod)
  if (normalizeEmail(email) === adminEmail && password === adminPassword) {
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: ENV.ADMIN_NAME,
        email: adminEmail,
        password: adminPassword,
        role: 'coordinator',
      });
    } else {
      // Same email may exist as participant/judge from an old register — always promote to coordinator for admin login
      if (admin.role !== 'coordinator') {
        admin.role = 'coordinator';
        await admin.save();
      }
    }

    const token = generateToken(admin._id);
    return {
      token,
      user: toPublicUser(admin),
    };
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const token = generateToken(user._id);

  return {
    token,
    user: toPublicUser(user),
  };
};

export const updateMe = async (userId, { name }) => {
  return updateProfile(userId, { name });
};

export const updateProfile = async (userId, body) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (body.name !== undefined) user.name = body.name;
  if (body.phone !== undefined) user.phone = String(body.phone).trim();
  if (body.gender !== undefined) user.gender = body.gender;
  if (body.collegeName !== undefined) user.collegeName = String(body.collegeName).trim();

  if (body.profilePhoto !== undefined && String(body.profilePhoto).trim()) {
    const avatarUrl = await saveUserAvatarFromDataUrl(user._id, body.profilePhoto);
    if (avatarUrl) user.avatarUrl = avatarUrl;
  }

  await user.save();
  return toPublicUser(user);
};