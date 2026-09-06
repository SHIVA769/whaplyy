import React, { useState, useEffect } from 'react';
import { Mail, Save, Check, Copy } from 'lucide-react';
import { VariableChipPanel } from '../../components/common/VariableChipPanel';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import { EMAIL_TEMPLATE_VARS } from '../../config/constants';
import api from '../../api/axios';

export const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [senderName, setSenderName] = useState('WhatsStore Notification');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/templates/email');
      if (res.data?.success && res.data.data.length > 0) {
        setTemplates(res.data.data);
        const first = res.data.data[0];
        setSelectedTemplate(first);
        setSenderName(first.senderName || 'WhatsStore Notification');
        const langObj = first.languages?.find((l) => l.lang === 'en') || first.languages?.[0];
        setSubject(langObj?.subject || '');
        setBody(langObj?.body || '');
      }
    } catch (err) {
      console.error('Failed to load email templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setSenderName(tpl.senderName || 'WhatsStore Notification');
    const langObj = tpl.languages?.find((l) => l.lang === activeLang) || tpl.languages?.[0];
    setSubject(langObj?.subject || '');
    setBody(langObj?.body || '');
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    const existingLangs = selectedTemplate.languages || [];
    const updatedLangs = [...existingLangs];
    const idx = updatedLangs.findIndex((l) => l.lang === activeLang);

    if (idx > -1) {
      updatedLangs[idx] = { lang: activeLang, subject, body };
    } else {
      updatedLangs.push({ lang: activeLang, subject, body });
    }

    try {
      const res = await api.put(`/super-admin/templates/email/${selectedTemplate._id}`, {
        senderName,
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

  const availableVars = selectedTemplate ? EMAIL_TEMPLATE_VARS[selectedTemplate.name] || ['{app_name}', '{order_number}', '{customer_name}'] : [];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email Notification Templates</h1>
          <p className="text-xs text-slate-500">Customize automated transactional customer and store owner emails</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          {saveSuccess ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          {saveSuccess ? 'Saved!' : 'Save Template'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Template Selector List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System Templates</h3>
          {templates.map((tpl) => (
            <button
              key={tpl._id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors ${
                selectedTemplate?._id === tpl._id
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{tpl.name}</span>
            </button>
          ))}
        </div>

        {/* Center: Editor Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Template Name</label>
              <input
                type="text"
                disabled
                value={selectedTemplate?.name || ''}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded-lg text-slate-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sender Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rich Text Email Body</label>
            <RichTextEditor value={body} onChange={setBody} rows={10} />
          </div>
        </div>

        {/* Right: Context-Aware Variables Panel */}
        <div className="space-y-4">
          <VariableChipPanel variables={availableVars} title="Template Variables" />
        </div>
      </div>
    </div>
  );
};
