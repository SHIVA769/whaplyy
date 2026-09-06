import React, { useState, useEffect } from 'react';
import { Coins, Plus, Trash2, Edit, Check } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

export const Currencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', symbol: '', description: '', isDefault: false });

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/currencies');
      if (res.data?.success) setCurrencies(res.data.data);
    } catch (err) {
      console.error('Failed to load currencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCurrency) {
        await api.put(`/super-admin/currencies/${editingCurrency._id}`, form);
      } else {
        await api.post('/super-admin/currencies', form);
      }
      setIsModalOpen(false);
      setEditingCurrency(null);
      fetchCurrencies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save currency');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this currency?')) {
      try {
        await api.delete(`/super-admin/currencies/${id}`);
        fetchCurrencies();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete currency');
      }
    }
  };

  const columns = [
    {
      header: 'Currency Name',
      render: (c) => (
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
          {c.isDefault && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              Default
            </span>
          )}
        </div>
      ),
    },
    { header: 'Code', render: (c) => <span className="font-mono font-bold text-xs">{c.code}</span> },
    { header: 'Symbol', render: (c) => <span className="font-mono text-sm font-extrabold text-primary-600">{c.symbol}</span> },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => {
              setEditingCurrency(c);
              setForm({ name: c.name, code: c.code, symbol: c.symbol, description: c.description || '', isDefault: c.isDefault });
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-600 hover:text-slate-900"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          {!c.isDefault && (
            <button onClick={() => handleDelete(c._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Currencies</h1>
          <p className="text-xs text-slate-500">Configure global transaction and display currencies</p>
        </div>
        <button
          onClick={() => {
            setEditingCurrency(null);
            setForm({ name: '', code: '', symbol: '', description: '', isDefault: false });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Currency
        </button>
      </div>

      <DataTable columns={columns} data={currencies} loading={loading} />

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCurrency ? 'Edit Currency' : 'Add Currency'}>
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency Name</label>
            <input
              type="text"
              required
              placeholder="e.g. US Dollar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency Code</label>
              <input
                type="text"
                required
                placeholder="USD"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Symbol</label>
              <input
                type="text"
                required
                placeholder="$"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              type="text"
              placeholder="Optional notes"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded text-primary-600"
            />
            <span>Set as Default Platform Currency</span>
          </label>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Save Currency
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
