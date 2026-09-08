import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true }, // null = platform default
    defaultLanguage: { type: String, default: 'en' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    timeFormat: { type: String, default: '12-hour' },
    calendarStartDay: { type: String, default: 'monday' },
    defaultTimezone: { type: String, default: 'UTC' },
    emailVerification: { type: Boolean, default: false },
    landingPageEnabled: { type: Boolean, default: true },
    userRegistrationEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const brandSettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    darkLogo: { type: String, default: '' },
    lightLogo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    titleText: { type: String, default: 'WhatsStore SaaS' },
    footerText: { type: String, default: '© 2026 WhatsStore SaaS. All rights reserved.' },
    themeColor: { type: String, default: '#0284c7' }, // 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | hex
    sidebarVariant: { type: String, enum: ['inset', 'floating', 'minimal'], default: 'inset' },
    sidebarStyle: { type: String, enum: ['plain', 'colored', 'gradient'], default: 'plain' },
    layoutDirection: { type: String, enum: ['ltr', 'rtl'], default: 'ltr' },
    themeMode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  },
  { timestamps: true }
);

const currencySettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    defaultCurrency: { type: String, default: 'INR' },
    symbol: { type: String, default: '₹' },
    decimalPlaces: { type: Number, default: 2 },
    symbolPosition: { type: String, enum: ['before', 'after'], default: 'before' },
    decimalSeparator: { type: String, default: '.' },
    thousandsSeparator: { type: String, default: ',' },
    showDecimals: { type: Boolean, default: true },
    addSpace: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const emailSettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    provider: { type: String, default: 'smtp' },
    mailDriver: { type: String, default: 'smtp' },
    host: { type: String, default: 'smtp.mailtrap.io' },
    port: { type: Number, default: 587 },
    username: { type: String, default: '' },
    password: { type: String, default: '' }, // encrypted
    encryption: { type: String, enum: ['none', 'tls', 'ssl'], default: 'tls' },
    fromAddress: { type: String, default: 'noreply@whatsstore.io' },
    fromName: { type: String, default: 'WhatsStore SaaS' },
  },
  { timestamps: true }
);

const paymentGatewaySettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true }, // null = platform super admin
    gateway: { type: String, required: true, index: true },
    isEnabled: { type: Boolean, default: false },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }, // Encrypted secret values
  },
  { timestamps: true }
);
paymentGatewaySettingsSchema.index({ companyId: 1, gateway: 1 }, { unique: true });

const storageSettingsSchema = new mongoose.Schema(
  {
    activeDriver: { type: String, enum: ['local', 's3', 'wasabi'], default: 'local' },
    localConfig: {
      allowedFileTypes: { type: [String], default: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'zip'] },
      maxUploadSizeKB: { type: Number, default: 5120 }, // 5MB
    },
    s3Config: {
      accessKeyId: { type: String, default: '' },
      secretAccessKey: { type: String, default: '' },
      region: { type: String, default: 'us-east-1' },
      bucket: { type: String, default: '' },
      url: { type: String, default: '' },
      endpoint: { type: String, default: '' },
      allowedFileTypes: { type: [String], default: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'zip'] },
      maxUploadSizeKB: { type: Number, default: 10240 },
    },
    wasabiConfig: {
      accessKey: { type: String, default: '' },
      secretKey: { type: String, default: '' },
      region: { type: String, default: 'us-east-1' },
      bucket: { type: String, default: '' },
      url: { type: String, default: '' },
      rootPath: { type: String, default: '' },
      allowedFileTypes: { type: [String], default: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'zip'] },
      maxUploadSizeKB: { type: Number, default: 10240 },
    }
  },
  { timestamps: true }
);

const recaptchaSettingsSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: false },
    version: { type: String, enum: ['v2', 'v3'], default: 'v2' },
    siteKey: { type: String, default: '' },
    secretKey: { type: String, default: '' },
  },
  { timestamps: true }
);

const chatGptSettingsSchema = new mongoose.Schema(
  {
    apiKey: { type: String, default: '' }, // Encrypted
    modelName: { type: String, default: 'gpt-3.5-turbo' },
  },
  { timestamps: true }
);

const cookieSettingsSchema = new mongoose.Schema(
  {
    enableLogging: { type: Boolean, default: true },
    title: { type: String, default: 'We value your privacy' },
    description: { type: String, default: 'We use cookies to improve your shopping experience, analyze site performance, and power WhatsApp ordering.' },
    contactDescription: { type: String, default: 'Have questions regarding our cookie practices?' },
    contactUrl: { type: String, default: '/contact' },
    strictlyNecessaryTitle: { type: String, default: 'Strictly Necessary Cookies' },
    strictlyNecessaryDescription: { type: String, default: 'Essential for cart state, session authentication, and secure checkout.' },
  },
  { timestamps: true }
);

const cookieLogSchema = new mongoose.Schema(
  {
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    acceptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const seoSettingsSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, default: 'WhatsStore — Multi-Tenant WhatsApp Store Builder' },
    metaDescription: { type: String, default: 'Build and launch high-converting WhatsApp e-commerce stores with multiple themes, custom domains, and automated order notifications.' },
    metaKeywords: { type: String, default: 'whatsapp store, whatsapp ecommerce, saas, online shop, cart, checkout' },
    metaImage: { type: String, default: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200' },
  },
  { timestamps: true }
);

export const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export const BrandSettings = mongoose.model('BrandSettings', brandSettingsSchema);
export const CurrencySettings = mongoose.model('CurrencySettings', currencySettingsSchema);
export const EmailSettings = mongoose.model('EmailSettings', emailSettingsSchema);
export const PaymentGatewaySettings = mongoose.model('PaymentGatewaySettings', paymentGatewaySettingsSchema);
export const StorageSettings = mongoose.model('StorageSettings', storageSettingsSchema);
export const RecaptchaSettings = mongoose.model('RecaptchaSettings', recaptchaSettingsSchema);
export const ChatGptSettings = mongoose.model('ChatGptSettings', chatGptSettingsSchema);
export const CookieSettings = mongoose.model('CookieSettings', cookieSettingsSchema);
export const CookieLog = mongoose.model('CookieLog', cookieLogSchema);
export const SeoSettings = mongoose.model('SeoSettings', seoSettingsSchema);
