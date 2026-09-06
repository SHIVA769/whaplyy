export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMPANY_OWNER: 'company_owner',
  STAFF: 'staff',
  CUSTOMER: 'customer',
};

export const POINT_COSTS = {
  addProduct: 5,
  createStore: 20,
  sendCampaign: 10,
};

export const COIN_BUNDLES = [
  { id: 'starter', points: 1000, price: 9.99 },
  { id: 'growth', points: 5000, price: 39.99 },
];

export const REFERRAL_REWARD_POINTS = 100;
export const REFERRAL_COUPON_DISCOUNT_PERCENT = 20;

export const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { id: 'analytics', label: 'Analytics & Reports', actions: ['view', 'export'] },
  { id: 'users', label: 'Staff & Users', actions: ['view', 'create', 'edit', 'delete', 'toggle_status'] },
  { id: 'roles', label: 'Roles & Permissions', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'plans', label: 'Plans & Billing', actions: ['view', 'subscribe', 'request'] },
  { id: 'plan_requests', label: 'Plan Requests', actions: ['view', 'manage'] },
  { id: 'plan_orders', label: 'Plan Orders', actions: ['view'] },
  { id: 'settings', label: 'Settings', actions: ['view', 'edit'] },
  { id: 'referral', label: 'Referral Program', actions: ['view', 'request_payout', 'manage'] },
  { id: 'media', label: 'Media Library', actions: ['view', 'upload', 'delete'] },
  { id: 'stores', label: 'Store Management', actions: ['view', 'create', 'edit', 'delete', 'settings'] },
  { id: 'products', label: 'Products', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'categories', label: 'Categories', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'tax', label: 'Tax Rules', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'orders', label: 'Orders', actions: ['view', 'edit', 'delete', 'export'] },
  { id: 'customers', label: 'Customers', actions: ['view', 'create', 'edit', 'delete', 'export'] },
  { id: 'coupons', label: 'Store Coupons', actions: ['view', 'create', 'edit', 'delete', 'toggle'] },
  { id: 'shipping', label: 'Shipping Methods', actions: ['view', 'create', 'edit', 'delete'] },
  { id: 'express_checkout', label: 'Express Checkout', actions: ['view', 'manage'] },
  { id: 'webhooks', label: 'Webhooks', actions: ['view', 'create', 'edit', 'delete'] },
];

export const STORE_THEMES = [
  { id: 'theme-home-decor', name: 'Home Decor & Furniture', category: 'home', description: 'Warm earth tones, modern clean serif & sans typography, elegant cards' },
  { id: 'theme-gadgets', name: 'Gadgets & Electronics', category: 'electronics', description: 'Sleek dark/slate tech aesthetics, neon accent badges, specs comparison' },
  { id: 'theme-fashion', name: 'Fashion & Apparel', category: 'apparel', description: 'Editorial lookbook style, chic look, large imagery, size/color variant chips' },
  { id: 'theme-bakery', name: 'Bakery & Cakes', category: 'food', description: 'Warm pastel tones, appetizing cards, customizable cake options' },
  { id: 'theme-grocery', name: 'Supermarket & Grocery', category: 'grocery', description: 'Crisp green fresh UI, fast add-to-cart, badges for organic/fresh' },
  { id: 'theme-car-accessories', name: 'Car Accessories', category: 'automotive', description: 'Bold athletic/automotive styling, high contrast, technical specs' },
  { id: 'theme-toys', name: 'Toy & Kids', category: 'toys', description: 'Vibrant playful tones, rounded bubbly components, age group badges' },
  { id: 'theme-whatsapp-store', name: 'WhatsApp Store', category: 'whatsapp', description: 'Official WhatsApp green branding, full e-commerce homepage with categories, hero, and product grid' },
];

