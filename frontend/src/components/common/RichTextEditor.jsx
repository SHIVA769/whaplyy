import React, { useState } from 'react';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code, Link as LinkIcon, Eye, Edit3 } from 'lucide-react';

export const RichTextEditor = ({ value = '', onChange, placeholder = 'Write details here...', rows = 6 }) => {
  const [previewMode, setPreviewMode] = useState(false);

  const insertFormatting = (prefix, suffix = '') => {
    const textarea = document.getElementById('rich-text-area');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex-wrap gap-1">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('### ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
            title="Heading"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n• ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n1. ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('[', '](https://)')}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          {previewMode ? (
            <>
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 mr-1" /> Preview
            </>
          )}
        </button>
      </div>

      {/* Editor / Preview Area */}
      {previewMode ? (
        <div className="p-4 min-h-[160px] prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50 whitespace-pre-wrap">
          {value || <span className="text-slate-400 italic">No content to preview</span>}
        </div>
      ) : (
        <textarea
          id="rich-text-area"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 text-sm bg-transparent focus:outline-none text-slate-900 dark:text-white resize-y font-sans"
        />
      )}
    </div>
  );
};
