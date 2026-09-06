import express from 'express';
import {
  getStoreBySlug,
  getStoreCatalog,
  getProductQuickView,
  applyCoupon,
  getStoreShippingMethods,
  checkoutStoreOrder,
  confirmStorefrontPayment,
  trackPublicOrder,
  downloadPublicOrderInvoice,
  getPublicLandingPage,
  getPublicCustomPage,
  subscribeNewsletterPublic,
  submitContactInquiryPublic,
} from '../controllers/storefrontController.js';

const router = express.Router();

// Public Landing Page & Leads
router.get('/landing', getPublicLandingPage);
router.get('/pages/:slug', getPublicCustomPage);
router.post('/newsletter/subscribe', subscribeNewsletterPublic);
router.post('/contact/inquiry', submitContactInquiryPublic);

// Public Storefront Endpoints
router.get('/:slug', getStoreBySlug);
router.get('/:slug/catalog', getStoreCatalog);
router.get('/:slug/products', getStoreCatalog);
router.get('/:slug/products/:productId', getProductQuickView);
router.post('/:slug/coupon/apply', applyCoupon);
router.get('/:slug/shipping-methods', getStoreShippingMethods);
router.post('/:slug/checkout', checkoutStoreOrder);
router.post('/:slug/orders/:orderNumber/payment-confirmation', confirmStorefrontPayment);
router.get('/:slug/orders/:orderNumber', trackPublicOrder);
router.get('/:slug/orders/:orderNumber/invoice', downloadPublicOrderInvoice);

export default router;
