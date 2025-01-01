import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { loginUser } from '../../services/api_service';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const LoginPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser(formData);

      // Encrypt merchant data and token
      const secretKey = import.meta.env.VITE_SECRET_KEY;
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify({
          merchant: {
            id: response.id,
            first_name: response.first_name,
            last_name: response.last_name,
            email_address: response.email_address,
            phone_number: response.phone_number,
            joined: response.joined,
            updated: response.updated,
          },
          token: response.access_token,
        }),
        secretKey
      ).toString();
      Cookies.set('auth_data', encryptedData, { expires: 250, secure: true });
      toast.success('Login successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${darkMode ? 'bg-black text-white' : 'bg-gray-900 text-gray-100'} min-h-screen flex items-center justify-center relative`}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1A3664] to-[#1A3664] opacity-30 animate-pulse"></div>

      <div className="w-full max-w-7xl flex items-center justify-center space-x-8 px-8 py-12">
        {/* Left Column - Login Form */}
        <div className="w-full max-w-md bg-gradient-to-r from-[#1A3664] via-[#1A3664] to-[#1A3664] dark:bg-gradient-to-r dark:from-[#1A3664] dark:via-[#1A3664] dark:to-[#1A3664] shadow-xl rounded-lg p-8 z-10 text-center transform transition-transform duration-300 ease-in-out hover:scale-105">
          <h2 className="text-3xl font-semibold text-white mb-6">Login to Your Account</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="absolute text-sm text-white left-4 top-2 transform -translate-y-1/2 transition-all ease-in-out">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-b-2 border-white dark:border-gray-700 bg-transparent text-white dark:text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1A3664] rounded-md transition-all ease-in-out"
                placeholder="Enter your email"
              />
            </div>

            <div className="relative">
              <label className="absolute text-sm text-white left-4 top-2 transform -translate-y-1/2 transition-all ease-in-out">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-b-2 border-white dark:border-gray-700 bg-transparent text-white dark:text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#1A3664] rounded-md transition-all ease-in-out"
                placeholder="Enter your password"
              />
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center text-white">
                <input type="checkbox" className="mr-2 rounded" />
                Remember Me
              </label>
              <a href="/forgot-password" className="text-[#1A3664] hover:text-[#1A3664]">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white bg-[#1A3664] hover:bg-[#1A3664] focus:outline-none focus:ring-2 focus:ring-[#1A3664] rounded-md transition-all ease-in-out ${loading && 'opacity-50 cursor-not-allowed'}`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-300 mt-4">
            Don’t have an account?{' '}
            <a href="/signup" className="text-[#1A3664] hover:text-[#1A3664]">
              Sign Up
            </a>
          </p>
        </div>

        <div className="w-1/2 hidden md:block">
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
