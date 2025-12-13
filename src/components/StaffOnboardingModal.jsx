import React, { useState } from 'react';
import { X, Users, UserPlus, Mail, Phone, Briefcase, AlertCircle } from 'lucide-react';
import { createStaff } from '../services/api_service';
import { toast } from 'react-hot-toast';

const StaffOnboardingModal = ({ isOpen, onStaffAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    specialization: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Prevent closing the modal
  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Staff name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createStaff(formData);

      toast.success('Staff member added successfully!');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'STAFF',
        specialization: ''
      });

      // Call the callback to refresh staff list and close modal
      if (onStaffAdded) {
        onStaffAdded();
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error(error.message || 'Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  Add Your First Staff Member
                </h2>
                <p className="text-blue-100 mt-1">
                  Required to create services and manage bookings
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="m-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Important: Staff Required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                At least one staff member is required to create services. Staff members are assigned to services and handle customer bookings.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Full Name *</span>
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. John Doe"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address *</span>
                </div>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number *</span>
                </div>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+254 XXX XXX XXX"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.phone
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Specialization (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Specialization (Optional)</span>
                </div>
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="e.g. Hair Stylist, Massage Therapist"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This helps customers find the right service provider
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Adding Staff Member...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Add Staff Member</span>
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="pt-2 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You can add more staff members later from the Staff Management page
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffOnboardingModal;
