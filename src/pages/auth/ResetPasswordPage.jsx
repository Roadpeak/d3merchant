import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import merchantAuthService from '../../services/merchantAuthService';
import { Lock, ArrowRight, Store, Shield, CheckCircle, Loader, AlertCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setTokenError(true);
      toast.error('Invalid or missing reset token');
    } else {
      setToken(resetToken);
    }
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await merchantAuthService.resetPassword(token, formData.newPassword);
      toast.success('Password reset successfully! You can now log in with your new password.');
      navigate('/accounts/sign-in');
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        setTokenError(true);
      }
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
              <p className="text-blue-200 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>

              <div className="space-y-3">
                <Link
                  to="/merchant/forgot-password"
                  className="w-full inline-flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105"
                >
                  Request New Link
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>

                <Link
                  to="/accounts/sign-in"
                  className="block text-blue-300 hover:text-white font-medium transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col w-1/2 pr-12">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Discoun3</h1>
                <p className="text-blue-200">Merchant Portal</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              Create New
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Password
              </span>
            </h2>

            <p className="text-xl text-blue-100 mb-8">
              Choose a strong password to secure your merchant account
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <Shield className="w-5 h-5 text-blue-400 mr-3" />
              <span>Secure password encryption</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Lock className="w-5 h-5 text-purple-400 mr-3" />
              <span>Protected account access</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <span>Instant password update</span>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8 lg:hidden">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Discoun3</h1>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
              <p className="text-blue-200">Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                      errors.newPassword ? 'border-red-400' : 'border-white/20'
                    } rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                )}

                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs">
                      <CheckCircle
                        className={`w-4 h-4 mr-2 ${
                          formData.newPassword.length >= 8 ? 'text-green-400' : 'text-gray-400'
                        }`}
                      />
                      <span className={formData.newPassword.length >= 8 ? 'text-green-400' : 'text-blue-200'}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <CheckCircle
                        className={`w-4 h-4 mr-2 ${
                          /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword) ? 'text-green-400' : 'text-gray-400'
                        }`}
                      />
                      <span className={/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword) ? 'text-green-400' : 'text-blue-200'}>
                        Uppercase, lowercase, and number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                      errors.confirmPassword ? 'border-red-400' : 'border-white/20'
                    } rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <CheckCircle className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="mt-8 text-center">
              <p className="text-blue-200">
                Remember your password?{' '}
                <Link
                  to="/accounts/sign-in"
                  className="text-blue-300 hover:text-white font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
