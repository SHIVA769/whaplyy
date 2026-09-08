import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { PointsTransaction } from '../models/PointsTransaction.js';

export const adjustPoints = async (companyId, amount, reason) => {
  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error('Points adjustment must be a non-zero integer.');
  }

  if (!reason || typeof reason !== 'string') {
    throw new Error('Points adjustment reason is required.');
  }

  const session = await mongoose.startSession();

  try {
    let transaction;

    await session.withTransaction(async () => {
      const company = await Company.findOneAndUpdate(
        { _id: companyId, ...(amount < 0 ? { pointsBalance: { $gte: Math.abs(amount) } } : {}) },
        { $inc: { pointsBalance: amount } },
        { new: true, session }
      );

      if (!company) {
        const error = new Error(amount < 0 ? 'Insufficient coins - please top up.' : 'Company not found.');
        error.statusCode = amount < 0 ? 402 : 404;
        throw error;
      }

      [transaction] = await PointsTransaction.create(
        [{ companyId: company._id, amount, reason, balanceAfter: company.pointsBalance }],
        { session }
      );
    });

    return transaction;
  } finally {
    await session.endSession();
  }
};