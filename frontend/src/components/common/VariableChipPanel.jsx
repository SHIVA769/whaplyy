import React, { useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';

export const VariableChipPanel = ({ variables = [], title = 'Dynamic Variables' }) => {
  const [copiedVar, setCopiedVar] = useState(null);

  const handleCopy = (variableName) => {
    navigator.clipboard.writeText(variableName);
    setCopiedVar(variableName);
    setTimeout(() => setCopiedVar(null), 1800);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary-500" />
        <span>{title}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Click any variable chip below to copy it to your clipboard for pasting into the template editor:
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((v) => {
          const isCopied = copiedVar === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => handleCopy(v)}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                isCopied
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600 shadow-2xs'
              }`}
              title="Click to copy"
            >
              <span>{v}</span>
              {isCopied ? (
                <Check className="w-3 h-3 ml-1 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 ml-1 opacity-50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
