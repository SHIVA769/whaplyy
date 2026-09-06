import mongoose from 'mongoose';

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true, index: true },
    phoneCode: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

const stateSchema = new mongoose.Schema(
  {
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

const citySchema = new mongoose.Schema(
  {
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const Country = mongoose.model('Country', countrySchema);
export const State = mongoose.model('State', stateSchema);
export const City = mongoose.model('City', citySchema);
