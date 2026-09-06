import React, { useState } from 'react';
import { Globe, Search, Save, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ManageLanguages = () => {
  const { activeLanguages, dictionary, updateTranslationKey } = useLanguage();
  const [selectedLang, setSelectedLang] = useState('en');
  const [search, setSearch] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const langDictionary = dictionary[selectedLang] || dictionary.en || {};
  const allKeys = Object.keys(dictionary.en || {});

  const filteredKeys = allKeys.filter((k) =>
    k.toLowerCase().includes(search.toLowerCase()) ||
    (langDictionary[k] || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleLabelChange = (key, val) => {
    updateTranslationKey(selectedLang, key, val);
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Language & Translation Manager</h1>
          <p className="text-xs text-slate-500">Manage multi-language translation strings and localized UI labels</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          {saveSuccess ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          {saveSuccess ? 'Saved!' : 'Save Language Strings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Panel: Language Selection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Languages</h3>
          {activeLanguages.map((l) => (
            <button
              key={l.code}
              onClick={() => setSelectedLang(l.code)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
                selectedLang === l.code
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">{l.flag}</span>
                <span>{l.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {l.code}
              </span>
            </button>
          ))}
        </div>

        {/* Right Panel: Translation Key / Label Editor */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search translation key or text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredKeys.length} translation strings
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto pr-1">
            {filteredKeys.map((key) => (
              <div key={key} className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{key}</span>
                  <p className="text-[11px] text-slate-400 italic truncate">Default: {dictionary.en?.[key] || key}</p>
                </div>
                <input
                  type="text"
                  value={langDictionary[key] || ''}
                  onChange={(e) => handleLabelChange(key, e.target.value)}
                  placeholder={`Translate '${key}'...`}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
