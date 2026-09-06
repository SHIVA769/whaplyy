import mongoose from 'mongoose';

const platformCouponSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['flat', 'percentage'], required: true },
    discountValue: { type: Number, required: true },
    minSpend: { type: Number, default: 0 },
    maxSpend: { type: Number, default: 0 }, // 0 = unlimited
    totalLimit: { type: Number, default: 0 }, // 0 = unlimited
    userLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const PlatformCoupon = mongoose.model('PlatformCoupon', platformCouponSchema);
