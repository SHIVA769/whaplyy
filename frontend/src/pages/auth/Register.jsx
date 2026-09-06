import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Building, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data?.success) {
        const { token, user } = res.data.data;
        login(token, user);
        navigate('/company');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form auth-signup-page">
      <div className="auth-heading mb-6">
        <span className="auth-eyebrow">Build your workspace</span>
        <h2 className="text-2xl font-bold text-white mt-2 mb-2">Create your store</h2>
        <p className="text-xs text-slate-400">Launch multi-theme WhatsApp stores with automated ordering</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
        <div>
          <label className="auth-label block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Elena Rostova"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="auth-input w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="auth-label block text-xs font-semibold text-slate-300 mb-1">Company / Brand Name</label>
          <div className="relative">
            <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Artisan Living Co."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="auth-input w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="auth-label block text-xs font-semibold text-slate-300 mb-1">Work Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              placeholder="elena@artisanliving.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auth-input w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="auth-label block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="auth-input w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="auth-label block text-xs font-semibold text-slate-300 mb-1">Confirm</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="auth-input w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {formData.referralCode && (
          <div className="auth-referral p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Referral applied: {formData.referralCode}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-submit w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>{loading ? 'Setting up workspace...' : 'Create Account'}</span>
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <p className="mt-6 text-xs text-slate-400 text-center">
        Already have a workspace?{' '}
        <Link to="/login" className="auth-link text-primary-400 font-semibold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
};
