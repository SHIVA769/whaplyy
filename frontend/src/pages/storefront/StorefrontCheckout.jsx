import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  Tag,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  ShieldCheck,
  Building,
  Upload,
  MessageCircle,
  AlertCircle,
  Copy,
  QrCode,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { AddressCascade } from '../../components/common/AddressCascade';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/currency';

export const StorefrontCheckout = () => {
  const { slug } = useParams();
  const { storeData, themeConfig } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    taxTotal,
    shippingCost,
    discountAmount,
    finalTotal,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    selectedShippingMethod,
    setSelectedShippingMethod,
    clearCart,
  } = useCart();

  const [step, setStep] = useState(1);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  // Form State
  const [contactInfo, setContactInfo] = useState({
    firstName: user?.name ? user.name.split(' ')[0] : '',
    lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.shippingAddress?.street || '',
    country: user?.shippingAddress?.country || 'US',
    state: user?.shippingAddress?.state || '',
    city: user?.shippingAddress?.city || '',
    postalCode: user?.shippingAddress?.postalCode || '',
  });

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const paymentSettings = storeData?.paymentSettings;

  // Fetch Shipping Methods
  useEffect(() => {
    if (slug) {
      const fetchMethods = async () => {
        try {
          const res = await api.get(`/storefront/${slug}/shipping-methods`);
          if (res.data?.success) {
            const methods = res.data.data.shippingMethods || [];
            setShippingMethods(methods);
            if (methods.length > 0 && !selectedShippingMethod) {
              setSelectedShippingMethod(methods[0]);
            }
          }
        } catch (err) {
          console.error('Failed to load shipping methods:', err);
        } finally {
          setLoadingMethods(false);
        }
      };
      fetchMethods();
    }
  }, [slug]);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Your cart is empty</h2>
        <p className="text-xs text-slate-500">Add items to your cart before proceeding to checkout.</p>
        <Link
          to={`/store/${slug}`}
          className={`inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold ${themeConfig.primaryBtn}`}
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponMsg(null);
    const result = await applyCouponCode(slug, couponCodeInput);
    if (result.success) {
      setCouponMsg({ type: 'success', text: result.message || 'Coupon applied!' });
      setCouponCodeInput('');
    } else {
      setCouponMsg({ type: 'error', text: result.message });
    }
  };

  const validateStep1 = () => {
    if (!contactInfo.firstName.trim() || !contactInfo.email.trim() || !contactInfo.street.trim()) {
      setErrorMessage('Please fill in your name, email, and street address.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        contactInfo,
        items,
        shippingMethodId: selectedShippingMethod?._id || selectedShippingMethod?.id || null,
        couponCode: appliedCoupon?.code || null,
        paymentMethod,
        notes,
        isGuest: !user,
      };

      const res = await api.post(`/storefront/${slug}/checkout`, payload);

      if (res.data?.success) {
        const orderData = res.data.data;

        if (paymentMethod === 'UPI') {
          navigate(`/store/${slug}/payment/${orderData.order.orderNumber}`, {
            state: {
              order: orderData.order,
              paymentSettings,
              whatsappChatUrl: orderData.whatsappChatUrl,
              whatsappMessage: orderData.whatsappMessage,
            },
          });
          return;
        }

        clearCart();

        // Redirect to success screen with state
        navigate(`/store/${slug}/order-success/${orderData.order.orderNumber}`, {
          state: {
            order: orderData.order,
            whatsappChatUrl: orderData.whatsappChatUrl,
            whatsappMessage: orderData.whatsappMessage,
          },
        });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      {/* Checkout Wizard Header Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${themeConfig.fontHeading} text-slate-900 dark:text-white`}>
            Checkout
          </h1>
          <p className="text-xs text-slate-500 mt-1">Complete your order details below</p>
        </div>

        {/* 3-Step Indicator */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <div
            onClick={() => setStep(1)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              step >= 1 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span>1. Contact & Address</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div
            onClick={() => step >= 2 && setStep(2)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${
              step >= 2 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span>2. Shipping & Offers</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl ${
              step === 3 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span>3. Payment</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Form Steps + Persistent Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Active Step Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Contact Information & Address */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">1. Contact & Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={contactInfo.firstName}
                    onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={contactInfo.lastName}
                    onChange={(e) => setContactInfo({ ...contactInfo, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {/* Street, country, state, city, and postal code */}
              <AddressCascade
                values={{
                  street: contactInfo.street,
                  country: contactInfo.country,
                  state: contactInfo.state,
                  city: contactInfo.city,
                  postalCode: contactInfo.postalCode,
                }}
                onChange={(addr) => setContactInfo((prev) => ({ ...prev, ...addr }))}
              />

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 ${themeConfig.primaryBtn}`}
                >
                  <span>Continue to Shipping</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Options & Store Coupons */}
          {step === 2 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <Truck className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">2. Shipping Method & Coupon Offers</h2>
              </div>

              {/* Shipping Methods List */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Delivery Method</label>

                {loadingMethods ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading shipping options...</div>
                ) : shippingMethods.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-500">
                    Standard Free Shipping applies to this order.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {shippingMethods.map((m) => {
                      const methodId = m._id || m.id;
                      const selectedMethodId = selectedShippingMethod?._id || selectedShippingMethod?.id;
                      const isSelected = selectedMethodId === methodId;
                      return (
                        <div
                          key={methodId}
                          onClick={() => setSelectedShippingMethod(m)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 ring-1 ring-slate-900'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white' : 'border-slate-300'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</p>
                              <p className="text-[10px] text-slate-400">{m.deliveryTime || '2-4 business days'}</p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">
                            {m.cost > 0 ? formatCurrency(m.cost) : 'FREE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Have a Store Coupon Code?</label>

                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        Coupon Code: <span className="font-mono uppercase">{appliedCoupon.code}</span> (-{formatCurrency(discountAmount)})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponMsg && (
                  <p className={`text-[11px] font-medium ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Address</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-6 py-3 rounded-2xl text-xs font-bold flex items-center space-x-2 ${themeConfig.primaryBtn}`}
                >
                  <span>Continue to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Options & Place Order */}
          {step === 3 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">3. Payment Selection</h2>
              </div>

              <div className="space-y-3">
                {[
                  { id: 'Cash on Delivery', title: 'Cash on Delivery (COD)', desc: 'Pay with cash upon receiving delivery' },
                  { id: 'WhatsApp', title: 'Order via WhatsApp Chat', desc: 'Confirm order details & receipt directly on WhatsApp' },
                  { id: 'Bank Transfer', title: 'Bank Direct Transfer', desc: 'Transfer to store bank account & upload receipt' },
                  { id: 'Stripe', title: 'Credit / Debit Card (Stripe)', desc: 'Instant secure online card checkout' },
                  ...(paymentSettings?.upiEnabled && paymentSettings.upiId
                    ? [{ id: 'UPI', title: 'UPI Payment', desc: 'Pay directly to the store using UPI or scan the QR code' }]
                    : []),
                ].map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 ring-1 ring-slate-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{pm.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{pm.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {paymentMethod === 'UPI' && paymentSettings?.upiEnabled && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <QrCode className="w-4 h-4" />
                    <p className="text-xs font-extrabold">Pay the store owner via UPI</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {paymentSettings.qrCodeImage ? (
                      <img src={paymentSettings.qrCodeImage} alt="Store owner UPI QR code" className="w-36 h-36 rounded-xl border border-emerald-200 bg-white object-contain p-2" />
                    ) : null}
                    <div className="text-center sm:text-left space-y-1">
                      <p className="text-[11px] text-emerald-700">UPI ID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-extrabold text-slate-900">{paymentSettings.upiId}</p>
                        <button
                          type="button"
                          title="Copy UPI ID"
                          onClick={() => navigator.clipboard?.writeText(paymentSettings.upiId)}
                          className="p-1.5 rounded-lg bg-white text-emerald-700 hover:bg-emerald-100"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {paymentSettings.accountName && <p className="text-[11px] text-slate-600">Account name: {paymentSettings.accountName}</p>}
                      <p className="text-[11px] text-slate-600">After paying, place the order. The store owner will verify your payment.</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Order Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Shipping</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className={`px-8 py-3.5 rounded-2xl text-xs font-extrabold shadow-lg flex items-center space-x-2 ${themeConfig.primaryBtn} disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <span>Place Order ({formatCurrency(finalTotal)})</span>
                      <CheckCircle2 className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Persistent Order Summary Card */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Order Summary ({items.length} items)
            </h3>

            {/* Itemized Line Items */}
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <img
                    src={item.image || 'https://via.placeholder.com/100'}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-xl border border-slate-100 dark:border-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.quantity * item.price)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span className="font-mono font-semibold">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="font-mono font-semibold">
                  {shippingCost > 0 ? formatCurrency(shippingCost) : 'FREE'}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex items-center justify-center space-x-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Encrypted & Safe Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
