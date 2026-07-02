// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SESSION_KEY  = 'alca_admin_session';
const PERSIST_KEY  = 'alca_admin_persist';
const USERNAME_KEY = 'alca_admin_username';

// Hardcoded fallback admins (in addition to Firestore)
const HARDCODED_ADMINS = [
  { username: 'aldi', password: 'pantoloan87' },
  { username: 'alca', password: 'alcaa0904'  },
];

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin]             = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

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

    // 1. Check hardcoded list first (always works, no network needed)
    const hardcoded = HARDCODED_ADMINS.some(
      a => a.username === trimUser && a.password === trimPass
    );

    // 2. Check Firestore (for dynamically added admins)
    let firestoreMatch = false;
    if (!hardcoded) {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        firestoreMatch = snap.docs.some(d => {
          const a = d.data();
          return String(a.username ?? '').trim().toLowerCase() === trimUser
              && String(a.password ?? '').trim() === trimPass;
        });
      } catch (e) {
        console.warn('[Auth] Firestore fetch failed:', e.message);
      }
    }

    // 3. Check env vars (original fallback)
    const envMatch = !hardcoded && !firestoreMatch &&
      trimUser === (process.env.REACT_APP_ADMIN_USERNAME || 'alca').toLowerCase() &&
      trimPass === (process.env.REACT_APP_ADMIN_PASSWORD || 'admin123');

    if (hardcoded || firestoreMatch || envMatch) {
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
    localStorage.removeItem(USERNAME_KEY);
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
