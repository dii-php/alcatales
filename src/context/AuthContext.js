// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'alca_admin';

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Check both sessionStorage (tab-session) and localStorage (remember me)
    const session = sessionStorage.getItem(STORAGE_KEY);
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (session === 'true' || persisted === 'true') setIsAdmin(true);
  }, []);

  const login = (username, password, rememberMe = false) => {
    const adminUser = process.env.REACT_APP_ADMIN_USERNAME || 'aldi';
    const adminPass = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (username === adminUser && password === adminPass) {
      setIsAdmin(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, showLoginModal, setShowLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
};
