import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Store } from '../models/Store.js';
import { Plan } from '../models/Plan.js';
import { Currency } from '../models/Currency.js';
import { Country, State, City } from '../models/Locations.js';
import { PlatformCoupon } from '../models/PlatformCoupon.js';
import { StoreCoupon } from '../models/StoreCoupon.js';
import { EmailTemplate, NotificationTemplate } from '../models/Templates.js';
import {
  SystemSettings,
  BrandSettings,
  CurrencySettings,
  EmailSettings,
  PaymentGatewaySettings,
  StorageSettings,
  RecaptchaSettings,
  ChatGptSettings,
  CookieSettings,
  SeoSettings,
} from '../models/Settings.js';
import { Product, Category, Tax, Order, Customer, ShippingMethod, CompanyMessagingSettings } from '../models/ECommerce.js';
import { LandingPageConfig } from '../models/LandingBuilder.js';
import { ROLES, STORE_THEMES, EMAIL_TEMPLATE_VARS, NOTIFICATION_TEMPLATE_VARS } from '../config/constants.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsstore_saas';

export const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Store.deleteMany({}),
      Plan.deleteMany({}),
      Currency.deleteMany({}),
      Country.deleteMany({}),
      State.deleteMany({}),
      City.deleteMany({}),
      PlatformCoupon.deleteMany({}),
      StoreCoupon.deleteMany({}),
      EmailTemplate.deleteMany({}),
      NotificationTemplate.deleteMany({}),
      SystemSettings.deleteMany({}),
      BrandSettings.deleteMany({}),
      CurrencySettings.deleteMany({}),
      EmailSettings.deleteMany({}),
      PaymentGatewaySettings.deleteMany({}),
      StorageSettings.deleteMany({}),
      RecaptchaSettings.deleteMany({}),
      ChatGptSettings.deleteMany({}),
      CookieSettings.deleteMany({}),
      SeoSettings.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Tax.deleteMany({}),
      Order.deleteMany({}),
      Customer.deleteMany({}),
      ShippingMethod.deleteMany({}),
      CompanyMessagingSettings.deleteMany({}),
      LandingPageConfig.deleteMany({}),
    ]);

    console.log('[Seed] Existing collections cleared.');

    // 1. Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@whatsstore.io',
      password: 'admin123',
      role: ROLES.SUPER_ADMIN,
      emailVerified: true,
      status: 'active',
    });

    // 2. Create Plans
    const freeTrialPlan = await Plan.create({
      name: 'Free Trial',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Test all features risk-free for 14 days.',
      maxStores: 1,
      maxUsersPerStore: 2,
      maxProductsPerStore: 15,
      storageLimitGB: 1,
      trialDays: 14,
      features: { customDomain: false, customSubdomain: true, pwa: true, aiIntegration: false, shippingMethod: true, enableTrial: true },
      themes: ['theme-home-decor', 'theme-gadgets'],
      isActive: true,
      isDefault: false,
    });

    const proPlan = await Plan.create({
      name: 'Professional',
      monthlyPrice: 29,
      yearlyPrice: 279,
      description: 'Ideal for growing e-commerce boutiques and retail shops.',
      maxStores: 3,
      maxUsersPerStore: 5,
      maxProductsPerStore: 200,
      storageLimitGB: 10,
      trialDays: 0,
      features: { customDomain: true, customSubdomain: true, pwa: true, aiIntegration: true, shippingMethod: true, enableTrial: false },
      themes: [], // all themes allowed
      isActive: true,
      isDefault: true,
    });

    const enterprisePlan = await Plan.create({
      name: 'Enterprise Scale',
      monthlyPrice: 79,
      yearlyPrice: 759,
      description: 'Uncapped power for supermarket chains, multi-brand merchants, and global sellers.',
      maxStores: 15,
      maxUsersPerStore: 25,
      maxProductsPerStore: 5000,
      storageLimitGB: 100,
      trialDays: 0,
      features: { customDomain: true, customSubdomain: true, pwa: true, aiIntegration: true, shippingMethod: true, enableTrial: false },
      themes: [],
      isActive: true,
      isDefault: false,
    });

    // 3. Create Currencies
    await Currency.create([
      { name: 'Indian Rupee', code: 'INR', symbol: '₹', description: 'Indian Rupee', isDefault: true },
      { name: 'Euro', code: 'EUR', symbol: '€', description: 'European Euro', isDefault: false },
      { name: 'British Pound', code: 'GBP', symbol: '£', description: 'Pound Sterling', isDefault: false },
      { name: 'UAE Dirham', code: 'AED', symbol: 'د.إ', description: 'Emirati Dirham', isDefault: false },
    ]);

    // 4. Create Locations (Country -> State -> City)
    const usa = await Country.create({ name: 'United States', code: 'US', phoneCode: '+1', status: 'active' });
    const uk = await Country.create({ name: 'United Kingdom', code: 'GB', phoneCode: '+44', status: 'active' });
    const uae = await Country.create({ name: 'United Arab Emirates', code: 'AE', phoneCode: '+971', status: 'active' });

    const cal = await State.create({ countryId: usa._id, name: 'California', code: 'CA', status: 'active' });
    const ny = await State.create({ countryId: usa._id, name: 'New York', code: 'NY', status: 'active' });
    const tx = await State.create({ countryId: usa._id, name: 'Texas', code: 'TX', status: 'active' });

    await City.create([
      { countryId: usa._id, stateId: cal._id, name: 'Los Angeles', status: 'active' },
      { countryId: usa._id, stateId: cal._id, name: 'San Francisco', status: 'active' },
      { countryId: usa._id, stateId: ny._id, name: 'New York City', status: 'active' },
      { countryId: usa._id, stateId: tx._id, name: 'Austin', status: 'active' },
    ]);

    // 5. Create Platform Coupons
    await PlatformCoupon.create([
      {
        name: 'Launch Special 30% Off',
        code: 'LAUNCH30',
        discountType: 'percentage',
        discountValue: 30,
        minSpend: 20,
        totalLimit: 500,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        name: 'Flat $10 Off First Month',
        code: 'WELCOME10',
        discountType: 'flat',
        discountValue: 10,
        minSpend: 25,
        totalLimit: 1000,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active',
      }
    ]);

    // 6. Create Email & Notification Templates
    for (const [tplName, vars] of Object.entries(EMAIL_TEMPLATE_VARS)) {
      await EmailTemplate.create({
        name: tplName,
        senderName: 'WhatsStore Alerts',
        isSystem: true,
        dynamicVariables: vars,
        languages: [
          {
            lang: 'en',
            subject: `Update regarding {app_name}: ${tplName}`,
            body: `<p>Hello {customer_name},</p><p>This is an automated notification for your order {order_number} at {store_name}.</p><p>Total: {final_total}</p><p><a href="{order_url}">View Order Details</a></p>`,
          },
        ],
      });
    }

    for (const [tplName, vars] of Object.entries(NOTIFICATION_TEMPLATE_VARS)) {
      await NotificationTemplate.create({
        name: tplName,
        isEnabled: true,
        isSystem: true,
        dynamicVariables: vars,
        languages: [
          {
            lang: 'en',
            message: `[{company_name}] Order #{order_number} for {customer_name} received. Total: {final_total}. Track: {order_url}`,
          },
        ],
      });
    }

    // 7. System Settings
    await SystemSettings.create({ companyId: null, defaultLanguage: 'en', emailVerification: false, userRegistrationEnabled: true });
    await BrandSettings.create({ companyId: null, titleText: 'WhatsStore SaaS', themeColor: '#0284c7' });
    await CurrencySettings.create({ companyId: null, defaultCurrency: 'USD', symbol: '$' });
    await StorageSettings.create({ activeDriver: 'local' });
    await CookieSettings.create({});
    await SeoSettings.create({});
    await LandingPageConfig.create({});

    // 8. Create Demo Company
    const demoCompany = await Company.create({
      name: 'Luxe Brands Global',
      email: 'owner@luxeretail.com',
      phone: '+1 (555) 019-2834',
      planId: proPlan._id,
      planBillingCycle: 'yearly',
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      referralCode: 'WS-LUXE99',
      referralBalance: 120,
      totalCommissionEarned: 350,
      status: 'active',
      enableLogin: true,
    });

    // Create Company Owner User
    const ownerUser = await User.create({
      name: 'Elena Rostova',
      email: 'owner@luxeretail.com',
      password: 'owner123',
      role: ROLES.COMPANY_OWNER,
      companyId: demoCompany._id,
      emailVerified: true,
      status: 'active',
    });

    // Create Messaging Settings for Demo Company
    await CompanyMessagingSettings.create({
      companyId: demoCompany._id,
      codEnabled: true,
      whatsappEnabled: true,
      whatsappNumber: '+15552345678',
      telegramEnabled: false,
    });

    // 9. Create 7 Theme Stores under Demo Company
    const themeStoreConfigs = [
      {
        theme: 'theme-home-decor',
        name: 'Artisan Home & Living',
        slug: 'artisan-living',
        welcomeMessage: 'Discover hand-crafted modern minimalist furniture & ambient home decor.',
        categoryNames: ['Living Room', 'Lighting & Lamps', 'Ceramics & Vases', 'Bedding & Throws'],
        products: [
          {
            name: 'Nordic Oak Lounge Chair',
            sku: 'HOM-OAK-01',
            price: 249.00,
            salePrice: 219.00,
            coverImage: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Wood Finish', options: ['Natural Oak', 'Smoked Walnut', 'Black Ash'] }],
            description: 'Ergonomically contoured solid oak armchair with high-density linen upholstery.',
          },
          {
            name: 'Minimalist Brass Arc Floor Lamp',
            sku: 'LGT-ARC-02',
            price: 189.00,
            salePrice: 159.00,
            coverImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Metal', options: ['Brushed Brass', 'Matte Black'] }],
            description: 'Warm ambient LED curved floor standing lamp with marble counterweight base.',
          },
          {
            name: 'Handmade Matte Ceramic Vase Trio',
            sku: 'DEC-VAS-03',
            price: 65.00,
            salePrice: null,
            coverImage: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Colorway', options: ['Terracotta & Sand', 'Charcoal & Slate', 'Pure Alabaster'] }],
            description: 'Artisanal stoneware decorative vases designed for dried botanicals and pampas.',
          },
          {
            name: 'Washed French Linen Duvet Set',
            sku: 'BED-LIN-04',
            price: 145.00,
            salePrice: 129.00,
            coverImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Size', options: ['Queen', 'King', 'Cal King'] }, { name: 'Color', options: ['Sage Green', 'Warm Oat', 'Cloud White'] }],
            description: '100% natural pre-washed French flax linen that gets softer with every wash.',
          }
        ]
      },
      {
        theme: 'theme-gadgets',
        name: 'CyberTech Electronics',
        slug: 'cyber-tech',
        welcomeMessage: 'Flagship audiophile gear, mechanical keyboards & next-gen creator gadgets.',
        categoryNames: ['Audio & ANC', 'Keyboards & Desk', 'Smart Wearables', 'Power & Chargers'],
        products: [
          {
            name: 'AeroPulse Pro ANC Headphones',
            sku: 'AUD-ANC-90',
            price: 299.00,
            salePrice: 249.00,
            coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Color', options: ['Midnight Space Grey', 'Silver Frost', 'Matte Navy'] }],
            description: 'Hybrid active noise cancellation with 45-hour battery life and spatial lossless audio.',
          },
          {
            name: 'Apex 75% Custom Mechanical Keyboard',
            sku: 'KB-APX-75',
            price: 169.00,
            salePrice: null,
            coverImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Switch Type', options: ['Gateron Oil King (Linear)', 'Boba U4T (Tactile)', 'Kailh Box White (Clicky)'] }],
            description: 'CNC gasket-mounted aluminum body with hot-swappable sockets and RGB per-key underglow.',
          },
          {
            name: 'Ultra Titanium Smartwatch Series X',
            sku: 'WCH-TIT-01',
            price: 349.00,
            salePrice: 299.00,
            coverImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Band', options: ['Ocean Silicone', 'Alpine Loop', 'Milanese Mesh'] }],
            description: 'Sapphire crystal screen with dual-frequency GPS, ECG, and 100m water resistance.',
          }
        ]
      },
      {
        theme: 'theme-fashion',
        name: 'Maison Chic Apparel',
        slug: 'maison-chic',
        welcomeMessage: 'Effortless luxury & timeless seasonal wardrobe staples.',
        categoryNames: ['Outerwear', 'Dresses & Silks', 'Footwear', 'Bags & Accessories'],
        products: [
          {
            name: 'Double-Breasted Wool Trench Coat',
            sku: 'FSH-TRN-01',
            price: 320.00,
            salePrice: 285.00,
            coverImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Size', options: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Color', options: ['Camel Beige', 'Midnight Black'] }],
            description: 'Tailored 100% Italian virgin wool with belted waist and horn buttons.',
          },
          {
            name: 'Mulberry Silk Slip Dress',
            sku: 'FSH-SLK-02',
            price: 175.00,
            salePrice: 149.00,
            coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Size', options: ['S', 'M', 'L'] }, { name: 'Color', options: ['Champagne', 'Emerald Green', 'Wine Red'] }],
            description: 'Grade 6A 22-momme pure mulberry silk with subtle cowl neckline.',
          }
        ]
      },
      {
        theme: 'theme-bakery',
        name: 'Sweet Crust Artisan Bakery',
        slug: 'sweet-crust',
        welcomeMessage: 'Freshly baked sourdough, gourmet celebration cakes & French patisserie.',
        categoryNames: ['Custom Cakes', 'Sourdough & Breads', 'Croissants & Pastries', 'Dessert Boxes'],
        products: [
          {
            name: 'Triple Berry Velvet Tiered Cake',
            sku: 'BAK-CAK-01',
            price: 85.00,
            salePrice: 75.00,
            coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Size', options: ['6 inch (6-8 Servings)', '8 inch (12-16 Servings)', '10 inch (20-25 Servings)'] }],
            description: 'Vanilla sponge infused with raspberry coulis, layered with cream cheese frosting and organic berries.',
          },
          {
            name: 'Handcrafted Butter Croissant Box (6-Pack)',
            sku: 'BAK-CRS-02',
            price: 24.00,
            salePrice: null,
            coverImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Assortment', options: ['Classic Butter', 'Pain au Chocolat Mix', 'Almond Frangipane'] }],
            description: '72-hour fermented French AOP Normandy butter laminated croissants, baked fresh every morning.',
          }
        ]
      },
      {
        theme: 'theme-grocery',
        name: 'Green Harvest Supermarket',
        slug: 'green-harvest',
        welcomeMessage: 'Farm-fresh organic produce, dairy, bakery essentials & same-day delivery.',
        categoryNames: ['Organic Fruits', 'Farm Vegetables', 'Dairy & Eggs', 'Pantry & Grains'],
        products: [
          {
            name: 'Organic Farm Harvest Box (Seasonal 7kg)',
            sku: 'GRO-BOX-01',
            price: 38.00,
            salePrice: 32.00,
            coverImage: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Box Type', options: ['Mixed Fruit & Veg', 'All Veggie', 'All Fruit'] }],
            description: 'Handpicked heirloom tomatoes, organic avocados, kale, honeycrisp apples, and citrus.',
          },
          {
            name: 'Artisan Cold-Pressed Extra Virgin Olive Oil (1L)',
            sku: 'GRO-OIL-02',
            price: 22.00,
            salePrice: 19.50,
            coverImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Infusion', options: ['Classic Extra Virgin', 'Garlic & Rosemary', 'White Truffle'] }],
            description: 'Single-estate early harvest Greek Koroneiki olives, unrefined and unfiltered.',
          }
        ]
      },
      {
        theme: 'theme-car-accessories',
        name: 'Torque Automotive Pro',
        slug: 'torque-auto',
        welcomeMessage: 'Performance detailing, smart dash cams, LED retrofits & interior upgrades.',
        categoryNames: ['Dashcams & Tech', 'Interior & Mats', 'Car Care & Detailing', 'Exterior & Lights'],
        products: [
          {
            name: '4K Dual Channel GPS Dash Camera',
            sku: 'AUT-CAM-4K',
            price: 189.00,
            salePrice: 159.00,
            coverImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Storage', options: ['64GB High Endurance', '128GB High Endurance', '256GB High Endurance'] }],
            description: 'Front 4K + Rear 1080p Sony Starvis sensor with 24-hour parking surveillance mode.',
          },
          {
            name: 'Graphene Ceramic Shield Coating Kit (50ml)',
            sku: 'AUT-CRM-02',
            price: 79.00,
            salePrice: null,
            coverImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Kit Version', options: ['Standard Bottle Kit', 'Pro Applicator & Towels Pack'] }],
            description: '10H hardness graphene ceramic matrix offering 5+ years of hydrophobic gloss protection.',
          }
        ]
      },
      {
        theme: 'theme-toys',
        name: 'WonderKids Toy Land',
        slug: 'wonder-kids',
        welcomeMessage: 'Montessori educational toys, STEM robotics, wooden puzzles & creative play.',
        categoryNames: ['STEM & Science', 'Montessori Wooden', 'Building Blocks', 'Creative Arts'],
        products: [
          {
            name: 'Montessori Wooden Sensory Activity Board',
            sku: 'TOY-MON-01',
            price: 49.00,
            salePrice: 42.00,
            coverImage: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Theme', options: ['Space Adventure', 'Jungle Safari', 'Dinosaur World'] }],
            description: 'Natural beech wood toddler activity board developing fine motor skills, locks, and gears.',
          },
          {
            name: 'Magnetic Master Builder Blocks (120 Pcs)',
            sku: 'TOY-MAG-02',
            price: 55.00,
            salePrice: 48.00,
            coverImage: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&auto=format&fit=crop&q=80',
            variants: [{ name: 'Set Size', options: ['120 Pieces Standard', '200 Pieces Deluxe Mega'] }],
            description: 'BPA-free colorful translucent 3D magnetic geometric tiles with strong rivets.',
          }
        ]
      }
    ];

    // Seed Stores, Categories, Products, Taxes, Shipping, and Coupons for all 7 themes
    for (const conf of themeStoreConfigs) {
      const store = await Store.create({
        companyId: demoCompany._id,
        name: conf.name,
        slug: conf.slug,
        theme: conf.theme,
        welcomeMessage: conf.welcomeMessage,
        email: `contact@${conf.slug}.com`,
        logo: '',
        address: {
          street: '100 Market St',
          city: 'San Francisco',
          state: 'California',
          country: 'United States',
          postalCode: '94105',
        },
        socialLinks: {
          whatsapp: '+15552345678',
          instagram: 'https://instagram.com',
          facebook: 'https://facebook.com',
        },
        whatsappWidget: {
          enabled: true,
          phoneNumber: '+15552345678',
          defaultMessage: `Hi! I want to inquire about products in ${conf.name}.`,
          position: 'bottom-right',
          showOnMobile: true,
          showOnDesktop: true,
        },
        status: 'active',
      });

      // Tax rule for store
      const tax = await Tax.create({
        companyId: demoCompany._id,
        storeId: store._id,
        name: 'Sales Tax (8%)',
        rate: 8,
        priority: 1,
        status: 'active',
      });

      // Shipping methods for store
      const standardShipping = await ShippingMethod.create({
        companyId: demoCompany._id,
        storeId: store._id,
        name: 'Standard Courier Delivery',
        type: 'Flat Rate',
        cost: 9.99,
        estimatedDeliveryTime: '2-4 Business Days',
        status: 'active',
        zones: { zoneType: 'Domestic', countries: ['United States'] },
      });

      await ShippingMethod.create({
        companyId: demoCompany._id,
        storeId: store._id,
        name: 'Express Next-Day Air',
        type: 'Express Delivery',
        cost: 19.99,
        estimatedDeliveryTime: '1 Business Day',
        status: 'active',
        zones: { zoneType: 'Domestic', countries: ['United States'] },
      });

      // Store coupon
      await StoreCoupon.create({
        companyId: demoCompany._id,
        storeId: store._id,
        name: 'Special Store 15% Off',
        code: 'SAVE15',
        discountType: 'percentage',
        discountValue: 15,
        minSpend: 50,
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'active',
      });

      // Categories
      const createdCategories = [];
      for (const catName of conf.categoryNames) {
        const cat = await Category.create({
          companyId: demoCompany._id,
          storeId: store._id,
          name: catName,
          slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          status: 'active',
        });
        createdCategories.push(cat);
      }

      // Products
      for (let i = 0; i < conf.products.length; i++) {
        const pConf = conf.products[i];
        const cat = createdCategories[i % createdCategories.length];
        await Product.create({
          companyId: demoCompany._id,
          storeId: store._id,
          name: pConf.name,
          slug: pConf.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${i + 1}`,
          sku: pConf.sku,
          categoryId: cat._id,
          taxId: tax._id,
          price: pConf.price,
          salePrice: pConf.salePrice,
          stockQuantity: 45,
          coverImage: pConf.coverImage,
          images: [pConf.coverImage],
          description: pConf.description,
          specifications: 'Premium build quality • 1 Year Warranty • Eco-friendly materials',
          details: 'Ships within 24 hours in secure, reinforced protective packaging.',
          variants: pConf.variants,
          soldCount: 12 + i * 5,
          isDisplay: true,
          status: 'active',
        });
      }
    }

    console.log('[Seed] Database successfully seeded with:');
    console.log('  - Super Admin: admin@whatsstore.io / admin123');
    console.log('  - Demo Company: owner@luxeretail.com / owner123');
    console.log('  - 7 Stores configured with unique themes, products, and categories!');

    return true;
  } catch (error) {
    console.error('[Seed Error]', error);
    return false;
  }
};

// If run directly via `node seeds/seedData.js`
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDatabase().then(() => process.exit(0));
}
