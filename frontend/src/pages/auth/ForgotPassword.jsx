import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
      <p className="text-xs text-slate-400 mb-6">Enter your email and we will send you a reset link</p>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">Reset link dispatched!</p>
          <p className="text-xs text-slate-400">
            Check your email at <b>{email}</b> for instructions to reset your account password.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-primary-400 hover:text-primary-300 pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
