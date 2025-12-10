// components/AuthForm.js
"use client"

import axios from 'axios';
import { useState } from 'react';
import { setTokens } from '@/lib/auth';
import { API_BASE_URL, ENDPOINTS } from "../lib/apiConfig";
import { useRouter } from 'next/navigation';

export default function AuthForm({ isLogin = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
    const payload = isLogin
        ? { email, password }
        : { username, email, password };

      // Gunakan base + endpoint yang sudah benar (dengan prefix /api)
      const response = await axios.post(
        `${API_BASE_URL}${isLogin ? ENDPOINTS.LOGIN : ENDPOINTS.REGISTER}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: false, // kita pakai Bearer token, bukan cookie
        }
      );

      const { access_token, refresh_token, user } = response.data;
      if (!access_token || !refresh_token) {
        setError("Autentikasi gagal: Respons server tidak valid");
        return;
      }

      setTokens({ access_token, refresh_token, user });
      
       // Redirect berbasis role
      const role = (user?.role || '').toLowerCase();
      const dest = role === 'admin' || role === 'doctor' ? '/dashboard' : '/exam';
      router.push(dest);
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        const errorMessage = err.response.data?.error || 
          `Error server: ${err.response.status}`;
        setError(errorMessage);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('Server tidak merespon. Silahkan coba lagi nanti.');
      } else {
        console.error('Request setup error:', err.message);
        setError(`Permintaan gagal: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isLogin && (
        <div className="relative">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 pl-5 pr-12 bg-white/30 dark:bg-gray-800/30 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            required
            disabled={isLoading}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      )}
      
      <div className="relative">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 pl-5 pr-12 bg-white/30 dark:bg-gray-800/30 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          required
          disabled={isLoading}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 pl-5 pr-12 bg-white/30 dark:bg-gray-800/30 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          required
          disabled={isLoading}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-tr-lg rounded-br-lg">
          <p className="text-red-600 dark:text-red-500 text-sm">{error}</p>
        </div>
      )}
      
      <button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memproses...
          </>
        ) : (
          <>
            {isLogin ? 'Masuk' : 'Daftar'}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}