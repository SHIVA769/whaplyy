import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  KeyRound,
  LogIn,
  ArrowUpCircle,
  MoreVertical,
  Trash2,
  Edit,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const Companies = () => {
  const { login } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [plans, setPlans] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', enableLogin: true, planId: '' });
  const [upgradeForm, setUpgradeForm] = useState({ planId: '', planBillingCycle: 'monthly' });
  const [resetPassForm, setResetPassForm] = useState({ password: '' });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/companies', {
        params: { search, status: statusFilter },
      });
      if (res.data?.success) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      if (res.data?.success) setPlans(res.data.data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchPlans();
  }, [search, statusFilter]);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    try {
      await api.post('/super-admin/companies', addForm);
      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', password: '', enableLogin: true, planId: '' });
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create company');
    }
  };

  const handleImpersonate = async (comp) => {
    try {
      const res = await api.post(`/auth/impersonate/${comp._id}`);
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        window.location.href = '/company';
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Impersonation failed');
    }
  };

  const handleUpgradePlan = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/super-admin/companies/${selectedCompany._id}`, upgradeForm);
      setIsUpgradeModalOpen(false);
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || 'Plan upgrade failed');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/super-admin/companies/${selectedCompany._id}/reset-password`, resetPassForm);
      setIsResetPassModalOpen(false);
      setResetPassForm({ password: '' });
      alert('Password reset successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleToggleLogin = async (comp) => {
    try {
      await api.put(`/super-admin/companies/${comp._id}`, {
        enableLogin: !comp.enableLogin,
      });
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update company');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (window.confirm('Are you sure you want to delete this company and all its stores and catalog?')) {
      try {
        await api.delete(`/super-admin/companies/${id}`);
        fetchCompanies();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete company');
      }
    }
  };

  const columns = [
    {
      header: 'Company & Owner',
      render: (c) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
          <div className="text-xs text-slate-400">{c.email}</div>
          <div className="text-[10px] text-slate-500 font-mono">Owner: {c.ownerName}</div>
        </div>
      ),
    },
    {
      header: 'Subscription Plan',
      render: (c) => (
        <div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {c.planId?.name || 'Free Plan'}
          </span>
          <span className="block text-[10px] text-slate-400 capitalize mt-0.5">
            {c.planBillingCycle || 'monthly'} billing
          </span>
        </div>
      ),
    },
    {
      header: 'Stores',
      render: (c) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {c.storeCount || 0} Stores
        </span>
      ),
    },
    {
      header: 'Login Access',
      render: (c) => (
        <button
          onClick={() => handleToggleLogin(c)}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            c.enableLogin
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          {c.enableLogin ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
          {c.enableLogin ? 'Enabled' : 'Disabled'}
        </button>
      ),
    },
    {
      header: 'Created Date',
      render: (c) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => handleImpersonate(c)}
            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950 dark:hover:bg-sky-900"
            title="Login as Company"
          >
            <LogIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedCompany(c);
              setUpgradeForm({ planId: c.planId?._id || '', planBillingCycle: c.planBillingCycle || 'monthly' });
              setIsUpgradeModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-950 dark:hover:bg-purple-900"
            title="Upgrade Plan"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedCompany(c);
              setIsResetPassModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950 dark:hover:bg-amber-900"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteCompany(c._id)}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900"
            title="Delete Company"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Companies Management</h1>
          <p className="text-xs text-slate-500">Manage all registered tenant companies, subscription tiers & login states</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Company
        </button>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        showViewToggle={true}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        exportFilename="companies-list.csv"
        filterComponents={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        }
        renderGridItem={(c) => (
          <div key={c._id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                <p className="text-xs text-slate-400">{c.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">
                {c.planId?.name || 'Free'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              <p>Stores: <b>{c.storeCount || 0}</b></p>
              <p>Owner: <b>{c.ownerName}</b></p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleImpersonate(c)}
                className="px-2.5 py-1 text-xs font-semibold bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 flex items-center"
              >
                <LogIn className="w-3 h-3 mr-1" /> Login
              </button>
              <button
                onClick={() => handleDeleteCompany(c._id)}
                className="text-xs text-rose-500 hover:text-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      />

      {/* Add Company Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Company">
        <form onSubmit={handleAddCompany} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
            <input
              type="text"
              required
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Email</label>
            <input
              type="email"
              required
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subscription Plan</label>
            <select
              value={addForm.planId}
              onChange={(e) => setAddForm({ ...addForm, planId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Default Plan</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} (${p.monthlyPrice}/mo)
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableLogin"
              checked={addForm.enableLogin}
              onChange={(e) => setAddForm({ ...addForm, enableLogin: e.target.checked })}
              className="rounded border-slate-300 text-primary-600 focus:ring-0"
            />
            <label htmlFor="enableLogin" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enable Login Account for Owner
            </label>
          </div>
          {addForm.enableLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
              <input
                type="password"
                required
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Create Company
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Plan Modal */}
      <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} title={`Upgrade Plan: ${selectedCompany?.name}`}>
        <form onSubmit={handleUpgradePlan} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Tier</label>
            <select
              value={upgradeForm.planId}
              onChange={(e) => setUpgradeForm({ ...upgradeForm, planId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ${p.monthlyPrice}/mo (${p.yearlyPrice}/yr)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Billing Cycle</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUpgradeForm({ ...upgradeForm, planBillingCycle: 'monthly' })}
                className={`py-2 text-xs font-bold rounded-lg border ${
                  upgradeForm.planBillingCycle === 'monthly' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setUpgradeForm({ ...upgradeForm, planBillingCycle: 'yearly' })}
                className={`py-2 text-xs font-bold rounded-lg border ${
                  upgradeForm.planBillingCycle === 'yearly' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-slate-200'
                }`}
              >
                Yearly (20% Off)
              </button>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setIsUpgradeModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Save Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetPassModalOpen} onClose={() => setIsResetPassModalOpen(false)} title={`Reset Password: ${selectedCompany?.name}`}>
        <form onSubmit={handleResetPassword} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={resetPassForm.password}
              onChange={(e) => setResetPassForm({ password: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => setIsResetPassModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
