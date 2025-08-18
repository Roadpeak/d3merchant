// Fixed branchService.js - Updated methods with working days handling

import merchantAuthService from './merchantAuthService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

class BranchService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/branches`;
  }

  // Get headers for API requests
  getHeaders() {
    return merchantAuthService.getHeaders(true); // Include both API key and auth
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Convert working days to backend format (capitalized for now, backend will handle conversion)
  formatWorkingDaysForApi(workingDays) {
    if (!workingDays || !Array.isArray(workingDays)) {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    
    // Ensure proper capitalization for API
    return workingDays.map(day => {
      if (!day) return '';
      const dayStr = day.toString().trim();
      return dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
    }).filter(Boolean);
  }

  // Format working days from API response (they should already be capitalized)
  formatWorkingDaysFromApi(workingDays) {
    if (!workingDays || !Array.isArray(workingDays)) {
      return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    
    return workingDays.map(day => {
      if (!day) return '';
      const dayStr = day.toString().trim();
      return dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
    }).filter(Boolean);
  }

  // FIXED: Create a new branch (additional branch only)
  async createBranch(storeId, branchData) {
    try {
      console.log('🏢 Creating new additional branch for store:', storeId);
      console.log('📝 Original branch data:', branchData);

      // Remove isMainBranch if set - additional branches can't be main
      const { isMainBranch, ...cleanBranchData } = branchData;

      if (isMainBranch) {
        console.warn('⚠️ Removing isMainBranch flag - store information serves as main branch');
      }

      // FIXED: Format working days properly for API
      if (cleanBranchData.workingDays) {
        cleanBranchData.workingDays = this.formatWorkingDaysForApi(cleanBranchData.workingDays);
        console.log('✅ Working days formatted for API:', cleanBranchData.workingDays);
      }

      console.log('📝 Final branch data for API:', cleanBranchData);

      const response = await fetch(`${this.baseURL}/store/${storeId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(cleanBranchData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to create branch: ${response.status}`);
      }

      console.log('✅ Additional branch created successfully:', data.branch);
      
      // Format working days in response
      if (data.branch && data.branch.workingDays) {
        data.branch.workingDays = this.formatWorkingDaysFromApi(data.branch.workingDays);
      }

      return data;

    } catch (error) {
      console.error('💥 Error creating branch:', error);
      throw error;
    }
  }

  // FIXED: Get all branches for a store
  async getBranchesByStore(storeId, options = {}) {
    try {
      console.log('📋 Fetching branches for store:', storeId);

      const queryParams = new URLSearchParams();
      if (options.status) queryParams.append('status', options.status);
      if (options.includeInactive) queryParams.append('includeInactive', 'true');

      const url = `${this.baseURL}/store/${storeId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch branches: ${response.status}`);
      }

      // FIXED: Format working days in all branches
      if (data.branches && Array.isArray(data.branches)) {
        data.branches = data.branches.map(branch => ({
          ...branch,
          workingDays: this.formatWorkingDaysFromApi(branch.workingDays)
        }));
      }

      console.log('✅ Branches fetched successfully:', data.branches?.length || 0, 'branches');
      console.log('🏪 Main branch working days:', data.mainBranch?.workingDays);

      return data;

    } catch (error) {
      console.error('💥 Error fetching branches:', error);
      throw error;
    }
  }

  // FIXED: Get all branches for the current merchant
  async getMerchantBranches(options = {}) {
    try {
      console.log('📋 Fetching all merchant branches');

      const queryParams = new URLSearchParams();
      if (options.status) queryParams.append('status', options.status);
      if (options.storeId) queryParams.append('storeId', options.storeId);

      const url = `${this.baseURL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch merchant branches: ${response.status}`);
      }

      // FIXED: Format working days in all branches
      if (data.branches && Array.isArray(data.branches)) {
        data.branches = data.branches.map(branch => ({
          ...branch,
          workingDays: this.formatWorkingDaysFromApi(branch.workingDays)
        }));
      }

      console.log('✅ Merchant branches fetched successfully:', data.totalCount || 0, 'branches');
      return data;

    } catch (error) {
      console.error('💥 Error fetching merchant branches:', error);
      throw error;
    }
  }

  // FIXED: Get a specific branch
  async getBranch(branchId) {
    try {
      console.log('📋 Fetching branch:', branchId);

      const response = await fetch(`${this.baseURL}/${branchId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch branch: ${response.status}`);
      }

      // FIXED: Format working days in response
      if (data.branch && data.branch.workingDays) {
        data.branch.workingDays = this.formatWorkingDaysFromApi(data.branch.workingDays);
      }

      console.log('✅ Branch fetched successfully:', data.branch);
      return data;

    } catch (error) {
      console.error('💥 Error fetching branch:', error);
      throw error;
    }
  }

  // FIXED: Update a branch
  async updateBranch(branchId, updateData) {
    try {
      console.log('🔄 Updating branch:', branchId);
      console.log('📝 Original update data:', updateData);

      // Check if trying to update store-based main branch
      if (branchId.startsWith('store-')) {
        throw new Error('Cannot update main branch directly. Please update store information instead.');
      }

      // Remove isMainBranch if set - additional branches can't be main
      const { isMainBranch, ...cleanUpdateData } = updateData;

      if (isMainBranch) {
        console.warn('⚠️ Removing isMainBranch flag - store information serves as main branch');
      }

      // FIXED: Format working days properly for API
      if (cleanUpdateData.workingDays) {
        cleanUpdateData.workingDays = this.formatWorkingDaysForApi(cleanUpdateData.workingDays);
        console.log('✅ Working days formatted for API:', cleanUpdateData.workingDays);
      }

      console.log('📝 Final update data for API:', cleanUpdateData);

      const response = await fetch(`${this.baseURL}/${branchId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(cleanUpdateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to update branch: ${response.status}`);
      }

      // FIXED: Format working days in response
      if (data.branch && data.branch.workingDays) {
        data.branch.workingDays = this.formatWorkingDaysFromApi(data.branch.workingDays);
      }

      console.log('✅ Branch updated successfully:', data.branch);
      return data;

    } catch (error) {
      console.error('💥 Error updating branch:', error);
      throw error;
    }
  }

  // Delete a branch (unchanged)
  async deleteBranch(branchId) {
    try {
      console.log('🗑️ Deleting branch:', branchId);

      // Check if trying to delete store-based main branch
      if (branchId.startsWith('store-')) {
        throw new Error('Cannot delete main branch. Main branch is based on store information.');
      }

      const response = await fetch(`${this.baseURL}/${branchId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to delete branch: ${response.status}`);
      }

      console.log('✅ Branch deleted successfully');
      return data;

    } catch (error) {
      console.error('💥 Error deleting branch:', error);
      throw error;
    }
  }

  // FIXED: Validate branch data before sending
  validateBranchData(branchData) {
    const errors = {};

    if (!branchData.name || branchData.name.trim().length < 2) {
      errors.name = 'Branch name must be at least 2 characters long';
    }

    if (!branchData.address || branchData.address.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters long';
    }

    if (branchData.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(branchData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (branchData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(branchData.email)) {
      errors.email = 'Invalid email format';
    }

    if (branchData.manager && branchData.manager.length > 100) {
      errors.manager = 'Manager name must be less than 100 characters';
    }

    if (branchData.openingTime && branchData.closingTime) {
      if (branchData.openingTime >= branchData.closingTime) {
        errors.time = 'Opening time must be before closing time';
      }
    }

    // FIXED: Validate working days
    if (branchData.workingDays) {
      if (!Array.isArray(branchData.workingDays)) {
        errors.workingDays = 'Working days must be an array';
      } else if (branchData.workingDays.length === 0) {
        errors.workingDays = 'At least one working day must be selected';
      } else {
        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const invalidDays = branchData.workingDays.filter(day => 
          !validDays.includes(day.charAt(0).toUpperCase() + day.slice(1).toLowerCase())
        );
        if (invalidDays.length > 0) {
          errors.workingDays = `Invalid working days: ${invalidDays.join(', ')}`;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // FIXED: Format branch data for display
  formatBranchForDisplay(branch) {
    return {
      ...branch,
      displayAddress: this.truncateText(branch.address, 50),
      displayPhone: this.formatPhoneNumber(branch.phone),
      displayHours: this.formatBusinessHours(branch.openingTime, branch.closingTime),
      isOpenNow: this.isCurrentlyOpen(branch),
      statusBadge: this.getStatusBadgeColor(branch.status),
      workingDays: this.formatWorkingDaysFromApi(branch.workingDays) // Ensure proper format
    };
  }

  // Helper methods (unchanged)
  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatPhoneNumber(phone) {
    if (!phone) return '';
    // Simple phone formatting - you can enhance this
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  formatBusinessHours(openingTime, closingTime) {
    if (!openingTime || !closingTime) return '24/7';
    
    // Convert 24hr to 12hr format
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatTime(openingTime)} - ${formatTime(closingTime)}`;
  }

  // FIXED: Check if currently open with proper working days handling
  isCurrentlyOpen(branch) {
    if (!branch.workingDays || !branch.openingTime || !branch.closingTime) {
      return true; // Assume open if no restrictions
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Ensure working days are properly formatted
    const workingDays = this.formatWorkingDaysFromApi(branch.workingDays);
    
    if (!workingDays.includes(currentDay)) {
      return false;
    }

    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= branch.openingTime && currentTime <= branch.closingTime;
  }

  getStatusBadgeColor(status) {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-gray-100 text-gray-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Suspended': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  // Test connection
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/test/connection`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Connection test failed');
      }

      return data;
    } catch (error) {
      console.error('💥 Branch service connection test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
const branchService = new BranchService();
export default branchService;