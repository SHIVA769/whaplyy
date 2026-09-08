import mongoose from 'mongoose';

const storeCouponSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    minSpend: { type: Number, default: 0 },
    maxSpend: { type: Number, default: 0 }, // 0 = unlimited
    perCouponLimit: { type: Number, default: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    totalSavings: { type: Number, default: 0 },
    uniqueUsersCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

storeCouponSchema.index({ storeId: 1, code: 1 }, { unique: true });

export const StoreCoupon = mongoose.model('StoreCoupon', storeCouponSchema);
