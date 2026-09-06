import mongoose from 'mongoose';

const planOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    orderDate: { type: Date, default: Date.now },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    duration: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    originalPrice: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Stripe' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    invoiceUrl: { type: String, default: '' },
    transactionId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const PlanOrder = mongoose.model('PlanOrder', planOrderSchema);
