import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import merchantAuthService from '../../services/merchantAuthService';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Store, CheckCircle, Shield } from 'lucide-react';

const MerchantSignupPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    businessType: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    if (merchantAuthService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const businessTypes = [
    'Beauty & Wellness',
    'Barber & Salon',
    'Spa',
    'Recreation',
    'Fitness & Sports',
    'Events & Entertainment',
    'Cleaning Services',
    'Laundry',
    'Domestic Services',
    'Photography & Videography',
    'Tailoring & Fashion',
    'Legal Services',
    'Accounting & Tax Services',
    'Business Consulting & Advisory',
    'Marketing, Advertising & Branding',
    'IT & Software Development',
    'Creative & Media',
    'Hospitals & Clinics',
    'Dental Services',
    'Counseling & Mental Health Services',
    'Tutors',
    'E-learning & Online Coaching',
    'Taxi & Ride-hailing',
    'Vehicle Rentals & Leasing',
    'Courier & Delivery Services',
    'Moving & Relocation Services',
    'Hotels, Lodges & Guest Houses',
    'Restaurants, Cafés & Catering',
    'Tour & Travel Agencies',
    'Adventure & Safari Guides',
    'Event Venues & Conferencing',
    'Freight & Logistics Companies',
    'Car Repairs & Maintenance',
    'Real Estate Agents & Property Managers',
    'Construction & Renovation',
    'Plumbing, Electrical, Carpentry & Handymen',
    'Interior Design & Landscaping',
    'Security Services',
    'Agro-vet Services',
    'Farm Equipment & Machinery Rentals',
    'Irrigation & Greenhouse Installation',
    'Veterinary Services',
    'Produce Transport & Storage'
  ];

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.businessType) {
      newErrors.businessType = 'Please select a business type';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
      };

      const response = await merchantAuthService.register(signupData);

      // Store auth data
      merchantAuthService.storeAuthData({
        merchant: response.merchant,
        token: response.access_token,
      });

      toast.success('Account created successfully! Please create your store.');
      navigate('/stores/create');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Personal Information</h2>
        <p className="text-white/80">Let's start with your basic details</p>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            First Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                errors.firstName ? 'border-red-400' : 'border-white/20'
              } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
              placeholder="First name"
              disabled={loading}
            />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
                errors.lastName ? 'border-red-400' : 'border-white/20'
              } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
              placeholder="Last name"
              disabled={loading}
            />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
              errors.email ? 'border-red-400' : 'border-white/20'
            } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
            placeholder="Enter your email"
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${
              errors.phoneNumber ? 'border-red-400' : 'border-white/20'
            } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
            placeholder="Enter your phone number"
            disabled={loading}
          />
        </div>
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
        )}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNextStep}
        className="w-full flex items-center justify-center py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        Continue
        <ArrowRight className="ml-2 w-5 h-5" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Security & Business</h2>
        <p className="text-white/80">Set up your password and business type</p>
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Business Type
        </label>
        <select
          name="businessType"
          value={formData.businessType}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 bg-white/10 border ${
            errors.businessType ? 'border-red-400' : 'border-white/20'
          } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
          disabled={loading}
        >
          <option value="" className="bg-slate-800">Select business type</option>
          {businessTypes.map((type) => (
            <option key={type} value={type} className="bg-slate-800">
              {type}
            </option>
          ))}
        </select>
        {errors.businessType && (
          <p className="mt-1 text-sm text-red-400">{errors.businessType}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full pl-12 pr-12 py-3 bg-white/10 border ${
              errors.password ? 'border-red-400' : 'border-white/20'
            } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
            placeholder="Create a strong password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-400">{errors.password}</p>
        )}

        {/* Password Strength Indicator */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center text-xs">
            <CheckCircle
              className={`w-4 h-4 mr-2 ${
                formData.password.length >= 8 ? 'text-green-400' : 'text-gray-400'
              }`}
            />
            <span className={formData.password.length >= 8 ? 'text-green-400' : 'text-white/70'}>
              At least 8 characters
            </span>
          </div>
          <div className="flex items-center text-xs">
            <CheckCircle
              className={`w-4 h-4 mr-2 ${
                /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) ? 'text-green-400' : 'text-gray-400'
              }`}
            />
            <span className={/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password) ? 'text-green-400' : 'text-white/70'}>
              Uppercase, lowercase, and number
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full pl-12 pr-12 py-3 bg-white/10 border ${
              errors.confirmPassword ? 'border-red-400' : 'border-white/20'
            } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm transition-all duration-200`}
            placeholder="Confirm your password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            disabled={loading}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div>
        <label className="flex items-start">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="w-5 h-5 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-yellow-400 focus:ring-2 mt-1"
            disabled={loading}
          />
          <span className="ml-3 text-sm text-white/80">
            I agree to the{' '}
            <Link to="/terms" className="text-yellow-300 hover:text-yellow-400 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-yellow-300 hover:text-yellow-400 underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="mt-1 text-sm text-red-400">{errors.acceptTerms}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePrevStep}
          className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-500 transition-all duration-200"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5 mr-2 inline" />
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col w-1/2 pr-12">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-lg leading-none tracking-tight">D3</span>
                  <svg
                    className="w-6 h-2 text-yellow-400 mt-0.5"
                    viewBox="0 0 24 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M2 2 Q 12 8, 22 2" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Discoun3</h1>
                <p className="text-white/80">Merchant Portal</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">
              Start Your Journey
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                Build Your Business
              </span>
            </h2>

            <p className="text-xl text-white/90 mb-8">
              Join our platform and start offering discounted services to thousands of customers
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                <Store className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Easy Setup</h3>
                <p className="text-white/80 text-sm">Get your store up and running in minutes</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Secure Platform</h3>
                <p className="text-white/80 text-sm">Bank-level security for all transactions</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">24/7 Support</h3>
                <p className="text-white/80 text-sm">Get help whenever you need it</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-white font-bold text-sm leading-none tracking-tight">D3</span>
                    <svg
                      className="w-5 h-1.5 text-yellow-400 mt-0.5"
                      viewBox="0 0 24 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M2 2 Q 12 8, 22 2" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white">Discoun3</h1>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-white/80">Step {currentStep} of 2</span>
                <span className="text-sm text-white/80">{currentStep === 1 ? 'Personal Info' : 'Security & Business'}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300 ease-in-out shadow-lg"
                  style={{ width: `${(currentStep / 2) * 100}%` }}
                ></div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {currentStep === 1 ? renderStep1() : renderStep2()}
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-white/80">
                Already have an account?{' '}
                <Link
                  to="/accounts/sign-in"
                  className="text-yellow-300 hover:text-yellow-400 font-medium transition-colors"
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

export default MerchantSignupPage;