import { Advertisement } from '../models/Advertisement.js';
import { Store } from '../models/Store.js';
import { Product, Category, Tax, Order, Customer, ShippingMethod, CompanyMessagingSettings } from '../models/ECommerce.js';
import { StoreCoupon } from '../models/StoreCoupon.js';
import { Subscriber, ContactInquiry, LandingPageConfig, CustomPage } from '../models/LandingBuilder.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { renderOrderMessage } from '../utils/templateEngine.js';
import { sendEmail } from '../services/mailer.js';
import { sendTwilioSms } from '../services/twilioService.js';
import { sendTelegramMessage } from '../services/telegramService.js';
import { dispatchWebhook } from '../services/webhookService.js';
import { generateOrderInvoicePDF } from '../services/pdfInvoiceService.js';
import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

// ==========================================
// 5.28 Public Storefront Endpoints
// ==========================================

const formatProductForStorefront = (product) => {
  const doc = product.toObject ? product.toObject() : { ...product };
  return {
    ...doc,
    _id: doc._id || doc.id,
    thumbnail: doc.coverImage || doc.thumbnail || '',
  };
};

export const getStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findFirst({ where: { slug, status: 'active' } });

    if (!store) {
      return sendError(res, 'Store not found or is currently inactive.', 404);
    }

    // Get company messaging settings for WhatsApp/Telegram/COD availability
    const [messaging, featuredCoupon, advertisements] = await Promise.all([
      prisma.companyMessagingSettings.findUnique({ where: { companyId: store.companyId } }),
      prisma.storeCoupon.findFirst({
        where: { storeId: store.id, status: 'active', endDate: { gte: new Date() } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.advertisement.findMany({
        where: {
          status: 'active',
          AND: [
            { OR: [{ startAt: null }, { startAt: { lte: new Date() } }] },
            { OR: [{ endAt: null }, { endAt: { gte: new Date() } }] },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return sendSuccess(res, {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        email: store.email,
        logo: store.logo,
        bannerImage: store.bannerImage,
        favicon: store.favicon,
        welcomeMessage: store.welcomeMessage,
        storeDescription: store.storeDescription,
        copyrightText: store.copyrightText,
        theme: store.theme || 'theme-home-decor',
        address: store.address,
        socialLinks: store.socialLinks,
        whatsappWidget: store.whatsappWidget,
        paymentSettings: {
          upiEnabled: store.paymentSettings?.upiEnabled ?? false,
          upiId: store.paymentSettings?.upiId || '',
          accountName: store.paymentSettings?.accountName || '',
          qrCodeImage: store.paymentSettings?.qrCodeImage || '',
          bankName: store.paymentSettings?.bankName || '',
          accountNumber: store.paymentSettings?.accountNumber || '',
          ifscCode: store.paymentSettings?.ifscCode || '',
        },
        pwaConfig: store.pwaConfig,
        customCSS: store.customCSS,
        customJS: store.customJS,
        isMaintenance: store.isMaintenance,
        featuredCoupon: featuredCoupon
          ? {
              code: featuredCoupon.code,
              discountType: featuredCoupon.discountType,
              discountValue: featuredCoupon.discountValue,
              description: featuredCoupon.description,
            }
          : null,
              advertisements: advertisements.map((ad) => ({
                id: ad.id,
                title: ad.title,
                description: ad.description,
                imageUrl: ad.imageUrl,
                linkUrl: ad.linkUrl,
              })),
      },
      paymentOptions: {
        codEnabled: messaging?.codEnabled ?? true,
        whatsappEnabled: messaging?.whatsappEnabled ?? true,
        whatsappNumber: messaging?.whatsappNumber || store.whatsappWidget?.phoneNumber || '',
        telegramEnabled: messaging?.telegramEnabled ?? false,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getStoreCatalog = async (req, res) => {
  try {
    const { slug } = req.params;
    const { category, search } = req.query;

    const store = await prisma.store.findFirst({ where: { slug, status: 'active' } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const categories = await prisma.category.findMany({
      where: { storeId: store.id, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });

    const productQuery = { storeId: store.id, status: 'active', isDisplay: true };

    if (category && category !== 'all') {
      const cat = categories.find((item) => item.slug === category || item.id === category);
      if (cat) productQuery.categoryId = cat.id;
    }

    if (search) {
      productQuery.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where: productQuery,
      include: { category: true, tax: true },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, {
      categories: categories.map((item) => ({ ...item, _id: item.id })),
      products: products.map(formatProductForStorefront),
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getProductQuickView = async (req, res) => {
  try {
    const { slug, productId } = req.params;
    const store = await prisma.store.findFirst({ where: { slug, status: 'active' } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id, status: 'active' },
      include: { category: true, tax: true },
    });
    if (!product) return sendError(res, 'Product not found.', 404);

    // Increment views count
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { viewsCount: product.viewsCount + 1 },
    });

    return sendSuccess(res, formatProductForStorefront({ ...updatedProduct, category: product.category, tax: product.tax }));
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const applyCoupon = async (req, res) => {
  try {
    const { slug } = req.params;
    const { code, subtotal = 0 } = req.body;

    if (!code) return sendError(res, 'Coupon code is required.', 400);

    const store = await prisma.store.findFirst({ where: { slug } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const coupon = await prisma.storeCoupon.findFirst({
      where: {
      storeId: store.id,
      code: code.toUpperCase().trim(),
      status: 'active',
      endDate: { gte: new Date() },
      },
    });

    if (!coupon) {
      return sendError(res, 'Invalid or expired coupon code.', 400);
    }

    if (coupon.minSpend > 0 && subtotal < coupon.minSpend) {
      return sendError(res, `Minimum spend of $${coupon.minSpend} required to use this coupon.`, 400);
    }

    if (coupon.maxSpend > 0 && subtotal > coupon.maxSpend) {
      return sendError(res, `Maximum eligible spend for this coupon is $${coupon.maxSpend}.`, 400);
    }

    if (coupon.perCouponLimit > 0 && coupon.usedCount >= coupon.perCouponLimit) {
      return sendError(res, 'This coupon has reached its maximum usage limit.', 400);
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return sendSuccess(res, {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discountAmount.toFixed(2)),
      description: coupon.description,
    }, 'Coupon applied successfully!');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getStoreShippingMethods = async (req, res) => {
  try {
    const { slug } = req.params;
    const store = await prisma.store.findFirst({ where: { slug, status: 'active' } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const shippingMethods = await prisma.shippingMethod.findMany({
      where: { storeId: store.id, status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    return sendSuccess(res, shippingMethods);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * 3-Step Storefront Checkout Processor
 */
export const checkoutStoreOrder = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      contactInfo, // { firstName, lastName, email, phone, street, country, state, city, postalCode }
      items = [],
      shippingMethodId,
      couponCode,
      paymentMethod = 'WhatsApp',
      notes = '',
      isGuest = false,
    } = req.body;

    const store = await prisma.store.findFirst({ where: { slug, status: 'active' } });
    if (!store) return sendError(res, 'Store not found.', 404);

    if (paymentMethod === 'UPI' && (!store.paymentSettings?.upiEnabled || !store.paymentSettings?.upiId)) {
      return sendError(res, 'UPI payments are not enabled for this store.', 400);
    }

    if (!items || items.length === 0) {
      return sendError(res, 'Cart is empty.', 400);
    }

    if (!contactInfo?.firstName || !contactInfo?.email) {
      return sendError(res, 'First name and email are required for checkout.', 400);
    }

    // 1. Calculate items subtotal and tax
    let subtotal = 0;
    let taxTotal = 0;
    const processedItems = [];
    const products = await Promise.all(
      items.map((item) =>
        prisma.product.findFirst({
          where: { id: item.productId, storeId: store.id, status: 'active' },
          include: { tax: true },
        })
      )
    );

    const missingProductIndex = products.findIndex((product) => !product);
    if (missingProductIndex !== -1) {
      return sendError(res, `Product '${items[missingProductIndex]?.productId || 'unknown'}' is no longer available in this store.`, 400);
    }

    for (const [index, item] of items.entries()) {
      const product = products[index];

      const itemPrice = product.salePrice !== null && product.salePrice > 0 ? product.salePrice : product.price;
      const quantity = Math.max(1, item.quantity || 1);
      const lineSubtotal = itemPrice * quantity;
      subtotal += lineSubtotal;

      let itemTaxRate = 0;
      let itemTaxName = '';
      if (product.tax) {
        itemTaxRate = product.tax.rate || 0;
        itemTaxName = product.tax.name || 'Tax';
      }
      const itemTaxAmount = (lineSubtotal * itemTaxRate) / 100;
      taxTotal += itemTaxAmount;

      processedItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        image: product.coverImage,
        price: itemPrice,
        quantity,
        selectedVariant: item.selectedVariant == null ? Prisma.JsonNull : item.selectedVariant,
        taxName: itemTaxName,
        taxRate: itemTaxRate,
        taxAmount: itemTaxAmount,
        lineTotal: lineSubtotal + itemTaxAmount,
      });

      // Decrement stock & increment sold count
      await prisma.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: Math.max(0, product.stockQuantity - quantity),
          soldCount: (product.soldCount || 0) + quantity,
        },
      });
    }

    // 2. Shipping Cost
    let shippingCost = 0;
    let shippingName = 'Standard Shipping';
    if (shippingMethodId) {
      const shipping = await prisma.shippingMethod.findFirst({
        where: { id: shippingMethodId, storeId: store.id, status: 'active' },
      });
      if (shipping) {
        shippingCost = shipping.cost || 0;
        shippingName = shipping.name;
      }
    }

    // 3. Coupon Discount
    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.storeCoupon.findFirst({
        where: {
        storeId: store.id,
        code: couponCode.toUpperCase().trim(),
        status: 'active',
        },
      });
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.min(discount, subtotal);
        await prisma.storeCoupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: (coupon.usedCount || 0) + 1,
            totalSavings: (coupon.totalSavings || 0) + discount,
          },
        });
      }
    }

    const total = Math.max(0, subtotal + taxTotal + shippingCost - discount);
    const orderNumber = `WS-${Date.now().toString(36).toUpperCase()}`;

    // 4. Create or update Customer record
    let customer = await prisma.customer.findUnique({
      where: { storeId_email: { storeId: store.id, email: contactInfo.email.toLowerCase() } },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId: store.companyId,
          storeId: store.id,
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName?.trim() || 'Customer',
          email: contactInfo.email.toLowerCase(),
          phone: contactInfo.phone || '',
          shippingAddress: {
            street: contactInfo.street || '',
            country: contactInfo.country || '',
            state: contactInfo.state || '',
            city: contactInfo.city || '',
            postalCode: contactInfo.postalCode || '',
          },
          totalOrders: 1,
          totalSpent: total,
          lastOrderAt: new Date(),
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: (customer.totalOrders || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + total,
          lastOrderAt: new Date(),
        },
      });
    }

    // 5. Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        companyId: store.companyId,
        storeId: store.id,
        customerId: customer.id,
        customerName: `${contactInfo.firstName} ${contactInfo.lastName || ''}`.trim(),
        customerEmail: contactInfo.email.toLowerCase(),
        customerPhone: contactInfo.phone || '',
        items: { create: processedItems },
        subtotal,
        taxTotal,
        shippingCost,
        discount,
        total,
        couponCode: couponCode || '',
        shippingMethodName: shippingName,
        shippingMethodId: shippingMethodId || null,
        shippingAddress: {
          street: contactInfo.street || '',
          country: contactInfo.country || '',
          state: contactInfo.state || '',
          city: contactInfo.city || '',
          postalCode: contactInfo.postalCode || '',
        },
        billingAddress: {
          street: contactInfo.street || '',
          country: contactInfo.country || '',
          state: contactInfo.state || '',
          city: contactInfo.city || '',
          postalCode: contactInfo.postalCode || '',
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Delivery' || paymentMethod === 'WhatsApp' || paymentMethod === 'Bank Transfer' || paymentMethod === 'UPI' ? 'pending' : 'paid',
        fulfillmentStatus: 'pending',
        timeline: [
          {
            status: 'Order Placed',
            timestamp: new Date().toISOString(),
            note: `Order placed via ${paymentMethod} on ${store.name}`,
            completed: true,
          },
        ],
        isGuest,
        notes,
      },
      include: { items: true },
    });

    // 6. Generate WhatsApp & Telegram message payload
    const messaging = await prisma.companyMessagingSettings.findUnique({ where: { companyId: store.companyId } });
    const orderUrl = `${process.env.APP_URL || 'http://localhost:5173'}/store/${store.slug}/orders/${order.orderNumber}`;

    const formattedOrderData = {
      storeName: store.name,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      total: order.total,
      orderUrl,
      appName: 'WhatsStore',
    };

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const productImages = processedItems
      .map((item) => item.image)
      .filter(Boolean)
      .map((image) => (/^https?:\/\//i.test(image) ? image : image.startsWith('/') ? `${appUrl}${image}` : ''))
      .filter(Boolean);
    const paymentDetails = paymentMethod === 'UPI' && store.paymentSettings?.upiEnabled
      ? [
          '',
          'UPI PAYMENT DETAILS',
          `UPI ID: ${store.paymentSettings.upiId}`,
          store.paymentSettings.accountName ? `Account Name: ${store.paymentSettings.accountName}` : '',
          store.paymentSettings.qrCodeImage && /^https?:\/\//i.test(store.paymentSettings.qrCodeImage)
            ? `UPI QR: ${store.paymentSettings.qrCodeImage}`
            : '',
        ].filter(Boolean).join('\n')
      : '';
    const bankDetails = store.paymentSettings?.bankName || store.paymentSettings?.accountNumber || store.paymentSettings?.ifscCode
      ? [
          '',
          'BANK TRANSFER DETAILS',
          store.paymentSettings.bankName ? `Bank: ${store.paymentSettings.bankName}` : '',
          store.paymentSettings.accountName ? `Account Name: ${store.paymentSettings.accountName}` : '',
          store.paymentSettings.accountNumber ? `Account Number: ${store.paymentSettings.accountNumber}` : '',
          store.paymentSettings.ifscCode ? `IFSC: ${store.paymentSettings.ifscCode}` : '',
        ].filter(Boolean).join('\n')
      : '';

    const whatsappMessage = renderOrderMessage({
      template: messaging?.messageTemplate || '',
      itemFormat: messaging?.itemVariableFormat || '',
      orderData: formattedOrderData,
      items: processedItems,
      channel: 'whatsapp',
    }) + (productImages.length ? `\n\nPRODUCT IMAGES\n${productImages.join('\n')}` : '') + paymentDetails + bankDetails;

    order.whatsappPayload = whatsappMessage;
    await prisma.order.update({ where: { id: order.id }, data: { whatsappPayload: whatsappMessage } });

    // Generate WhatsApp direct chat link
    const targetPhone = messaging?.whatsappNumber || store.whatsappWidget?.phoneNumber || '';
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const whatsappChatUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMessage)}`;

    // Dispatch async notifications if enabled
    if (messaging?.telegramEnabled && messaging?.telegramBotToken) {
      const telegramHtml = renderOrderMessage({
        template: messaging.messageTemplate,
        itemFormat: messaging.itemVariableFormat,
        orderData: formattedOrderData,
        items: processedItems,
        channel: 'telegram',
      });
      sendTelegramMessage({ companyId: store.companyId, messageHtml: telegramHtml });
    }

    if (messaging?.twilioEnabled && order.customerPhone) {
      sendTwilioSms({
        companyId: store.companyId,
        to: order.customerPhone,
        message: `Hi ${order.customerName}, your order #${order.orderNumber} ($${order.total.toFixed(2)}) has been placed successfully at ${store.name}! Track here: ${orderUrl}`,
      });
    }

    // Send customer order confirmation email
    sendEmail({
      to: order.customerEmail,
      subject: `Order Confirmation #${order.orderNumber} — ${store.name}`,
      html: `<h2>Thank you for your order!</h2><p>Your order #${order.orderNumber} for $${order.total.toFixed(2)} has been received.</p><p><a href="${orderUrl}">Click here to view your order details</a></p>`,
      companyId: store.companyId,
    });

    dispatchWebhook({
      companyId: store.companyId,
      module: 'orders',
      event: 'order.created',
      payload: { orderNumber: order.orderNumber, total: order.total, customer: order.customerName, itemsCount: processedItems.length },
    });

    return sendSuccess(
      res,
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.fulfillmentStatus,
          paymentStatus: order.paymentStatus,
          invoiceUrl: `/api/storefront/${store.slug}/orders/${order.orderNumber}/invoice`,
        },
        whatsappChatUrl,
        whatsappMessage,
      },
      'Order placed successfully!',
      201
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return sendError(res, error.message, 500);
  }
};

export const confirmStorefrontPayment = async (req, res) => {
  try {
    const { slug, orderNumber } = req.params;
    const store = await prisma.store.findFirst({ where: { slug, status: 'active' } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const order = await prisma.order.findFirst({ where: { orderNumber, storeId: store.id } });
    if (!order) return sendError(res, 'Order not found.', 404);
    if (order.paymentMethod !== 'UPI') return sendError(res, 'This order does not use UPI payment.', 400);
    if (order.paymentStatus === 'paid') return sendSuccess(res, order, 'Payment is already confirmed.');

    const timeline = Array.isArray(order.timeline) ? order.timeline : [];
    timeline.push({
      status: 'Payment Confirmed',
      timestamp: new Date().toISOString(),
      note: 'UPI payment marked as paid by the customer. Merchant verification is still recommended.',
      completed: true,
    });
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'paid', timeline },
    });

    await prisma.notification.create({
      storeId: store.id,
      companyId: store.companyId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `${order.customerName} confirmed UPI payment of ₹${Number(order.total || 0).toFixed(2)} for order #${order.orderNumber}. Please verify in your bank/UPI app before fulfilling.`,
      orderId: order.id,
    });

    return sendSuccess(res, updatedOrder, 'UPI payment confirmation received.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const trackPublicOrder = async (req, res) => {
  try {
    const { slug, orderNumber } = req.params;
    const store = await prisma.store.findFirst({ where: { slug } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const order = await prisma.order.findFirst({
      where: { storeId: store.id, orderNumber },
      include: { items: true, shippingMethod: true },
    });
    if (!order) return sendError(res, 'Order not found with that order number.', 404);

    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const downloadPublicOrderInvoice = async (req, res) => {
  try {
    const { slug, orderNumber } = req.params;
    const store = await prisma.store.findFirst({ where: { slug } });
    if (!store) return sendError(res, 'Store not found.', 404);

    const order = await prisma.order.findFirst({
      where: { storeId: store.id, orderNumber },
      include: { items: true },
    });
    if (!order) return sendError(res, 'Order not found.', 404);

    generateOrderInvoicePDF(order, store, res);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// Public Landing Page & Leads
// ==========================================
export const getPublicLandingPage = async (req, res) => {
  try {
    const config = await LandingPageConfig.findOne();
    return sendSuccess(res, config);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getPublicCustomPage = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await CustomPage.findOne({ slug, isActive: true });
    if (!page) return sendError(res, 'Page not found.', 404);
    return sendSuccess(res, page);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const subscribeNewsletterPublic = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email address is required.', 400);

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      existing.status = 'subscribed';
      await existing.save();
      return sendSuccess(res, null, 'You are already subscribed! Updated preference.');
    }

    await Subscriber.create({ email: email.toLowerCase() });
    return sendSuccess(res, null, 'Thank you for subscribing to our newsletter!', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const submitContactInquiryPublic = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return sendError(res, 'Name, email, and message are required.', 400);
    }

    const inquiry = await ContactInquiry.create({
      name,
      email: email.toLowerCase(),
      subject: subject || 'General Inquiry',
      message,
    });

    return sendSuccess(res, inquiry, 'Your message has been sent successfully. We will be in touch shortly.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
