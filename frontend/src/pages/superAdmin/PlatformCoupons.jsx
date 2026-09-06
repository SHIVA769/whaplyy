import React, { useState, useEffect } from 'react';
import { Tag, Plus, Copy, Check, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

export const PlatformCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 0,
    maxSpend: 0,
    totalLimit: 100,
    userLimit: 1,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/coupons', {
        params: { search, status: statusFilter, type: typeFilter },
      });
      if (res.data?.success) setCoupons(res.data.data);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [search, statusFilter, typeFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await api.put(`/super-admin/coupons/${editingCoupon._id}`, form);
      } else {
        await api.post('/super-admin/coupons', form);
      }
      setIsModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this platform coupon?')) {
      try {
        await api.delete(`/super-admin/coupons/${id}`);
        fetchCoupons();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const columns = [
    {
      header: 'Coupon Name & Code',
      render: (c) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
          <button
            onClick={() => handleCopy(c.code)}
            className="inline-flex items-center text-xs font-mono font-bold text-primary-600 dark:text-primary-400 mt-0.5 hover:underline"
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
        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `$${c.discountValue} FLAT`}
        </span>
      ),
    },
    {
      header: 'Spend Limits',
      render: (c) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          Min: ${c.minSpend} {c.maxSpend > 0 ? `| Max: $${c.maxSpend}` : '| No Max'}
        </span>
      ),
    },
    {
      header: 'Usage Count',
      render: (c) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
          {c.usedCount || 0} / {c.totalLimit > 0 ? c.totalLimit : '∞'}
        </span>
      ),
    },
    {
      header: 'Expiry Date',
      render: (c) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(c.expiryDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (c) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}>
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
                minSpend: c.minSpend,
                maxSpend: c.maxSpend,
                totalLimit: c.totalLimit,
                userLimit: c.userLimit,
                expiryDate: new Date(c.expiryDate).toISOString().split('T')[0],
                status: c.status,
              });
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform Coupons</h1>
          <p className="text-xs text-slate-500">Discount codes for companies subscribing to platform plans</p>
        </div>
        <button
          onClick={() => {
            setEditingCoupon(null);
            setForm({
              name: '',
              code: `DISC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
              discountType: 'percentage',
              discountValue: 20,
              minSpend: 0,
              maxSpend: 0,
              totalLimit: 500,
              userLimit: 1,
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'active',
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Coupon
        </button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        filterComponents={
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat ($)</option>
            </select>
          </div>
        }
      />

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCoupon ? 'Edit Coupon' : 'Create Platform Coupon'}>
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Coupon Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Discount Value</label>
              <input
                type="number"
                required
                min="1"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Spend ($)</label>
              <input
                type="number"
                min="0"
                value={form.minSpend}
                onChange={(e) => setForm({ ...form, minSpend: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Spend ($)</label>
              <input
                type="number"
                min="0"
                value={form.maxSpend}
                onChange={(e) => setForm({ ...form, maxSpend: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Usage Limit</label>
              <input
                type="number"
                min="0"
                value={form.totalLimit}
                onChange={(e) => setForm({ ...form, totalLimit: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Save Coupon
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
