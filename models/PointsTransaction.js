import mongoose from 'mongoose';

const pointsTransactionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    amount: { type: Number, required: true, validate: Number.isInteger },
    reason: { type: String, required: true, trim: true },
    balanceAfter: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pointsTransactionSchema.index({ companyId: 1, createdAt: -1 });

export const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);