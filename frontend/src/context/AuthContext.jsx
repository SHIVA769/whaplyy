import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('whatsstore_token') || null);
  const [activeStore, setActiveStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          setUser(res.data.data.user);
        }
      } catch {
        localStorage.removeItem('whatsstore_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = (authToken, userData) => {
    localStorage.setItem('whatsstore_token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('whatsstore_token');
    setToken(null);
    setUser(null);
    setActiveStore(null);
    window.location.assign('/login');
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isCompanyOwner = user?.role === 'company_owner';
  const isStaff = user?.role === 'staff';
  const isCustomer = user?.role === 'customer';

  const hasPermission = (permKey) => {
    if (isSuperAdmin || isCompanyOwner) return true;
    if (!user?.permissions) return false;
    return user.permissions.includes(permKey) || user.permissions.includes('*');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        activeStore,
        setActiveStore,
        isSuperAdmin,
        isCompanyOwner,
        isStaff,
        isCustomer,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
