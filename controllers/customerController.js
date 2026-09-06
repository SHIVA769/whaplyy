import { User } from '../models/User.js';
import { Customer, Order } from '../models/ECommerce.js';
import { Store } from '../models/Store.js';
import { generateToken } from '../middlewares/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../config/constants.js';

export const customerRegister = async (req, res) => {
  try {
    const { storeSlug, firstName, lastName, email, password, phone } = req.body;

    if (!storeSlug || !firstName || !email || !password) {
      return sendError(res, 'Store, First Name, Email, and Password are required.', 400);
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) return sendError(res, 'Store not found.', 404);

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return sendError(res, 'An account with this email already exists.', 400);
    }

    user = await User.create({
      name: `${firstName} ${lastName || ''}`.trim(),
      email: email.toLowerCase(),
      password,
      role: ROLES.CUSTOMER,
      companyId: store.companyId,
      storeId: store._id,
      phone,
      status: 'active',
      emailVerified: true,
    });

    let customer = await Customer.findOne({ storeId: store._id, email: email.toLowerCase() });
    if (!customer) {
      customer = await Customer.create({
        companyId: store.companyId,
        storeId: store._id,
        userId: user._id,
        firstName,
        lastName: lastName || '',
        email: email.toLowerCase(),
        phone: phone || '',
        status: 'active',
      });
    } else {
      customer.userId = user._id;
      await customer.save();
    }

    const token = generateToken({ userId: user._id, role: user.role, storeId: store._id, companyId: store.companyId });

    return sendSuccess(res, {
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    }, 'Account registered successfully.', 201);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const customerLogin = async (req, res) => {
  try {
    const { email, password, storeSlug } = req.body;
    if (!email || !password) return sendError(res, 'Email and password required.', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return sendError(res, 'Invalid credentials.', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid credentials.', 401);

    let store = null;
    if (storeSlug) {
      store = await Store.findOne({ slug: storeSlug });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() });

    const token = generateToken({
      userId: user._id,
      role: user.role,
      storeId: store?._id || user.storeId,
      companyId: store?.companyId || user.companyId,
    });

    return sendSuccess(res, {
      token,
      customer: customer || { firstName: user.name, email: user.email },
    }, 'Logged in successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findOne({ email: req.user.email });
    return sendSuccess(res, {
      user: req.user,
      customer,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const updateCustomerProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, shippingAddress, billingAddress, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (newPassword) {
      if (!currentPassword) return sendError(res, 'Current password required to change password.', 400);
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return sendError(res, 'Current password incorrect.', 400);
      user.password = newPassword;
      await user.save();
    }

    if (firstName) {
      user.name = `${firstName} ${lastName || ''}`.trim();
      await user.save();
    }

    let customer = await Customer.findOne({ email: user.email });
    if (customer) {
      if (firstName) customer.firstName = firstName;
      if (lastName !== undefined) customer.lastName = lastName;
      if (phone !== undefined) customer.phone = phone;
      if (shippingAddress) customer.shippingAddress = shippingAddress;
      if (billingAddress) customer.billingAddress = billingAddress;
      await customer.save();
    }

    return sendSuccess(res, { user, customer }, 'Profile updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.user.email }).populate('storeId').sort({ createdAt: -1 });
    return sendSuccess(res, orders);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
