import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if an existing session cookie is valid on initial load
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await api.getMe();
        if (isMounted && res.success && res.admin) {
          setAdmin(res.admin);
        }
      } catch (err) {
        if (isMounted) {
          setAdmin(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.admin) {
      setAdmin(res.admin);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
