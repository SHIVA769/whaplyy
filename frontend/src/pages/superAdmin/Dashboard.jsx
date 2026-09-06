import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Store,
  CreditCard,
  TrendingUp,
  DollarSign,
  RotateCcw,
  Activity,
  ArrowUpRight,
  Shield,
  Share2,
  Settings,
} from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard';
import api from '../../api/axios';

export const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load super admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Dashboard</h1>
          <p className="text-xs text-slate-500">Live platform telemetry, subscription performance & growth metrics</p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors"
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Companies"
          value={data?.summaryCards?.totalCompanies ?? 0}
          icon={Building2}
          color="sky"
        />
        <SummaryCard
          title="Total Stores"
          value={data?.summaryCards?.totalStores ?? 0}
          icon={Store}
          color="emerald"
        />
        <SummaryCard
          title="Active Plans"
          value={data?.summaryCards?.activePlans ?? 0}
          icon={CreditCard}
          color="purple"
        />
        <SummaryCard
          title="Monthly Growth"
          value={data?.summaryCards?.monthlyGrowth ?? '0%'}
          icon={TrendingUp}
          color="amber"
          isPositive={true}
        />
        <SummaryCard
          title="Total Revenue"
          value={data?.summaryCards?.totalRevenue ?? '$0'}
          icon={DollarSign}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Activity Live Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Activity Live Feed</h3>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-600">
              Live Real-Time
            </span>
          </div>

          <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
            {data?.activityFeed?.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      item.status === 'success' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.time).toLocaleDateString()} at {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Plan Ranking */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Plan Performance Ranking</h3>
          </div>

          <div className="space-y-3">
            {data?.planRankings?.map((p, idx) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-400 font-mono">#{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{p.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ${p.monthlyPrice}/mo • {p.subscribers} active subscribers
                  </p>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${p.monthlyRevenue?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Overview Quick Links */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md">
        <h3 className="text-sm font-bold text-white mb-1">Platform Control Short-Cuts</h3>
        <p className="text-xs text-slate-400 mb-4">Direct access to core administrative modules</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/companies"
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold">Companies</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </Link>

          <Link
            to="/admin/plans"
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold">Plans</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </Link>

          <Link
            to="/admin/referrals"
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold">Referrals</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </Link>

          <Link
            to="/admin/settings"
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold">Settings</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
};
