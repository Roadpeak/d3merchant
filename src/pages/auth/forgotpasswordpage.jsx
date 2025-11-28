import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import merchantAuthService from '../../services/merchantAuthService';
import { Mail, ArrowRight, Store, Shield, CheckCircle, Loader, Lock } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [formData, setFormData] = useState({
    email: ''
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

  const handleRequestReset = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      await merchantAuthService.requestPasswordReset(formData.email);
      toast.success('Password reset link sent! Please check your email.');
      setEmailSent(true);
    } catch (error) {
      console.error('Password reset request error:', error);
      toast.error(error.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
        <p className="text-blue-200">Enter your email address and we'll send you a link to reset your password</p>
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
            <Loader className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderSuccessMessage = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-blue-200 mb-4">
          We've sent a password reset link to <strong className="text-white">{formData.email}</strong>
        </p>
        <p className="text-blue-300 text-sm">
          Click the link in the email to reset your password. The link will expire in 1 hour.
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-white/5 rounded-xl p-6 space-y-3">
        <h3 className="text-white font-medium mb-3">Next Steps:</h3>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-blue-300 text-xs font-bold">1</span>
          </div>
          <p className="text-blue-200 text-sm">Check your email inbox (and spam folder)</p>
        </div>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-blue-300 text-xs font-bold">2</span>
          </div>
          <p className="text-blue-200 text-sm">Click the password reset link</p>
        </div>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-blue-300 text-xs font-bold">3</span>
          </div>
          <p className="text-blue-200 text-sm">Enter your new password</p>
        </div>
      </div>

      {/* Resend link */}
      <div className="text-center">
        <p className="text-blue-200 text-sm mb-4">
          Didn't receive the email?{' '}
          <button
            onClick={() => setEmailSent(false)}
            className="text-blue-300 hover:text-white font-medium transition-colors"
          >
            Try again
          </button>
        </p>

        <Link
          to="/accounts/sign-in"
          className="text-blue-300 hover:text-white font-medium transition-colors text-sm"
        >
          Return to Sign In
        </Link>
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

            {emailSent ? renderSuccessMessage() : renderEmailStep()}

            {/* Back to Login Link */}
            {!emailSent && (
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
            )}
          </div>
        </div>
      </div>

      <style>
        {`
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
        `}
      </style>
    </div>
  );
};

export default ForgotPasswordPage;