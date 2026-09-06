import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppFloatingWidget = ({ config = {}, storeName = 'Store' }) => {
  if (!config.enabled || !config.phoneNumber) return null;

  const cleanPhone = config.phoneNumber.replace(/[^0-9]/g, '');
  const message = config.defaultMessage || `Hi ${storeName}! I want to inquire about products on your store.`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

  const positionClass = config.position === 'bottom-left' ? 'left-6 bottom-6' : 'right-6 bottom-6';
  const visibilityClass = `${config.showOnMobile ? 'flex' : 'hidden sm:flex'} ${config.showOnDesktop ? 'sm:flex' : 'sm:hidden'}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${positionClass} ${visibilityClass} z-40 items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all group`}
      title="Chat on WhatsApp"
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
      </div>
      <span className="text-xs font-bold tracking-wide hidden md:inline">
        Chat with Store
      </span>
    </a>
  );
};
