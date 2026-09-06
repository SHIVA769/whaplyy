import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const Shipping = () => {
  const { activeStore } = useAuth();
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('basic');

  // Form State (3 Tabs)
  const [form, setForm] = useState({
    name: '',
    description: '',
    estimatedDays: '2-3 Business Days',
    cost: 15,
    freeShippingThreshold: 150,
    minOrderAmount: 0,
    status: 'active',
  });

  const fetchShipping = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/shipping', { params: { storeId: activeStore._id } });
      if (res.data?.success) setShippingMethods(res.data.data.shippingMethods || res.data.data);
    } catch (err) {
      console.error('Failed to load shipping methods:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipping();
  }, [activeStore]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, storeId: activeStore._id };
      if (editingMethod) {
        await api.put(`/company/shipping/${editingMethod._id}`, payload);
      } else {
        await api.post('/company/shipping', payload);
      }
      setIsModalOpen(false);
      setEditingMethod(null);
      fetchShipping();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save shipping method');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this shipping method?')) {
      try {
        await api.delete(`/company/shipping/${id}`);
        fetchShipping();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const formTabs = [
    { id: 'basic', label: '1. Basic Info' },
    { id: 'rates', label: '2. Rate & Threshold' },
    { id: 'rules', label: '3. Restrictions' },
  ];

  const columns = [
    {
      header: 'Method Name',
      render: (m) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{m.name}</span>
          <span className="text-xs text-slate-400">{m.description}</span>
        </div>
      ),
    },
    {
      header: 'Delivery Time',
      render: (m) => (
        <span className="inline-flex items-center text-xs text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
          {m.estimatedDays}
        </span>
      ),
    },
    {
      header: 'Standard Cost',
      render: (m) => <span className="font-mono font-bold text-slate-900 dark:text-white">${m.cost}</span>,
    },
    {
      header: 'Free Shipping Over',
      render: (m) => (
        <span className="text-xs font-mono text-emerald-600">
          {m.freeShippingThreshold > 0 ? `Orders > $${m.freeShippingThreshold}` : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (m) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {m.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (m) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => {
              setEditingMethod(m);
              setForm({
                name: m.name,
                description: m.description || '',
                estimatedDays: m.estimatedDays || '2-3 Days',
                cost: m.cost,
                freeShippingThreshold: m.freeShippingThreshold || 0,
                minOrderAmount: m.minOrderAmount || 0,
                status: m.status,
              });
              setActiveFormTab('basic');
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-slate-900"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(m._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Shipping & Delivery Rates</h1>
          <p className="text-xs text-slate-500">Configure courier options, flat rates & free shipping minimums</p>
        </div>
        <button
          onClick={() => {
            setEditingMethod(null);
            setForm({
              name: '',
              description: 'Standard domestic courier delivery',
              estimatedDays: '2-4 Business Days',
              cost: 12,
              freeShippingThreshold: 100,
              minOrderAmount: 0,
              status: 'active',
            });
            setActiveFormTab('basic');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Shipping Method
        </button>
      </div>

      <DataTable columns={columns} data={shippingMethods} loading={loading} />

      {/* 3-Tab Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMethod ? 'Edit Shipping Method' : 'Create Shipping Method'}>
        <div className="space-y-4 text-left">
          <Tabs tabs={formTabs} activeTab={activeFormTab} onChange={setActiveFormTab} variant="pills" />

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {activeFormTab === 'basic' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Method Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Express Courier"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Delivery Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-2 Business Days"
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {activeFormTab === 'rates' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shipping Cost ($) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Free Shipping Over ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.freeShippingThreshold}
                      onChange={(e) => setForm({ ...form, freeShippingThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeFormTab === 'rules' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Order Subtotal Requirement ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                Save Shipping
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
