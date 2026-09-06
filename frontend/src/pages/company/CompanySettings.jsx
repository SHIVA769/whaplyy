import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Webhook,
  Save,
  CheckCircle,
  Key,
  ShieldCheck,
  Globe,
  Sliders,
  Eye,
  Mail,
} from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';
import { VariableChipPanel } from '../../components/common/VariableChipPanel';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const CompanySettings = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Forms
  const [whatsappTemplate, setWhatsappTemplate] = useState('');
  const [telegramTemplate, setTelegramTemplate] = useState('');
  const [twilioForm, setTwilioForm] = useState({ enabled: false, accountSid: '', authToken: '', fromPhone: '' });
  const [telegramBotForm, setTelegramBotForm] = useState({ enabled: false, botToken: '', chatId: '' });
  const [webhookForm, setWebhookForm] = useState({ enabled: false, url: '', secretKey: '' });
  const [testRecipient, setTestRecipient] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/messaging-settings');
      if (res.data?.success) {
        const d = res.data.data;
        setSettings(d);
        setWhatsappTemplate(d.whatsappTemplate || '');
        setTelegramTemplate(d.telegramTemplate || '');
        setTwilioForm(d.twilio || { enabled: false, accountSid: '', authToken: '', fromPhone: '' });
        setTelegramBotForm(d.telegramBot || { enabled: false, botToken: '', chatId: '' });
        setWebhookForm(d.webhook || { enabled: false, url: '', secretKey: '' });
      }
    } catch (err) {
      console.error('Failed to load messaging settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/company/messaging-settings', {
        whatsappTemplate,
        telegramTemplate,
        twilio: twilioForm,
        telegramBot: telegramBotForm,
        webhook: webhookForm,
      });
      setSaveSuccess(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const sampleTemplate = whatsappTemplate
    .replaceAll('{store_name}', 'WonderKids Toy Land')
    .replaceAll('{order_no}', 'ORD-1001')
    .replaceAll('{customer_name}', 'Aisha Khan')
    .replaceAll('{customer_phone}', '+91 98765 43210')
    .replaceAll('{items_summary}', '1x Wooden Building Blocks')
    .replaceAll('{shipping_address}', '12 Park Street, Kolkata')
    .replaceAll('{subtotal}', '$24.00')
    .replaceAll('{discount}', '$2.00')
    .replaceAll('{shipping_cost}', '$4.00')
    .replaceAll('{tax_amount}', '$1.30')
    .replaceAll('{final_total}', '$27.30')
    .replaceAll('{order_tracking_url}', 'https://example.com/orders/ORD-1001');

  const handleSendWhatsApp = () => {
    const phone = testRecipient.replace(/\D/g, '');
    if (!phone) {
      toast.error('Enter a WhatsApp number with country code.');
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(sampleTemplate)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      toast.error('Enter a valid email address.');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await api.post('/company/messaging-settings/test-email', {
        to: testRecipient,
        message: sampleTemplate,
      });
      toast.success(res.data?.message || 'Test email sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const tabs = [
    { id: 'templates', label: '1. WhatsApp & Telegram Templates' },
    { id: 'gateways', label: '2. Twilio & Telegram Bot Keys' },
    { id: 'webhooks', label: '3. Webhooks & API Dispatch' },
  ];

  const availableVars = [
    '{store_name}',
    '{order_no}',
    '{customer_name}',
    '{customer_phone}',
    '{items_summary}',
    '{shipping_address}',
    '{subtotal}',
    '{discount}',
    '{shipping_cost}',
    '{tax_amount}',
    '{final_total}',
    '{order_tracking_url}',
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Communication & Webhook Settings</h1>
          <p className="text-xs text-slate-500">Configure WhatsApp checkout templates, Twilio SMS API & HMAC signed webhooks</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          {saveSuccess ? <CheckCircle className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          {saveSuccess ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: WhatsApp & Telegram Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Pre-filled Order Message Template
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                This exact text is generated when the customer clicks "Place Order via WhatsApp":
              </p>
              <textarea
                rows={8}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex items-center px-3 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                </button>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Email or WhatsApp number"
                  className="flex-1 min-w-[190px] p-2 text-xs bg-slate-50 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="inline-flex items-center px-3 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 disabled:opacity-60"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" /> {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Telegram Channel Order Alert Template
              </label>
              <textarea
                rows={6}
                value={telegramTemplate}
                onChange={(e) => setTelegramTemplate(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <VariableChipPanel variables={availableVars} title="Template Variables" />
          </div>
        </div>
      )}

      {/* Tab 2: Twilio & Telegram Bot Keys */}
      {activeTab === 'gateways' && (
        <div className="space-y-6 max-w-2xl">
          {/* Twilio SMS */}
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
            <label className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={twilioForm.enabled}
                onChange={(e) => setTwilioForm({ ...twilioForm, enabled: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span>Enable Twilio Automated SMS Alerts</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  value={twilioForm.accountSid}
                  onChange={(e) => setTwilioForm({ ...twilioForm, accountSid: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={twilioForm.authToken}
                  onChange={(e) => setTwilioForm({ ...twilioForm, authToken: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Twilio Sender Phone Number</label>
              <input
                type="text"
                placeholder="+18005550199"
                value={twilioForm.fromPhone}
                onChange={(e) => setTwilioForm({ ...twilioForm, fromPhone: e.target.value })}
                className="w-full sm:w-1/2 p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Telegram Bot */}
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 text-xs">
            <label className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <input
                type="checkbox"
                checked={telegramBotForm.enabled}
                onChange={(e) => setTelegramBotForm({ ...telegramBotForm, enabled: e.target.checked })}
                className="rounded text-sky-600"
              />
              <span>Enable Telegram Channel Bot Alerts</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Telegram Bot Token</label>
                <input
                  type="password"
                  placeholder="bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={telegramBotForm.botToken}
                  onChange={(e) => setTelegramBotForm({ ...telegramBotForm, botToken: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Channel / Group Chat ID</label>
                <input
                  type="text"
                  placeholder="@mystoreorders or -100123456789"
                  value={telegramBotForm.chatId}
                  onChange={(e) => setTelegramBotForm({ ...telegramBotForm, chatId: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 text-xs max-w-2xl">
          <label className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
            <input
              type="checkbox"
              checked={webhookForm.enabled}
              onChange={(e) => setWebhookForm({ ...webhookForm, enabled: e.target.checked })}
              className="rounded text-purple-600"
            />
            <span>Enable Outgoing Order Webhooks (Zapier / Make / Custom Server)</span>
          </label>

          <div>
            <label className="block font-semibold mb-1">Payload Target URL</label>
            <input
              type="url"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={webhookForm.url}
              onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">HMAC SHA-256 Signing Secret</label>
            <input
              type="password"
              placeholder="whsec_••••••••"
              value={webhookForm.secretKey}
              onChange={(e) => setWebhookForm({ ...webhookForm, secretKey: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
            />
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Message Preview</h2>
              <button type="button" onClick={() => setPreviewOpen(false)} className="text-xs text-slate-500 hover:text-slate-900">Close</button>
            </div>
            <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-xs text-slate-700 dark:text-slate-200">{sampleTemplate || 'Enter a template to preview it.'}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
