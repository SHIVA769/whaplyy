import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const Tax = () => {
  const { activeStore } = useAuth();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [form, setForm] = useState({ name: '', rate: 8.5, type: 'percentage', status: 'active' });

  const fetchTaxes = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/taxes', { params: { storeId: activeStore._id } });
      if (res.data?.success) setTaxes(res.data.data.taxes || res.data.data);
    } catch (err) {
      console.error('Failed to load taxes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, [activeStore]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, storeId: activeStore?._id || undefined };
      if (editingTax) {
        await api.put(`/company/taxes/${editingTax._id}`, payload);
      } else {
        await api.post('/company/taxes', payload);
      }
      setIsModalOpen(false);
      setEditingTax(null);
      fetchTaxes();
      toast.success(editingTax ? 'Tax rule updated successfully' : 'Tax rule created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tax rule');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this tax rule?')) {
      try {
        await api.delete(`/company/taxes/${id}`);
        fetchTaxes();
        toast.success('Tax rule deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const columns = [
    { header: 'Tax Name', render: (t) => <span className="font-bold text-slate-900 dark:text-white">{t.name}</span> },
    {
      header: 'Tax Rate',
      render: (t) => (
        <span className="font-mono font-bold text-emerald-600">
          {t.type === 'percentage' ? `${t.rate}%` : `$${t.rate} Flat`}
        </span>
      ),
    },
    {
      header: 'Status',
      className: 'hidden sm:table-cell',
      render: (t) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {t.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (t) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => {
              setEditingTax(t);
              setForm({ name: t.name, rate: t.rate, type: t.type, status: t.status });
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-slate-900"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(t._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tax Rules</h1>
          <p className="text-xs text-slate-500">Configure regional sales taxes, VAT & Flat rate duties</p>
        </div>
        <button
          onClick={() => {
            setEditingTax(null);
            setForm({ name: '', rate: 8.5, type: 'percentage', status: 'active' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Tax Rule
        </button>
      </div>

      <DataTable columns={columns} data={taxes} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTax ? 'Edit Tax Rule' : 'Create Tax Rule'}>
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rule Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Standard VAT (8.5%)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rate Value</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              Save Tax Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
