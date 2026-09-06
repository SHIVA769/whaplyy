import React from 'react';

export const Tabs = ({ tabs = [], activeTab, onChange, variant = 'underline' }) => {
  if (variant === 'pills') {
    return (
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl w-full max-w-max overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
