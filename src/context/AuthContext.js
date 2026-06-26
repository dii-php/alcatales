// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SESSION_KEY  = 'alca_admin_session';  // sessionStorage
const PERSIST_KEY  = 'alca_admin_persist';  // localStorage (remember me)
const USERNAME_KEY = 'alca_admin_username'; // localStorage (which admin)

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin]           = useState(false);
  const [adminUsername, setAdminUsername] = useState(''); // 'alca' | 'aldi' | ''
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminsLoaded, setAdminsLoaded] = useState(false);
  const [adminList, setAdminList]       = useState([]);

  // Load admin list from Firestore once
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAdminList(list);
      } catch (e) {
        console.warn('Could not load admins from Firestore, falling back to env');
      }
      setAdminsLoaded(true);
    };
    loadAdmins();
  }, []);

  // Restore session
  useEffect(() => {
    const session   = sessionStorage.getItem(SESSION_KEY);
    const persisted = localStorage.getItem(PERSIST_KEY);
    const username  = localStorage.getItem(USERNAME_KEY) || '';
    if (session === 'true' || persisted === 'true') {
      setIsAdmin(true);
      setAdminUsername(username);
    }
  }, []);

  const login = async (username, password, rememberMe = false) => {
    // Try Firestore admin list first
    const trimUser = username.trim().toLowerCase();
    const trimPass = password.trim();

    let matched = false;

    if (adminList.length > 0) {
      matched = adminList.some(a =>
        a.username?.toLowerCase() === trimUser && a.password === trimPass
      );
    }

    // Fallback to env vars (single admin)
    if (!matched) {
      const envUser = (process.env.REACT_APP_ADMIN_USERNAME || 'alca').toLowerCase();
      const envPass = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
      matched = trimUser === envUser && trimPass === envPass;
    }

    if (matched) {
      setIsAdmin(true);
      setAdminUsername(trimUser);
      sessionStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(USERNAME_KEY, trimUser);
      if (rememberMe) {
        localStorage.setItem(PERSIST_KEY, 'true');
      } else {
        localStorage.removeItem(PERSIST_KEY);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminUsername('');
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
    // Keep USERNAME_KEY so we can still match subscriber status after logout
  };

  return (
    <AuthContext.Provider value={{
      isAdmin, adminUsername, login, logout,
      showLoginModal, setShowLoginModal,
      adminsLoaded, adminList,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
