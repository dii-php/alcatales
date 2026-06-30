// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SESSION_KEY  = 'alca_admin_session';
const PERSIST_KEY  = 'alca_admin_persist';
const USERNAME_KEY = 'alca_admin_username';

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

    let matched = false;

    try {
      const snap = await getDocs(collection(db, 'admins'));
      const docs = snap.docs.map(d => d.data());
      console.log('[Auth] Loaded admins from Firestore:', docs.map(a => ({
        username: a.username,
        usernameType: typeof a.username,
        passwordLength: a.password?.length,
      })));

      matched = docs.some(a => {
        // Normalize both sides aggressively: trim + lowercase + handle non-string values
        const docUser = String(a.username ?? '').trim().toLowerCase();
        const docPass = String(a.password ?? '').trim();
        const isMatch = docUser === trimUser && docPass === trimPass;
        if (docUser === trimUser && !isMatch) {
          console.warn(`[Auth] Username matched "${docUser}" but password mismatch. Expected length ${docPass.length}, got length ${trimPass.length}`);
        }
        return isMatch;
      });
    } catch (e) {
      console.warn('[Auth] Firestore fetch failed:', e.message);
    }

    // Fallback to env vars (only matters for the default admin)
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
    localStorage.removeItem(USERNAME_KEY); // clear so subscriber history resets to guest view
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
