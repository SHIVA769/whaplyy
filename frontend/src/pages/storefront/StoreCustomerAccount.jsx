import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  KeyRound,
  FileText,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  XCircle,
  Eye,
  LogOut,
  MapPin,
  Lock,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AddressCascade } from '../../components/common/AddressCascade';
import { formatCurrency } from '../../utils/currency';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';
import { downloadOrderPdf } from '../../utils/orderPdf';

export const StoreCustomerAccount = () => {
  const { slug } = useParams();
  const { storeData, themeConfig } = useOutletContext();
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(user ? 'orders' : 'login');

  // Auth Forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Profile & Orders Data
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    shippingAddress: { street: '', country: 'US', state: '', city: '', postalCode: '' },
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    if (user) {
      if (activeTab === 'login' || activeTab === 'register') {
        setActiveTab('orders');
      }
      fetchOrders();
      fetchProfile();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/customer/orders');
      if (res.data?.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customer/profile');
      if (res.data?.success && res.data.data.customer) {
        const c = res.data.data.customer;
        setProfileData((prev) => ({
          ...prev,
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          phone: c.phone || '',
          shippingAddress: c.shippingAddress || { street: '', country: 'US', state: '', city: '', postalCode: '' },
        }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/customer/login', {
        email: loginEmail,
        password: loginPassword,
        storeSlug: slug,
      });

      if (res.data?.success) {
        const { token, customer } = res.data.data;
        login(token, {
          name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
          email: customer.email,
          role: 'customer',
        });
        setActiveTab('orders');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid login credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/customer/register', {
        storeSlug: slug,
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });

      if (res.data?.success) {
        const { token, customer } = res.data.data;
        login(token, {
          name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
          email: customer.email,
          role: 'customer',
        });
        setActiveTab('orders');
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      const res = await api.put('/customer/profile', profileData);
      if (res.data?.success) {
        setAuthSuccess('Profile updated successfully!');
        setProfileData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Delivered</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">Shipped</span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Processing</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">Pending</span>;
    }
  };

  // Render Unauthenticated Customer Login / Register View
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6 text-left">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <User className="w-6 h-6" />
          </div>
          <h1 className={`text-2xl font-black ${themeConfig.fontHeading} text-slate-900 dark:text-white`}>
            Customer Account
          </h1>
          <p className="text-xs text-slate-500">Sign in or create an account to view your order history</p>
        </div>

        {/* Auth Toggle Tabs */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 font-bold text-xs">
          <button
            onClick={() => { setActiveTab('login'); setAuthError(''); }}
            className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'login' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setAuthError(''); }}
            className={`flex-1 py-2 rounded-xl transition-colors ${activeTab === 'register' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            Create Account
          </button>
        </div>

        {authError && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
            {authError}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-2xl text-xs font-bold ${themeConfig.primaryBtn}`}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-2xl text-xs font-bold ${themeConfig.primaryBtn}`}
            >
              {isSubmitting ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Render Logged-In Customer Portal View
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      {/* Account Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-md">
            {user.name?.[0] || 'C'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{user.name}</h1>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'orders' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            My Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Profile & Security
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-200"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MY ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Orders</h2>

          {loadingOrders ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading order history...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No orders found yet</p>
              <p className="text-xs text-slate-400">When you place an order, it will appear here for tracking.</p>
              <Link
                to={`/store/${slug}`}
                className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold ${themeConfig.primaryBtn}`}
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o._id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                        #{o.orderNumber}
                      </span>
                      {getStatusBadge(o.fulfillmentStatus)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Placed on {new Date(o.createdAt).toLocaleDateString()} • {o.items?.length || 0} items
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                      {formatCurrency(o.total)}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setIsOrderDetailOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadOrderPdf(slug, o.orderNumber)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200"
                      title="Download PDF invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFILE & SECURITY TAB */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Profile & Address Information
          </h2>

          {authSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
              {authSuccess}
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
              {authError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Default Street Address</label>
            <input
              type="text"
              value={profileData.shippingAddress.street}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  shippingAddress: { ...profileData.shippingAddress, street: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <AddressCascade
            value={profileData.shippingAddress}
            onChange={(addr) =>
              setProfileData((prev) => ({
                ...prev,
                shippingAddress: { ...prev.shippingAddress, ...addr },
              }))
            }
          />

          {/* Security Password Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Security Password Change</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold ${themeConfig.primaryBtn}`}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <Modal
          isOpen={isOrderDetailOpen}
          onClose={() => setIsOrderDetailOpen(false)}
          title={`Order #${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-left text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Order Date:</span>
              <span className="font-bold">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-400">Fulfillment Status:</span>
              <span>{getStatusBadge(selectedOrder.fulfillmentStatus)}</span>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900">Line Items</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <span className="font-mono font-bold">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span className="font-mono">{formatCurrency(selectedOrder.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="font-mono">{formatCurrency(selectedOrder.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-1 border-t border-slate-100">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
