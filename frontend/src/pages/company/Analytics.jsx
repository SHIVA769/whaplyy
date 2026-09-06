import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const Analytics = () => {
  const { activeStore } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  const fetchAnalytics = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/analytics', { params: { storeId: activeStore._id, range: dateRange } });
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeStore, dateRange]);

  const handleExportCSV = () => {
    if (!data?.timeline) return;
    const headers = 'Date,Revenue,Orders\n';
    const rows = data.timeline.map((t) => `"${t.date}",${t.revenue},${t.orders}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${activeStore?.slug || 'store'}-${dateRange}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Analytics & Performance Reports</h1>
          <p className="text-xs text-slate-500">Sales velocity, order conversions & category revenue distributions</p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl font-semibold"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last 12 Months</option>
          </select>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Period Revenue" value={data?.summary?.totalRevenue ?? '$0'} icon={DollarSign} color="emerald" />
        <SummaryCard title="Orders Placed" value={data?.summary?.totalOrders ?? 0} icon={ShoppingBag} color="sky" />
        <SummaryCard title="Avg Basket Size" value={data?.summary?.avgOrderValue ?? '$0'} icon={TrendingUp} color="purple" />
        <SummaryCard title="Items Sold" value={data?.summary?.itemsSold ?? 0} icon={Layers} color="amber" />
      </div>

      {/* Sales Velocity Timeline Visual */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Timeline Velocity</h3>
        <div className="h-48 flex items-end justify-between gap-2 pt-8">
          {data?.timeline?.map((item, idx) => {
            const maxRev = Math.max(...data.timeline.map((t) => t.revenue || 1), 100);
            const heightPercent = Math.max((item.revenue / maxRev) * 100, 8);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-20">
                  ${item.revenue} ({item.orders} orders)
                </div>

                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-all cursor-pointer"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[40px]">
                  {item.date?.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Revenue Products</h3>
          <div className="divide-y text-xs">
            {data?.topProducts?.map((p, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">#{idx + 1} {p.name}</span>
                <span className="font-mono font-bold text-emerald-600">${p.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Sales Share</h3>
          <div className="divide-y text-xs">
            {data?.categoryBreakdown?.map((c, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                <span className="font-mono text-slate-500">{c.percentage}% ({c.orderCount} orders)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
