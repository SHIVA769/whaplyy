import { Store } from '../models/Store.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Product, Category, Tax, Order, Customer, ShippingMethod, CompanyMessagingSettings, WebhookConfig } from '../models/ECommerce.js';
import { StoreCoupon } from '../models/StoreCoupon.js';
import { Plan } from '../models/Plan.js';
import { PlanRequest } from '../models/PlanRequest.js';
import { PlanOrder } from '../models/PlanOrder.js';
import { PlatformCoupon } from '../models/PlatformCoupon.js';
import { ReferredUser, PayoutRequest, ReferralSettings } from '../models/Referral.js';
import { SystemSettings, BrandSettings, CurrencySettings, EmailSettings } from '../models/Settings.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { encryptSecret, maskSecret } from '../utils/crypto.js';
import { generateOrderInvoicePDF } from '../services/pdfInvoiceService.js';
import { dispatchWebhook } from '../services/webhookService.js';
import { sendEmail } from '../services/mailer.js';
import { ROLES, PERMISSION_MODULES, STORE_THEMES } from '../config/constants.js';
import { prisma } from '../config/prisma.js';

// Helper to extract effective companyId
const getCompanyId = (req) => req.impersonatedCompanyId || req.effectiveCompanyId || req.user?.companyId;
const getAccessibleStoreIds = async (req) => {
  const companyId = getCompanyId(req);
  if (req.user?.role === ROLES.STAFF && req.user.storeId) {
    const store = await prisma.store.findFirst({ where: { id: req.user.storeId, companyId }, select: { id: true } });
    return store ? [store.id] : [];
  }
  const stores = await prisma.store.findMany({ where: { companyId }, select: { id: true } });
  return stores.map((store) => store.id);
};

const withLegacyId = (record) => ({ ...record, _id: record.id });

