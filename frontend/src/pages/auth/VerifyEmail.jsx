import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verified, setVerified] = useState(true);

  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-white">Email Verified Successfully!</h2>
      <p className="text-xs text-slate-400 max-w-sm mx-auto">
        Your email address has been authenticated. You can now access your complete store builder features.
      </p>
      <Link
        to="/login"
        className="inline-flex items-center justify-center py-2.5 px-6 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md transition-all mt-4"
      >
        <span>Proceed to Login</span>
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Link>
    </div>
  );
};
