// lib/auth.js

const isBrowser = typeof window !== 'undefined';

/**
 * Simpan token dan data user ke localStorage
 * @param {{ access_token: string, refresh_token: string, user: object }} param0
 */
export const setTokens = ({ access_token, refresh_token, user }) => {
  if (!isBrowser) return;

  try {
    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    const payload = user ? JSON.stringify(user) : 'null';
    // Simpan user (kompatibel: dua key)
    localStorage.setItem('user', payload);
    localStorage.setItem('rc_user', payload);
  } catch (e) {
    console.error('Failed storing tokens', e);
  }
};

/**
 * Ambil access token dari localStorage
 * @returns {string|null}
 */
export const getAccessToken = () => {
  if (!isBrowser) return null;
  return localStorage.getItem('accessToken');
};

/**
 * Ambil refresh token dari localStorage
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  if (!isBrowser) return null;
  return localStorage.getItem('refreshToken');
};

/**
 * Ambil data user saat ini dari localStorage
 * @returns {Object|null}
 */
export const getUser = () => {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem('rc_user') || localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/**
 * Hapus seluruh data autentikasi
 */
export const clearAuth = () => {
  if (!isBrowser) return;
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rc_user');
  } catch (e) {
    console.error('Failed clearing auth', e);
  }
};

/**
 * Cek status autentikasi
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  if (!isBrowser) return false;
  return !!getAccessToken();
};

/**
 * Perbarui access token (saat refresh)
 * @param {string} accessToken
 */
export const updateAccessToken = (accessToken) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem('accessToken', accessToken);
  } catch (e) {
    console.error('Failed updating access token', e);
  }
};

// Backward compatibility helpers
export const setToken = (token) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem('accessToken', token);
  } catch (e) {
    console.error('Failed setting token', e);
  }
};

export const getToken = getAccessToken;
export const removeToken = clearAuth;