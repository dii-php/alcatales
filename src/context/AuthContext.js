// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SESSION_KEY  = 'alca_admin_session';
const PERSIST_KEY  = 'alca_admin_persist';
const USERNAME_KEY = 'alca_admin_username';

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin]               = useState(false);
  const [adminUsername, setAdminUsername]   = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const adminListRef = useRef([]); // use ref so login() always reads latest value

  // Load admin list from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        adminListRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('[Auth] Admins loaded:', adminListRef.current.map(a => a.username));
      } catch (e) {
        console.warn('[Auth] Could not load admins from Firestore:', e.message);
      }
    };
    load();
  }, []);

  // Restore session on mount
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
    const trimUser = username.trim().toLowerCase();
    const trimPass = password.trim();

    // Fetch fresh from Firestore every login attempt (avoids race condition)
    let firestoreMatch = false;
    try {
      const snap = await getDocs(collection(db, 'admins'));
      const list = snap.docs.map(d => d.data());
      adminListRef.current = list;
      firestoreMatch = list.some(
        a => a.username?.toLowerCase() === trimUser && a.password === trimPass
      );
    } catch (e) {
      console.warn('[Auth] Firestore fetch failed during login:', e.message);
    }

    // Fallback: env vars
    const envUser = (process.env.REACT_APP_ADMIN_USERNAME || 'alca').toLowerCase();
    const envPass = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    const envMatch = trimUser === envUser && trimPass === envPass;

    if (firestoreMatch || envMatch) {
      setIsAdmin(true);
      setAdminUsername(trimUser);
      sessionStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(USERNAME_KEY, trimUser);
      if (rememberMe) localStorage.setItem(PERSIST_KEY, 'true');
      else localStorage.removeItem(PERSIST_KEY);
      return { success: true };
    }

    return { success: false, message: 'Akun tidak ditemukan, lau sape mpruy 🤨' };
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminUsername('');
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PERSIST_KEY);
  };

  return (
    <AuthContext.Provider value={{
      isAdmin, adminUsername, login, logout,
      showLoginModal, setShowLoginModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
