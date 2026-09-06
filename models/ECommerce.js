import mongoose from 'mongoose';

// Category Schema (§7.2)
const categorySchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);
categorySchema.index({ storeId: 1, slug: 1 }, { unique: true });

// Tax Schema (§7.3)
const taxSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    rate: { type: Number, required: true, default: 0 },
    priority: { type: Number, default: 1 },
    isCompound: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true }
);

// Product Schema (§7.1 — 6 Tabs: General, Pricing, Inventory, Content, Variants, Advanced)
const productSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    
    // Tab 1: General
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    sku: { type: String, required: true, trim: true },
    badge: { type: String, default: '', trim: true, maxlength: 24 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax', default: null },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    isDisplay: { type: Boolean, default: true, index: true },

    // Tab 2: Pricing
    price: { type: Number, required: true },
    salePrice: { type: Number, default: null },

    // Tab 3: Inventory
    stockQuantity: { type: Number, required: true, default: 0 },
    isDownloadable: { type: Boolean, default: false },
    downloadableFile: { type: String, default: '' },

    // Tab 4: Content
    description: { type: String, default: '' },
    specifications: { type: String, default: '' },
    details: { type: String, default: '' },

    // Tab 5: Variants (e.g. Color: Red, Blue; Size: S, M, L)
    variants: [
      {
        name: { type: String, required: true }, // e.g. "Color" or "Size"
        options: [{ type: String, required: true }], // e.g. ["Black", "Silver", "Gold"]
      }
    ],
    hasVariants: { type: Boolean, default: false },

    // Tab 6: Advanced (Custom Fields)
    customFields: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      }
    ],

    soldCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active', index: true },
  },
  { timestamps: true }
);
productSchema.index({ storeId: 1, sku: 1 }, { unique: true });
productSchema.index({ storeId: 1, slug: 1 }, { unique: true });

// Customer Schema (§9)
const customerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    // Tab 1: Personal Info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    photo: { type: String, default: '' },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active', index: true },

    // Tab 2: Address
    billingAddress: {
      street: { type: String, default: '' },
      country: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    shippingAddress: {
      street: { type: String, default: '' },
      country: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },

    // Tab 3: Preferences
    communicationPreferences: {
      emailMarketing: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
    },
    preferredLanguage: { type: String, default: 'en' },
    customerGroup: { type: String, default: 'General' },

    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: { type: Date, default: null },
  },
  { timestamps: true }
);
customerSchema.index({ storeId: 1, email: 1 }, { unique: true });

// Shipping Method Schema (§11 — 3 Tabs: General, Shipping Zones, Advanced)
const shippingMethodSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    
    // Tab 1: General
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['Flat Rate', 'Free Shipping', 'Weight Based', 'Local Pickup', 'Express Delivery'], default: 'Flat Rate' },
    description: { type: String, default: '' },
    cost: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    estimatedDeliveryTime: { type: String, default: '2-4 Business Days' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },

    // Tab 2: Shipping Zones
    zones: {
      zoneType: { type: String, enum: ['Domestic', 'Global', 'Regional'], default: 'Domestic' },
      countries: [{ type: String }],
      postalCodeRange: { type: String, default: '' },
      maxDistanceKm: { type: Number, default: 0 },
    },

    // Tab 3: Advanced
    advanced: {
      maxWeightKg: { type: Number, default: 0 },
      maxDimensions: { type: String, default: '' }, // e.g. "50x40x30 cm"
      requireSignature: { type: Boolean, default: false },
      insuranceRequired: { type: Boolean, default: false },
      trackingAvailable: { type: Boolean, default: true },
      handlingFee: { type: Number, default: 0 },
    },

    // Performance Metrics
    metrics: {
      pageViews: { type: Number, default: 0 },
      orders30Days: { type: Number, default: 0 },
      deliveredOrders: { type: Number, default: 0 },
      avgDeliveryDays: { type: Number, default: 3 },
    }
  },
  { timestamps: true }
);

// Order Schema (§8)
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedVariant: { type: mongoose.Schema.Types.Mixed, default: null }, // e.g. { Color: "Black", Size: "M" }
    taxName: { type: String, default: '' },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, default: '' },

    items: [orderItemSchema],

    subtotal: { type: Number, required: true, default: 0 },
    taxTotal: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    couponCode: { type: String, default: '' },
    shippingMethodName: { type: String, default: 'Standard Shipping' },
    shippingMethodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod', default: null },

    shippingAddress: {
      street: { type: String, default: '' },
      country: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    billingAddress: {
      street: { type: String, default: '' },
      country: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },

    paymentMethod: { type: String, default: 'Cash on Delivery' }, // 'Cash on Delivery', 'WhatsApp', 'Telegram', 'Stripe', 'PayPal', 'Razorpay', 'Bank Transfer', etc.
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', index: true },
    fulfillmentStatus: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true },
    bankTransferReceipt: { type: String, default: '' },

    timeline: [
      {
        status: { type: String, required: true }, // 'Order Placed', 'Payment Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        completed: { type: Boolean, default: true },
      }
    ],

    whatsappPayload: { type: String, default: '' },
    isGuest: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// Company Messaging & Integration Settings (§16)
const companyMessagingSettingsSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true, index: true },
    
    // COD
    codEnabled: { type: Boolean, default: true },

    // WhatsApp
    whatsappEnabled: { type: Boolean, default: true },
    whatsappNumber: { type: String, default: '' },

    // Telegram
    telegramEnabled: { type: Boolean, default: false },
    telegramBotToken: { type: String, default: '' },
    telegramChatId: { type: String, default: '' },

    // Message Templates
    whatsappTemplate: {
      type: String,
      default: `*🛒 NEW ORDER: {order_no}*
Store: {store_name}
Customer: {customer_name}
Phone: {customer_phone}

*📦 Items:*
{items_summary}

*Subtotal:* {subtotal}
*Tax:* {tax_amount}
*Shipping:* {shipping_cost}
*Discount:* -{discount}
*💰 Final Total:* {final_total}

*📍 Shipping Address:*
{shipping_address}

Thank you for shopping with us!`,
    },
    telegramTemplate: {
      type: String,
      default: `🚨 *New Order Alert: {order_no}*
Store: {store_name}
Customer: {customer_name} ({customer_phone})
Total: {final_total}
Tracking: {order_tracking_url}`,
    },
    messageTemplate: {
      type: String,
      default: `*🛒 NEW ORDER: {order_no}*
Store: {store_name}
Customer: {customer_name}
Phone: {customer_phone}

*📦 Items:*
{item_variable}

*Subtotal:* ${'{sub_total}'}
*Tax:* ${'{total_tax}'}
*Shipping:* ${'{shipping_amount}'}
*Discount:* -${'{discount_amount}'}
*💰 Final Total:* ${'{final_total}'}

*📍 Shipping Address:*
{shipping_address}, {shipping_city}, {shipping_state}, {shipping_country} {shipping_postalcode}

Thank you for shopping with us!`,
    },
    itemVariableFormat: {
      type: String,
      default: `• {quantity}x {product_name} ({variant_name}) — ${'{item_total}'}`,
    },

    // Twilio SMS
    twilioEnabled: { type: Boolean, default: false },
    twilioSid: { type: String, default: '' },
    twilioAuthToken: { type: String, default: '' },
    twilioFromNumber: { type: String, default: '' },
    twilioEvents: {
      orderCreated: { type: Boolean, default: true },
      orderStatusUpdated: { type: Boolean, default: true },
      newCustomer: { type: Boolean, default: false },
    },

    // Email Notification Event Toggles
    emailEvents: {
      orderCreated: { type: Boolean, default: true },
      orderCreatedOwner: { type: Boolean, default: true },
      ownerStoreCreated: { type: Boolean, default: true },
      statusChange: { type: Boolean, default: true },
      userCreated: { type: Boolean, default: true },
    }
  },
  { timestamps: true }
);

// Webhook Configuration Schema (§16)
const webhookConfigSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    module: { type: String, required: true }, // 'orders', 'products', 'customers', 'stores'
    method: { type: String, enum: ['GET', 'POST'], default: 'POST' },
    url: { type: String, required: true },
    isActive: { type: Boolean, default: true, index: true },
    secret: { type: String, default: '' },
    logs: [
      {
        event: { type: String, required: true },
        status: { type: String, enum: ['success', 'failed'], default: 'success' },
        responseCode: { type: Number, default: 200 },
        attemptAt: { type: Date, default: Date.now },
        payloadSummary: { type: String, default: '' },
      }
    ],
  },
  { timestamps: true }
);

// Cart Session Schema (§4)
const cartSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        selectedVariant: { type: mongoose.Schema.Types.Mixed, default: null },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
      }
    ],
    couponCode: { type: String, default: '' },
    shippingMethodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod', default: null },
  },
  { timestamps: true }
);
cartSessionSchema.index({ sessionId: 1, storeId: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
export const Tax = mongoose.model('Tax', taxSchema);
export const Product = mongoose.model('Product', productSchema);
export const Customer = mongoose.model('Customer', customerSchema);
export const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
export const Order = mongoose.model('Order', orderSchema);
export const CompanyMessagingSettings = mongoose.model('CompanyMessagingSettings', companyMessagingSettingsSchema);
export const WebhookConfig = mongoose.model('WebhookConfig', webhookConfigSchema);
export const CartSession = mongoose.model('CartSession', cartSessionSchema);
