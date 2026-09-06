import React, { useEffect } from 'react';
import { useOutletContext, useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, Copy, Download, ShoppingBag, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadOrderPdf } from '../../utils/orderPdf';
import { formatCurrency } from '../../utils/currency';

export const OrderSuccess = () => {
  const { slug } = useParams();
  const { storeData, themeConfig } = useOutletContext();
  const location = useLocation();

  const orderData = location.state?.order || {
    orderNumber: `WS-${Date.now().toString(36).toUpperCase()}`,
    total: 0,
    status: 'pending',
    paymentStatus: 'pending',
  };

  const whatsappChatUrl = location.state?.whatsappChatUrl;

  useEffect(() => {
    // Fire celebration confetti animation
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderData.orderNumber);
    alert('Order Number copied to clipboard!');
  };

  const downloadPdf = () => {
    downloadOrderPdf(slug, orderData.orderNumber);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8">
      {/* Icon & Title */}
      <div className="space-y-3">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-emerald-50 dark:ring-emerald-900/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className={`text-3xl font-black ${themeConfig.fontHeading} text-slate-900 dark:text-white`}>
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Thank you for shopping with <span className="font-bold text-slate-800 dark:text-white">{storeData?.name}</span>.
          We have received your order and are processing it now.
        </p>
      </div>

      {/* Order Reference Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Order Reference</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                #{orderData.orderNumber}
              </span>
              <button
                onClick={copyOrderNumber}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
                title="Copy order number"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Amount</span>
            <p className="text-base font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(orderData.total)}
            </p>
          </div>
        </div>

        {/* WhatsApp Direct Action Button */}
        {whatsappChatUrl && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Complete Order Confirmation on WhatsApp</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Send your order details directly to the merchant's WhatsApp for instant confirmation & live updates.
            </p>
            <a
              href={whatsappChatUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md space-x-2 transition-all mt-1"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Open WhatsApp & Send Order</span>
            </a>
          </div>
        )}

        {/* Order PDF download */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-500 font-medium">Download Order PDF</span>
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center text-slate-900 dark:text-white font-bold hover:underline"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={`/store/${slug}`}
          className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 ${themeConfig.primaryBtn}`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <Link
          to={`/store/${slug}/customer/orders`}
          className="px-6 py-3 rounded-2xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center space-x-2"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