export const getCompanyNotifications = async (req, res) => {
  try {
    const { unread } = req.query;
    const where = { companyId: getCompanyId(req), storeId: { in: await getAccessibleStoreIds(req) } };
    if (unread === 'true') where.read = false;

    const notifications = await prisma.notification.findMany({
      where,
      include: { order: { select: { orderNumber: true, total: true, paymentMethod: true, paymentStatus: true, customerName: true, timeline: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return sendSuccess(res, notifications);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const markCompanyNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, storeId: { $in: await getAccessibleStoreIds(req) } },
      { read: true },
      { new: true }
    );
    if (!notification) return sendError(res, 'Notification not found.', 404);
    return sendSuccess(res, notification, 'Notification marked as read.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.15 Store Owner Dashboard
// ==========================================
export const getCompanyDashboardStats = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId } = req.query;

    const stores = await prisma.$queryRaw`
      SELECT *
      FROM "Store"
      WHERE CASE
        WHEN "companyId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN "companyId"::uuid
      END = ${companyId}::uuid
      ORDER BY "createdAt" DESC
    `;
    const accessibleStores = stores.map((store) => ({ ...store, _id: store.id }));
    const selectedStoreId = storeId && storeId !== 'all' ? storeId : null;
    const storeIds = selectedStoreId
      ? accessibleStores.filter((store) => store.id === selectedStoreId).map((store) => store.id)
      : accessibleStores.map((store) => store.id);
    const storeFilter = { storeId: { in: storeIds } };
    const currentStore = selectedStoreId ? accessibleStores.find((store) => store.id === selectedStoreId) : accessibleStores[0];

    const [orderCount, productCount, customerCount, revenueSummary, recentOrders, topProducts] = await Promise.all([
      prisma.order.count({ where: storeFilter }),
      prisma.product.count({ where: storeFilter }),
      prisma.customer.count({ where: storeFilter }),
      prisma.order.aggregate({ where: storeFilter, _sum: { total: true } }),
      prisma.order.findMany({
        where: storeFilter,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.product.findMany({
        where: storeFilter,
        orderBy: [{ soldCount: 'desc' }, { createdAt: 'desc' }],
        take: 5,
      }),
    ]);
    const totalRevenue = revenueSummary._sum.total || 0;
    const recentOrderData = recentOrders.map((order) => ({
      ...withLegacyId(order),
      customer: { name: order.customerName },
      pricing: { finalTotal: order.total },
      status: order.fulfillmentStatus,
    }));
    const topProductData = topProducts.map((product) => ({
      ...withLegacyId(product),
      salesCount: product.soldCount,
    }));

    return sendSuccess(res, {
      stores: accessibleStores,
      currentStore,
      summaryCards: {
        totalOrders: orderCount,
        totalProducts: productCount,
        totalCustomers: customerCount,
        totalSales: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        avgOrderValue: `$${(orderCount ? totalRevenue / orderCount : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      recentOrders: recentOrderData,
      topProducts: topProductData,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.16 Store Management
// ==========================================
export const getStores = async (req, res) => {
  try { 
    const companyId = getCompanyId(req);
    const stores = await prisma.store.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });

    const enriched = await Promise.all(
      stores.map(async (s) => {
        const [orderSummary, productCount, customerCount] = await Promise.all([
          prisma.order.aggregate({ where: { storeId: s.id }, _count: { _all: true }, _sum: { total: true } }),
          prisma.product.count({ where: { storeId: s.id } }),
          prisma.customer.count({ where: { storeId: s.id } }),
        ]);
        const summary = { orderCount: orderSummary._count._all, revenue: orderSummary._sum.total || 0 };
        return {
          ...withLegacyId(s),
          orderCount: summary.orderCount,
          revenue: `$${summary.revenue.toFixed(2)}`,
          productCount,
          customerCount,
        };
      })
    );

    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.status === 'active').length;
    const totalCustomers = await prisma.customer.count({ where: { companyId } });
    const revenueSummary = await prisma.order.aggregate({ where: { companyId }, _sum: { total: true } });
    const totalRevenue = revenueSummary._sum.total || 0;

    return sendSuccess(res, {
      stores: enriched,
      summaryCards: {
        totalStores,
        activeStores,
        totalCustomers,
        revenue: `$${totalRevenue.toFixed(2)}`,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createStore = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { name, slug, description, email, logo, bannerImage, theme, domainConfig, pwaConfig, welcomeMessage, storeDescription, address, socialLinks, paymentSettings } = req.body;

    if (!name) return sendError(res, 'Store name is required.', 400);

    const generatedSlug = slug ? slug.toLowerCase().trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.store.findUnique({ where: { slug: generatedSlug } });
    if (existing) return sendError(res, 'Store slug already in use. Please pick a unique slug.', 400);

    const store = await prisma.store.create({
      data: {
        companyId,
        name,
        slug: generatedSlug,
        description: description || '',
        email: email || '',
        logo: logo || '',
        bannerImage: bannerImage || '',
        theme: theme ? theme.replace(/-/g, '_') : 'theme_whatsapp_store',
        domainConfig: domainConfig || undefined,
        pwaConfig: pwaConfig || undefined,
        welcomeMessage: welcomeMessage || 'Welcome to our store! Discover premium products & order instantly via WhatsApp.',
        storeDescription: storeDescription || '',
        address: address || undefined,
        socialLinks: socialLinks || undefined,
        paymentSettings: paymentSettings || undefined,
        status: 'active',
      },
    });

    dispatchWebhook({
      companyId,
      module: 'stores',
      event: 'store.created',
      payload: { id: store.id, name: store.name, slug: store.slug, theme: store.theme },
    });

    return sendSuccess(res, withLegacyId(store), 'Store created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateStore = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const store = await Store.findOne({ _id: id, companyId });
    if (!store) return sendError(res, 'Store not found.', 404);

    Object.assign(store, req.body);
    await store.save();

    return sendSuccess(res, store, 'Store updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteStore = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    await Store.findOneAndDelete({ _id: id, companyId });
    await Product.deleteMany({ storeId: id });
    await Category.deleteMany({ storeId: id });
    await Order.deleteMany({ storeId: id });
    await Customer.deleteMany({ storeId: id });

    return sendSuccess(res, null, 'Store and related catalog deleted successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.17 Product Management (6 Tabs)
// ==========================================
export const getProducts = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, search, categoryId, status, page = 1, limit = 10 } = req.query;
    const where = { companyId };
    if (storeId && storeId !== 'all') where.storeId = storeId;
    if (categoryId && categoryId !== 'all') where.categoryId = categoryId;
    if (status && status !== 'all') where.status = status;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }];

    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const [total, products, allProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true, tax: true, store: true },
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * pageLimit,
        take: pageLimit,
      }),
      prisma.product.findMany({ where: { companyId }, select: { status: true, price: true, stockQuantity: true } }),
    ]);
    const normalizedProducts = products.map((product) => ({
      ...withLegacyId(product),
      category: product.category ? withLegacyId(product.category) : null,
      tax: product.tax ? withLegacyId(product.tax) : null,
      store: product.store ? withLegacyId(product.store) : null,
    }));

    // Summary cards
    const totalCount = allProducts.length;
    const activeCount = allProducts.filter((p) => p.status === 'active').length;
    const lowStockCount = allProducts.filter((p) => (p.stockQuantity || 0) <= 5).length;
    const totalInventoryValue = allProducts.reduce((sum, p) => sum + (p.price || 0) * (p.stockQuantity || 0), 0);

    return sendSuccess(
      res,
      {
        products: normalizedProducts,
        summaryCards: {
          totalProducts: totalCount,
          activeProducts: `${activeCount} (${totalCount ? Math.round((activeCount / totalCount) * 100) : 0}%)`,
          lowStock: lowStockCount,
          totalValue: `$${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      },
      'Products retrieved',
      200,
      { page: pageNumber, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) }
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createProduct = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const {
      storeId,
      name,
      sku,
      badge,
      categoryId,
      taxId,
      coverImage,
      thumbnail,
      images,
      isDisplay = true,
      price,
      salePrice,
      stockQuantity,
      isDownloadable,
      downloadableFile,
      description,
      specifications,
      details,
      variants,
      hasVariants,
      customFields,
      status,
    } = req.body;

    const store = storeId ? await prisma.store.findFirst({ where: { id: storeId, companyId } }) : null;
    if (!storeId || !store) {
      return sendError(res, 'A valid store is required before creating a product.', 400);
    }

    if (!name || !sku || price === undefined || stockQuantity === undefined) {
      return sendError(res, 'Name, SKU, Price, and Stock Quantity are required.', 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now().toString(36)}`;
    const imageUrl = coverImage || thumbnail || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800';

    const product = await prisma.product.create({
      data: {
        companyId,
        storeId,
        name,
        slug,
        sku,
        badge: badge || '',
        categoryId: categoryId || null,
        taxId: taxId || null,
        coverImage: imageUrl,
        images: images || [],
        isDisplay,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        stockQuantity: Number(stockQuantity),
        isDownloadable: !!isDownloadable,
        downloadableFile: downloadableFile || '',
        description: description || '',
        specifications: specifications || '',
        details: details || '',
        variants: variants || [],
        hasVariants: !!hasVariants,
        customFields: customFields || [],
        status: status || 'active',
      },
    });

    dispatchWebhook({
      companyId,
      module: 'products',
      event: 'product.created',
      payload: { id: product.id, name: product.name, sku: product.sku, price: product.price },
    });

    return sendSuccess(res, withLegacyId(product), 'Product created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const updates = { ...req.body };
    if (updates.storeId) {
      const store = await Store.findOne({ _id: updates.storeId, companyId });
      if (!store) {
        return sendError(res, 'Selected store does not belong to this merchant.', 400);
      }
    }

    if (updates.thumbnail && !updates.coverImage) {
      updates.coverImage = updates.thumbnail;
    }
    delete updates.thumbnail;

    const product = await Product.findOneAndUpdate({ _id: id, companyId }, updates, { new: true });
    if (!product) return sendError(res, 'Product not found.', 404);

    return sendSuccess(res, product, 'Product updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    await Product.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Product deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.17 Categories & Tax
// ==========================================
export const getCategories = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId } = req.query;
    const where = { companyId };
    if (storeId && storeId !== 'all') where.storeId = storeId;

    const categories = await prisma.category.findMany({ where, include: { parent: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });

    const enriched = await Promise.all(
      categories.map(async (c) => {
        const productCount = await prisma.product.count({ where: { categoryId: c.id } });
        return { ...withLegacyId(c), parentId: c.parent ? withLegacyId(c.parent) : null, productCount };
      })
    );

    const total = categories.length;
    const active = categories.filter((c) => c.status === 'active').length;
    const parentCount = categories.filter((c) => !c.parentId).length;
    const subCount = categories.filter((c) => !!c.parentId).length;

    return sendSuccess(res, {
      categories: enriched,
      summaryCards: {
        total,
        activeRate: `${active} (${total ? Math.round((active / total) * 100) : 0}%)`,
        parentCategories: parentCount,
        subCategories: subCount,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCategory = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, name, description, image, parentId, sortOrder, status } = req.body;
    if (!name || !storeId) return sendError(res, 'Store and Category name are required.', 400);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now().toString(36)}`;
    const category = await Category.create({
      companyId,
      storeId,
      name,
      slug,
      description,
      image,
      parentId: parentId || null,
      sortOrder: Number(sortOrder) || 0,
      status: status || 'active',
    });

    return sendSuccess(res, category, 'Category created.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const category = await Category.findOneAndUpdate({ _id: id, companyId }, req.body, { new: true });
    return sendSuccess(res, category, 'Category updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await Category.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Category deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getTaxes = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId } = req.query;
    const where = { companyId };
    if (storeId && storeId !== 'all') where.storeId = storeId;

    const taxes = await prisma.tax.findMany({ where, orderBy: { priority: 'asc' } });

    const enriched = await Promise.all(
      taxes.map(async (t) => {
        const productsCount = await prisma.product.count({ where: { taxId: t.id } });
        return { ...withLegacyId(t), productsUsingCount: productsCount };
      })
    );

    const total = taxes.length;
    const active = taxes.filter((t) => t.status === 'active').length;
    const avgRate = total ? (taxes.reduce((acc, t) => acc + t.rate, 0) / total).toFixed(1) : '0';

    return sendSuccess(res, {
      taxes: enriched,
      summaryCards: {
        totalRules: total,
        activeRate: `${active} (${total ? Math.round((active / total) * 100) : 0}%)`,
        averageRate: `${avgRate}%`,
        taxCollectedMonth: '$1,240.00',
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createTax = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    let { storeId, name, type, rate, priority, isCompound, status } = req.body;

    if (!storeId) {
      const firstStore = await Store.findOne({ companyId });
      if (firstStore) storeId = firstStore._id;
    }

    if (!name || !storeId || rate === undefined) return sendError(res, 'Store, Name, and Rate are required.', 400);

    const tax = await Tax.create({
      companyId,
      storeId,
      name,
      type: type || 'percentage',
      rate: Number(rate),
      priority: Number(priority) || 1,
      isCompound: !!isCompound,
      status: status || 'active',
    });

    return sendSuccess(res, tax, 'Tax rule created.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateTax = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const tax = await Tax.findOneAndUpdate({ _id: id, companyId }, req.body, { new: true });
    return sendSuccess(res, tax, 'Tax rule updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteTax = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await Tax.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Tax rule deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.18 Order Management
// ==========================================
export const getOrders = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, search, status, paymentMethod, page = 1, limit = 10 } = req.query;
    const query = { companyId };

    if (storeId && storeId !== 'all') query.storeId = storeId;
    if (status && status !== 'all') query.fulfillmentStatus = status;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('storeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Summary cards
    const allOrders = await Order.find({ companyId });
    const totalCount = allOrders.length;
    const pendingCount = allOrders.filter((o) => o.fulfillmentStatus === 'pending').length;
    const totalRev = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderVal = totalCount ? (totalRev / totalCount).toFixed(2) : '0.00';

    return sendSuccess(
      res,
      {
        orders,
        summaryCards: {
          totalOrders: totalCount,
          pendingOrders: pendingCount,
          totalRevenue: `$${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          avgOrderValue: `$${avgOrderVal}`,
        },
      },
      'Orders retrieved',
      200,
      { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, companyId }).populate('storeId customerId shippingMethodId');
    if (!order) return sendError(res, 'Order not found.', 404);

    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const { fulfillmentStatus, paymentStatus, note } = req.body;

    const order = await Order.findOne({ _id: id, companyId });
    if (!order) return sendError(res, 'Order not found.', 404);

    if (fulfillmentStatus) {
      order.fulfillmentStatus = fulfillmentStatus;
      order.timeline.push({
        status: `Status changed to ${fulfillmentStatus.toUpperCase()}`,
        timestamp: new Date(),
        note: note || `Order updated by staff`,
        completed: true,
      });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    dispatchWebhook({
      companyId,
      module: 'orders',
      event: 'order.updated',
      payload: { id: order._id, orderNumber: order.orderNumber, status: order.fulfillmentStatus, payment: order.paymentStatus },
    });

    return sendSuccess(res, order, 'Order updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const downloadOrderInvoice = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, companyId });
    if (!order) return sendError(res, 'Order not found.', 404);

    const store = await Store.findById(order.storeId);
    generateOrderInvoicePDF(order, store, res);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.19 Customer Management (3 Tabs)
// ==========================================
export const getCustomers = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, search, status, page = 1, limit = 10 } = req.query;
    const query = { companyId };

    if (storeId && storeId !== 'all') query.storeId = storeId;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .populate('storeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const allCust = await Customer.find({ companyId });
    const totalCount = allCust.length;
    const activeCount = allCust.filter((c) => c.status === 'active').length;
    const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newThisMonth = allCust.filter((c) => new Date(c.createdAt) >= thisMonth).length;
    const totalSpentAll = allCust.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrdersAll = allCust.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const avgOrderVal = totalOrdersAll ? (totalSpentAll / totalOrdersAll).toFixed(2) : '0.00';

    return sendSuccess(
      res,
      {
        customers,
        summaryCards: {
          totalCustomers: totalCount,
          activeRate: `${activeCount} (${totalCount ? Math.round((activeCount / totalCount) * 100) : 0}%)`,
          newThisMonth: `+${newThisMonth}`,
          avgOrderValue: `$${avgOrderVal}`,
        },
      },
      'Customers retrieved',
      200,
      { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCustomer = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    let {
      storeId,
      name,
      firstName,
      lastName,
      email,
      phone,
      photo,
      dob,
      gender,
      notes,
      status,
      billingAddress,
      shippingAddress,
      communicationPreferences,
      preferredLanguage,
      customerGroup,
    } = req.body;

    if (!storeId) {
      const firstStore = await Store.findOne({ companyId });
      if (firstStore) storeId = firstStore._id;
    }

    if (name && (!firstName || !lastName)) {
      const parts = name.trim().split(' ');
      firstName = firstName || parts[0] || 'Customer';
      lastName = lastName || parts.slice(1).join(' ') || '';
    }

    if (!firstName) firstName = name || 'Customer';
    if (lastName === undefined) lastName = '';

    if (!storeId || !email) {
      return sendError(res, 'Store and Email are required.', 400);
    }

    const customer = await Customer.create({
      companyId,
      storeId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone: phone || '',
      photo: photo || '',
      dob: dob || null,
      gender: gender || 'prefer_not_to_say',
      notes: notes || '',
      status: status || 'active',
      billingAddress: billingAddress || {},
      shippingAddress: shippingAddress || {},
      communicationPreferences: communicationPreferences || { emailMarketing: true, sms: true, orderUpdates: true },
      preferredLanguage: preferredLanguage || 'en',
      customerGroup: customerGroup || 'General',
    });

    return sendSuccess(res, customer, 'Customer created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.name && (!updateData.firstName || !updateData.lastName)) {
      const parts = updateData.name.trim().split(' ');
      updateData.firstName = parts[0] || 'Customer';
      updateData.lastName = parts.slice(1).join(' ') || '';
    }

    const customer = await Customer.findOneAndUpdate({ _id: id, companyId }, updateData, { new: true });
    return sendSuccess(res, customer, 'Customer updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await Customer.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Customer deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.20 Store Coupons (3 Tabs)
// ==========================================
export const getStoreCoupons = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, search, status } = req.query;
    const query = { companyId };
    if (storeId && storeId !== 'all') query.storeId = storeId;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];
    }

    const coupons = await StoreCoupon.find(query).sort({ createdAt: -1 });

    const total = coupons.length;
    const active = coupons.filter((c) => c.status === 'active').length;
    const percentage = coupons.filter((c) => c.discountType === 'percentage').length;
    const fixed = coupons.filter((c) => c.discountType === 'fixed').length;

    return sendSuccess(res, {
      coupons,
      summaryCards: {
        totalCoupons: total,
        activeRate: `${active} (${total ? Math.round((active / total) * 100) : 0}%)`,
        percentageCoupons: percentage,
        fixedCoupons: fixed,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createStoreCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, name, code, description, discountType, discountValue, startDate, endDate, minSpend, maxSpend, perCouponLimit, perUserLimit, status } = req.body;

    if (!storeId || !name || discountValue === undefined || !endDate) {
      return sendError(res, 'Store, Name, Discount Value, and End Date are required.', 400);
    }

    const generatedCode = code ? code.toUpperCase().trim() : `SAVE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const coupon = await StoreCoupon.create({
      companyId,
      storeId,
      name,
      code: generatedCode,
      description,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      minSpend: Number(minSpend) || 0,
      maxSpend: Number(maxSpend) || 0,
      perCouponLimit: Number(perCouponLimit) || 0,
      perUserLimit: Number(perUserLimit) || 0,
      status: status || 'active',
    });

    return sendSuccess(res, coupon, 'Store coupon created.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateStoreCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const coupon = await StoreCoupon.findOneAndUpdate({ _id: id, companyId }, req.body, { new: true });
    return sendSuccess(res, coupon, 'Store coupon updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteStoreCoupon = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await StoreCoupon.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Store coupon deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.21 Shipping Management (3 Tabs)
// ==========================================
export const getShippingMethods = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId } = req.query;
    const query = { companyId };
    if (storeId && storeId !== 'all') query.storeId = storeId;

    const methods = await ShippingMethod.find(query).sort({ sortOrder: 1 });

    const total = methods.length;
    const active = methods.filter((m) => m.status === 'active').length;
    const zonesCount = new Set(methods.map((m) => m.zones?.zoneType || 'Domestic')).size;
    const avgCost = total ? (methods.reduce((sum, m) => sum + (m.cost || 0), 0) / total).toFixed(2) : '0.00';

    return sendSuccess(res, {
      shippingMethods: methods,
      summaryCards: {
        shippingMethods: total,
        activeRate: `${active} (${total ? Math.round((active / total) * 100) : 0}%)`,
        shippingZones: zonesCount,
        avgShippingCost: `$${avgCost}`,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createShippingMethod = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { storeId, name, type, description, cost, minOrderAmount, estimatedDeliveryTime, sortOrder, status, zones, advanced } = req.body;

    if (!storeId || !name || !type) {
      return sendError(res, 'Store, Name, and Type are required.', 400);
    }

    const method = await ShippingMethod.create({
      companyId,
      storeId,
      name,
      type,
      description,
      cost: Number(cost) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      estimatedDeliveryTime: estimatedDeliveryTime || '2-4 Business Days',
      sortOrder: Number(sortOrder) || 0,
      status: status || 'active',
      zones: zones || {},
      advanced: advanced || {},
    });

    return sendSuccess(res, method, 'Shipping method created.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateShippingMethod = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const method = await ShippingMethod.findOneAndUpdate({ _id: id, companyId }, req.body, { new: true });
    return sendSuccess(res, method, 'Shipping method updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteShippingMethod = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await ShippingMethod.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Shipping method deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.22 Analytics & Reporting
// ==========================================
export const getAnalyticsData = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { range = '30d', storeId } = req.query;

    const query = { companyId };
    if (storeId && storeId !== 'all') query.storeId = storeId;

    const orders = await Order.find(query).sort({ createdAt: 1 });
    const customers = await Customer.find(query);
    const products = await Product.find(query).sort({ soldCount: -1 }).limit(5);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const conversionRate = '3.8%';

    // Group daily revenue for bar chart
    const dailyMap = {};
    orders.forEach((o) => {
      const day = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[day] = (dailyMap[day] || 0) + (o.total || 0);
    });

    const revenueOverview = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));
    if (revenueOverview.length === 0) {
      revenueOverview.push({ date: 'Today', revenue: 0 });
    }

    // Top customers
    const topCustomers = [...customers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 5);

    return sendSuccess(res, {
      summaryCards: {
        totalRevenue: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        totalOrders,
        totalCustomers,
        conversionRate,
      },
      revenueOverview,
      topSellingProducts: products.map((p) => ({ name: p.name, units: p.soldCount || 0, revenue: (p.soldCount || 0) * p.price })),
      topCustomers: topCustomers.map((c) => ({ name: `${c.firstName} ${c.lastName}`, orders: c.totalOrders || 0, spend: `$${(c.totalSpent || 0).toFixed(2)}` })),
      recentActivity: orders.slice(-5).reverse().map((o) => ({
        id: o._id,
        text: `Order #${o.orderNumber} placed for $${o.total.toFixed(2)} by ${o.customerName}`,
        time: o.createdAt,
      })),
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.23 Staff Management (Users & Roles)
// ==========================================
export const getStaffUsers = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const users = await User.find({ companyId, role: { $ne: ROLES.CUSTOMER } }).populate('roleId');
    return sendSuccess(res, users);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createStaffUser = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { name, email, password, roleId, role } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return sendError(res, 'User with this email already exists.', 400);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || ROLES.STAFF,
      roleId: roleId || null,
      companyId,
      status: 'active',
      emailVerified: true,
    });

    return sendSuccess(res, user, 'Staff member added successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateStaffUser = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const { name, roleId, status, password } = req.body;

    const user = await User.findOne({ _id: id, companyId });
    if (!user) return sendError(res, 'User not found.', 404);

    if (name) user.name = name;
    if (roleId !== undefined) user.roleId = roleId;
    if (status) user.status = status;
    if (password) user.password = password;

    await user.save();
    return sendSuccess(res, user, 'Staff user updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteStaffUser = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return sendError(res, 'You cannot delete your own user account.', 400);
    }

    await User.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Staff user deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getRoles = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const roles = await Role.find({ companyId }).populate('createdBy', 'name');
    return sendSuccess(res, {
      roles,
      permissionModules: PERMISSION_MODULES,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createRole = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { name, description, permissions } = req.body;

    if (!name) return sendError(res, 'Role name is required.', 400);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const role = await Role.create({
      name,
      slug,
      description,
      permissions: permissions || [],
      companyId,
      createdBy: req.user._id,
    });

    return sendSuccess(res, role, 'Role created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateRole = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    const role = await Role.findOneAndUpdate({ _id: id, companyId }, req.body, { new: true });
    return sendSuccess(res, role, 'Role updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteRole = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await Role.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Role deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.24 Plans & Billing (Company Side)
// ==========================================
export const getCompanyPlansData = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const [company, plans, requests, orders, stores, users, products] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, include: { plan: true } }),
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } }),
      prisma.planRequest.findMany({ where: { companyId }, include: { plan: true }, orderBy: { requestedAt: 'desc' } }),
      prisma.planOrder.findMany({ where: { companyId }, include: { plan: true }, orderBy: { createdAt: 'desc' } }),
      prisma.store.count({ where: { companyId } }),
      prisma.user.count({ where: { companyId } }),
      prisma.product.count({ where: { companyId } }),
    ]);

    return sendSuccess(res, {
      currentPlan: company?.plan ? withLegacyId(company.plan) : null,
      billingCycle: company?.planBillingCycle || 'monthly',
      expiresAt: company?.planExpiresAt || null,
      isTrialActive: company?.isTrialActive || false,
      plans: plans.map(withLegacyId),
      requests: requests.map((request) => ({ ...withLegacyId(request), plan: request.plan ? withLegacyId(request.plan) : null })),
      orders: orders.map((order) => ({ ...withLegacyId(order), plan: order.plan ? withLegacyId(order.plan) : null })),
      usage: { stores, users, products },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const submitPlanRequest = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { planId, duration = 'monthly', notes } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) return sendError(res, 'Plan not found.', 404);

    const price = duration === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

    const request = await PlanRequest.create({
      companyId,
      userId: req.user._id,
      planId,
      duration,
      price,
      notes: notes || '',
      status: 'pending',
    });

    return sendSuccess(res, request, 'Plan upgrade request submitted to administrator.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const subscribePlan = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { planId, duration = 'monthly', couponCode, paymentMethod = 'Stripe' } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) return sendError(res, 'Plan not found.', 404);

    let price = duration === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    let discount = 0;

    if (couponCode) {
      const coupon = await PlatformCoupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
      if (coupon && new Date(coupon.expiryDate) > new Date()) {
        if (coupon.discountType === 'percentage') {
          discount = (price * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();
      }
    }

    const finalPrice = Math.max(0, price - discount);

    const orderNumber = `ORD-PLN-${Date.now().toString(36).toUpperCase()}`;
    const order = await PlanOrder.create({
      orderNumber,
      companyId,
      userId: req.user._id,
      planId: plan._id,
      duration,
      originalPrice: price,
      couponCode: couponCode || '',
      discount,
      finalPrice,
      paymentMethod,
      paymentStatus: 'paid',
      status: 'approved',
    });

    const company = await Company.findById(companyId);
    company.planId = plan._id;
    company.planBillingCycle = duration;
    const days = duration === 'yearly' ? 365 : 30;
    company.planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    company.isTrialActive = false;
    await company.save();

    return sendSuccess(res, { order, company }, 'Plan subscription completed successfully!');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.25 Referral Program (Company Side)
// ==========================================
export const getCompanyReferralData = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const company = await Company.findById(companyId);
    const settings = await ReferralSettings.findOne() || { isEnabled: true, commissionPercentage: 15, minThresholdAmount: 50 };

    const referredUsers = await ReferredUser.find({ referringCompanyId: companyId }).populate('referredCompanyId planId');
    const payoutRequests = await PayoutRequest.find({ companyId }).sort({ requestedAt: -1 });

    const totalReferrals = referredUsers.length;
    const totalEarned = company.totalCommissionEarned || 0;
    const availableBalance = company.referralBalance || 0;

    return sendSuccess(res, {
      summaryCards: {
        totalReferrals,
        totalEarned: `$${totalEarned.toFixed(2)}`,
        availableBalance: `$${availableBalance.toFixed(2)}`,
        payoutRequestsCount: payoutRequests.length,
      },
      referralCode: company.referralCode,
      referralLink: `${process.env.APP_URL || 'http://localhost:5173'}/register?ref=${company.referralCode}`,
      referredUsers,
      payoutRequests,
      settings,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const requestPayout = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { amount, notes } = req.body;

    const company = await Company.findById(companyId);
    const settings = await ReferralSettings.findOne() || { minThresholdAmount: 50 };

    if (!amount || Number(amount) <= 0) {
      return sendError(res, 'Valid withdrawal amount is required.', 400);
    }

    if (Number(amount) < settings.minThresholdAmount) {
      return sendError(res, `Minimum withdrawal amount is $${settings.minThresholdAmount}.`, 400);
    }

    if (Number(amount) > (company.referralBalance || 0)) {
      return sendError(res, 'Withdrawal amount exceeds your available referral balance.', 400);
    }

    company.referralBalance -= Number(amount);
    await company.save();

    const payout = await PayoutRequest.create({
      companyId,
      amount: Number(amount),
      notes: notes || '',
      status: 'pending',
    });

    return sendSuccess(res, payout, 'Payout request submitted successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.26 Settings (Company Side)
// ==========================================
export const getCompanySettings = async (req, res) => {
  try {
    const companyId = getCompanyId(req);

    const system = await SystemSettings.findOne({ companyId }) || await SystemSettings.findOne({ companyId: null });
    const brand = await BrandSettings.findOne({ companyId }) || await BrandSettings.findOne({ companyId: null });
    const currency = await CurrencySettings.findOne({ companyId }) || await CurrencySettings.findOne({ companyId: null });
    const email = await EmailSettings.findOne({ companyId }) || await EmailSettings.findOne({ companyId: null });

    let messaging = await CompanyMessagingSettings.findOne({ companyId });
    if (!messaging) {
      messaging = await CompanyMessagingSettings.create({ companyId });
    }

    const webhooks = await WebhookConfig.find({ companyId });

    return sendSuccess(res, {
      system,
      brand,
      currency,
      email,
      messaging: {
        ...messaging.toObject(),
        twilioAuthToken: messaging.twilioAuthToken ? maskSecret(messaging.twilioAuthToken) : '',
        telegramBotToken: messaging.telegramBotToken ? maskSecret(messaging.telegramBotToken) : '',
      },
      webhooks,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getCompanyMessagingSettings = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    let messaging = await CompanyMessagingSettings.findOne({ companyId });
    if (!messaging) {
      messaging = await CompanyMessagingSettings.create({ companyId });
    }

    const webhook = await WebhookConfig.findOne({ companyId, module: 'orders' }) || await WebhookConfig.findOne({ companyId });

    return sendSuccess(res, {
      whatsappTemplate: messaging.whatsappTemplate || messaging.messageTemplate || '',
      telegramTemplate: messaging.telegramTemplate || '',
      twilio: {
        enabled: !!messaging.twilioEnabled,
        accountSid: messaging.twilioSid || '',
        authToken: messaging.twilioAuthToken ? maskSecret(messaging.twilioAuthToken) : '',
        fromPhone: messaging.twilioFromNumber || '',
      },
      telegramBot: {
        enabled: !!messaging.telegramEnabled,
        botToken: messaging.telegramBotToken ? maskSecret(messaging.telegramBotToken) : '',
        chatId: messaging.telegramChatId || '',
      },
      webhook: {
        enabled: webhook ? webhook.isActive : false,
        url: webhook ? webhook.url : '',
        secretKey: webhook ? (webhook.secret ? maskSecret(webhook.secret) : '') : '',
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCompanyMessagingSettings = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    let messaging = await CompanyMessagingSettings.findOne({ companyId });
    if (!messaging) messaging = new CompanyMessagingSettings({ companyId });

    const {
      whatsappTemplate,
      telegramTemplate,
      twilio,
      telegramBot,
      webhook,
    } = req.body;

    if (whatsappTemplate !== undefined) {
      messaging.whatsappTemplate = whatsappTemplate;
      messaging.messageTemplate = whatsappTemplate;
    }
    if (telegramTemplate !== undefined) {
      messaging.telegramTemplate = telegramTemplate;
    }

    if (twilio) {
      if (twilio.enabled !== undefined) messaging.twilioEnabled = twilio.enabled;
      if (twilio.accountSid !== undefined) messaging.twilioSid = twilio.accountSid;
      if (twilio.authToken && !twilio.authToken.includes('****')) {
        messaging.twilioAuthToken = encryptSecret(twilio.authToken);
      }
      if (twilio.fromPhone !== undefined) messaging.twilioFromNumber = twilio.fromPhone;
    }

    if (telegramBot) {
      if (telegramBot.enabled !== undefined) messaging.telegramEnabled = telegramBot.enabled;
      if (telegramBot.botToken && !telegramBot.botToken.includes('****')) {
        messaging.telegramBotToken = encryptSecret(telegramBot.botToken);
      }
      if (telegramBot.chatId !== undefined) messaging.telegramChatId = telegramBot.chatId;
    }

    // Direct field overrides if flat structure sent
    if (req.body.twilioAuthToken && !req.body.twilioAuthToken.includes('****')) {
      messaging.twilioAuthToken = encryptSecret(req.body.twilioAuthToken);
    }
    if (req.body.telegramBotToken && !req.body.telegramBotToken.includes('****')) {
      messaging.telegramBotToken = encryptSecret(req.body.telegramBotToken);
    }

    Object.assign(messaging, req.body);
    await messaging.save();

    if (webhook && webhook.url) {
      let wh = await WebhookConfig.findOne({ companyId, module: 'orders' });
      if (!wh) {
        wh = new WebhookConfig({ companyId, module: 'orders' });
      }
      wh.url = webhook.url;
      wh.isActive = webhook.enabled !== undefined ? webhook.enabled : true;
      if (webhook.secretKey && !webhook.secretKey.includes('****')) {
        wh.secret = webhook.secretKey;
      }
      await wh.save();
    }

    return sendSuccess(res, messaging, 'Messaging & Notification settings updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const sendCompanyTemplateEmail = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { to, message } = req.body;

    if (!to || !message) return sendError(res, 'Recipient email and message are required.', 400);

    const result = await sendEmail({
      companyId,
      to,
      subject: 'WhatsStore message template preview',
      text: message,
      html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${message.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]))}</pre>`,
    });

    if (!result.success) return sendError(res, result.error || 'Failed to send test email.', 500);
    return sendSuccess(res, null, `Test email sent to ${to}.`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createWebhook = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { module, method, url, isActive, secret } = req.body;

    if (!module || !url) return sendError(res, 'Module and URL are required.', 400);

    const webhook = await WebhookConfig.create({
      companyId,
      module,
      method: method || 'POST',
      url,
      isActive: isActive !== undefined ? isActive : true,
      secret: secret || '',
    });

    return sendSuccess(res, webhook, 'Webhook registered.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    const { id } = req.params;
    await WebhookConfig.findOneAndDelete({ _id: id, companyId });
    return sendSuccess(res, null, 'Webhook deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
