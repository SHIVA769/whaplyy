import React, { useState } from 'react';
import { Search, Filter, Download, LayoutGrid, List, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filterComponents,
  onApplyFilters,
  onResetFilters,
  pagination,
  onPageChange,
  showViewToggle = false,
  viewMode = 'list',
  onViewModeChange,
  exportFilename = 'export.csv',
  actions,
  renderGridItem,
  emptyMessage = 'No records found.',
}) => {
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = columns.map((col) => col.header).join(',');
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          let val = col.accessor ? item[col.accessor] : '';
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          return `"${String(val || '').replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', exportFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Buttons & Toggles */}
        <div className="flex items-center flex-wrap gap-2">
          {filterComponents && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`inline-flex items-center px-3 py-2 text-xs font-medium border rounded-lg transition-colors ${
                showFiltersPanel
                  ? 'bg-primary-50 text-primary-600 border-primary-300 dark:bg-primary-950/40 dark:border-primary-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filters
            </button>
          )}

          {showViewToggle && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onViewModeChange && onViewModeChange('list')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange && onViewModeChange('grid')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </button>

          {actions}
        </div>
      </div>

      {/* Expandable Filters Panel */}
      {filterComponents && showFiltersPanel && (
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">{filterComponents}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetFilters}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
            <button
              onClick={onApplyFilters}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Table Body / Grid Body */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-3" />
          <p className="text-sm">Loading records...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      ) : viewMode === 'grid' && renderGridItem ? (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
          {data.map(renderGridItem)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
                {columns.map((col, i) => (
                  <th key={i} className={`p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row, rowIdx) => (
                <tr key={row._id || rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </span>
          <div className="flex items-center space-x-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-800 dark:text-white">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
