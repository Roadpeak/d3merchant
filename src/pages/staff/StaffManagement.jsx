import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Edit, Trash2, UserCheck, UserX, Building2, ChevronDown, ChevronUp, Loader2, AlertCircle, MapPin, Users, Filter, RefreshCw, X } from 'lucide-react';
import Layout from '../../elements/Layout';
import StaffAPI from '../../services/api_service';
import { getMerchantStores } from '../../services/api_service';
import branchService from '../../services/branchService';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [stores, setStores] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    store: '',
    branch: '',
    role: '',
    status: '',
    availability: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Toast helper function
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load staff, stores, and branches in parallel
      const [staffResponse, storesData] = await Promise.all([
        StaffAPI.getAllStaff(),
        loadStoresAndBranches()
      ]);
      
      const staffData = staffResponse?.staff || staffResponse || [];
      
      setStaff(staffData);
      setStores(storesData.stores);
      setBranches(storesData.branches);
    } catch (err) {
      setError(err.message);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
      showToast('Data refreshed successfully');
    } catch (error) {
      showToast('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Load stores and branches function
  const loadStoresAndBranches = async () => {
    try {
      const storesResponse = await getMerchantStores();
      const stores = storesResponse?.stores || storesResponse || [];
      
      if (stores.length === 0) {
        setError('No stores found. Please create a store first before adding staff.');
        return { stores: [], branches: [] };
      }

      // Load all branches for all stores
      const allBranches = [];
      
      for (const store of stores) {
        try {
          const branchResponse = await branchService.getBranchesByStore(store.id);
          const storeBranches = branchResponse?.branches || [];
          
          // Add store context to branches
          const branchesWithStore = storeBranches.map(branch => ({
            ...branch,
            storeName: store.name,
            storeId: store.id
          }));
          
          allBranches.push(...branchesWithStore);
        } catch (branchError) {
          console.error('Error loading branches for store', store.id, ':', branchError);
        }
      }
      
      return { stores, branches: allBranches };
    } catch (error) {
      console.error('Error loading merchant stores:', error);
      setError('Failed to load store information');
      return { stores: [], branches: [] };
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = staff.filter(member => {
      const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStore = !filters.store || member.storeId === filters.store;
      const matchesBranch = !filters.branch || member.branchId === filters.branch;
      const matchesStatus = !filters.status || member.status === filters.status;

      return matchesSearch && matchesStore && matchesBranch && matchesStatus;
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, filters, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusChange = async (staffId, newStatus) => {
    try {
      await StaffAPI.updateStaff(staffId, { status: newStatus });
      setStaff(prev => prev.map(member =>
        member.id === staffId ? { ...member, status: newStatus } : member
      ));
      showToast(`Staff ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      setDropdownOpen(null);
    } catch (err) {
      showToast('Failed to update staff status', 'error');
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await StaffAPI.deleteStaff(staffId);
        setStaff(prev => prev.filter(member => member.id !== staffId));
        showToast('Staff member deleted successfully');
        setDropdownOpen(null);
      } catch (err) {
        showToast('Failed to delete staff member', 'error');
      }
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setIsEditModalOpen(true);
    setDropdownOpen(null);
  };

  const handleAddStaff = async (newStaffData) => {
    try {
      const response = await StaffAPI.createStaff(newStaffData);
      const newStaff = response.staff || response;
      setStaff(prev => [...prev, newStaff]);
      showToast('Staff member added successfully');
      setIsAddModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to add staff member', 'error');
    }
  };

  const handleUpdateStaff = async (updatedStaffData) => {
    try {
      const response = await StaffAPI.updateStaff(updatedStaffData.id, updatedStaffData);
      const updatedStaff = response.staff || response;
      setStaff(prev => prev.map(member => 
        member.id === updatedStaffData.id ? { ...member, ...updatedStaff } : member
      ));
      showToast('Staff member updated successfully');
      setIsEditModalOpen(false);
      setEditingStaff(null);
    } catch (err) {
      showToast(err.message || 'Failed to update staff member', 'error');
    }
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || 'Unknown Store';
  };

  const getBranchInfo = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return { name: 'Unknown Branch', isMain: false };
    
    return {
      name: branch.name,
      isMain: branch.isMainBranch || branch.isStoreMainBranch,
      address: branch.address
    };
  };

  const getFilteredBranches = () => {
    if (!filters.store) return branches;
    return branches.filter(branch => branch.storeId === filters.store);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const calculateStats = () => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'active').length;
    const inactive = staff.filter(s => s.status !== 'active').length;
    const totalStores = stores.length;
    const totalBranches = branches.length;

    return { total, active, inactive, totalStores, totalBranches };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="text-center">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Loading staff data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !staff.length) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="text-center max-w-md px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Error Loading Staff</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
            <button 
              onClick={loadData}
              className="bg-blue-600 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white text-sm sm:text-base max-w-sm`}>
          {toast.message}
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Staff Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your team members - {staff.length} total staff
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-xl hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Staff
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Staff</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">All team members</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Currently working</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Stores</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.totalStores}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Locations</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Branches</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.totalBranches}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">All branches</p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                Search & Filter Staff
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm text-gray-600">
                  {filteredStaff.length} of {staff.length}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <select
                  value={filters.store}
                  onChange={(e) => {
                    setFilters(prev => ({ 
                      ...prev, 
                      store: e.target.value,
                      branch: ''
                    }));
                  }}
                  className="px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">All Stores</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>

                <select
                  value={filters.branch}
                  onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                  className="px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={!filters.store}
                >
                  <option value="">All Branches</option>
                  {getFilteredBranches().map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                      {(branch.isMainBranch || branch.isStoreMainBranch) && ' (Main)'}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 sm:p-6 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-start sm:items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm text-yellow-800">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Staff List */}
        {filteredStaff.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                        >
                          Staff Member
                          {sortConfig.key === 'name' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Store & Branch
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                        >
                          Status
                          {sortConfig.key === 'status' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Join Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredStaff.map((member) => {
                      const branchInfo = getBranchInfo(member.branchId);
                      return (
                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                  {getInitials(member.name)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">{getStoreName(member.storeId)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">{branchInfo.name}</span>
                                {branchInfo.isMain && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                    Main
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="text-gray-900">{member.phoneNumber || 'N/A'}</div>
                              <div className="text-gray-500 capitalize">{member.role || 'Staff'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                              member.status === 'active' ? 'bg-green-100 text-green-800' :
                              member.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(member.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative">
                              <button
                                onClick={() => setDropdownOpen(dropdownOpen === member.id ? null : member.id)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {dropdownOpen === member.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setDropdownOpen(null)}
                                  />
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-20 border border-gray-100 py-2">
                                    <button
                                      onClick={() => handleEdit(member)}
                                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                    >
                                      <Edit className="w-4 h-4 mr-3" />
                                      Edit Details
                                    </button>
                                    
                                    {member.status === 'active' ? (
                                      <button
                                        onClick={() => handleStatusChange(member.id, 'suspended')}
                                        className="flex items-center px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 w-full text-left transition-colors"
                                      >
                                        <UserX className="w-4 h-4 mr-3" />
                                        Suspend Staff
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleStatusChange(member.id, 'active')}
                                        className="flex items-center px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                                      >
                                        <UserCheck className="w-4 h-4 mr-3" />
                                        Activate Staff
                                      </button>
                                    )}
                                    
                                    <div className="border-t border-gray-100 my-1" />
                                    
                                    <button
                                      onClick={() => handleDelete(member.id)}
                                      className="flex items-center px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 w-full text-left transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3" />
                                      Delete Staff
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredStaff.map((member) => {
                const branchInfo = getBranchInfo(member.branchId);
                return (
                  <div key={member.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{member.name}</div>
                          <div className="text-xs text-gray-500 truncate">{member.email}</div>
                        </div>
                      </div>
                      <div className="relative flex-shrink-0 ml-2">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === member.id ? null : member.id)}
                          className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {dropdownOpen === member.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setDropdownOpen(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-20 border border-gray-100 py-2">
                              <button
                                onClick={() => handleEdit(member)}
                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                              >
                                <Edit className="w-4 h-4 mr-3" />
                                Edit Details
                              </button>
                              
                              {member.status === 'active' ? (
                                <button
                                  onClick={() => handleStatusChange(member.id, 'suspended')}
                                  className="flex items-center px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 w-full text-left transition-colors"
                                >
                                  <UserX className="w-4 h-4 mr-3" />
                                  Suspend Staff
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(member.id, 'active')}
                                  className="flex items-center px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                                >
                                  <UserCheck className="w-4 h-4 mr-3" />
                                  Activate Staff
                                </button>
                              )}
                              
                              <div className="border-t border-gray-100 my-1" />
                              
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="flex items-center px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 w-full text-left transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Staff
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{getStoreName(member.storeId)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{branchInfo.name}</span>
                        {branchInfo.isMain && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium flex-shrink-0">
                            Main
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">{member.phoneNumber || 'N/A'}</span>
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' :
                          member.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500 capitalize">{member.role || 'Staff'}</span>
                        <span className="text-xs text-gray-500">{formatDate(member.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-8 sm:p-12">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">No Staff Found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'No staff members match your current search or filters. Try adjusting your criteria.'
                  : 'Get started by adding your first team member to manage your business operations.'
                }
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 text-white text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Staff Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <AddStaffModal
          stores={stores}
          branches={branches}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddStaff}
        />
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          stores={stores}
          branches={branches}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingStaff(null);
          }}
          onUpdate={handleUpdateStaff}
        />
      )}
    </Layout>
  );
};

// Add Staff Modal Component
const AddStaffModal = ({ stores, branches, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    storeId: '',
    branchId: '',
    role: 'staff'
  });
  const [isLoading, setIsLoading] = useState(false);

  const getFilteredBranches = () => {
    if (!formData.storeId) return [];
    return branches.filter(branch => branch.storeId === formData.storeId);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.storeId || !formData.branchId) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onAdd(formData);
    } catch (error) {
      console.error('Error adding staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'storeId' && { branchId: '' })
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add Staff Member</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Store <span className="text-red-500">*</span>
            </label>
            <select
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select Store</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select Branch</option>
              {getFilteredBranches().map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {(branch.isMainBranch || branch.isStoreMainBranch) && ' (Main Branch)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="cashier">Cashier</option>
              <option value="sales">Sales Representative</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Staff Modal Component
const EditStaffModal = ({ staff, stores, branches, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    id: staff.id,
    name: staff.name,
    email: staff.email,
    phoneNumber: staff.phoneNumber || '',
    storeId: staff.storeId,
    branchId: staff.branchId || '',
    role: staff.role || 'staff',
    status: staff.status,
  });
  const [isLoading, setIsLoading] = useState(false);

  const getFilteredBranches = () => {
    if (!formData.storeId) return [];
    return branches.filter(branch => branch.storeId === formData.storeId);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.storeId || !formData.branchId) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onUpdate(formData);
    } catch (error) {
      console.error('Error updating staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'storeId' && { branchId: '' })
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Staff Member</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Store <span className="text-red-500">*</span>
            </label>
            <select
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select Branch</option>
              {getFilteredBranches().map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {(branch.isMainBranch || branch.isStoreMainBranch) && ' (Main Branch)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="cashier">Cashier</option>
              <option value="sales">Sales Representative</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm sm:text-base border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Updating...' : 'Update Staff'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;