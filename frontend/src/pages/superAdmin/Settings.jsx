import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Palette,
  Coins,
  Mail,
  CreditCard,
  HardDrive,
  Shield,
  Bot,
  Cookie,
  Search as SearchIcon,
  RotateCcw,
  Save,
  Send,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios';

export const Settings = () => {
  const [activeSection, setActiveSection] = useState('system');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Forms
  const [systemForm, setSystemForm] = useState({});
  const [brandForm, setBrandForm] = useState({});
  const [currencyForm, setCurrencyForm] = useState({});
  const [emailForm, setEmailForm] = useState({});
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState('');
  const [storageForm, setStorageForm] = useState({});
  const [recaptchaForm, setRecaptchaForm] = useState({});
  const [chatgptForm, setChatgptForm] = useState({});
  const [cookieForm, setCookieForm] = useState({});
  const [seoForm, setSeoForm] = useState({});
  const [gateways, setGateways] = useState([]);
  const [gatewaySearch, setGatewaySearch] = useState('');
  const [cacheStats, setCacheStats] = useState({ sizeKB: '0 KB', totalEntries: 0 });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/settings');
      if (res.data?.success) {
        const d = res.data.data;
        setSettings(d);
        setSystemForm(d.system || {});
        setBrandForm(d.brand || {});
        setCurrencyForm(d.currency || {});
        setEmailForm(d.email || {});
        setStorageForm(d.storage || {});
        setRecaptchaForm(d.recaptcha || {});
        setChatgptForm(d.chatgpt || {});
        setCookieForm(d.cookie || {});
        setSeoForm(d.seo || {});
        setGateways(d.gateways || []);
        setCacheStats(d.cache || {});
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (sectionKey, payload) => {
    try {
      let endpoint = `/super-admin/settings/${sectionKey}`;
      await api.put(endpoint, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      fetchSettings();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to save ${sectionKey} settings`);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) return alert('Enter recipient email');
    setTestEmailStatus('sending');
    try {
      const res = await api.post('/super-admin/settings/email/test', { to: testEmailTo });
      setTestEmailStatus('success');
      alert(res.data?.message || 'Test email dispatched!');
    } catch (err) {
      setTestEmailStatus('error');
      alert(err.response?.data?.message || 'Test email failed');
    }
  };

  const handleSaveGateway = async (gatewayId, isEnabled, config) => {
    try {
      await api.put('/super-admin/settings/payments', { gateway: gatewayId, isEnabled, config });
      alert(`${gatewayId} settings saved successfully!`);
      fetchSettings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save payment gateway');
    }
  };

  const handleClearCache = async () => {
    try {
      const res = await api.post('/super-admin/settings/cache/clear');
      if (res.data?.success) {
        setCacheStats(res.data.data);
        alert('All application, route, view, and config caches cleared successfully!');
      }
    } catch (err) {
      alert('Failed to clear cache');
    }
  };

  const menuItems = [
    { id: 'system', label: 'System Settings', icon: Sliders },
    { id: 'brand', label: 'Brand & White-Label', icon: Palette },
    { id: 'currency', label: 'Currency Formatting', icon: Coins },
    { id: 'email', label: 'Email (SMTP)', icon: Mail },
    { id: 'payments', label: 'Payment Gateways (20+)', icon: CreditCard },
    { id: 'storage', label: 'Storage Drivers (S3/Wasabi)', icon: HardDrive },
    { id: 'recaptcha', label: 'reCAPTCHA Protection', icon: Shield },
    { id: 'chatgpt', label: 'ChatGPT AI Assistant', icon: Bot },
    { id: 'cookie', label: 'Cookie Compliance', icon: Cookie },
    { id: 'seo', label: 'SEO & Social Meta', icon: SearchIcon },
    { id: 'cache', label: 'Cache Manager', icon: RotateCcw },
  ];

  if (loading || !settings) {
    return <div className="p-12 text-center text-slate-400">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
        <p className="text-xs text-slate-500">Configure global platform defaults, white-label branding & payment credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Navigation Sub-Menu */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1 h-fit">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Form Container */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* 1. System Settings */}
          {activeSection === 'system' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">System Defaults</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Default Platform Timezone</label>
                  <input
                    type="text"
                    value={systemForm.defaultTimezone || 'UTC'}
                    onChange={(e) => setSystemForm({ ...systemForm, defaultTimezone: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Date Format</label>
                  <select
                    value={systemForm.dateFormat || 'YYYY-MM-DD'}
                    onChange={(e) => setSystemForm({ ...systemForm, dateFormat: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-16)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (16-08-2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (08/16/2026)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="flex items-center space-x-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={systemForm.emailVerification}
                    onChange={(e) => setSystemForm({ ...systemForm, emailVerification: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span>Enforce Email Verification on New Registrations</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={systemForm.userRegistrationEnabled}
                    onChange={(e) => setSystemForm({ ...systemForm, userRegistrationEnabled: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span>Allow Public User & Merchant Registrations</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={systemForm.landingPageEnabled}
                    onChange={(e) => setSystemForm({ ...systemForm, landingPageEnabled: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  <span>Enable Public Marketing Landing Page</span>
                </label>
              </div>

              <button
                onClick={() => handleSave('system', systemForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save System Settings
              </button>
            </div>
          )}

          {/* 2. Brand Settings */}
          {activeSection === 'brand' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Brand & Theme Styling</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Platform Title Text</label>
                  <input
                    type="text"
                    value={brandForm.titleText || ''}
                    onChange={(e) => setBrandForm({ ...brandForm, titleText: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={brandForm.footerText || ''}
                    onChange={(e) => setBrandForm({ ...brandForm, footerText: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Sidebar Variant</label>
                <select
                  value={brandForm.sidebarVariant || 'inset'}
                  onChange={(e) => setBrandForm({ ...brandForm, sidebarVariant: e.target.value })}
                  className="w-full sm:w-1/2 p-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="inset">Inset (Modern Default)</option>
                  <option value="floating">Floating Island</option>
                  <option value="minimal">Minimal Collapsed</option>
                </select>
              </div>

              <button
                onClick={() => handleSave('brand', brandForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Brand Settings
              </button>
            </div>
          )}

          {/* 3. Currency Settings */}
          {activeSection === 'currency' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Currency Formatting & Live Preview</h3>

              {/* Live Preview Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Live Price Format Preview:</span>
                  <span className="text-2xl font-black text-primary-600 font-mono">
                    {currencyForm.symbolPosition === 'after'
                      ? `1,299${currencyForm.decimalSeparator || '.'}50${currencyForm.symbol || '₹'}`
                      : `${currencyForm.symbol || '₹'}1,299${currencyForm.decimalSeparator || '.'}50`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Default Symbol</label>
                  <input
                    type="text"
                    value={currencyForm.symbol || '₹'}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Symbol Position</label>
                  <select
                    value={currencyForm.symbolPosition || 'before'}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbolPosition: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="before">Before ($100)</option>
                    <option value="after">After (100$)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Decimal Separator</label>
                  <select
                    value={currencyForm.decimalSeparator || '.'}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, decimalSeparator: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value=".">Dot (.)</option>
                    <option value=",">Comma (,)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleSave('currency', currencyForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Currency Formats
              </button>
            </div>
          )}

          {/* 4. Email Settings & Test */}
          {activeSection === 'email' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">SMTP Mail Server</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={emailForm.host || ''}
                    onChange={(e) => setEmailForm({ ...emailForm, host: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={emailForm.port || 587}
                    onChange={(e) => setEmailForm({ ...emailForm, port: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={emailForm.username || ''}
                    onChange={(e) => setEmailForm({ ...emailForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">SMTP Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={emailForm.password || ''}
                    onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Send Test Email</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="flex-1 p-2 text-xs bg-white dark:bg-slate-800 border rounded-lg"
                  />
                  <button
                    onClick={handleSendTestEmail}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center"
                  >
                    <Send className="w-3 h-3 mr-1" /> Send Test
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleSave('email', emailForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Email Settings
              </button>
            </div>
          )}

          {/* 5. Payment Gateways (20+ Gateways) */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Gateway Adapters (20+)</h3>
                  <p className="text-[11px] text-slate-400">All credentials encrypted at rest with AES-256 and masked on read</p>
                </div>
                <input
                  type="text"
                  placeholder="Filter gateways..."
                  value={gatewaySearch}
                  onChange={(e) => setGatewaySearch(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {gateways
                  .filter((g) => g.name.toLowerCase().includes(gatewaySearch.toLowerCase()))
                  .map((gateway) => (
                    <div key={gateway.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{gateway.name}</span>
                        <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gateway.isEnabled}
                            onChange={(e) => {
                              const copy = [...gateways];
                              const target = copy.find((x) => x.id === gateway.id);
                              if (target) target.isEnabled = e.target.checked;
                              setGateways(copy);
                            }}
                            className="rounded text-primary-600"
                          />
                          <span>{gateway.isEnabled ? 'Enabled' : 'Disabled'}</span>
                        </label>
                      </div>

                      {gateway.fields && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {gateway.fields.map((f) => (
                            <div key={f.key}>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">{f.label}</label>
                              <input
                                type={f.type === 'password' ? 'password' : 'text'}
                                placeholder={f.label}
                                value={gateway.config?.[f.key] || ''}
                                onChange={(e) => {
                                  const copy = [...gateways];
                                  const target = copy.find((x) => x.id === gateway.id);
                                  if (target) {
                                    target.config = { ...(target.config || {}), [f.key]: e.target.value };
                                  }
                                  setGateways(copy);
                                }}
                                className="w-full p-2 bg-white dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveGateway(gateway.id, gateway.isEnabled, gateway.config)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg"
                        >
                          Save {gateway.name}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 6. Storage Drivers */}
          {activeSection === 'storage' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Storage Drivers</h3>
              <div className="flex items-center space-x-2">
                {['local', 's3', 'wasabi'].map((drv) => (
                  <button
                    key={drv}
                    type="button"
                    onClick={() => setStorageForm({ ...storageForm, activeDriver: drv })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize border ${
                      storageForm.activeDriver === drv ? 'bg-primary-50 text-primary-700 border-primary-500' : 'border-slate-200'
                    }`}
                  >
                    {drv} Storage Driver
                  </button>
                ))}
              </div>

              {storageForm.activeDriver === 's3' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">S3 Access Key ID</label>
                    <input
                      type="text"
                      value={storageForm.s3Config?.accessKeyId || ''}
                      onChange={(e) => setStorageForm({ ...storageForm, s3Config: { ...storageForm.s3Config, accessKeyId: e.target.value } })}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">S3 Bucket Name</label>
                    <input
                      type="text"
                      value={storageForm.s3Config?.bucket || ''}
                      onChange={(e) => setStorageForm({ ...storageForm, s3Config: { ...storageForm.s3Config, bucket: e.target.value } })}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => handleSave('storage', storageForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Storage Driver
              </button>
            </div>
          )}

          {/* 7. ReCaptcha */}
          {activeSection === 'recaptcha' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Google reCAPTCHA Security</h3>
              <label className="flex items-center space-x-2 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={recaptchaForm.isEnabled}
                  onChange={(e) => setRecaptchaForm({ ...recaptchaForm, isEnabled: e.target.checked })}
                  className="rounded text-primary-600"
                />
                <span>Enable reCAPTCHA on Auth Forms</span>
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Site Key</label>
                  <input
                    type="text"
                    value={recaptchaForm.siteKey || ''}
                    onChange={(e) => setRecaptchaForm({ ...recaptchaForm, siteKey: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Secret Key</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={recaptchaForm.secretKey || ''}
                    onChange={(e) => setRecaptchaForm({ ...recaptchaForm, secretKey: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave('recaptcha', recaptchaForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save reCAPTCHA
              </button>
            </div>
          )}

          {/* 8. ChatGPT AI */}
          {activeSection === 'chatgpt' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">OpenAI ChatGPT Integration</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    placeholder="sk-••••••••"
                    value={chatgptForm.apiKey || ''}
                    onChange={(e) => setChatgptForm({ ...chatgptForm, apiKey: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Model Name</label>
                  <select
                    value={chatgptForm.modelName || 'gpt-3.5-turbo'}
                    onChange={(e) => setChatgptForm({ ...chatgptForm, modelName: e.target.value })}
                    className="w-full sm:w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4o">GPT-4o</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleSave('chatgpt', chatgptForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save AI Key
              </button>
            </div>
          )}

          {/* 9. Cookie Compliance */}
          {activeSection === 'cookie' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Cookie Privacy Settings</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Cookie Banner Title</label>
                  <input
                    type="text"
                    value={cookieForm.title || ''}
                    onChange={(e) => setCookieForm({ ...cookieForm, title: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cookie Description</label>
                  <textarea
                    rows={3}
                    value={cookieForm.description || ''}
                    onChange={(e) => setCookieForm({ ...cookieForm, description: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave('cookie', cookieForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Cookie Settings
              </button>
            </div>
          )}

          {/* 10. SEO */}
          {activeSection === 'seo' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Global SEO & SERP Preview</h3>

              {/* SERP Preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border rounded-xl text-left space-y-1">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">https://whatsstore.io</span>
                <h4 className="text-base font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">
                  {seoForm.metaTitle || 'WhatsStore — Multi-Tenant WhatsApp Store Builder'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {seoForm.metaDescription || 'Build and launch high-converting WhatsApp stores with 7 themes, custom domains & instant checkout.'}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Meta Title (50-60 chars)</label>
                  <input
                    type="text"
                    value={seoForm.metaTitle || ''}
                    onChange={(e) => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta Description (120-160 chars)</label>
                  <textarea
                    rows={3}
                    value={seoForm.metaDescription || ''}
                    onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave('seo', seoForm)}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save SEO Settings
              </button>
            </div>
          )}

          {/* 11. Cache Manager */}
          {activeSection === 'cache' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2">Cache Memory Manager</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold">Active In-Memory Cache Footprint:</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{cacheStats.sizeKB || '0 KB'}</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Total Cached Objects: {cacheStats.totalEntries || 0}</span>
                </div>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center shadow-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" /> Purge & Clear Cache
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
