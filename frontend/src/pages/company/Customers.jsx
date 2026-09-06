import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Eye, ShoppingBag } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { AddressCascade } from '../../components/common/AddressCascade';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const Customers = () => {
  const { activeStore } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('general');

  // Form State (3 Tabs)
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    shippingAddress: { street: '', country: 'United States', state: 'California', city: 'Los Angeles', postalCode: '90001' },
    billingAddress: { street: '', country: 'United States', state: 'California', city: 'Los Angeles', postalCode: '90001' },
  });

  const fetchCustomers = async () => {
    if (!activeStore) return;
    setLoading(true);
    try {
      const res = await api.get('/company/customers', { params: { storeId: activeStore._id, search } });
      if (res.data?.success) setCustomers(res.data.data.customers || res.data.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeStore, search]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const parts = (customerForm.name || '').trim().split(' ');
      const firstName = parts[0] || 'Customer';
      const lastName = parts.slice(1).join(' ') || '';

      const payload = {
        ...customerForm,
        firstName,
        lastName,
        storeId: activeStore?._id || undefined,
      };

      if (editingCustomer) {
        await api.put(`/company/customers/${editingCustomer._id}`, payload);
      } else {
        await api.post('/company/customers', payload);
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
      toast.success(editingCustomer ? 'Customer updated successfully' : 'Customer created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    }
  };

  const formTabs = [
    { id: 'general', label: '1. General Info' },
    { id: 'shipping', label: '2. Shipping Address' },
    { id: 'billing', label: '3. Billing Address' },
  ];

  const columns = [
    {
      header: 'Customer',
      render: (c) => {
        const displayName = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Customer';
        return (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
              {displayName[0] || 'C'}
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">{displayName}</span>
              <span className="text-[11px] text-slate-400">{c.email}</span>
            </div>
          </div>
        );
      },
    },
    { header: 'Phone Number', className: 'hidden sm:table-cell', render: (c) => <span className="font-mono text-xs">{c.phone}</span> },
    {
      header: 'Total Orders',
      className: 'hidden md:table-cell',
      render: (c) => (
        <span className="font-mono text-xs font-bold text-emerald-600">
          {c.ordersCount || c.orderCount || 1} Orders
        </span>
      ),
    },
    {
      header: 'Registered Date',
      className: 'hidden lg:table-cell',
      render: (c) => <span className="text-xs text-slate-400 font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Customer Accounts</h1>
          <p className="text-xs text-slate-500">View customer purchasing history, phone contacts & delivery addresses</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setCustomerForm({
              name: '',
              email: '',
              phone: '',
              shippingAddress: { street: '', country: 'United States', state: 'California', city: 'Los Angeles', postalCode: '90001' },
              billingAddress: { street: '', country: 'United States', state: 'California', city: 'Los Angeles', postalCode: '90001' },
            });
            setActiveFormTab('general');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Customer
        </button>
      </div>

      <DataTable columns={columns} data={customers} loading={loading} searchValue={search} onSearchChange={setSearch} />

      {/* 3-Tab Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-left">
          <Tabs tabs={formTabs} activeTab={activeFormTab} onChange={setActiveFormTab} variant="pills" />

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {activeFormTab === 'general' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="sarah@example.com"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="+14155552671"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeFormTab === 'shipping' && (
              <AddressCascade
                values={customerForm.shippingAddress}
                onChange={(addr) => setCustomerForm({ ...customerForm, shippingAddress: addr })}
              />
            )}

            {activeFormTab === 'billing' && (
              <AddressCascade
                values={customerForm.billingAddress}
                onChange={(addr) => setCustomerForm({ ...customerForm, billingAddress: addr })}
              />
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                Save Customer
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
