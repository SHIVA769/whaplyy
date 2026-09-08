import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    companyId: { type: String, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    email: { type: String, default: '' },
    logo: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    favicon: { type: String, default: '' },
    welcomeMessage: { type: String, default: 'Welcome to our store! Discover premium products & order instantly via WhatsApp.' },
    storeDescription: { type: String, default: '' },
    copyrightText: { type: String, default: '© WhatsStore. All rights reserved.' },
    theme: { type: String, default: 'theme-home-decor' }, // 'theme-home-decor' | 'theme-gadgets' | 'theme-fashion' | 'theme-bakery' | 'theme-grocery' | 'theme-car-accessories' | 'theme-toys' | 'theme-whatsapp-store'
    
    // Address
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },

    // Social Links
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' },
    },

    // Domain Configuration
    domainConfig: {
      customDomainEnabled: { type: Boolean, default: false },
      customDomain: { type: String, default: '' },
      customSubdomainEnabled: { type: Boolean, default: false },
      customSubdomain: { type: String, default: '' },
    },

    // PWA Configuration
    pwaConfig: {
      enabled: { type: Boolean, default: false },
      appName: { type: String, default: '' },
      shortName: { type: String, default: '' },
      appDescription: { type: String, default: '' },
      themeColor: { type: String, default: '#0284c7' },
      backgroundColor: { type: String, default: '#ffffff' },
      displayMode: { type: String, enum: ['standalone', 'fullscreen', 'minimal-ui', 'browser'], default: 'standalone' },
      orientation: { type: String, enum: ['portrait', 'landscape', 'any'], default: 'portrait' },
    },

    // WhatsApp Floating Widget
    whatsappWidget: {
      enabled: { type: Boolean, default: true },
      phoneNumber: { type: String, default: '' },
      defaultMessage: { type: String, default: 'Hi! I have a question about your products on the store.' },
      position: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
      showOnMobile: { type: Boolean, default: true },
      showOnDesktop: { type: Boolean, default: true },
    },

    // Store-owner payment instructions for manual UPI payments
    paymentSettings: {
      upiEnabled: { type: Boolean, default: false },
      upiId: { type: String, default: '' },
      accountName: { type: String, default: '' },
      qrCodeImage: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
    },

    // Advanced & Security
    customCSS: { type: String, default: '', maxLength: 50000 },
    customJS: { type: String, default: '', maxLength: 50000 },
    isMaintenance: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const Store = mongoose.model('Store', storeSchema);
