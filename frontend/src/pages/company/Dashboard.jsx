import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Users,
  QrCode,
  ExternalLink,
  RotateCcw,
  ArrowUpRight,
  Package,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard';
import { QRCodeModal } from '../../components/common/QRCodeModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const CompanyDashboard = () => {
  const { activeStore } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/dashboard', {
        params: { storeId: activeStore?._id },
      });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load merchant dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeStore]);

  const currentStoreUrl = activeStore
    ? `${window.location.origin}/store/${activeStore.slug}`
    : `${window.location.origin}/store/artisan-living`;

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Merchant Overview</h1>
          <p className="text-xs text-slate-500">
            Real-time sales, order funnel & catalog performance for <b>{activeStore?.name || 'Active Store'}</b>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeStore && (
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5" />
              Store QR Code
            </button>
          )}
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            title="Refresh metrics"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Orders"
          value={data?.summaryCards?.totalOrders ?? 0}
          icon={ShoppingBag}
          color="emerald"
        />
        <SummaryCard
          title="Gross Revenue"
          value={data?.summaryCards?.totalSales ?? '$0'}
          icon={DollarSign}
          color="sky"
        />
        <SummaryCard
          title="Total Customers"
          value={data?.summaryCards?.totalCustomers ?? 0}
          icon={Users}
          color="purple"
        />
        <SummaryCard
          title="Avg Order Value"
          value={data?.summaryCards?.avgOrderValue ?? '$0'}
          icon={TrendingUp}
          color="amber"
          isPositive={true}
        />
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Store Orders</h3>
            </div>
            <Link to="/company/orders" className="text-xs font-semibold text-primary-600 hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {data?.recentOrders?.length === 0 ? (
              <div className="py-8 text-center text-slate-400">No orders placed yet.</div>
            ) : (
              data?.recentOrders?.map((order) => (
                <div key={order._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      #{order.orderNumber?.slice(-4)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{order.customer?.name || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">
                        {order.items?.length || 1} items • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-extrabold text-slate-900 dark:text-white font-mono block">
                      ${order.pricing?.finalTotal || order.total || '0'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Products</h3>
          </div>

          <div className="space-y-3">
            {data?.topProducts?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No product sales yet.</div>
            ) : (
              data?.topProducts?.map((product, idx) => (
                <div key={product._id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-mono text-xs font-black text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 font-mono shrink-0">
                    {product.salesCount || 1} sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Store QR Modal */}
      {activeStore && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          storeName={activeStore.name}
          storeUrl={currentStoreUrl}
        />
      )}
    </div>
  );
};