export const PAYMENT_GATEWAYS = [
  { id: 'bank_transfer', name: 'Bank Transfer', fields: [{ key: 'bank_details', label: 'Bank Details / Instructions', type: 'textarea' }] },
  { id: 'stripe', name: 'Stripe', fields: [{ key: 'publishable_key', label: 'Publishable Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'paypal', name: 'PayPal', fields: [{ key: 'mode', label: 'Mode (sandbox/live)', type: 'select', options: ['sandbox', 'live'] }, { key: 'client_id', label: 'Client ID', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'razorpay', name: 'Razorpay', fields: [{ key: 'key_id', label: 'Key ID', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'mercadopago', name: 'Mercado Pago', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'access_token', label: 'Access Token', type: 'password' }] },
  { id: 'paystack', name: 'Paystack', fields: [{ key: 'public_key', label: 'Public Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'flutterwave', name: 'Flutterwave', fields: [{ key: 'public_key', label: 'Public Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'paytabs', name: 'PayTabs', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'profile_id', label: 'Profile ID', type: 'text' }, { key: 'server_key', label: 'Server Key', type: 'password' }, { key: 'region', label: 'Region', type: 'text' }, { key: 'currency_codes', label: 'Currency Codes', type: 'text' }] },
  { id: 'skrill', name: 'Skrill', fields: [{ key: 'merchant_id', label: 'Merchant ID', type: 'text' }, { key: 'secret_word', label: 'Secret Word', type: 'password' }] },
  { id: 'coingate', name: 'CoinGate', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'api_token', label: 'API Token', type: 'password' }] },
  { id: 'payfast', name: 'Payfast', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'merchant_id', label: 'Merchant ID', type: 'text' }, { key: 'merchant_key', label: 'Merchant Key', type: 'password' }, { key: 'passphrase', label: 'Passphrase', type: 'password' }] },
  { id: 'tap', name: 'Tap', fields: [{ key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'xendit', name: 'Xendit', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }] },
  { id: 'paytr', name: 'PayTR', fields: [{ key: 'merchant_id', label: 'Merchant ID', type: 'text' }, { key: 'merchant_key', label: 'Merchant Key', type: 'password' }, { key: 'merchant_salt', label: 'Merchant Salt', type: 'password' }] },
  { id: 'mollie', name: 'Mollie', fields: [{ key: 'api_key', label: 'API Key', type: 'password' }] },
  { id: 'toyyibpay', name: 'toyyibPay', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'category_code', label: 'Category Code', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'benefit', name: 'Benefit', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'public_key', label: 'Public Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'iyzipay', name: 'Iyzipay', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'public_key', label: 'Public Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'aamarpay', name: 'Aamarpay', fields: [{ key: 'store_id', label: 'Store ID', type: 'text' }, { key: 'signature', label: 'Signature', type: 'password' }] },
  { id: 'midtrans', name: 'Midtrans', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'yookassa', name: 'YooKassa', fields: [{ key: 'shop_id', label: 'Shop ID', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'paiementpro', name: 'Paiement Pro', fields: [{ key: 'merchant_id', label: 'Merchant ID', type: 'text' }] },
  { id: 'cinetpay', name: 'CinetPay', fields: [{ key: 'site_id', label: 'Site ID', type: 'text' }, { key: 'api_key', label: 'API Key', type: 'password' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'payhere', name: 'PayHere', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'merchant_id', label: 'Merchant ID', type: 'text' }, { key: 'merchant_secret', label: 'Merchant Secret', type: 'password' }, { key: 'app_id', label: 'App ID', type: 'text' }, { key: 'app_secret', label: 'App Secret', type: 'password' }] },
  { id: 'fedapay', name: 'FedaPay', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'public_key', label: 'Public Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'authorizenet', name: 'AuthorizeNet', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'merchant_id', label: 'API Login ID', type: 'text' }, { key: 'transaction_key', label: 'Transaction Key', type: 'password' }] },
  { id: 'khalti', name: 'Khalti', fields: [{ key: 'public_key', label: 'Public Key', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
  { id: 'easebuzz', name: 'Easebuzz', fields: [{ key: 'environment', label: 'Environment (test/prod)', type: 'select', options: ['test', 'prod'] }, { key: 'merchant_key', label: 'Merchant Key', type: 'text' }, { key: 'salt_key', label: 'Salt Key', type: 'password' }] },
  { id: 'ozow', name: 'Ozow', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'site_key', label: 'Site Key', type: 'text' }, { key: 'private_key', label: 'Private Key', type: 'password' }, { key: 'api_key', label: 'API Key', type: 'password' }] },
  { id: 'cashfree', name: 'Cashfree', fields: [{ key: 'mode', label: 'Mode', type: 'select', options: ['sandbox', 'live'] }, { key: 'public_key', label: 'App ID', type: 'text' }, { key: 'secret_key', label: 'Secret Key', type: 'password' }] },
];

export const EMAIL_TEMPLATE_VARS = {
  'Order Created': ['{app_name}', '{order_name}', '{order_number}', '{order_url}', '{customer_name}', '{customer_email}', '{final_total}', '{store_name}', '{store_url}'],
  'Order Created For Owner': ['{app_name}', '{order_name}', '{order_number}', '{order_url}', '{owner_name}', '{customer_name}', '{final_total}', '{store_name}'],
  'Owner And Store Created': ['{app_name}', '{owner_name}', '{owner_email}', '{password}', '{store_name}', '{store_url}', '{login_url}'],
  'Status Change': ['{app_name}', '{order_number}', '{order_url}', '{old_status}', '{new_status}', '{customer_name}', '{store_name}'],
  'User Created': ['{app_name}', '{user_name}', '{user_email}', '{password}', '{login_url}', '{role_name}'],
};

export const NOTIFICATION_TEMPLATE_VARS = {
  'Order Created': ['{company_name}', '{store_name}', '{order_number}', '{customer_name}', '{final_total}', '{order_url}'],
  'Order Status Updated': ['{company_name}', '{store_name}', '{order_number}', '{new_status}', '{customer_name}'],
  'New Customer': ['{company_name}', '{store_name}', '{customer_name}', '{customer_phone}'],
};
