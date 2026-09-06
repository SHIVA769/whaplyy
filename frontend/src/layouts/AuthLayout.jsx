import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Check, MessageCircle, Package, ShoppingBag } from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';

export const AuthLayout = () => {
  return (
    <div className="auth-layout min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="auth-grid absolute inset-0 pointer-events-none" />
      <div className="auth-glow auth-glow-top absolute pointer-events-none" />
      <div className="auth-glow auth-glow-bottom absolute pointer-events-none" />
      <div className="auth-orbit auth-orbit-one absolute pointer-events-none" />
      <div className="auth-orbit auth-orbit-two absolute pointer-events-none" />
      <div className="auth-signal absolute pointer-events-none" />
      <div className="auth-commerce-scene absolute pointer-events-none" aria-hidden="true">
        <div className="auth-commerce-card auth-product-card"><ShoppingBag /><span>New product</span><b>Added to store</b></div>
        <div className="auth-commerce-card auth-order-card"><Package /><span>Order received</span><b>#WS-2048</b><Check /></div>
        <div className="auth-commerce-card auth-chat-card"><MessageCircle /><span>Customer chat</span><b>Ready to order?</b></div>
        <div className="auth-cart-path" />
      </div>

      <div className="auth-brand sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center mb-4" aria-label="WhatsStore home">
          <BrandLogo className="h-16 w-16 rounded-2xl shadow-lg auth-logo" />
        </Link>
        <p className="text-xs font-medium text-slate-400 auth-tagline">
          The Next-Gen Multi-Tenant WhatsApp Store Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="auth-card bg-slate-800/90 border border-slate-700/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
