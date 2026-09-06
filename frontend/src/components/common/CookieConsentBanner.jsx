import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export const CookieConsentBanner = () => {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const isConsentGiven = localStorage.getItem('ws_cookie_consent');
    if (!isConsentGiven) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('ws_cookie_consent', 'accepted');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-slate-900/95 text-white backdrop-blur-md border-t border-slate-800 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
      <div className="flex items-start space-x-3 max-w-4xl">
        <ShieldCheck className="w-6 h-6 text-primary-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-bold text-sm text-white">We value your privacy</p>
          <p>
            We use essential cookies to maintain your shopping cart, manage session security, and enable direct WhatsApp checkout. By continuing to browse, you accept our standard cookie policies.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAccept}
          className="px-4 py-2 text-xs font-bold bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-sm"
        >
          Accept All
        </button>
        <button
          onClick={() => setAccepted(true)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
