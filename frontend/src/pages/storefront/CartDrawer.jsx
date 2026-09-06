import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Plus, Minus, Trash2, Tag, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/currency';

export const CartDrawer = ({ storeSlug, themeConfig }) => {
  const {
    items,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    finalTotal,
  } = useCart();
  const navigate = useNavigate();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isDrawerOpen) return null;

  const handleApplyCouponSubmit = (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) return;

    const res = applyCoupon(couponCodeInput.trim(), 15, 'percentage');
    if (!res.success) {
      setCouponError(res.message);
    }
  };

  const handleProceedToCheckout = () => {
    setIsDrawerOpen(false);
    navigate(`/store/${storeSlug}/checkout`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform animate-slide-left text-slate-900 dark:text-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-primary-600" />
              <h3 className="font-bold text-base">Your Cart ({items.length})</h3>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-medium">Your shopping bag is empty</p>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center space-x-3 text-xs">
                  <img
                    src={item.image || 'https://via.placeholder.com/60'}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                    {item.variant && (
                      <span className="text-[10px] text-slate-400 block">{item.variant}</span>
                    )}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                      {formatCurrency(item.price)}
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedVariant, Math.max(1, item.quantity - 1))}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-[11px]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.selectedVariant, item.quantity + 1)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId, item.selectedVariant)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3 text-xs">
              {/* Coupon Form */}
              {appliedCoupon ? (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{appliedCoupon.code} applied (-{formatCurrency(discountAmount)})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-700 hover:text-rose-600 text-[10px] font-bold">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCouponSubmit} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl font-mono text-xs uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[10px] text-rose-500">{couponError}</p>}

              {/* Price Breakdown */}
              <div className="space-y-1.5 font-mono pt-1 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t flex justify-between font-black text-sm text-slate-900 dark:text-white">
                  <span>Estimated Total:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-transform active:scale-98 flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
