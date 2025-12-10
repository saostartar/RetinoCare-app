/**
 * API configuration for the RetinoCare application.
 * Centralizes API URLs and other configuration settings.
 */

// Base API URL with fallback to localhost for development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// API endpoints
export const ENDPOINTS = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH: "/api/auth/refresh",

  // clinical
  PATIENTS: "/api/patients",
  EXAMS: "/api/exams",
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_USERS: "/api/admin/users",
};

/**
 * Get complete URL for an API endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} The complete URL
 */
export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;