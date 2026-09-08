import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    senderName: { type: String, default: 'WhatsStore Notification' },
    isSystem: { type: Boolean, default: true },
    languages: [
      {
        lang: { type: String, required: true, default: 'en' },
        subject: { type: String, required: true },
        body: { type: String, required: true }, // rich-text HTML with variables
      }
    ],
    dynamicVariables: [{ type: String }],
  },
  { timestamps: true }
);

const notificationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    isEnabled: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: true },
    languages: [
      {
        lang: { type: String, required: true, default: 'en' },
        message: { type: String, required: true }, // text with 160-char counter & dynamic variables
      }
    ],
    dynamicVariables: [{ type: String }],
  },
  { timestamps: true }
);

export const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
export const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);
