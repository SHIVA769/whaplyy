import React, { useState, useEffect } from 'react';
import { Bell, Save, Check } from 'lucide-react';
import { VariableChipPanel } from '../../components/common/VariableChipPanel';
import { NOTIFICATION_TEMPLATE_VARS } from '../../config/constants';
import api from '../../api/axios';

export const NotificationTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [isEnabled, setIsEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/templates/notification');
      if (res.data?.success && res.data.data.length > 0) {
        setTemplates(res.data.data);
        const first = res.data.data[0];
        setSelectedTemplate(first);
        setIsEnabled(first.isEnabled);
        const langObj = first.languages?.find((l) => l.lang === 'en') || first.languages?.[0];
        setMessage(langObj?.message || '');
      }
    } catch (err) {
      console.error('Failed to load notification templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setIsEnabled(tpl.isEnabled);
    const langObj = tpl.languages?.find((l) => l.lang === activeLang) || tpl.languages?.[0];
    setMessage(langObj?.message || '');
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    const existingLangs = selectedTemplate.languages || [];
    const updatedLangs = [...existingLangs];
    const idx = updatedLangs.findIndex((l) => l.lang === activeLang);

    if (idx > -1) {
      updatedLangs[idx] = { lang: activeLang, message };
    } else {
      updatedLangs.push({ lang: activeLang, message });
    }

    try {
      const res = await api.put(`/super-admin/templates/notification/${selectedTemplate._id}`, {
        isEnabled,
        languages: updatedLangs,
      });
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save template');
    }
  };

  const charCount = message.length;
  const availableVars = selectedTemplate ? NOTIFICATION_TEMPLATE_VARS[selectedTemplate.name] || ['{company_name}', '{store_name}', '{order_number}'] : [];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notification Templates (SMS / WhatsApp / Telegram)</h1>
          <p className="text-xs text-slate-500">Configure messaging templates with dynamic order variables & character hints</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          {saveSuccess ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          {saveSuccess ? 'Saved!' : 'Save Notification'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Templates</h3>
          {templates.map((tpl) => (
            <button
              key={tpl._id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedTemplate?._id === tpl._id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <Bell className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{tpl.name}</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${tpl.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </button>
          ))}
        </div>

        {/* Center: Editor */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedTemplate?.name}</span>
            <label className="flex items-center space-x-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="rounded text-primary-600"
              />
              <span>Enable this notification</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message Content
              </label>
              <span className={`text-[11px] font-mono font-semibold ${charCount > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                {charCount} / 160 chars (1 SMS segment)
              </span>
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write notification message..."
              className="w-full p-3.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              💡 <b>Best Practice Hint:</b> Keep messages under 160 characters to optimize SMS carrier delivery rates.
            </p>
          </div>
        </div>

        {/* Right: Variables Panel */}
        <div>
          <VariableChipPanel variables={availableVars} title="Notification Variables" />
        </div>
      </div>
    </div>
  );
};
