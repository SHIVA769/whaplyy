import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Store } from '../models/Store.js';
import { Plan } from '../models/Plan.js';
import { PlanRequest } from '../models/PlanRequest.js';
import { PlanOrder } from '../models/PlanOrder.js';
import { PlatformCoupon } from '../models/PlatformCoupon.js';
import { Currency } from '../models/Currency.js';
import { Country, State, City } from '../models/Locations.js';
import { ReferralSettings, ReferredUser, PayoutRequest } from '../models/Referral.js';
import { MediaFile, CustomPage, Subscriber, ContactInquiry, LandingPageConfig } from '../models/LandingBuilder.js';
import { Advertisement } from '../models/Advertisement.js';
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
  CookieLog,
  SeoSettings,
} from '../models/Settings.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { encryptSecret, maskSecret } from '../utils/crypto.js';
import { cache } from '../utils/cache.js';
import { sendEmail } from '../services/mailer.js';
import { PAYMENT_GATEWAYS, ROLES } from '../config/constants.js';
import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

const withLegacyId = (record) => ({ ...record, _id: record.id });

// ==========================================
// 5.2 Super Admin Dashboard
// ==========================================
export const getDashboardStats = async (req, res) => {
  try {
    const [totalCompanies, totalStores, activePlans, planOrders, plans, recentUsers, recentStores] = await Promise.all([
      prisma.company.count(),
      prisma.store.count(),
      prisma.plan.count({ where: { isActive: true } }),
      prisma.planOrder.findMany({ where: { paymentStatus: 'paid' }, select: { finalPrice: true } }),
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { monthlyPrice: 'asc' } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }),
      prisma.store.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }),
    ]);

    // Calculate revenue from PlanOrders
    const totalRevenue = planOrders.reduce((sum, order) => sum + (order.finalPrice || 0), 0);

    // Calculate monthly growth (companies registered in last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const recentCompanies = await prisma.company.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    const prevCompanies = await prisma.company.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
    const monthlyGrowth = prevCompanies === 0 ? 100 : Math.round(((recentCompanies - prevCompanies) / prevCompanies) * 100);

    // Plan ranking
    const planRankings = await Promise.all(
      plans.map(async (plan) => {
        const subscriberCount = await prisma.company.count({ where: { planId: plan.id } });
        const monthlyRev = subscriberCount * plan.monthlyPrice;
        return {
          id: plan.id,
          name: plan.name,
          subscribers: subscriberCount,
          monthlyRevenue: monthlyRev,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
        };
      })
    );
    planRankings.sort((a, b) => b.subscribers - a.subscribers);

    // System Activity Live Feed (recent registrations, store creations, plan orders)
    const recentOrders = await prisma.planOrder.findMany({ include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 4 });

    const activityFeed = [
      ...recentUsers.map((u) => ({
        id: `usr-${u.id}`,
        title: `New user registration: ${u.name}`,
        time: u.createdAt,
        type: 'user',
        status: 'success',
      })),
      ...recentStores.map((s) => ({
        id: `str-${s.id}`,
        title: `New store launched: ${s.name} (${s.theme})`,
        time: s.createdAt,
        type: 'store',
        status: 'info',
      })),
      ...recentOrders.map((o) => ({
        id: `ord-${o.id}`,
        title: `Plan order #${o.orderNumber} for ${o.plan?.name || 'Plan'} ($${o.finalPrice})`,
        time: o.createdAt,
        type: 'order',
        status: o.paymentStatus === 'paid' ? 'success' : 'warning',
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

    return sendSuccess(res, {
      summaryCards: {
        totalCompanies,
        totalStores,
        activePlans,
        monthlyGrowth: `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth}%`,
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
      },
      activityFeed,
      planRankings,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.3 Companies Management
// ==========================================
export const getCompanies = async (req, res) => {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        include: {
          plan: true,
          users: {
            where: { role: 'company_owner' },
            select: { name: true, email: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
      }),
    ]);

    const storeCounts = new Map();
    if (companies.length > 0) {
      const counts = await prisma.$queryRaw`
        SELECT "companyId", COUNT(*)::int AS count
        FROM "Store"
        WHERE CASE
          WHEN "companyId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN "companyId"::uuid
        END IN (${Prisma.join(companies.map((company) => company.id))})
        GROUP BY "companyId"
      `;
      counts.forEach(({ companyId, count }) => storeCounts.set(companyId, count));
    }

    const enriched = companies.map(({ plan, users, storageUsedBytes, ...company }) => ({
      ...company,
      _id: company.id,
      planId: plan,
      storageUsedBytes: Number(storageUsedBytes),
      storeCount: storeCounts.get(company.id) || 0,
      ownerName: users[0]?.name || company.name,
      ownerEmail: users[0]?.email || company.email,
    }));

    return sendSuccess(res, enriched, 'Companies retrieved', 200, {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCompany = async (req, res) => {
  try {
    const { name, email, password, enableLogin = true, planId } = req.body;
    if (!name || !email) {
      return sendError(res, 'Company name and email are required.', 400);
    }

    if (enableLogin && !password) {
      return sendError(res, 'Password is required when login is enabled.', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 'A user with this email already exists.', 400);
    }

    const defaultPlan = planId ? await Plan.findById(planId) : await Plan.findOne({ isDefault: true }) || await Plan.findOne();

    const company = await Company.create({
      name,
      email: email.toLowerCase(),
      planId: defaultPlan?._id || null,
      enableLogin,
      status: 'active',
      referralCode: `WS-${Date.now().toString(36).toUpperCase()}`,
    });

    if (enableLogin) {
      await User.create({
        name: `${name} Admin`,
        email: email.toLowerCase(),
        password,
        role: ROLES.COMPANY_OWNER,
        companyId: company._id,
        status: 'active',
        emailVerified: true,
      });
    }

    return sendSuccess(res, company, 'Company created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status, enableLogin, planId, planBillingCycle } = req.body;

    const company = await Company.findById(id);
    if (!company) return sendError(res, 'Company not found.', 404);

    if (name) company.name = name;
    if (email) company.email = email.toLowerCase();
    if (status) company.status = status;
    if (enableLogin !== undefined) company.enableLogin = enableLogin;
    if (planId) company.planId = planId;
    if (planBillingCycle) company.planBillingCycle = planBillingCycle;

    await company.save();
    return sendSuccess(res, company, 'Company updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await Company.findByIdAndDelete(id);
    await User.deleteMany({ companyId: id });
    await Store.deleteMany({ companyId: id });
    return sendSuccess(res, null, 'Company and associated data deleted successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const resetCompanyPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return sendError(res, 'New password is required.', 400);

    const ownerUser = await User.findOne({ companyId: id, role: ROLES.COMPANY_OWNER });
    if (!ownerUser) {
      return sendError(res, 'No user found for this company.', 404);
    }

    ownerUser.password = password;
    await ownerUser.save();

    return sendSuccess(res, null, `Password updated for company owner ${ownerUser.email}`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.4 Media Library
// ==========================================
export const getMediaFiles = async (req, res) => {
  try {
    const { search, companyId } = req.query;
    const query = {};
    if (companyId) query.companyId = companyId;
    if (search) query.originalName = { $regex: search, $options: 'i' };

    const files = await MediaFile.find(query).sort({ createdAt: -1 });
    const totalStorageBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    const storageUsedMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);
    const imageCount = files.filter((f) => f.mimeType?.startsWith('image/')).length;

    return sendSuccess(res, {
      files,
      stats: {
        totalFiles: files.length,
        storageUsedMB: `${storageUsedMB} MB`,
        totalImages: imageCount,
      },
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const uploadMediaFile = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded.', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const media = await MediaFile.create({
      companyId: req.user.role === ROLES.SUPER_ADMIN ? null : req.user.companyId,
      userId: req.user._id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl,
      fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      storageDriver: 'local',
    });

    return sendSuccess(res, media, 'File uploaded successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteMediaFile = async (req, res) => {
  try {
    const { id } = req.params;
    await MediaFile.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Media file deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
// ==========================================
// 5.5 Advertisements
// ==========================================
export const getAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find().sort({ sortOrder: 1, createdAt: -1 });
    return sendSuccess(res, advertisements);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.create(req.body);
    return sendSuccess(res, advertisement, 'Advertisement created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!advertisement) return sendError(res, 'Advertisement not found.', 404);
    return sendSuccess(res, advertisement, 'Advertisement updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findByIdAndDelete(req.params.id);
    if (!advertisement) return sendError(res, 'Advertisement not found.', 404);
    return sendSuccess(res, null, 'Advertisement deleted successfully.');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

// ==========================================
// 5.6 Plans, Plan Requests, Plan Orders
// ==========================================
export const getPlans = async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { monthlyPrice: 'asc' } });
    return sendSuccess(res, plans.map(withLegacyId));
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createPlan = async (req, res) => {
  try {
    const {
      name,
      monthlyPrice,
      yearlyPrice,
      description,
      maxStores,
      maxUsersPerStore,
      maxProductsPerStore,
      storageLimitGB,
      trialDays,
      features,
      themes,
      isActive = true,
      isDefault = false,
    } = req.body;

    if (!name || monthlyPrice === undefined) {
      return sendError(res, 'Plan name and monthly price are required.', 400);
    }

    // If yearly price is blank, auto 20% discount
    const calculatedYearly = yearlyPrice !== undefined && yearlyPrice !== '' && yearlyPrice !== 0
      ? Number(yearlyPrice)
      : Math.round(Number(monthlyPrice) * 12 * 0.8);

    if (isDefault) {
      await prisma.plan.updateMany({ data: { isDefault: false } });
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        monthlyPrice: Number(monthlyPrice),
        yearlyPrice: calculatedYearly,
        description: description || '',
        maxStores: Number(maxStores) || 10,
        maxUsersPerStore: Number(maxUsersPerStore) || 2,
        maxProductsPerStore: Number(maxProductsPerStore) || 20,
        storageLimitGB: Number(storageLimitGB) || 1,
        trialDays: Number(trialDays) || 0,
        features: features || { customDomain: false, customSubdomain: false, pwa: false, aiIntegration: false, shippingMethod: true, enableTrial: false },
        themes: themes || [],
        isActive,
        isDefault,
      },
    });

    return sendSuccess(res, withLegacyId(plan), 'Plan created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.isDefault) {
      await Plan.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, plan, 'Plan updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await prisma.company.count({ where: { planId: id } });
    if (inUse > 0) {
      return sendError(res, `Cannot delete plan: Assigned to ${inUse} active company/companies.`, 400);
    }

    await prisma.plan.delete({ where: { id } });
    return sendSuccess(res, null, 'Plan deleted successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getPlanRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;

    const requests = await prisma.planRequest.findMany({
      where,
      include: { company: true, user: true, plan: true },
      orderBy: { requestedAt: 'desc' },
    });
    const normalized = requests.map((request) => ({
      ...withLegacyId(request),
      companyId: request.company ? withLegacyId(request.company) : null,
      userId: request.user ? withLegacyId(request.user) : null,
      planId: request.plan ? withLegacyId(request.plan) : null,
    }));

    return sendSuccess(res, normalized);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updatePlanRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // 'approved' | 'rejected'

    const request = await PlanRequest.findById(id).populate('planId companyId');
    if (!request) return sendError(res, 'Plan request not found.', 404);

    request.status = status;
    if (notes) request.notes = notes;
    await request.save();

    if (status === 'approved' && request.companyId && request.planId) {
      const company = await Company.findById(request.companyId._id);
      if (company) {
        company.planId = request.planId._id;
        company.planBillingCycle = request.duration;
        const days = request.duration === 'yearly' ? 365 : 30;
        company.planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await company.save();

        // Record plan order
        await PlanOrder.create({
          orderNumber: `ORD-REQ-${Date.now().toString(36).toUpperCase()}`,
          companyId: company._id,
          userId: request.userId,
          planId: request.planId._id,
          duration: request.duration,
          originalPrice: request.price,
          finalPrice: request.price,
          paymentMethod: 'Bank Transfer / Admin Approval',
          paymentStatus: 'paid',
          status: 'approved',
        });
      }
    }

    return sendSuccess(res, request, `Plan request ${status}.`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getPlanOrders = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (status && status !== 'all') where.status = status;

    const orders = await prisma.planOrder.findMany({
      where,
      include: { company: true, user: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });
    const normalized = orders.map((order) => ({
      ...withLegacyId(order),
      companyId: order.company ? withLegacyId(order.company) : null,
      userId: order.user ? withLegacyId(order.user) : null,
      planId: order.plan ? withLegacyId(order.plan) : null,
    }));

    return sendSuccess(res, normalized);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.6 Platform Coupons
// ==========================================
export const getPlatformCoupons = async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.discountType = type;

    const coupons = await PlatformCoupon.find(query).sort({ createdAt: -1 });
    return sendSuccess(res, coupons);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createPlatformCoupon = async (req, res) => {
  try {
    const { name, code, discountType, discountValue, minSpend, maxSpend, totalLimit, userLimit, expiryDate, status } = req.body;
    if (!name || !discountType || discountValue === undefined || !expiryDate) {
      return sendError(res, 'Name, discount type, value, and expiry date are required.', 400);
    }

    const generatedCode = code ? code.toUpperCase().trim() : `DISC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const coupon = await PlatformCoupon.create({
      name,
      code: generatedCode,
      discountType,
      discountValue: Number(discountValue),
      minSpend: Number(minSpend) || 0,
      maxSpend: Number(maxSpend) || 0,
      totalLimit: Number(totalLimit) || 0,
      userLimit: Number(userLimit) || 0,
      expiryDate: new Date(expiryDate),
      status: status || 'active',
    });

    return sendSuccess(res, coupon, 'Platform coupon created successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updatePlatformCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await PlatformCoupon.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, coupon, 'Coupon updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deletePlatformCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await PlatformCoupon.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Coupon deleted successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.7 Currencies
// ==========================================
export const getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.find().sort({ isDefault: -1, code: 1 });
    return sendSuccess(res, currencies);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCurrency = async (req, res) => {
  try {
    const { name, code, symbol, description, isDefault } = req.body;
    if (!name || !code || !symbol) {
      return sendError(res, 'Name, code, and symbol are required.', 400);
    }

    if (isDefault) {
      await Currency.updateMany({}, { isDefault: false });
    }

    const currency = await Currency.create({
      name,
      code: code.toUpperCase().trim(),
      symbol: symbol.trim(),
      description,
      isDefault: !!isDefault,
    });

    return sendSuccess(res, currency, 'Currency created.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.isDefault) {
      await Currency.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    const currency = await Currency.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, currency, 'Currency updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    await Currency.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Currency deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.8 Location Management (Countries -> States -> Cities)
// ==========================================
export const getLocationsData = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    const states = await State.find().populate('countryId').sort({ name: 1 });
    const cities = await City.find().populate('countryId stateId').sort({ name: 1 });

    const countriesWithCounts = countries.map((c) => {
      const stateCount = states.filter((s) => s.countryId?._id?.toString() === c._id.toString()).length;
      return { ...c.toObject(), statesCount: stateCount };
    });

    const statesWithCounts = states.map((s) => {
      const cityCount = cities.filter((ci) => ci.stateId?._id?.toString() === s._id.toString()).length;
      return { ...s.toObject(), citiesCount: cityCount };
    });

    return sendSuccess(res, {
      countries: countriesWithCounts,
      states: statesWithCounts,
      cities,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCountry = async (req, res) => {
  try {
    const country = await Country.create(req.body);
    return sendSuccess(res, country, 'Country added.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createState = async (req, res) => {
  try {
    const state = await State.create(req.body);
    return sendSuccess(res, state, 'State added.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCity = async (req, res) => {
  try {
    const city = await City.create(req.body);
    return sendSuccess(res, city, 'City added.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.9 Referral Program (Admin)
// ==========================================
export const getReferralAdminData = async (req, res) => {
  try {
    const settings = await ReferralSettings.findOne() || await ReferralSettings.create({});
    const referredUsers = await ReferredUser.find()
      .populate('referringCompanyId referredCompanyId planId')
      .sort({ createdAt: -1 });

    const payoutRequests = await PayoutRequest.find()
      .populate('companyId')
      .sort({ requestedAt: -1 });

    const totalReferralUsers = referredUsers.length;
    const pendingPayouts = payoutRequests.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const totalCommissionPaid = payoutRequests.filter((p) => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
    const activeCompaniesWithReferrals = new Set(referredUsers.map((r) => r.referringCompanyId?._id?.toString())).size;

    return sendSuccess(res, {
      summaryCards: {
        totalReferralUsers,
        pendingPayouts: `$${pendingPayouts.toFixed(2)}`,
        totalCommissionPaid: `$${totalCommissionPaid.toFixed(2)}`,
        activeCompanies: activeCompaniesWithReferrals,
      },
      referredUsers,
      payoutRequests,
      settings,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateReferralSettings = async (req, res) => {
  try {
    let settings = await ReferralSettings.findOne();
    if (!settings) {
      settings = await ReferralSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    return sendSuccess(res, settings, 'Referral settings updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updatePayoutRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // 'approved' | 'rejected'

    const payout = await PayoutRequest.findById(id).populate('companyId');
    if (!payout) return sendError(res, 'Payout request not found.', 404);

    payout.status = status;
    payout.notes = notes || '';
    payout.processedAt = new Date();
    await payout.save();

    return sendSuccess(res, payout, `Payout request ${status}.`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.10 Landing Page Builder & Content
// ==========================================
export const getLandingPageConfig = async (req, res) => {
  try {
    let config = await LandingPageConfig.findOne();
    if (!config) {
      config = await LandingPageConfig.create({});
    }
    return sendSuccess(res, config);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const saveLandingPageConfig = async (req, res) => {
  try {
    let config = await LandingPageConfig.findOne();
    if (!config) {
      config = await LandingPageConfig.create(req.body);
    } else {
      // Merge updates across Setup, Layout, Content, Social, Engagement
      Object.assign(config, req.body);
      await config.save();
    }

    cache.clear('views');
    return sendSuccess(res, config, 'Landing page configuration saved successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getCustomPages = async (req, res) => {
  try {
    const pages = await CustomPage.find().sort({ createdAt: -1 });
    return sendSuccess(res, pages);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const createCustomPage = async (req, res) => {
  try {
    const { title, slug, content, metaTitle, metaDescription, isActive } = req.body;
    const generatedSlug = slug ? slug.toLowerCase().trim() : title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const page = await CustomPage.create({
      title,
      slug: generatedSlug,
      content,
      metaTitle,
      metaDescription,
      isActive: isActive !== undefined ? isActive : true,
    });
    return sendSuccess(res, page, 'Custom page created.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCustomPage = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await CustomPage.findByIdAndUpdate(id, req.body, { new: true });
    return sendSuccess(res, page, 'Custom page updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteCustomPage = async (req, res) => {
  try {
    const { id } = req.params;
    await CustomPage.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Custom page deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getSubscribers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (search) query.email = { $regex: search, $options: 'i' };
    if (status && status !== 'all') query.status = status;

    const subscribers = await Subscriber.find(query).sort({ subscribedAt: -1 });
    return sendSuccess(res, subscribers);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sub = await Subscriber.findByIdAndUpdate(id, { status }, { new: true });
    return sendSuccess(res, sub, 'Subscriber status updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    await Subscriber.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Subscriber deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getContactInquiries = async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find().sort({ createdAt: -1 });
    return sendSuccess(res, inquiries);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const deleteContactInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await ContactInquiry.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Inquiry deleted.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.11 & 5.12 Email & Notification Templates
// ==========================================
export const getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ name: 1 });
    return sendSuccess(res, templates);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { senderName, languages } = req.body;
    const template = await EmailTemplate.findById(id);
    if (!template) return sendError(res, 'Template not found.', 404);

    if (senderName) template.senderName = senderName;
    if (languages) template.languages = languages;
    await template.save();

    return sendSuccess(res, template, 'Email template updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getNotificationTemplates = async (req, res) => {
  try {
    const templates = await NotificationTemplate.find().sort({ name: 1 });
    return sendSuccess(res, templates);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateNotificationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { isEnabled, languages } = req.body;
    const template = await NotificationTemplate.findById(id);
    if (!template) return sendError(res, 'Notification template not found.', 404);

    if (isEnabled !== undefined) template.isEnabled = isEnabled;
    if (languages) template.languages = languages;
    await template.save();

    return sendSuccess(res, template, 'Notification template updated.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// ==========================================
// 5.13 Super Admin Settings Shell
// ==========================================
export const getSettings = async (req, res) => {
  try {
    const system = await SystemSettings.findOne({ companyId: null }) || await SystemSettings.create({ companyId: null });
    const brand = await BrandSettings.findOne({ companyId: null }) || await BrandSettings.create({ companyId: null });
    const currency = await CurrencySettings.findOne({ companyId: null }) || await CurrencySettings.create({ companyId: null });
    const email = await EmailSettings.findOne({ companyId: null }) || await EmailSettings.create({ companyId: null });
    const storage = await StorageSettings.findOne() || await StorageSettings.create({});
    const recaptcha = await RecaptchaSettings.findOne() || await RecaptchaSettings.create({});
    const chatgpt = await ChatGptSettings.findOne() || await ChatGptSettings.create({});
    const cookie = await CookieSettings.findOne() || await CookieSettings.create({});
    const seo = await SeoSettings.findOne() || await SeoSettings.create({});

    // Gateways (mask secrets in GET response)
    const gateways = await PaymentGatewaySettings.find({ companyId: null });
    const maskedGateways = PAYMENT_GATEWAYS.map((gDef) => {
      const existing = gateways.find((g) => g.gateway === gDef.id);
      const maskedConfig = {};
      if (existing?.config) {
        for (const [k, v] of Object.entries(existing.config)) {
          maskedConfig[k] = maskSecret(v);
        }
      }
      return {
        ...gDef,
        isEnabled: existing?.isEnabled || false,
        config: maskedConfig,
      };
    });

    const cacheStats = cache.getStats();

    return sendSuccess(res, {
      system,
      brand,
      currency,
      email: {
        ...email.toObject(),
        password: email.password ? maskSecret(email.password) : '',
      },
      gateways: maskedGateways,
      storage,
      recaptcha: {
        ...recaptcha.toObject(),
        secretKey: recaptcha.secretKey ? maskSecret(recaptcha.secretKey) : '',
      },
      chatgpt: {
        ...chatgpt.toObject(),
        apiKey: chatgpt.apiKey ? maskSecret(chatgpt.apiKey) : '',
      },
      cookie,
      seo,
      cache: cacheStats,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ companyId: null });
    if (!settings) settings = new SystemSettings({ companyId: null });
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'System settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateBrandSettings = async (req, res) => {
  try {
    let settings = await BrandSettings.findOne({ companyId: null });
    if (!settings) settings = new BrandSettings({ companyId: null });
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'Brand settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCurrencySettings = async (req, res) => {
  try {
    let settings = await CurrencySettings.findOne({ companyId: null });
    if (!settings) settings = new CurrencySettings({ companyId: null });
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'Currency formatting settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateEmailSettings = async (req, res) => {
  try {
    let settings = await EmailSettings.findOne({ companyId: null });
    if (!settings) settings = new EmailSettings({ companyId: null });

    if (req.body.password && !req.body.password.includes('*')) {
      req.body.password = encryptSecret(req.body.password);
    } else {
      delete req.body.password;
    }

    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'Email SMTP settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return sendError(res, 'Recipient email is required.', 400);

    const result = await sendEmail({
      to,
      subject: 'Test Email from WhatsStore SaaS',
      html: '<h3>SMTP Configuration Test</h3><p>Your SMTP mail settings on WhatsStore SaaS are functioning properly.</p>',
    });

    if (result.success) {
      return sendSuccess(res, null, `Test email dispatched successfully to ${to}`);
    } else {
      return sendError(res, `Failed to send email: ${result.error}`, 500);
    }
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updatePaymentGatewaySettings = async (req, res) => {
  try {
    const { gateway, isEnabled, config } = req.body;
    if (!gateway) return sendError(res, 'Gateway name required.', 400);

    let setting = await PaymentGatewaySettings.findOne({ gateway, companyId: null });
    if (!setting) {
      setting = new PaymentGatewaySettings({ gateway, companyId: null });
    }

    setting.isEnabled = isEnabled;

    if (config) {
      const encryptedConfig = { ...(setting.config || {}) };
      for (const [key, val] of Object.entries(config)) {
        if (typeof val === 'string' && !val.includes('****')) {
          encryptedConfig[key] = encryptSecret(val);
        } else if (typeof val !== 'string') {
          encryptedConfig[key] = val;
        }
      }
      setting.config = encryptedConfig;
    }

    await setting.save();
    return sendSuccess(res, null, `${gateway} payment settings saved.`);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateStorageSettings = async (req, res) => {
  try {
    let settings = await StorageSettings.findOne();
    if (!settings) settings = new StorageSettings();
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'Storage settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateRecaptchaSettings = async (req, res) => {
  try {
    let settings = await RecaptchaSettings.findOne();
    if (!settings) settings = new RecaptchaSettings();
    if (req.body.secretKey && !req.body.secretKey.includes('****')) {
      req.body.secretKey = encryptSecret(req.body.secretKey);
    } else {
      delete req.body.secretKey;
    }
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'reCAPTCHA settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateChatGptSettings = async (req, res) => {
  try {
    let settings = await ChatGptSettings.findOne();
    if (!settings) settings = new ChatGptSettings();
    if (req.body.apiKey && !req.body.apiKey.includes('****')) {
      req.body.apiKey = encryptSecret(req.body.apiKey);
    } else {
      delete req.body.apiKey;
    }
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'ChatGPT AI settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCookieSettings = async (req, res) => {
  try {
    let settings = await CookieSettings.findOne();
    if (!settings) settings = new CookieSettings();
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'Cookie settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getCookieLogs = async (req, res) => {
  try {
    const logs = await CookieLog.find().sort({ acceptedAt: -1 }).limit(500);
    return sendSuccess(res, logs);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateSeoSettings = async (req, res) => {
  try {
    let settings = await SeoSettings.findOne();
    if (!settings) settings = new SeoSettings();
    Object.assign(settings, req.body);
    await settings.save();
    return sendSuccess(res, settings, 'SEO settings saved.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const clearCache = async (req, res) => {
  try {
    cache.clear();
    const stats = cache.getStats();
    return sendSuccess(res, stats, 'Application, view, route, and config caches cleared successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
