import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  FileText,
  MessageCircle,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/currency';

export const Orders = () => {
  const { activeStore } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Details Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentNotifications, setPaymentNotifications] = useState([]);

  const fetchPaymentNotifications = async () => {
    try {
      const res = await api.get('/company/notifications', { params: { unread: true } });
      setPaymentNotifications((res.data?.data || []).filter((notification) => notification.type === 'payment_confirmed'));
    } catch (err) {
      console.error('Failed to load payment notifications:', err);
    }
  };

  const fetchOrders = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/orders', {
        params: { storeId: activeStore._id, search, status: statusFilter },
      });
      if (res.data?.success) setOrders(res.data.data.orders || res.data.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPaymentNotifications();
  }, [activeStore, search, statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/company/orders/${orderId}/status`, { fulfillmentStatus: newStatus });
      if (res.data?.success) {
        setSelectedOrder(res.data.data);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const res = await api.get(`/company/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${selectedOrder?.orderNumber || orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to generate PDF invoice');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Delivered</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700">Shipped</span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">Processing</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">Pending</span>;
    }
  };

  const columns = [
    {
      header: 'Order No.',
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white block">#{o.orderNumber}</span>
          <span className="text-[10px] text-slate-400 font-mono">{new Date(o.createdAt).toLocaleDateString()}</span>
          {paymentNotifications.some((notification) => notification.orderId?._id === o._id || notification.orderId === o._id) && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              <AlertCircle className="h-3 w-3" /> Payment Confirmed
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (o) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{o.customer?.name || 'Guest'}</span>
          <span className="text-xs text-slate-400">{o.customer?.phone || o.customer?.email}</span>
        </div>
      ),
    },
    {
      header: 'Items',
      render: (o) => <span className="text-xs font-semibold">{o.items?.length || 0} items</span>,
    },
    {
      header: 'Total',
      render: (o) => (
        <span className="font-mono font-black text-slate-900 dark:text-white">
          {formatCurrency(o.pricing?.finalTotal || o.total || 0)}
        </span>
      ),
    },
    {
      header: 'Payment',
      render: (o) => (
        <div>
          <span className="text-xs capitalize font-medium text-slate-600 dark:text-slate-300 block">
            {o.paymentMethod?.replace('_', ' ')}
          </span>
          {o.paymentStatus === 'paid' && (
            <span className="mt-1 inline-block text-[10px] font-bold text-amber-700">Customer confirmed - verify</span>
          )}
          {o.paymentStatus && o.paymentStatus !== 'paid' && (
            <span className="mt-1 inline-block text-[10px] font-medium capitalize text-slate-400">{o.paymentStatus}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Fulfillment',
      render: (o) => getStatusBadge(o.fulfillmentStatus || o.status),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (o) => (
        <button
          onClick={() => {
            setSelectedOrder(o);
            setIsModalOpen(true);
          }}
          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 rounded-lg"
          title="View Order Details & Timeline"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Store Orders & Fulfillment</h1>
          <p className="text-xs text-slate-500">Track customer WhatsApp orders, timeline status & generate PDF invoices</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        filterComponents={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
      />

      {/* Order Details & Timeline Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Order Details: #${selectedOrder?.orderNumber}`}
        maxWidth="max-w-3xl"
      >
        {selectedOrder && (
          <div className="space-y-6 text-left text-xs">
            {/* Timeline Progress Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Fulfillment Progression</h4>
              <div className="flex items-center justify-between relative">
                {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
                  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                  const fulfillmentStatus = selectedOrder.fulfillmentStatus || selectedOrder.status || 'pending';
                  const currentIdx = statuses.indexOf(fulfillmentStatus);
                  const isCompleted = currentIdx >= idx;
                  const isCurrent = fulfillmentStatus === step;

                  return (
                    <div key={step} className="flex flex-col items-center z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className={`text-[11px] mt-1 capitalize font-semibold ${isCurrent ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Action Buttons */}
              <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">Update fulfillment status:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'processing')}
                    className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold"
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'shipped')}
                    className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-bold"
                  >
                    Shipped
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold"
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                    className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Info</h5>
                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customer?.name}</p>
                <p className="text-slate-500">{selectedOrder.customer?.phone}</p>
                <p className="text-slate-500">{selectedOrder.customer?.email}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Delivery Address</h5>
                <p className="text-slate-700 dark:text-slate-300">
                  {selectedOrder.shippingAddress?.street || 'Local Pickup'}
                </p>
                <p className="text-slate-500">
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}
                </p>
                <p className="text-slate-500">{selectedOrder.shippingAddress?.country}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h5 className="font-bold text-amber-900">Payment Timeline</h5>
              {(selectedOrder.timeline || []).filter((event) => event.status === 'Payment Confirmed').map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="mt-2 text-amber-800">
                  <p className="font-bold">Payment Confirmed: customer self-confirmed</p>
                  <p className="text-[11px]">{event.note || 'Not yet verified against bank records.'}</p>
                  <p className="mt-1 text-[10px]">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</p>
                </div>
              ))}
              {!(selectedOrder.timeline || []).some((event) => event.status === 'Payment Confirmed') && (
                <p className="mt-1 text-[11px] text-amber-800">No customer payment confirmation recorded.</p>
              )}
            </div>

            {/* Ordered Items Table */}
            <div>
              <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Ordered Products</h5>
              <div className="border rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{item.name || item.productId?.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Qty: {item.quantity} × {formatCurrency(item.price)}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(item.total || item.quantity * item.price)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.pricing?.subtotal || selectedOrder.subtotal || 0)}</span>
              </div>
              {selectedOrder.pricing?.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount:</span>
                  <span>-{formatCurrency(selectedOrder.pricing.discount)}</span>
                </div>
              )}
              {selectedOrder.pricing?.shippingCost > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Shipping:</span>
                  <span>+{formatCurrency(selectedOrder.pricing.shippingCost)}</span>
                </div>
              )}
              {selectedOrder.pricing?.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax:</span>
                  <span>+{formatCurrency(selectedOrder.pricing.taxAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Final Total:</span>
                <span>{formatCurrency(selectedOrder.pricing?.finalTotal || selectedOrder.total || 0)}</span>
              </div>
            </div>

            {/* Bottom Actions: Invoice Download & WhatsApp */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleDownloadInvoice(selectedOrder._id)}
                className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF Invoice
              </button>

              {selectedOrder.customer?.phone && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${selectedOrder.customer.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(`Hi ${selectedOrder.customer.name}! Regarding order #${selectedOrder.orderNumber}: your order is currently ${selectedOrder.fulfillmentStatus || selectedOrder.status || 'pending'}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Resend WhatsApp Update
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
