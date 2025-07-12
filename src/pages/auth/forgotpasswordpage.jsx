import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import merchantAuthService from '../../services/merchantAuthService';
import { Mail, Lock, ArrowRight, ArrowLeft, Store, Shield, CheckCircle } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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

  const validateEmail = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReset = () => {
    const newErrors = {};
    
    if (!formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    
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

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      await merchantAuthService.requestPasswordReset(formData.email);
      toast.success('OTP sent to your email! Please check your inbox.');
      setStep(2);
    } catch (error) {
      console.error('Password reset request error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validateReset()) {
      return;
    }

    setLoading(true);

    try {
      await merchantAuthService.resetPassword(
        formData.email,
        formData.otp,
        formData.newPassword
      );
      
      toast.success('Password reset successfully! You can now log in with your new password.');
      navigate('/merchant/login');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
        <p className="text-blue-200">Enter your email address and we'll send you an OTP to reset your password</p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                errors.email ? 'border-red-400' : 'border-white/20'
              } rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
              placeholder="Enter your registered email"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Send OTP
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderResetStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Enter OTP & New Password</h2>
        <p className="text-blue-200">
          We've sent a 6-digit OTP to <strong>{formData.email}</strong>
        </p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">
            6-Digit OTP
          </label>
          <input
            type="text"
            name="otp"
            value={formData.otp}
            onChange={handleInputChange}
            maxLength={6}
            className={`w-full px-4 py-3 bg-white/10 border ${
              errors.otp ? 'border-red-400' : 'border-white/20'
            } rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-center text-2xl tracking-widest`}
            placeholder="000000"
            disabled={loading}
          />
          {errors.otp && (
            <p className="mt-1 text-sm text-red-400">{errors.otp}</p>
          )}
        </div>

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

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2 inline" />
            Back
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Reset Password
                <CheckCircle className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Resend OTP */}
      <div className="text-center">
        <p className="text-blue-200 text-sm">
          Didn't receive the OTP?{' '}
          <button
            onClick={() => handleRequestReset({ preventDefault: () => {} })}
            disabled={loading}
            className="text-blue-300 hover:text-white font-medium transition-colors disabled:opacity-50"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );

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
              Secure Account
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Recovery
              </span>
            </h2>
            
            <p className="text-xl text-blue-100 mb-8">
              Reset your password securely and get back to managing your business
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <Shield className="w-5 h-5 text-blue-400 mr-3" />
              <span>Secure OTP verification</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Lock className="w-5 h-5 text-purple-400 mr-3" />
              <span>Encrypted password reset</span>
            </div>
            <div className="flex items-center text-blue-100">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <span>Instant account recovery</span>
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

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-blue-200">Step {step} of 2</span>
                <span className="text-sm text-blue-200">
                  {step === 1 ? 'Enter Email' : 'Reset Password'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${(step / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            {step === 1 ? renderEmailStep() : renderResetStep()}

            {/* Back to Login Link */}
            <div className="mt-8 text-center">
              <p className="text-blue-200">
                Remember your password?{' '}
                <Link
                  to="/merchant/login"
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

export default ForgotPasswordPage;