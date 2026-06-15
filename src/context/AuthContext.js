// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const adminSession = sessionStorage.getItem('alca_admin');
    if (adminSession === 'true') setIsAdmin(true);
  }, []);

  const login = (username, password) => {
    const adminUser = process.env.REACT_APP_ADMIN_USERNAME || 'aldi';
    const adminPass = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (username === adminUser && password === adminPass) {
      setIsAdmin(true);
      sessionStorage.setItem('alca_admin', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('alca_admin');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout, showLoginModal, setShowLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
};
