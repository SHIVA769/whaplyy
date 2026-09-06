import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Copy, Check } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const StoreCoupons = () => {
  const { activeStore } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('basic');

  // Form State (3 Tabs)
  const [form, setForm] = useState({
    name: '',
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: 0,
    maxSpend: 0,
    perCouponLimit: 200,
    perUserLimit: 1,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
  });

  const fetchCoupons = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/coupons', { params: { storeId: activeStore._id, search } });
      if (res.data?.success) setCoupons(res.data.data.coupons || res.data.data);
    } catch (err) {
      console.error('Failed to load store coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [activeStore, search]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, storeId: activeStore._id };
      if (editingCoupon) {
        await api.put(`/company/coupons/${editingCoupon._id}`, payload);
      } else {
        await api.post('/company/coupons', payload);
      }
      setIsModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete coupon?')) {
      try {
        await api.delete(`/company/coupons/${id}`);
        fetchCoupons();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formTabs = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'rules', label: '2. Usage Rules' },
    { id: 'validity', label: '3. Validity & Limits' },
  ];

  const columns = [
    {
      header: 'Coupon & Code',
      render: (c) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
          <button
            onClick={() => handleCopy(c.code)}
            className="inline-flex items-center text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 hover:underline"
          >
            <span>{c.code}</span>
            {copiedCode === c.code ? <Check className="w-3 h-3 ml-1 text-emerald-600" /> : <Copy className="w-3 h-3 ml-1 opacity-60" />}
          </button>
        </div>
      ),
    },
    {
      header: 'Discount',
      render: (c) => (
        <span className="font-mono font-extrabold text-emerald-600">
          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} FLAT`}
        </span>
      ),
    },
    {
      header: 'Usage',
      render: (c) => <span className="font-mono text-xs text-slate-500">{c.usedCount || 0} / {c.perCouponLimit > 0 ? c.perCouponLimit : '∞'}</span>,
    },
    {
      header: 'Expiry Date',
      render: (c) => <span className="text-xs text-slate-400 font-mono">{new Date(c.endDate).toLocaleDateString()}</span>,
    },
    {
      header: 'Status',
      render: (c) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {c.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => {
              setEditingCoupon(c);
              setForm({
                name: c.name,
                code: c.code,
                discountType: c.discountType,
                discountValue: c.discountValue,
                minSpend: c.minSpend || 0,
                maxSpend: c.maxSpend || 0,
                perCouponLimit: c.perCouponLimit || 100,
                perUserLimit: c.perUserLimit || 1,
                endDate: new Date(c.endDate).toISOString().split('T')[0],
                status: c.status,
              });
              setActiveFormTab('basic');
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-slate-900"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(c._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Store Discount Coupons</h1>
          <p className="text-xs text-slate-500">Create promotional codes for cart checkout discounts</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setForm({
              name: '',
              code: `SAVE${Math.floor(10 + Math.random() * 90)}`,
              discountType: 'percentage',
              discountValue: 15,
              minSpend: 0,
              maxSpend: 0,
              perCouponLimit: 300,
              perUserLimit: 1,
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'active',
            });
            setActiveFormTab('basic');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Create Coupon
        </button>
      </div>

      <DataTable columns={columns} data={coupons} loading={loading} searchValue={search} onSearchChange={setSearch} />

      {/* 3-Tab Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? 'Edit Store Coupon' : 'Create Store Coupon'}>
        <div className="space-y-4 text-left">
          <Tabs tabs={formTabs} activeTab={activeFormTab} onChange={setActiveFormTab} variant="pills" />

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {activeFormTab === 'basic' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Coupon Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Summer Promo"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Coupon Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg uppercase"
                  />
                </div>
              </div>
            )}

            {activeFormTab === 'rules' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
                    <select
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Order Spend ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minSpend}
                      onChange={(e) => setForm({ ...form, minSpend: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Order Spend ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.maxSpend}
                      onChange={(e) => setForm({ ...form, maxSpend: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeFormTab === 'validity' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Usage Quota</label>
                    <input
                      type="number"
                      min="0"
                      value={form.perCouponLimit}
                      onChange={(e) => setForm({ ...form, perCouponLimit: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiration Date</label>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                Save Coupon
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
