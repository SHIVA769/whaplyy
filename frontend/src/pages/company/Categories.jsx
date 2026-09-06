import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const Categories = () => {
  const { activeStore } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', status: 'active' });

  const fetchCategories = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/categories', { params: { storeId: activeStore._id } });
      if (res.data?.success) setCategories(res.data.data.categories || res.data.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeStore]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, storeId: activeStore._id };
      if (editingCat) {
        await api.put(`/company/categories/${editingCat._id}`, payload);
      } else {
        await api.post('/company/categories', payload);
      }
      setIsModalOpen(false);
      setEditingCat(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete category? Products in this category will become uncategorized.')) {
      try {
        await api.delete(`/company/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const columns = [
    {
      header: 'Category Name',
      render: (c) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center font-bold text-emerald-700 text-xs">
            {c.name?.[0] || 'C'}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">/{c.slug}</span>
          </div>
        </div>
      ),
    },
    { header: 'Description', accessor: 'description' },
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
              setEditingCat(c);
              setForm({ name: c.name, slug: c.slug, description: c.description || '', icon: c.icon || '', status: c.status });
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Store Categories</h1>
          <p className="text-xs text-slate-500">Organize merchandise for intuitive customer navigation & quick filtering</p>
        </div>
        <button
          onClick={() => {
            setEditingCat(null);
            setForm({ name: '', slug: '', description: '', icon: '', status: 'active' });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </button>
      </div>

      <DataTable columns={columns} data={categories} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCat ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Minimalist Decor"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                setForm({ ...form, name, slug: form.slug || slug });
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
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
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
