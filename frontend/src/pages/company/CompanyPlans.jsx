import React, { useState, useEffect } from 'react';
import { CreditCard, Check, ShieldCheck, Tag, ArrowRight, DollarSign } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const CompanyPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [companyPlan, setCompanyPlan] = useState(null);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Checkout Modal
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [gateways, setGateways] = useState(['stripe', 'paypal', 'bank_transfer', 'cod']);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/plans');
      if (res.data?.success) {
        setPlans(res.data.data.plans || []);
        setCompanyPlan(res.data.data.currentPlan || null);
        setUsage(res.data.data.usage || {});
        setBillingCycle(res.data.data.billingCycle || 'monthly');
      }
    } catch (err) {
      console.error('Failed to load plan details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/company/apply-platform-coupon', {
        code: couponCode,
        planId: selectedPlan._id,
        price: billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice,
      });
      if (res.data?.success) {
        setCouponDiscount(res.data.data.discountAmount || 0);
        alert(`Coupon applied! Saved $${res.data.data.discountAmount}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/company/plans/subscribe', {
        planId: selectedPlan._id,
        duration: billingCycle,
        couponCode,
        paymentMethod,
      });
      if (res.data?.success) {
        alert('Subscription activated successfully!');
        setIsSubscribeModalOpen(false);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Subscription failed');
    }
  };

  const openSubscribeModal = (plan) => {
    setSelectedPlan(plan);
    setCouponCode('');
    setCouponDiscount(0);
    setIsSubscribeModalOpen(true);
  };

  const originalPrice = selectedPlan ? (billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice) : 0;
  const finalPrice = Math.max(originalPrice - couponDiscount, 0);

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subscription & Usage Quotas</h1>
        <p className="text-xs text-slate-500">Monitor active subscription tier, resource consumption & upgrade plans</p>
      </div>

      {/* Current Quota Consumption Progress Cards */}
      {companyPlan && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Current Plan</span>
              <h2 className="text-xl font-black text-white">{companyPlan.name} Tier</h2>
            </div>
            <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold font-mono">
              ${companyPlan.monthlyPrice}/mo ({user?.company?.planBillingCycle || 'monthly'})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Stores ({usage.stores || 1}/{companyPlan.maxStores})</span>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(((usage.stores || 1) / companyPlan.maxStores) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Products ({usage.products || 12}/{companyPlan.maxProductsPerStore})</span>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full" style={{ width: `${Math.min(((usage.products || 12) / companyPlan.maxProductsPerStore) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Users ({usage.users || 1}/{companyPlan.maxUsersPerStore})</span>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full" style={{ width: `${Math.min(((usage.users || 1) / companyPlan.maxUsersPerStore) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Storage ({usage.storageGB || 0.2}/{companyPlan.storageLimitGB} GB)</span>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${Math.min(((usage.storageGB || 0.2) / companyPlan.storageLimitGB) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly / Yearly Switcher */}
      <div className="flex items-center justify-center pt-2">
        <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
          >
            <span>Yearly</span>
            <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded text-[10px]">
              20% Off
            </span>
          </button>
        </div>
      </div>

      {/* Available Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = companyPlan?._id === plan._id;
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan._id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
                isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-4">{plan.description}</p>

                <div className="flex items-baseline space-x-1 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">${price}</span>
                  <span className="text-xs text-slate-400">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <p>Max Stores: <b>{plan.maxStores}</b></p>
                  <p>Users per Store: <b>{plan.maxUsersPerStore}</b></p>
                  <p>Products per Store: <b>{plan.maxProductsPerStore}</b></p>
                  <p>Storage: <b>{plan.storageLimitGB} GB</b></p>
                </div>
              </div>

              <div className="pt-6 border-t mt-4">
                <button
                  disabled={isCurrent}
                  onClick={() => openSubscribeModal(plan)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-sm transition-all ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : 'Upgrade Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscribe / Checkout Modal */}
      <Modal isOpen={isSubscribeModalOpen} onClose={() => setIsSubscribeModalOpen(false)} title={`Subscribe: ${selectedPlan?.name} Plan`}>
        {selectedPlan && (
          <form onSubmit={handleSubscribe} className="space-y-4 text-left text-xs">
            {/* Price Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Plan Duration:</span>
                <span className="capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Base Price:</span>
                <span>${originalPrice}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-${couponDiscount}</span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between font-black text-sm text-slate-900 dark:text-white">
                <span>Total Due:</span>
                <span>${finalPrice}</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div>
              <label className="block font-semibold mb-1">Have a Platform Coupon?</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 p-2 bg-white dark:bg-slate-800 border rounded-lg font-mono uppercase text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3 py-2 bg-slate-800 text-white font-bold rounded-lg text-xs"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block font-semibold mb-1">Select Payment Gateway</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg"
              >
                <option value="stripe">Stripe (Credit / Debit Card)</option>
                <option value="paypal">PayPal Express</option>
                <option value="razorpay">Razorpay</option>
                <option value="bank_transfer">Bank Wire Transfer</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button type="button" onClick={() => setIsSubscribeModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">
                Confirm & Subscribe
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
