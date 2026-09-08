import express from 'express';
import {
  customerRegister,
  customerLogin,
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerOrders,
} from '../controllers/customerController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', customerRegister);
router.post('/login', customerLogin);

router.get('/profile', authenticate, getCustomerProfile);
router.put('/profile', authenticate, updateCustomerProfile);
router.get('/orders', authenticate, getCustomerOrders);

export default router;
