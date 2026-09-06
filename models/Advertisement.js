import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 240 },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    clicks: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const Advertisement = mongoose.model('Advertisement', advertisementSchema);
