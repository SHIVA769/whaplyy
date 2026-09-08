import mongoose from 'mongoose';

const planRequestSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    duration: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    notes: { type: String, default: '' },
    requestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PlanRequest = mongoose.model('PlanRequest', planRequestSchema);
