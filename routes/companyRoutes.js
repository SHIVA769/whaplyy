import express from 'express';
import {
  getCompanyDashboardStats,
  getStores,
  createStore,
  updateStore,
  deleteStore,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTaxes,
  createTax,
  updateTax,
  deleteTax,
  getOrders,
  getOrderById,
  updateOrderStatus,
  downloadOrderInvoice,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getStoreCoupons,
  createStoreCoupon,
  updateStoreCoupon,
  deleteStoreCoupon,
  getShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getAnalyticsData,
  getStaffUsers,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getCompanyPlansData,
  submitPlanRequest,
  subscribePlan,
  getCompanyReferralData,
  requestPayout,
  getCompanySettings,
  getCompanyMessagingSettings,
  updateCompanyMessagingSettings,
  sendCompanyTemplateEmail,
  createWebhook,
  deleteWebhook,
  getCompanyNotifications,
  markCompanyNotificationRead,
} from '../controllers/companyController.js';
import { authenticate, requireRole, requireCompanyScope, requirePermission } from '../middlewares/auth.js';
import { checkStoreLimit, checkProductLimit, checkUserLimit } from '../middlewares/planLimits.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Enforce Company Scope / Staff auth
router.use(authenticate, requireRole([ROLES.SUPER_ADMIN, ROLES.COMPANY_OWNER, ROLES.STAFF]), requireCompanyScope);

// Dashboard
router.get('/dashboard', requirePermission('dashboard.view'), getCompanyDashboardStats);
router.get('/notifications', requirePermission('orders.view'), getCompanyNotifications);
router.patch('/notifications/:id/read', requirePermission('orders.view'), markCompanyNotificationRead);

// Stores
router.get('/stores', requirePermission('stores.view'), getStores);
router.post('/stores', requirePermission('stores.create'), checkStoreLimit, createStore);
router.put('/stores/:id', requirePermission('stores.edit'), updateStore);
router.delete('/stores/:id', requirePermission('stores.delete'), deleteStore);

// Products
router.get('/products', requirePermission('products.view'), getProducts);
router.post('/products', requirePermission('products.create'), checkProductLimit, createProduct);
router.put('/products/:id', requirePermission('products.edit'), updateProduct);
router.delete('/products/:id', requirePermission('products.delete'), deleteProduct);

// Categories
router.get('/categories', requirePermission('categories.view'), getCategories);
router.post('/categories', requirePermission('categories.create'), createCategory);
router.put('/categories/:id', requirePermission('categories.edit'), updateCategory);
router.delete('/categories/:id', requirePermission('categories.delete'), deleteCategory);

// Taxes
router.get('/taxes', requirePermission('tax.view'), getTaxes);
router.post('/taxes', requirePermission('tax.create'), createTax);
router.put('/taxes/:id', requirePermission('tax.edit'), updateTax);
router.delete('/taxes/:id', requirePermission('tax.delete'), deleteTax);

// Orders
router.get('/orders', requirePermission('orders.view'), getOrders);
router.get('/orders/:id', requirePermission('orders.view'), getOrderById);
router.put('/orders/:id/status', requirePermission('orders.edit'), updateOrderStatus);
router.get('/orders/:id/invoice', requirePermission('orders.view'), downloadOrderInvoice);

// Customers
router.get('/customers', requirePermission('customers.view'), getCustomers);
router.post('/customers', requirePermission('customers.create'), createCustomer);
router.put('/customers/:id', requirePermission('customers.edit'), updateCustomer);
router.delete('/customers/:id', requirePermission('customers.delete'), deleteCustomer);

// Coupons
router.get('/coupons', requirePermission('coupons.view'), getStoreCoupons);
router.post('/coupons', requirePermission('coupons.create'), createStoreCoupon);
router.put('/coupons/:id', requirePermission('coupons.edit'), updateStoreCoupon);
router.delete('/coupons/:id', requirePermission('coupons.delete'), deleteStoreCoupon);

// Shipping
router.get('/shipping', requirePermission('shipping.view'), getShippingMethods);
router.post('/shipping', requirePermission('shipping.create'), createShippingMethod);
router.put('/shipping/:id', requirePermission('shipping.edit'), updateShippingMethod);
router.delete('/shipping/:id', requirePermission('shipping.delete'), deleteShippingMethod);

// Analytics
router.get('/analytics', requirePermission('analytics.view'), getAnalyticsData);

// Staff Users & Roles
router.get('/staff', requirePermission('users.view'), getStaffUsers);
router.post('/staff', requirePermission('users.create'), checkUserLimit, createStaffUser);
router.put('/staff/:id', requirePermission('users.edit'), updateStaffUser);
router.delete('/staff/:id', requirePermission('users.delete'), deleteStaffUser);

router.get('/roles', requirePermission('roles.view'), getRoles);
router.post('/roles', requirePermission('roles.create'), createRole);
router.put('/roles/:id', requirePermission('roles.edit'), updateRole);
router.delete('/roles/:id', requirePermission('roles.delete'), deleteRole);

// Plans & Billing
router.get('/plans', requirePermission('plans.view'), getCompanyPlansData);
router.post('/plans/request', requirePermission('plans.request'), submitPlanRequest);
router.post('/plans/subscribe', requirePermission('plans.subscribe'), subscribePlan);

// Referral Program
router.get('/referrals', requirePermission('referral.view'), getCompanyReferralData);
router.post('/referrals/payout', requirePermission('referral.request_payout'), requestPayout);

// Settings & Messaging
router.get('/settings', requirePermission('settings.view'), getCompanySettings);
router.get('/settings/messaging', requirePermission('settings.view'), getCompanyMessagingSettings);
router.put('/settings/messaging', requirePermission('settings.edit'), updateCompanyMessagingSettings);
router.get('/messaging-settings', requirePermission('settings.view'), getCompanyMessagingSettings);
router.put('/messaging-settings', requirePermission('settings.edit'), updateCompanyMessagingSettings);
router.post('/messaging-settings/test-email', requirePermission('settings.edit'), sendCompanyTemplateEmail);
router.post('/webhooks', requirePermission('webhooks.create'), createWebhook);
router.delete('/webhooks/:id', requirePermission('webhooks.delete'), deleteWebhook);

export default router;
