import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [ROLES.SUPER_ADMIN, ROLES.COMPANY_OWNER, ROLES.STAFF, ROLES.CUSTOMER],
      default: ROLES.STAFF,
      index: true,
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'disabled'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    preferredLanguage: { type: String, default: 'en' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
