import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [currentStoreSlug, setCurrentStoreSlug] = useState('');

  // Load cart from localStorage for store slug
  const initStoreCart = (slug) => {
    setCurrentStoreSlug(slug);
    try {
      const stored = localStorage.getItem(`ws_cart_${slug}`);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    if (currentStoreSlug) {
      localStorage.setItem(`ws_cart_${currentStoreSlug}`, JSON.stringify(items));
    }
  }, [items, currentStoreSlug]);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const normalizedProduct = product || {};
    const productId = normalizedProduct._id || normalizedProduct.id;
    if (!productId) return;
    const effectiveVariant = selectedVariant ?? normalizedProduct.selectedVariant ?? normalizedProduct.variant ?? null;
    const unitPrice = Number(
      normalizedProduct.salePrice && Number(normalizedProduct.salePrice) > 0
        ? normalizedProduct.salePrice
        : normalizedProduct.price || 0
    );

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === productId && JSON.stringify(i.selectedVariant) === JSON.stringify(effectiveVariant)
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += Number(quantity) || 1;
        return copy;
      }

      return [
        ...prev,
        {
          productId,
          name: normalizedProduct.name,
          sku: normalizedProduct.sku || '',
          image: normalizedProduct.coverImage || normalizedProduct.thumbnail || normalizedProduct.image || '',
          price: unitPrice,
          taxRate: normalizedProduct.taxId?.rate || 0,
          taxName: normalizedProduct.taxId?.name || '',
          quantity: Number(quantity) || 1,
          selectedVariant: effectiveVariant,
          stockQuantity: normalizedProduct.stockQuantity || 0,
        },
      ];
    });
    setIsDrawerOpen(true);
  };

  const addItem = (product, quantity = 1, selectedVariant = null) => {
    const resolvedVariant =
      selectedVariant ?? product?.selectedVariant ?? product?.variant ?? null;
    addToCart(product, quantity, resolvedVariant);
  };

  const updateQuantity = (productId, selectedVariant, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId, selectedVariant);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant)) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId, selectedVariant) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant))
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setSelectedShippingMethod(null);
    if (currentStoreSlug) {
      localStorage.removeItem(`ws_cart_${currentStoreSlug}`);
    }
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxTotal = items.reduce((acc, item) => acc + (item.price * item.quantity * (item.taxRate || 0)) / 100, 0);
  const shippingCost = selectedShippingMethod?.cost || 0;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const finalTotal = Math.max(0, subtotal + taxTotal + shippingCost - discountAmount);
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const applyCouponCode = async (slug, code) => {
    try {
      const res = await api.post(`/storefront/${slug}/coupon/apply`, { code, subtotal });
      if (res.data?.success) {
        setAppliedCoupon(res.data.data);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to apply coupon' };
    }
  };

  const applyCoupon = (code, value = 0, type = 'percentage') => {
    if (!code) return { success: false, message: 'Coupon code is required.' };
    const normalized = code.trim();
    const discountValue = Number(value) || 0;
    const nextCoupon = {
      code: normalized,
      discountType: type,
      discountValue,
      description: `Applied ${type === 'percentage' ? `${discountValue}%` : `$${discountValue}`} off`,
    };
    setAppliedCoupon(nextCoupon);
    return { success: true, message: 'Coupon applied successfully!' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const removeItem = (productId, selectedVariant = null) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && JSON.stringify(item.selectedVariant) === JSON.stringify(selectedVariant))
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        setIsDrawerOpen,
        initStoreCart,
        addToCart,
        addItem,
        updateQuantity,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCouponCode,
        applyCoupon,
        removeCoupon,
        removeItem,
        selectedShippingMethod,
        setSelectedShippingMethod,
        subtotal,
        taxTotal,
        shippingCost,
        discountAmount,
        finalTotal,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
