import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, DollarSign, Clock, Users, ArrowUpRight } from 'lucide-react';
import { SummaryCard } from '../../components/common/SummaryCard';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export const CompanyReferrals = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(50);
  const [payoutNotes, setPayoutNotes] = useState('');

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/company/referrals');
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error('Failed to load company referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const referralLink = `${window.location.origin}/register?ref=${user?.company?.referralCode || 'REF100'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    try {
      await api.post('/company/referrals/payout', { amount: payoutAmount, notes: payoutNotes });
      setIsPayoutModalOpen(false);
      alert('Payout request submitted for Super Admin review!');
      fetchReferrals();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit payout request');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Affiliate Referral Program</h1>
        <p className="text-xs text-slate-500">Invite new merchants to WhatsStore and earn recurring commission</p>
      </div>

      {/* Share Link Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md space-y-3">
        <h3 className="text-sm font-bold">Your Unique Merchant Referral Link</h3>
        <p className="text-xs text-emerald-100">
          Share this link with store owners. When they subscribe to a paid tier, you earn commission on every billing cycle.
        </p>
        <div className="flex items-center space-x-2 max-w-xl">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-3.5 py-2.5 bg-slate-900/60 border border-emerald-400/40 rounded-xl text-xs font-mono text-white focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 bg-white text-emerald-900 font-bold rounded-xl text-xs flex items-center shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 mr-1 text-emerald-600" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard title="Total Earnings" value={`$${data?.totalEarnings || 0}`} icon={DollarSign} color="emerald" />
        <SummaryCard title="Pending Balance" value={`$${data?.pendingBalance || 0}`} icon={Clock} color="amber" />
        <SummaryCard title="Referred Merchants" value={data?.referredCount || 0} icon={Users} color="purple" />
      </div>

      {/* Payout Trigger & History */}
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Withdraw Referral Commission</h4>
          <p className="text-xs text-slate-500">Minimum payout threshold: $50.00</p>
        </div>
        <button
          onClick={() => setIsPayoutModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
        >
          Request Payout
        </button>
      </div>

      {/* Payout Modal */}
      <Modal isOpen={isPayoutModalOpen} onClose={() => setIsPayoutModalOpen(false)} title="Request Commission Payout">
        <form onSubmit={handleRequestPayout} className="space-y-4 text-left text-xs">
          <div>
            <label className="block font-semibold mb-1">Payout Amount ($)</label>
            <input
              type="number"
              min="50"
              required
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(Number(e.target.value))}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono text-sm"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Bank / PayPal Payout Details</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. PayPal email or Bank IBAN/Routing details"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsPayoutModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
