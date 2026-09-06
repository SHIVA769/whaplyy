import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Check, CheckCircle, XCircle, Clock, ShieldCheck, Edit, Trash2, Tag, Eye } from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';
import { Modal } from '../../components/common/Modal';
import { STORE_THEMES } from '../../config/constants';
import api from '../../api/axios';

export const Plans = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form State
  const [planForm, setPlanForm] = useState({
    name: '',
    monthlyPrice: 0,
    yearlyPrice: '',
    description: '',
    maxStores: 10,
    maxUsersPerStore: 2,
    maxProductsPerStore: 20,
    storageLimitGB: 1,
    trialDays: 0,
    features: {
      customDomain: false,
      customSubdomain: true,
      pwa: false,
      aiIntegration: false,
      shippingMethod: true,
      enableTrial: false,
    },
    themes: [],
    isActive: true,
    isDefault: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, requestsRes, ordersRes] = await Promise.all([
        api.get('/super-admin/plans'),
        api.get('/super-admin/plan-requests'),
        api.get('/super-admin/plan-orders'),
      ]);
      if (plansRes.data?.success) setPlans(plansRes.data.data);
      if (requestsRes.data?.success) setRequests(requestsRes.data.data);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data);
    } catch (err) {
      console.error('Failed to load plans data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/super-admin/plans/${editingPlan._id}`, planForm);
      } else {
        await api.post('/super-admin/plans', planForm);
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleRequestStatus = async (id, status) => {
    try {
      await api.put(`/super-admin/plan-requests/${id}`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update request');
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Delete this plan?')) {
      try {
        await api.delete(`/super-admin/plans/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      description: plan.description || '',
      maxStores: plan.maxStores,
      maxUsersPerStore: plan.maxUsersPerStore,
      maxProductsPerStore: plan.maxProductsPerStore,
      storageLimitGB: plan.storageLimitGB,
      trialDays: plan.trialDays,
      features: plan.features || {},
      themes: plan.themes || [],
      isActive: plan.isActive,
      isDefault: plan.isDefault,
    });
    setIsPlanModalOpen(true);
  };

  const tabs = [
    { id: 'plans', label: 'Subscription Plans', badge: plans.length },
    { id: 'requests', label: 'Plan Requests', badge: requests.filter((r) => r.status === 'pending').length },
    { id: 'orders', label: 'Plan Orders Ledger', badge: orders.length },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Plans & Billing Engine</h1>
          <p className="text-xs text-slate-500">Manage pricing tiers, custom quotas, requests & payment logs</p>
        </div>
        {activeTab === 'plans' && (
          <button
            onClick={() => {
              setEditingPlan(null);
              setPlanForm({
                name: '',
                monthlyPrice: 19,
                yearlyPrice: '',
                description: '',
                maxStores: 10,
                maxUsersPerStore: 2,
                maxProductsPerStore: 50,
                storageLimitGB: 5,
                trialDays: 0,
                features: { customDomain: true, customSubdomain: true, pwa: true, aiIntegration: false, shippingMethod: true, enableTrial: false },
                themes: [],
                isActive: true,
                isDefault: false,
              });
              setIsPlanModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Plan
          </button>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center ${
                  billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                <span>Yearly Billing</span>
                <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded text-[10px]">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan._id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative ${
                    plan.isDefault ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {plan.isDefault && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                      Default Tier
                    </span>
                  )}

                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${plan.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description}</p>

                    <div className="flex items-baseline space-x-1 mb-6">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">${price}</span>
                      <span className="text-xs text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    </div>

                    {/* Limits List */}
                    <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Max Stores:</span>
                        <span className="font-bold">{plan.maxStores}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Users per Store:</span>
                        <span className="font-bold">{plan.maxUsersPerStore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Products per Store:</span>
                        <span className="font-bold">{plan.maxProductsPerStore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Storage Quota:</span>
                        <span className="font-bold">{plan.storageLimitGB} GB</span>
                      </div>
                      {plan.trialDays > 0 && (
                        <div className="flex items-center justify-between text-emerald-600 font-bold">
                          <span>Trial Duration:</span>
                          <span>{plan.trialDays} Days</span>
                        </div>
                      )}

                      {/* Features */}
                      <div className="pt-3 space-y-1.5 text-[11px]">
                        <p className={`flex items-center ${plan.features?.customDomain ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Custom Domain Mapping
                        </p>
                        <p className={`flex items-center ${plan.features?.pwa ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> PWA Mobile App Support
                        </p>
                        <p className={`flex items-center ${plan.features?.aiIntegration ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> AI Description Assistant
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan._id)}
                      className="p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Plan Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3">Company & Owner</th>
                <th className="px-4 py-3">Plan Requested</th>
                <th className="px-4 py-3">Cycle & Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {requests.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{r.companyId?.name || 'Company'}</span>
                    <span className="text-[11px] text-slate-400">{r.userId?.email || 'email'}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-primary-600">{r.planId?.name}</td>
                  <td className="px-4 py-3.5 font-mono">${r.price} ({r.duration})</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : r.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{new Date(r.requestedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-right">
                    {r.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleRequestStatus(r._id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestStatus(r._id, 'rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Plan Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Original Price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Final Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-mono font-bold">{o.orderNumber}</td>
                  <td className="px-4 py-3.5">{o.companyId?.name}</td>
                  <td className="px-4 py-3.5 font-semibold text-primary-600">{o.planId?.name}</td>
                  <td className="px-4 py-3.5 font-mono">${o.originalPrice}</td>
                  <td className="px-4 py-3.5 font-mono text-emerald-600">{o.discount > 0 ? `-$${o.discount}` : '$0'}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">${o.finalPrice}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {o.paymentStatus} ({o.paymentMethod})
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedOrder(o);
                        setIsOrderModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Price ($) *</label>
              <input
                type="number"
                required
                min="0"
                value={planForm.monthlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Yearly Price ($) (blank = auto 20% off)
              </label>
              <input
                type="number"
                min="0"
                value={planForm.yearlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Trial Days</label>
              <input
                type="number"
                min="0"
                value={planForm.trialDays}
                onChange={(e) => setPlanForm({ ...planForm, trialDays: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Quotas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Stores</label>
              <input
                type="number"
                min="1"
                value={planForm.maxStores}
                onChange={(e) => setPlanForm({ ...planForm, maxStores: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Users/Store</label>
              <input
                type="number"
                min="1"
                value={planForm.maxUsersPerStore}
                onChange={(e) => setPlanForm({ ...planForm, maxUsersPerStore: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Products</label>
              <input
                type="number"
                min="1"
                value={planForm.maxProductsPerStore}
                onChange={(e) => setPlanForm({ ...planForm, maxProductsPerStore: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage (GB)</label>
              <input
                type="number"
                min="1"
                value={planForm.storageLimitGB}
                onChange={(e) => setPlanForm({ ...planForm, storageLimitGB: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Feature Flags</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={planForm.features.customDomain}
                  onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, customDomain: e.target.checked } })}
                  className="rounded text-primary-600"
                />
                <span>Custom Domain</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={planForm.features.pwa}
                  onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, pwa: e.target.checked } })}
                  className="rounded text-primary-600"
                />
                <span>PWA Mobile App</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={planForm.features.aiIntegration}
                  onChange={(e) => setPlanForm({ ...planForm, features: { ...planForm.features, aiIntegration: e.target.checked } })}
                  className="rounded text-primary-600"
                />
                <span>ChatGPT AI Tool</span>
              </label>
            </div>
          </div>

          {/* Theme selection */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Allowed Themes (Empty = all 7 themes allowed)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
              {STORE_THEMES.map((theme) => {
                const isSelected = planForm.themes.includes(theme.id);
                return (
                  <label key={theme.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlanForm({ ...planForm, themes: [...planForm.themes, theme.id] });
                        } else {
                          setPlanForm({ ...planForm, themes: planForm.themes.filter((t) => t !== theme.id) });
                        }
                      }}
                      className="rounded text-primary-600"
                    />
                    <span className="truncate">{theme.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <label className="flex items-center space-x-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={planForm.isActive}
                onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span>Active Plan</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={planForm.isDefault}
                onChange={(e) => setPlanForm({ ...planForm, isDefault: e.target.checked })}
                className="rounded text-primary-600"
              />
              <span>Default Plan for New Signups</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
