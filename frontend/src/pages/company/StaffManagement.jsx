import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  KeyRound,
  Lock,
  UserX,
  CheckSquare,
  Square,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { Tabs } from '../../components/common/Tabs';
import { PERMISSION_MODULES } from '../../config/constants';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Modals & Forms
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [resetPassTarget, setResetPassTarget] = useState(null);

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    status: 'active',
  });
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Role Modals & Forms
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/company/staff'),
        api.get('/company/roles'),
      ]);
      if (usersRes.data?.success) {
        setUsers(usersRes.data.data || []);
      }
      if (rolesRes.data?.success) {
        setRoles(rolesRes.data.data.roles || rolesRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load staff management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- STAFF USER HANDLERS ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', roleId: roles[0]?._id || '', status: 'active' });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      roleId: u.roleId?._id || u.roleId || '',
      status: u.status || 'active',
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/company/staff/${editingUser._id}`, {
          name: userForm.name,
          roleId: userForm.roleId || null,
          status: userForm.status,
          ...(userForm.password ? { password: userForm.password } : {}),
        });
      } else {
        await api.post('/company/staff', userForm);
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchData();
      toast.success(editingUser ? 'Staff member updated successfully' : 'Staff member created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save staff member.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassTarget || !newPasswordInput.trim()) return;
    try {
      await api.put(`/company/staff/${resetPassTarget._id}`, { password: newPasswordInput });
      toast.success(`Password reset successfully for ${resetPassTarget.name}!`);
      setIsResetPassModalOpen(false);
      setResetPassTarget(null);
      setNewPasswordInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleToggleUserStatus = async (u) => {
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/company/staff/${u._id}`, { status: nextStatus });
      fetchData();
      toast.success(`User status updated to ${nextStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Revoke access and delete this staff member?')) {
      try {
        await api.delete(`/company/staff/${id}`);
        fetchData();
        toast.success('Staff member deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  // --- ROLE HANDLERS ---
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await api.put(`/company/roles/${editingRole._id}`, roleForm);
      } else {
        await api.post('/company/roles', roleForm);
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      fetchData();
      toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role.');
    }
  };

  const handleDeleteRole = async (id) => {
    if (window.confirm('Delete this custom role? Staff assigned to this role will fallback to basic access.')) {
      try {
        await api.delete(`/company/roles/${id}`);
        fetchData();
        toast.success('Role deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete role.');
      }
    }
  };

  // Master Permission Toggle Helper
  const allAvailablePerms = PERMISSION_MODULES.flatMap((mod) =>
    mod.actions.map((act) => `${mod.id}.${act}`)
  );

  const isAllPermsSelected = allAvailablePerms.every((p) => roleForm.permissions.includes(p));

  const handleToggleSelectAllPerms = () => {
    if (isAllPermsSelected) {
      setRoleForm({ ...roleForm, permissions: [] });
    } else {
      setRoleForm({ ...roleForm, permissions: [...allAvailablePerms] });
    }
  };

  const tabs = [
    { id: 'users', label: 'Staff Members', badge: users.length },
    { id: 'roles', label: 'Roles & Permission Matrix', badge: roles.length },
  ];

  const userColumns = [
    {
      header: 'Staff Member',
      render: (u) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white flex items-center justify-center font-extrabold text-xs">
            {u.name?.[0] || 'U'}
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
            <span className="text-xs text-slate-400">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      className: 'hidden sm:table-cell',
      render: (u) => (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          {u.roleId?.name || u.role || 'Staff Member'}
        </span>
      ),
    },
    {
      header: 'Status',
      className: 'hidden md:table-cell',
      render: (u) => (
        <button
          onClick={() => handleToggleUserStatus(u)}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
            u.status === 'active'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
          title="Click to toggle active status"
        >
          {u.status === 'active' ? 'Active' : 'Disabled'}
        </button>
      ),
    },
    {
      header: 'Joined Date',
      render: (u) => <span className="text-xs text-slate-400 font-mono">{new Date(u.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            onClick={() => {
              setResetPassTarget(u);
              setNewPasswordInput('');
              setIsResetPassModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEditUser(u)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Edit Member"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteUser(u._id)}
            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Revoke & Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Staff & Access Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage store managers, staff accounts, and customize granular RBAC permission matrices
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab === 'users' ? (
            <button
              onClick={handleOpenCreateUser}
              className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Staff Member
            </button>
          ) : (
            <button
              onClick={handleOpenCreateRole}
              className="inline-flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create Custom Role
            </button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* STAFF USERS TAB */}
      {activeTab === 'users' && <DataTable columns={userColumns} data={users} loading={loading} />}

      {/* ROLES & PERMISSIONS TAB */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div
              key={role._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{role.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{role.description || 'Custom company role'}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200">
                    {role.permissions?.length || 0} permissions
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {role.permissions?.length === 0 ? (
                    <span className="text-xs text-slate-400 font-italic">No permissions assigned</span>
                  ) : (
                    role.permissions?.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                      >
                        {p}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Created by {role.createdBy?.name || 'Admin'}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditRole(role)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role._id)}
                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-slate-200"
                    title="Delete Role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT STAFF USER MODAL */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? `Edit Staff Member: ${editingUser.name}` : 'Invite New Staff Member'}
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none disabled:opacity-60"
              placeholder="jane@company.com"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assign Role</label>
            <select
              value={userForm.roleId}
              onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="">Staff Member (Standard Access)</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.permissions?.length || 0} permissions)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
            <select
              value={userForm.status}
              onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
            >
              {editingUser ? 'Save User Changes' : 'Invite Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPassModalOpen}
        onClose={() => setIsResetPassModalOpen(false)}
        title={`Reset Password: ${resetPassTarget?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              placeholder="Enter new password"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsResetPassModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-md"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE / EDIT ROLE MODAL WITH GRANULAR CHECKBOXES */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Role with Permission Matrix'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Catalog & Order Manager"
              value={roleForm.name}
              onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              type="text"
              placeholder="Responsibilities and access scope..."
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                Granular Module Permission Checkboxes
              </label>
              <button
                type="button"
                onClick={handleToggleSelectAllPerms}
                className="text-xs font-bold text-purple-600 hover:underline flex items-center space-x-1"
              >
                <span>{isAllPermsSelected ? 'Deselect All' : 'Select All Permissions'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs">
              {PERMISSION_MODULES.flatMap((mod) =>
                mod.actions.map((act) => {
                  const permKey = `${mod.id}.${act}`;
                  const isChecked = roleForm.permissions.includes(permKey);

                  return (
                    <label
                      key={permKey}
                      className={`flex items-center space-x-2 p-2 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, permKey] });
                          } else {
                            setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter((p) => p !== permKey) });
                          }
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-mono text-[11px] truncate">{permKey}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md"
            >
              {editingRole ? 'Save Role Changes' : 'Create Custom Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
