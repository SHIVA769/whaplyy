import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, required: true, default: 0 }, // blank/0 can auto discount 20%
    description: { type: String, default: '' },
    maxStores: { type: Number, default: 1 },
    maxUsersPerStore: { type: Number, default: 2 },
    maxProductsPerStore: { type: Number, default: 20 },
    storageLimitGB: { type: Number, default: 1 },
    trialDays: { type: Number, default: 0 },
    features: {
      customDomain: { type: Boolean, default: false },
      customSubdomain: { type: Boolean, default: false },
      pwa: { type: Boolean, default: false },
      aiIntegration: { type: Boolean, default: false },
      shippingMethod: { type: Boolean, default: true },
      enableTrial: { type: Boolean, default: false },
    },
    themes: [{ type: String }], // Empty = all themes available
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', planSchema);
