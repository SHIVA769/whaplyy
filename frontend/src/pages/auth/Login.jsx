import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', formData);
      if (res.data?.success) {
        const { token, user } = res.data.data;
        login(token, user);
        if (user.role === 'super_admin') {
          navigate('/admin');
        } else {
          navigate('/company');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form auth-login-page">
      <div className="auth-heading mb-6">
        <span className="auth-eyebrow">Workspace access</span>
        <h2 className="text-2xl font-bold text-white mt-2 mb-2">Welcome back</h2>
        <p className="text-xs text-slate-400">Sign in to your WhatsStore admin or merchant workspace</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
            <label className="auth-label block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="auth-input w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="auth-label text-xs font-semibold text-slate-300">Password</label>
            <Link to="/forgot-password" className="auth-link text-xs text-primary-400 hover:text-primary-300">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="auth-input w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              className="rounded border-slate-700 text-primary-500 focus:ring-0 bg-slate-900"
            />
            <span>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-submit w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-sky-500 to-primary-600 hover:from-sky-600 hover:to-primary-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>{loading ? 'Signing In...' : 'Sign In'}</span>
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      {/* Quick Demo Credentials helper */}
      <div className="mt-6 pt-4 border-t border-slate-700/60 text-left">
        <p className="auth-label text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Quick Demo Logins:</p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setFormData({ email: 'admin@whatsstore.io', password: 'admin@whatsstore.io', rememberMe: true })}
            className="auth-demo p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-sky-400 hover:border-sky-500 font-medium text-left"
          >
            🛡️ <b>Super Admin</b>
            <span className="block text-[10px] text-slate-400 font-normal truncate">admin@whatsstore.io</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ email: 'owner@luxeretail.com', password: 'owner123', rememberMe: true })}
            className="auth-demo p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-emerald-400 hover:border-emerald-500 font-medium text-left"
          >
            🏬 <b>Store Owner</b>
            <span className="block text-[10px] text-slate-400 font-normal truncate">owner@luxeretail.com</span>
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        Don't have an account yet?{' '}
          <Link to="/register" className="auth-link text-primary-400 font-semibold hover:underline">
          Create Workspace
        </Link>
      </p>
    </div>
  );
};
