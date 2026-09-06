import React, { useEffect, useState } from 'react';
import { ExternalLink, Megaphone, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

const emptyForm = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  status: 'active',
  startAt: '',
  endAt: '',
  sortOrder: 0,
};

const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

export const Advertisements = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/advertisements');
      if (res.data?.success) setAds(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreate = () => {
    setEditingAd(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setForm({
      title: ad.title || '',
      description: ad.description || '',
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      status: ad.status || 'active',
      startAt: toInputDate(ad.startAt),
      endAt: toInputDate(ad.endAt),
      sortOrder: ad.sortOrder || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
      startAt: form.startAt || null,
      endAt: form.endAt || null,
    };

    try {
      if (editingAd) {
        await api.put(`/super-admin/advertisements/${editingAd._id}`, payload);
      } else {
        await api.post('/super-admin/advertisements', payload);
      }
      setIsModalOpen(false);
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save advertisement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete "${ad.title}" permanently?`)) return;
    try {
      await api.delete(`/super-admin/advertisements/${ad._id}`);
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete advertisement');
    }
  };

  const handleToggle = async (ad) => {
    try {
      await api.put(`/super-admin/advertisements/${ad._id}`, { status: ad.status === 'active' ? 'inactive' : 'active' });
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update advertisement');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-sky-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Advertisements</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Promote offers and campaigns across every active product website.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Advertisement
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Ads</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ads.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Live Ads</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{ads.filter((ad) => ad.status === 'active').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Clicks</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ads.reduce((total, ad) => total + (ad.clicks || 0), 0)}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading advertisements...</div>
      ) : ads.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No advertisements yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first marketplace-style promotion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ads.map((ad) => (
            <div key={ad._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col sm:flex-row">
              <img src={ad.imageUrl} alt={ad.title} className="w-full sm:w-44 h-36 sm:h-auto object-cover bg-slate-100" />
              <div className="p-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate">{ad.title}</h2>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ad.description || 'No description'}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${ad.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {ad.status === 'active' ? 'Live' : 'Paused'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-4 text-[10px] text-slate-400">
                  <span>{ad.clicks || 0} clicks</span>
                  <span>Priority {ad.sortOrder || 0}</span>
                  {ad.linkUrl && <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:underline"><ExternalLink className="w-3 h-3" /> Destination</a>}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => openEdit(ad)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleToggle(ad)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-600" title={ad.status === 'active' ? 'Pause ad' : 'Activate ad'}><Power className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(ad)} className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50" title="Delete ad"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAd ? 'Edit Advertisement' : 'Add Advertisement'}>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" placeholder="Summer sale" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Image URL *</label>
            <input required type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" placeholder="https://example.com/banner.jpg" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" placeholder="Short message shown with the promotion" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Destination URL</label>
            <input type="url" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" placeholder="https://example.com/offer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Starts</label><input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} className="w-full px-2 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" /></div>
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ends</label><input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} className="w-full px-2 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label><input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" /></div>
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button disabled={saving} type="submit" className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg">{saving ? 'Saving...' : editingAd ? 'Save Changes' : 'Create Advertisement'}</button></div>
        </form>
      </Modal>
    </div>
  );
};
