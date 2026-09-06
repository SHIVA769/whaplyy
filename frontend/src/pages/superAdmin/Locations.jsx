import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import api from '../../api/axios';

export const Locations = () => {
  const [activeTab, setActiveTab] = useState('countries');
  const [data, setData] = useState({ countries: [], states: [], cities: [] });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('country');
  const [countryForm, setCountryForm] = useState({ name: '', code: '', phoneCode: '+1', status: 'active' });
  const [stateForm, setStateForm] = useState({ countryId: '', name: '', code: '', status: 'active' });
  const [cityForm, setCityForm] = useState({ countryId: '', stateId: '', name: '', status: 'active' });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/locations');
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'country') {
        await api.post('/super-admin/countries', countryForm);
      } else if (modalType === 'state') {
        await api.post('/super-admin/states', stateForm);
      } else {
        await api.post('/super-admin/cities', cityForm);
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add location entry');
    }
  };

  const tabs = [
    { id: 'countries', label: 'Countries', badge: data.countries?.length },
    { id: 'states', label: 'States & Provinces', badge: data.states?.length },
    { id: 'cities', label: 'Cities & Municipalities', badge: data.cities?.length },
  ];

  const countryColumns = [
    { header: 'Country Name', render: (c) => <span className="font-bold text-slate-900 dark:text-white">{c.name}</span> },
    { header: 'ISO Code', render: (c) => <span className="font-mono text-xs font-bold">{c.code}</span> },
    { header: 'Phone Code', render: (c) => <span className="font-mono text-xs">{c.phoneCode}</span> },
    { header: 'States Count', render: (c) => <span className="font-mono text-xs text-primary-600 font-bold">{c.statesCount || 0} States</span> },
    { header: 'Status', render: (c) => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{c.status}</span> },
  ];

  const stateColumns = [
    { header: 'State Name', render: (s) => <span className="font-bold text-slate-900 dark:text-white">{s.name}</span> },
    { header: 'Code', render: (s) => <span className="font-mono text-xs font-bold">{s.code}</span> },
    { header: 'Country', render: (s) => <span className="text-xs font-semibold">{s.countryId?.name || 'N/A'}</span> },
    { header: 'Cities Count', render: (s) => <span className="font-mono text-xs text-primary-600 font-bold">{s.citiesCount || 0} Cities</span> },
    { header: 'Status', render: (s) => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{s.status}</span> },
  ];

  const cityColumns = [
    { header: 'City Name', render: (ci) => <span className="font-bold text-slate-900 dark:text-white">{ci.name}</span> },
    { header: 'State / Province', render: (ci) => <span className="text-xs">{ci.stateId?.name || 'N/A'}</span> },
    { header: 'Country', render: (ci) => <span className="text-xs">{ci.countryId?.name || 'N/A'}</span> },
    { header: 'Status', render: (ci) => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">{ci.status}</span> },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Location Management</h1>
          <p className="text-xs text-slate-500">Cascading Countries, States and Cities used across checkout, taxes, and shipping</p>
        </div>
        <button
          onClick={() => {
            setModalType(activeTab === 'countries' ? 'country' : activeTab === 'states' ? 'state' : 'city');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add {activeTab === 'countries' ? 'Country' : activeTab === 'states' ? 'State' : 'City'}
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'countries' && <DataTable columns={countryColumns} data={data.countries} loading={loading} />}
      {activeTab === 'states' && <DataTable columns={stateColumns} data={data.states} loading={loading} />}
      {activeTab === 'cities' && <DataTable columns={cityColumns} data={data.cities} loading={loading} />}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add ${modalType === 'country' ? 'Country' : modalType === 'state' ? 'State' : 'City'}`}
      >
        <form onSubmit={handleCreate} className="space-y-4 text-left">
          {modalType === 'country' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Germany"
                  value={countryForm.name}
                  onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ISO Code (2-letter)</label>
                  <input
                    type="text"
                    required
                    placeholder="DE"
                    value={countryForm.code}
                    onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Code</label>
                  <input
                    type="text"
                    placeholder="+49"
                    value={countryForm.phoneCode}
                    onChange={(e) => setCountryForm({ ...countryForm, phoneCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {modalType === 'state' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Country</label>
                <select
                  required
                  value={stateForm.countryId}
                  onChange={(e) => setStateForm({ ...stateForm, countryId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="">Select Country</option>
                  {data.countries.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bavaria"
                    value={stateForm.name}
                    onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State Code</label>
                  <input
                    type="text"
                    required
                    placeholder="BY"
                    value={stateForm.code}
                    onChange={(e) => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg font-mono uppercase"
                  />
                </div>
              </div>
            </>
          )}

          {modalType === 'city' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Country</label>
                <select
                  required
                  value={cityForm.countryId}
                  onChange={(e) => setCityForm({ ...cityForm, countryId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="">Select Country</option>
                  {data.countries.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                <select
                  required
                  value={cityForm.stateId}
                  onChange={(e) => setCityForm({ ...cityForm, stateId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                >
                  <option value="">Select State</option>
                  {data.states.filter((s) => !cityForm.countryId || s.countryId?._id === cityForm.countryId).map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Munich"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border rounded-lg"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
