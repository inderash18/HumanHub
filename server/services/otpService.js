import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';

export async function checkOTP(email, type, otp, consume = false) {
  if (typeof email !== 'string' || !['register', 'forgot_password'].includes(type) ||
      !/^\d{6}$/.test(String(otp || ''))) return null;
  const record = await OTP.findOneAndUpdate({
    email: email.toLowerCase().trim(), type,
    expiresAt: { $gt: new Date() },
    $or: [{ failedAttempts: { $lt: 5 } }, { failedAttempts: { $exists: false } }]
  }, { $inc: { failedAttempts: 1 } }, { new: true });
  if (!record || !(await bcrypt.compare(String(otp), record.otpHash))) return null;
  if (!consume) return record;
  return OTP.findOneAndDelete({
    _id: record._id, otpHash: record.otpHash, expiresAt: { $gt: new Date() }
  });
}
