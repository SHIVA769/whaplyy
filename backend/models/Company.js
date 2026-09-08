import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null, index: true },
    planBillingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    planExpiresAt: { type: Date, default: null },
    isTrialActive: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
    enableLogin: { type: Boolean, default: true },
    storageUsedBytes: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    referralBalance: { type: Number, default: 0 },
    totalCommissionEarned: { type: Number, default: 0 },
    pointsBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Company = mongoose.model('Company', companySchema);
