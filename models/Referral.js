import mongoose from 'mongoose';

const referralSettingsSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: true },
    commissionPercentage: { type: Number, default: 15 },
    minThresholdAmount: { type: Number, default: 50 },
    guidelines: { type: String, default: 'Earn recurring commission on every company that subscribes using your referral link.' },
  },
  { timestamps: true }
);

const referredUserSchema = new mongoose.Schema(
  {
    referringCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    referredCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
    planPrice: { type: Number, default: 0 },
    commissionPercentage: { type: Number, default: 15 },
    totalCommissionEarned: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    history: [
      {
        amount: { type: Number, required: true },
        percentage: { type: Number, required: true },
        planName: { type: String, default: '' },
        date: { type: Date, default: Date.now },
        note: { type: String, default: 'Subscription Commission' },
      }
    ],
  },
  { timestamps: true }
);

const payoutRequestSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    paymentMethod: { type: String, default: 'Bank Transfer' },
    notes: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ReferralSettings = mongoose.model('ReferralSettings', referralSettingsSchema);
export const ReferredUser = mongoose.model('ReferredUser', referredUserSchema);
export const PayoutRequest = mongoose.model('PayoutRequest', payoutRequestSchema);
