// Updated BranchManagement component - Key changes for working days

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import branchService from '../services/branchService';

const BranchManagement = ({ storeId, onBranchesUpdate }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    openingTime: '',
    closingTime: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], // Default working days
    description: '',
    isMainBranch: false
  });
  const [formErrors, setFormErrors] = useState({});

  // FIXED: Proper working days array - capitalized as expected by backend
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load branches on component mount
  useEffect(() => {
    if (storeId) {
      loadBranches();
    }
  }, [storeId]);

  // Load branches from API
  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.getBranchesByStore(storeId);
      setBranches(response.branches || []);
      
      console.log('🏢 Loaded branches:', response.branches?.length || 0);
      console.log('🏪 Main branch working days:', response.mainBranch?.workingDays);
      
      // Notify parent component
      if (onBranchesUpdate) {
        onBranchesUpdate(response.branches || []);
      }
    } catch (error) {
      console.error('💥 Error loading branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // FIXED: Handle working days selection with proper validation
  const handleWorkingDaysChange = (day) => {
    setFormData(prev => {
      const currentDays = prev.workingDays || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      
      console.log('📅 Working days updated:', newDays);
      
      return {
        ...prev,
        workingDays: newDays
      };
    });

    // Clear working days error
    if (formErrors.workingDays) {
      setFormErrors(prev => ({
        ...prev,
        workingDays: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const validation = branchService.validateBranchData(formData);
    
    // Additional validation for working days
    if (!formData.workingDays || formData.workingDays.length === 0) {
      validation.errors.workingDays = 'At least one working day must be selected';
      validation.isValid = false;
    }
    
    console.log('📝 Form validation:', validation);
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Submitting form with data:', formData);
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    // Ensure working days are properly formatted
    const submissionData = {
      ...formData,
      workingDays: formData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };

    console.log('📤 Final submission data:', submissionData);

    try {
      setLoading(true);

      if (editingBranch) {
        // Update existing branch
        await branchService.updateBranch(editingBranch.id, submissionData);
        toast.success('Branch updated successfully!');
      } else {
        // Create new branch
        await branchService.createBranch(storeId, submissionData);
        toast.success('Branch added successfully!');
      }

      // Reset form and reload branches
      resetForm();
      await loadBranches();

    } catch (error) {
      console.error('💥 Error saving branch:', error);
      toast.error(error.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      openingTime: '',
      closingTime: '',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], // Reset to default
      description: '',
      isMainBranch: false
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingBranch(null);
  };

  // FIXED: Start editing a branch with proper working days handling
  const startEditing = (branch) => {
    if (branch.isStoreMainBranch) {
      toast.error('Cannot edit main branch. Please update store information instead.');
      return;
    }

    console.log('✏️ Editing branch:', branch);

    // Ensure working days is an array and properly formatted
    let workingDays = branch.workingDays;
    if (!Array.isArray(workingDays)) {
      workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }

    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager: branch.manager || '',
      openingTime: branch.openingTime || '',
      closingTime: branch.closingTime || '',
      workingDays: workingDays, // Use the validated working days array
      description: branch.description || '',
      isMainBranch: false // Additional branches are never main
    });
    
    console.log('📅 Editing branch working days:', workingDays);
    
    setEditingBranch(branch);
    setShowAddForm(true);
  };

  // Delete a branch
  const handleDelete = async (branchId) => {
    // Check if trying to delete store-based main branch
    if (branchId.startsWith('store-')) {
      toast.error('Cannot delete main branch. Main branch is based on store information.');
      return;
    }

    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      setLoading(true);
      await branchService.deleteBranch(branchId);
      toast.success('Branch deleted successfully!');
      await loadBranches();
    } catch (error) {
      console.error('💥 Error deleting branch:', error);
      toast.error(error.message || 'Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Store Branches</h3>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <span>+</span> Add Branch
        </button>
      </div>

      {/* Add/Edit Branch Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Downtown Branch"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Manager
                </label>
                <input
                  type="text"
                  name="manager"
                  value={formData.manager}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.manager ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Manager name"
                />
                {formErrors.manager && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.manager}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formErrors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Complete address including street, city, state, ZIP"
              />
              {formErrors.address && (
                <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="branch@store.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {formErrors.time && (
              <p className="text-red-500 text-sm">{formErrors.time}</p>
            )}

            {/* FIXED: Working Days with better validation display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Days *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <label 
                    key={day} 
                    className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                      formData.workingDays.includes(day)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.workingDays.includes(day)}
                      onChange={() => handleWorkingDaysChange(day)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{day.substring(0, 3)}</span>
                  </label>
                ))}
              </div>
              {formErrors.workingDays && (
                <p className="text-red-500 text-sm mt-1">{formErrors.workingDays}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selected: {formData.workingDays.length} day{formData.workingDays.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details about this branch"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {editingBranch ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingBranch ? 'Update Branch' : 'Add Branch'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && !showAddForm && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading branches...</span>
        </div>
      )}

      {/* Branches List */}
      <div className="space-y-4">
        {branches.map((branch) => {
          const formattedBranch = branchService.formatBranchForDisplay(branch);
          
          return (
            <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{branch.name}</h4>
                    
                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-xs rounded-full ${formattedBranch.statusBadge}`}>
                      {branch.status}
                    </span>
                    
                    {/* Main Branch Badge */}
                    {branch.isMainBranch && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Main Branch
                      </span>
                    )}
                    
                    {/* Open/Closed Indicator */}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      formattedBranch.isOpenNow 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formattedBranch.isOpenNow ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">📍 Address:</span>
                      <p title={branch.address}>{formattedBranch.displayAddress}</p>
                    </div>
                    
                    {branch.phone && (
                      <div>
                        <span className="font-medium">📞 Phone:</span>
                        <p>{formattedBranch.displayPhone}</p>
                      </div>
                    )}
                    
                    {branch.manager && (
                      <div>
                        <span className="font-medium">👨‍💼 Manager:</span>
                        <p>{branch.manager}</p>
                      </div>
                    )}
                  </div>
                  
                  {branch.email && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">✉️ Email:</span> {branch.email}
                    </div>
                  )}
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">🕒 Hours:</span> {formattedBranch.displayHours}
                  </div>

                  {/* FIXED: Display working days properly */}
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">📅 Working Days:</span> {
                      (branch.workingDays && Array.isArray(branch.workingDays)) 
                        ? branch.workingDays.join(', ')
                        : 'Monday to Saturday'
                    }
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  {!branch.isStoreMainBranch && (
                    <button
                      onClick={() => startEditing(branch)}
                      disabled={loading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit branch"
                    >
                      ✏️
                    </button>
                  )}
                  
                  {!branch.isStoreMainBranch && (
                    <button
                      onClick={() => handleDelete(branch.id)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete branch"
                    >
                      🗑️
                    </button>
                  )}

                  {branch.isStoreMainBranch && (
                    <span className="text-sm text-gray-500 px-2 py-1">
                      Main branch (Store info)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {!loading && branches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No branches found.</p>
            <p className="text-sm">Click "Add Branch" to create your first branch.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagement;