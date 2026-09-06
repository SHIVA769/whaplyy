import React, { useState, useEffect } from 'react';
import { Share2, Users, DollarSign, Clock, Building2, CheckCircle, XCircle, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard';
import { Tabs } from '../../components/common/Tabs';
import { DataTable } from '../../components/common/DataTable';
import api from '../../api/axios';

export const ReferralProgram = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settingsForm, setSettingsForm] = useState({ isEnabled: true, commissionPercentage: 15, minThresholdAmount: 50, guidelines: '' });
  const [expandedUser, setExpandedUser] = useState(null);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/referrals');
      if (res.data?.success) {
        setData(res.data.data);
        setSettingsForm(res.data.data.settings || {});
      }
    } catch (err) {
      console.error('Failed to load referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/super-admin/referrals/settings', settingsForm);
      alert('Referral program settings saved!');
      fetchReferrals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    }
  };

  const handlePayoutStatus = async (id, status) => {
    try {
      await api.put(`/super-admin/referrals/payouts/${id}`, { status });
      fetchReferrals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payout request');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Referral Dashboard' },
    { id: 'users', label: 'Referred Companies', badge: data?.referredUsers?.length },
    { id: 'payouts', label: 'Payout Requests', badge: data?.payoutRequests?.filter((p) => p.status === 'pending').length },
    { id: 'settings', label: 'Program Settings' },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Referral Program Governance</h1>
        <p className="text-xs text-slate-500">Track merchant referrals, commission payouts & affiliate terms</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Referral Users" value={data?.summaryCards?.totalReferralUsers ?? 0} icon={Users} color="sky" />
            <SummaryCard title="Pending Payouts" value={data?.summaryCards?.pendingPayouts ?? '$0'} icon={Clock} color="amber" />
            <SummaryCard title="Total Commission Paid" value={data?.summaryCards?.totalCommissionPaid ?? '$0'} icon={DollarSign} color="emerald" />
            <SummaryCard title="Active Affiliates" value={data?.summaryCards?.activeCompanies ?? 0} icon={Building2} color="purple" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Referral Signups</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {data?.referredUsers?.slice(0, 5).map((r) => (
                <div key={r._id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white">{r.referredCompanyId?.name || 'Referred Co.'}</span>
                    <span className="text-slate-400 block text-[11px]">Referred by: {r.referringCompanyId?.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold font-mono">
                    {r.commissionPercentage}% Commission
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Referred Users (with expandable history) */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {data?.referredUsers?.map((r) => {
            const isExpanded = expandedUser === r._id;
            return (
              <div key={r._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center font-black text-primary-600 text-sm">
                      {r.referredCompanyId?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.referredCompanyId?.name || 'Company'}</h4>
                      <p className="text-xs text-slate-400">Referred by: <b>{r.referringCompanyId?.name}</b></p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs font-mono">
                      ${r.totalCommissionEarned || 0} earned
                    </span>
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : r._id)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Commission History */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Commission History</p>
                    {r.history?.length > 0 ? (
                      <div className="space-y-1.5 font-mono">
                        {r.history.map((h, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                            <span>{new Date(h.date).toLocaleDateString()} — {h.note}</span>
                            <span className="font-bold text-emerald-600">+${h.amount} ({h.percentage}%)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No commission payouts recorded yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Payout Requests */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800 text-slate-500">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {data?.payoutRequests?.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{p.companyId?.name || 'Company'}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">${p.amount}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : p.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{new Date(p.requestedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5 text-right">
                    {p.status === 'pending' && (
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handlePayoutStatus(p._id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePayoutStatus(p._id, 'rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Program Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4 max-w-xl">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
            <input
              type="checkbox"
              checked={settingsForm.isEnabled}
              onChange={(e) => setSettingsForm({ ...settingsForm, isEnabled: e.target.checked })}
              className="rounded text-primary-600"
            />
            <span>Enable Platform Referral Program</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Commission Percentage (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settingsForm.commissionPercentage}
                onChange={(e) => setSettingsForm({ ...settingsForm, commissionPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Threshold Amount ($)</label>
              <input
                type="number"
                min="5"
                value={settingsForm.minThresholdAmount}
                onChange={(e) => setSettingsForm({ ...settingsForm, minThresholdAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Referral Guidelines & Terms</label>
            <textarea
              rows={4}
              value={settingsForm.guidelines}
              onChange={(e) => setSettingsForm({ ...settingsForm, guidelines: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>

          <button type="submit" className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm">
            <Save className="w-4 h-4 mr-1.5" /> Save Referral Settings
          </button>
        </form>
      )}
    </div>
  );
};
