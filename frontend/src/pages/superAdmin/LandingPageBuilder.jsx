import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Save,
  Eye,
  Sliders,
  Palette,
  Layers,
  Code,
  FileText,
  Users,
  MessageSquare,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

export const LandingPageBuilder = () => {
  const [activeMainTab, setActiveMainTab] = useState('builder');
  const [activeBuilderTab, setActiveBuilderTab] = useState('setup');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sub-modules
  const [customPages, setCustomPages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [pageForm, setPageForm] = useState({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '', isActive: true });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cfgRes, pagesRes, subsRes, contactsRes] = await Promise.all([
        api.get('/super-admin/landing-builder'),
        api.get('/super-admin/custom-pages'),
        api.get('/super-admin/subscribers'),
        api.get('/super-admin/contacts'),
      ]);
      if (cfgRes.data?.success) setConfig(cfgRes.data.data);
      if (pagesRes.data?.success) setCustomPages(pagesRes.data.data);
      if (subsRes.data?.success) setSubscribers(subsRes.data.data);
      if (contactsRes.data?.success) setContacts(contactsRes.data.data);
    } catch (err) {
      console.error('Failed to load landing builder data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveConfig = async () => {
    try {
      const res = await api.post('/super-admin/landing-builder', config);
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save landing builder config');
    }
  };

  const handleCreateCustomPage = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/custom-pages', pageForm);
      setIsPageModalOpen(false);
      setPageForm({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '', isActive: true });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create page');
    }
  };

  const handleDeletePage = async (id) => {
    if (window.confirm('Delete custom page?')) {
      try {
        await api.delete(`/super-admin/custom-pages/${id}`);
        fetchAll();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await api.delete(`/super-admin/contacts/${id}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const mainTabs = [
    { id: 'builder', label: 'Landing Page Builder' },
    { id: 'custom-pages', label: 'Custom Pages', badge: customPages.length },
    { id: 'subscribers', label: 'Newsletter Subscribers', badge: subscribers.length },
    { id: 'contacts', label: 'Contact Inquiries', badge: contacts.length },
  ];

  const builderTabs = [
    { id: 'setup', label: '1. Setup & Order' },
    { id: 'layout', label: '2. Header, Hero & Footer' },
    { id: 'content', label: '3. Features, Gallery & Themes' },
    { id: 'social', label: '4. Team & Testimonials' },
    { id: 'engagement', label: '5. FAQ, Newsletter & Contact' },
  ];

  if (loading || !config) {
    return <div className="p-12 text-center text-slate-400">Loading Landing Page Builder...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Landing Page & Content Builder</h1>
          <p className="text-xs text-slate-500">Visual drag-and-drop landing page editor, custom pages & leads database</p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Live Preview
          </a>
          <button
            onClick={handleSaveConfig}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            {saveSuccess ? <CheckCircle className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            {saveSuccess ? 'Changes Saved!' : 'Save All Settings'}
          </button>
        </div>
      </div>

      <Tabs tabs={mainTabs} activeTab={activeMainTab} onChange={setActiveMainTab} />

      {/* Main Tab 1: Builder */}
      {activeMainTab === 'builder' && (
        <div className="space-y-6">
          <Tabs tabs={builderTabs} activeTab={activeBuilderTab} onChange={setActiveBuilderTab} variant="pills" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor Canvas (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              {/* 1. Setup & Order */}
              {activeBuilderTab === 'setup' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">General Brand Info</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Company Name</label>
                        <input
                          type="text"
                          value={config.setup.companyName}
                          onChange={(e) => setConfig({ ...config, setup: { ...config.setup, companyName: e.target.value } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Support Email</label>
                        <input
                          type="email"
                          value={config.setup.email}
                          onChange={(e) => setConfig({ ...config, setup: { ...config.setup, email: e.target.value } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Theme Accent Presets</h3>
                    <div className="flex items-center space-x-2">
                      {['#0284c7', '#16a34a', '#7c3aed', '#e11d48', '#d97706'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setConfig({ ...config, setup: { ...config.setup, primaryColor: color } })}
                          style={{ backgroundColor: color }}
                          className={`w-8 h-8 rounded-full border-2 ${config.setup.primaryColor === color ? 'border-white ring-2 ring-slate-900' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Advanced CSS / JS */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Advanced Custom Styling & Script Sandboxing</span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Custom CSS</label>
                      <textarea
                        rows={3}
                        value={config.setup.customCSS || ''}
                        onChange={(e) => setConfig({ ...config, setup: { ...config.setup, customCSS: e.target.value } })}
                        placeholder="/* Custom CSS overrides */"
                        className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Custom JS</label>
                      <textarea
                        rows={3}
                        value={config.setup.customJS || ''}
                        onChange={(e) => setConfig({ ...config, setup: { ...config.setup, customJS: e.target.value } })}
                        placeholder="// Custom tracking or analytics snippets"
                        className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Layout */}
              {activeBuilderTab === 'layout' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Hero Section Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hero Title</label>
                        <input
                          type="text"
                          value={config.layout.hero.title}
                          onChange={(e) => setConfig({ ...config, layout: { ...config.layout, hero: { ...config.layout.hero, title: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Hero Subtitle</label>
                        <textarea
                          rows={2}
                          value={config.layout.hero.subtitle}
                          onChange={(e) => setConfig({ ...config, layout: { ...config.layout, hero: { ...config.layout.hero, subtitle: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Primary Button Text</label>
                          <input
                            type="text"
                            value={config.layout.hero.primaryButtonText}
                            onChange={(e) => setConfig({ ...config, layout: { ...config.layout, hero: { ...config.layout.hero, primaryButtonText: e.target.value } } })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Hero Image URL</label>
                          <input
                            type="text"
                            value={config.layout.hero.heroImage}
                            onChange={(e) => setConfig({ ...config, layout: { ...config.layout, hero: { ...config.layout.hero, heroImage: e.target.value } } })}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                          />
                        </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Hero Video URL</label>
                            <input
                              type="url"
                              value={config.layout.hero.heroVideo || ''}
                              onChange={(e) => setConfig({ ...config, layout: { ...config.layout, hero: { ...config.layout.hero, heroVideo: e.target.value } } })}
                              placeholder="/uploads/hero-demo.mp4"
                              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                            />
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Content */}
              {activeBuilderTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Features Grid</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Features Heading</label>
                        <input
                          type="text"
                          value={config.content.features.title}
                          onChange={(e) => setConfig({ ...config, content: { ...config.content, features: { ...config.content.features, title: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={config.content.features.description}
                          onChange={(e) => setConfig({ ...config, content: { ...config.content, features: { ...config.content.features, description: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Social & Reviews */}
              {activeBuilderTab === 'social' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Testimonials & Social Proof</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Reviews Title</label>
                        <input
                          type="text"
                          value={config.social.reviews.title}
                          onChange={(e) => setConfig({ ...config, social: { ...config.social, reviews: { ...config.social.reviews, title: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Engagement */}
              {activeBuilderTab === 'engagement' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">FAQ & Contact Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">FAQ Section Title</label>
                        <input
                          type="text"
                          value={config.engagement.faq.title}
                          onChange={(e) => setConfig({ ...config, engagement: { ...config.engagement, faq: { ...config.engagement.faq, title: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Newsletter Title</label>
                        <input
                          type="text"
                          value={config.engagement.newsletter.title}
                          onChange={(e) => setConfig({ ...config, engagement: { ...config.engagement, newsletter: { ...config.engagement.newsletter, title: e.target.value } } })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Visual Snapshot Panel */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Live Landing Snapshot</h3>
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 space-y-3 text-left">
                <div className="h-6 w-20 bg-sky-500 rounded font-bold text-[10px] text-white flex items-center justify-center">
                  LOGO
                </div>
                <h4 className="text-sm font-extrabold leading-tight text-white">{config.layout.hero.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-3">{config.layout.hero.subtitle}</p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-sky-500 text-white rounded text-[10px] font-bold">
                    {config.layout.hero.primaryButtonText}
                  </span>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-[10px]">
                    Explore Themes
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 pt-2">
                <p>✓ 15 Meticulously tuned landing sections</p>
                <p>✓ Instant live preview synchronization</p>
                <p>✓ Automated lead routing to CRM database</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Custom Pages */}
      {activeMainTab === 'custom-pages' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsPageModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Custom Page
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Page Title</th>
                  <th className="px-4 py-3">URL Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {customPages.map((page) => (
                  <tr key={page._id}>
                    <td className="px-4 py-3 font-bold">{page.title}</td>
                    <td className="px-4 py-3 font-mono text-primary-600">/pages/{page.slug}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {page.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(page.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeletePage(page._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Tab 3: Subscribers */}
      {activeMainTab === 'subscribers' && (
        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3">Subscriber Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscribed At</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {subscribers.map((s) => (
                <tr key={s._id}>
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(s.subscribedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Tab 4: Contact Inquiries */}
      {activeMainTab === 'contacts' && (
        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3">Sender Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {contacts.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-bold">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email}</td>
                  <td className="px-4 py-3 font-medium">{c.subject}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{c.message}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteContact(c._id)} className="p-1.5 text-rose-600 hover:text-rose-900">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Custom Page Modal */}
      <Modal isOpen={isPageModalOpen} onClose={() => setIsPageModalOpen(false)} title="Create Custom Page" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateCustomPage} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Page Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Terms of Service"
              value={pageForm.title}
              onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Slug (optional)</label>
            <input
              type="text"
              placeholder="terms-of-service"
              value={pageForm.slug}
              onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rich Text Content</label>
            <RichTextEditor value={pageForm.content} onChange={(val) => setPageForm({ ...pageForm, content: val })} rows={8} />
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsPageModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Save Page
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
