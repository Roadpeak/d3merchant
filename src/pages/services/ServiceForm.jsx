import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; 
import { createService, uploadImage, getMerchantStores, fetchStaff } from '../../services/api_service';
import merchantAuthService from '../../services/merchantAuthService';
import branchService from '../../services/branchService';
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle, Loader, Users, UserCheck, MapPin, Building } from 'lucide-react';

const ServiceForm = ({ onClose, onServiceAdded, editingService = null }) => {
    const [serviceData, setServiceData] = useState({
        name: '',
        price: '',
        duration: '',
        image_url: '',
        category: '',
        description: '',
        type: 'fixed',
        store_id: '',
        branch_id: '', // Added for branch selection
        dynamicFields: [],
        staffIds: []
    });
    
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [storeLoading, setStoreLoading] = useState(true);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState([]);
    const navigate = useNavigate();

    const CATEGORIES = [
        'Beauty & Wellness',
        'Health & Fitness',
        'Automotive',
        'Home Services',
        'Professional Services',
        'Food & Beverage',
        'Entertainment',
        'Education',
        'Technology',
        'Consulting',
        'Other'
    ];

    // Load merchant's store and set up form
    useEffect(() => {
        const loadStoreData = async () => {
            try {
                setStoreLoading(true);
                const merchant = merchantAuthService.getCurrentMerchant();
                
                if (!merchant) {
                    toast.error('Please log in to continue');
                    return;
                }

                // Get merchant's stores
                const storesResponse = await getMerchantStores();
                const stores = storesResponse?.stores || storesResponse || [];
                
                if (stores.length === 0) {
                    toast.error('Please create a store first before adding services');
                    onClose();
                    return;
                }

                // Use the first store
                const storeId = stores[0].id;
                setServiceData(prev => ({
                    ...prev,
                    store_id: storeId
                }));

                // Load branches for the store
                await loadStoreBranches(storeId);

                // If editing, populate form
                if (editingService) {
                    setServiceData({
                        ...editingService,
                        store_id: editingService.store_id || storeId,
                        branch_id: editingService.branch_id || '',
                        price: editingService.price?.toString() || '',
                        duration: editingService.duration?.toString() || '',
                        staffIds: editingService.staff?.map(staff => staff.id) || []
                    });
                    
                    if (editingService.image_url) {
                        setImagePreview(editingService.image_url);
                    }

                    // Set selected staff if editing
                    if (editingService.staff) {
                        setSelectedStaff(editingService.staff);
                    }

                    // Load staff for the selected branch
                    if (editingService.branch_id) {
                        await loadBranchStaff(editingService.branch_id);
                    }
                } else {
                    // For new services, load staff for store (main branch) initially
                    await loadStoreStaff(storeId);
                }

            } catch (error) {
                console.error('Error loading store data:', error);
                toast.error('Failed to load store information');
            } finally {
                setStoreLoading(false);
            }
        };

        loadStoreData();
    }, [editingService, onClose]);

    // Load branches for the selected store
    const loadStoreBranches = async (storeId) => {
        try {
            setBranchesLoading(true);
            console.log('🏢 Loading branches for store:', storeId);
            
            const response = await branchService.getBranchesByStore(storeId);
            const branches = response?.branches || [];
            
            console.log('✅ Branches loaded:', branches.length);
            setAvailableBranches(branches);

            // If there's only one branch (main branch), auto-select it
            if (branches.length === 1 && !editingService) {
                const mainBranch = branches[0];
                setServiceData(prev => ({
                    ...prev,
                    branch_id: mainBranch.id
                }));
                // Load staff for the main branch
                await loadBranchStaff(mainBranch.id);
            }

        } catch (error) {
            console.error('Error loading branches:', error);
            toast.error('Failed to load store branches');
        } finally {
            setBranchesLoading(false);
        }
    };

    // Load staff for the selected store (main branch)
    const loadStoreStaff = async (storeId) => {
        try {
            setStaffLoading(true);
            const staffResponse = await fetchStaff();
            const staff = staffResponse?.staff || staffResponse || [];
            
            // Filter only active staff for the main store/branch
            const activeStaff = staff.filter(member => member.status === 'active');
            setAvailableStaff(activeStaff);
        } catch (error) {
            console.error('Error loading staff:', error);
            toast.error('Failed to load staff members');
        } finally {
            setStaffLoading(false);
        }
    };

    // Load staff for a specific branch
    const loadBranchStaff = async (branchId) => {
        try {
            setStaffLoading(true);
            console.log('👥 Loading staff for branch:', branchId);

            // Check if this is a store-based main branch
            if (branchId.startsWith('store-')) {
                // Load all store staff for main branch
                await loadStoreStaff(serviceData.store_id);
                return;
            }

            // For additional branches, you might want to implement branch-specific staff
            // For now, we'll load all store staff
            const staffResponse = await fetchStaff();
            const staff = staffResponse?.staff || staffResponse || [];
            
            // Filter only active staff - in the future you can filter by branch
            const activeStaff = staff.filter(member => member.status === 'active');
            setAvailableStaff(activeStaff);

        } catch (error) {
            console.error('Error loading branch staff:', error);
            toast.error('Failed to load staff for selected branch');
        } finally {
            setStaffLoading(false);
        }
    };

    // Handle branch selection change
    const handleBranchChange = async (e) => {
        const branchId = e.target.value;
        
        setServiceData(prev => ({
            ...prev,
            branch_id: branchId,
            staffIds: [] // Reset staff selection when branch changes
        }));
        
        setSelectedStaff([]); // Clear selected staff
        
        // Clear branch error
        if (errors.branch_id) {
            setErrors(prev => ({ ...prev, branch_id: '' }));
        }

        // Load staff for the selected branch
        if (branchId) {
            await loadBranchStaff(branchId);
        } else {
            setAvailableStaff([]);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!serviceData.name.trim()) {
            newErrors.name = 'Service name is required';
        }

        if (!serviceData.category) {
            newErrors.category = 'Please select a category';
        }

        if (!serviceData.branch_id) {
            newErrors.branch_id = 'Please select a branch where this service will be offered';
        }

        if (!serviceData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (serviceData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        if (!serviceData.image_url && !imageFile) {
            newErrors.image = 'Please upload an image for your service';
        }

        if (serviceData.type === 'fixed') {
            if (!serviceData.price || parseFloat(serviceData.price) <= 0) {
                newErrors.price = 'Please enter a valid price';
            }

            if (!serviceData.duration || parseInt(serviceData.duration) <= 0) {
                newErrors.duration = 'Please enter a valid duration';
            }
        }

        if (selectedStaff.length === 0) {
            newErrors.staff = 'Please select at least one staff member for this service';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setServiceData((prev) => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleStaffSelection = (staff) => {
        const isSelected = selectedStaff.some(s => s.id === staff.id);
        
        if (isSelected) {
            // Remove staff from selection
            setSelectedStaff(prev => prev.filter(s => s.id !== staff.id));
            setServiceData(prev => ({
                ...prev,
                staffIds: prev.staffIds.filter(id => id !== staff.id)
            }));
        } else {
            // Add staff to selection
            setSelectedStaff(prev => [...prev, staff]);
            setServiceData(prev => ({
                ...prev,
                staffIds: [...prev.staffIds, staff.id]
            }));
        }

        // Clear staff error when user selects staff
        if (errors.staff) {
            setErrors(prev => ({ ...prev, staff: '' }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setImageFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Clear image error
        if (errors.image) {
            setErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const handleImageUpload = async () => {
        if (!imageFile) {
            toast.error('Please select an image to upload');
            return;
        }

        try {
            setImageUploading(true);
            const response = await uploadImage(imageFile, 'services');
            
            const imageUrl = response.fileUrl || response.url || response.data?.url;
            setServiceData((prev) => ({
                ...prev,
                image_url: imageUrl,
            }));
            
            toast.success('Image uploaded successfully');
            
            // Clear image error
            if (errors.image) {
                setErrors(prev => ({ ...prev, image: '' }));
            }
            
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error(error.message || 'Failed to upload image. Please try again.');
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        // Upload image first if needed
        if (imageFile && !serviceData.image_url) {
            await handleImageUpload();
            if (!serviceData.image_url) {
                toast.error('Please upload the image first');
                return;
            }
        }

        try {
            setLoading(true);

            const servicePayload = {
                ...serviceData,
                price: serviceData.type === 'fixed' ? parseFloat(serviceData.price) : null,
                duration: serviceData.type === 'fixed' ? parseInt(serviceData.duration) : null,
                staffIds: selectedStaff.map(staff => staff.id)
            };

            let response;
            if (editingService) {
                // Update existing service
                response = await updateService(editingService.id, servicePayload);
                toast.success('Service updated successfully');
            } else {
                // Create new service
                response = await createService(servicePayload);
                toast.success('Service created successfully');
            }

            // Handle dynamic service redirection
            if (serviceData.type === 'dynamic' && !editingService) {
                const serviceId = response.newService?.id || response.service?.id;
                if (serviceId) {
                    toast.success('Redirecting to form builder...');
                    setTimeout(() => {
                        navigate(`/dashboard/dynamic-form/${serviceId}`);
                    }, 1000);
                    return;
                }
            }

            onClose();
            onServiceAdded();

        } catch (error) {
            console.error('Service submission error:', error);
            toast.error(error.message || 'Failed to save service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get selected branch details for display
    const selectedBranch = availableBranches.find(branch => branch.id === serviceData.branch_id);

    if (storeLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Loading store information...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Name *
                </label>
                <input
                    id="name"
                    type="text"
                    name="name"
                    value={serviceData.name}
                    onChange={handleInputChange}
                    placeholder="Enter service name"
                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.name ? 'border-red-400' : 'border-gray-300'
                    }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Branch Selection */}
            <div>
                <label htmlFor="branch_id" className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Location (Branch) *
                </label>
                
                {branchesLoading ? (
                    <div className="flex items-center justify-center py-4 border border-gray-300 rounded-md">
                        <Loader className="w-4 h-4 animate-spin text-primary mr-2" />
                        <span className="text-sm text-gray-600">Loading branches...</span>
                    </div>
                ) : (
                    <select
                        id="branch_id"
                        name="branch_id"
                        value={serviceData.branch_id}
                        onChange={handleBranchChange}
                        className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                            errors.branch_id ? 'border-red-400' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Select a branch</option>
                        {availableBranches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                                {branch.isMainBranch && ' (Main Branch)'}
                                {branch.address && ` - ${branch.address.substring(0, 50)}${branch.address.length > 50 ? '...' : ''}`}
                            </option>
                        ))}
                    </select>
                )}
                
                {/* Selected Branch Details */}
                {selectedBranch && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-start">
                            <MapPin className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <h4 className="text-sm font-medium text-blue-900">{selectedBranch.name}</h4>
                                    {selectedBranch.isMainBranch && (
                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                            Main Branch
                                        </span>
                                    )}
                                </div>
                                {selectedBranch.address && (
                                    <p className="text-sm text-blue-700 mt-1">{selectedBranch.address}</p>
                                )}
                                {selectedBranch.phone && (
                                    <p className="text-xs text-blue-600 mt-1">📞 {selectedBranch.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {errors.branch_id && <p className="mt-1 text-xs text-red-600">{errors.branch_id}</p>}
                
                <p className="mt-1 text-xs text-gray-500">
                    Choose which branch will offer this service. Staff will be filtered based on your selection.
                </p>
            </div>

            {/* Service Type */}
            <div>
                <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Type *
                </label>
                <select
                    id="type"
                    name="type"
                    value={serviceData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                    <option value="fixed">Fixed Price Service</option>
                    <option value="dynamic">Dynamic Price Service</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                    {serviceData.type === 'fixed' 
                        ? 'Fixed price services have set pricing and duration'
                        : 'Dynamic services allow custom pricing based on customer requirements'
                    }
                </p>
            </div>

            {/* Fixed Price Fields */}
            {serviceData.type === 'fixed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                            Price (KES) *
                        </label>
                        <input
                            id="price"
                            type="number"
                            name="price"
                            value={serviceData.price}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                errors.price ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                    </div>

                    <div>
                        <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2">
                            Duration (minutes) *
                        </label>
                        <input
                            id="duration"
                            type="number"
                            name="duration"
                            value={serviceData.duration}
                            onChange={handleInputChange}
                            placeholder="30"
                            min="1"
                            className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                errors.duration ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        {errors.duration && <p className="mt-1 text-xs text-red-600">{errors.duration}</p>}
                    </div>
                </div>
            )}

            {/* Category */}
            <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                </label>
                <select
                    id="category"
                    name="category"
                    value={serviceData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.category ? 'border-red-400' : 'border-gray-300'
                    }`}
                >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={serviceData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your service in detail..."
                    rows="4"
                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                        errors.description ? 'border-red-400' : 'border-gray-300'
                    }`}
                ></textarea>
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                <p className="mt-1 text-xs text-gray-500">{serviceData.description.length}/500 characters</p>
            </div>

            {/* Staff Selection */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Staff Members *
                </label>
                
                {!serviceData.branch_id ? (
                    <div className="border border-gray-300 rounded-md p-4 text-center">
                        <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Please select a branch first</p>
                        <p className="text-xs text-gray-400">Staff will be loaded based on your branch selection</p>
                    </div>
                ) : staffLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader className="w-4 h-4 animate-spin text-primary mr-2" />
                        <span className="text-sm text-gray-600">Loading staff...</span>
                    </div>
                ) : availableStaff.length === 0 ? (
                    <div className="text-center py-4">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No active staff members found</p>
                        <p className="text-xs text-gray-400">Add staff members to your store first</p>
                    </div>
                ) : (
                    <div className={`border rounded-md p-4 ${errors.staff ? 'border-red-400' : 'border-gray-300'}`}>
                        <div className="mb-3">
                            <p className="text-sm text-gray-600">
                                Select staff members who will provide this service at{' '}
                                <span className="font-medium">{selectedBranch?.name}</span>
                                {' '}({selectedStaff.length} selected)
                            </p>
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {availableStaff.map((staff) => {
                                const isSelected = selectedStaff.some(s => s.id === staff.id);
                                return (
                                    <div
                                        key={staff.id}
                                        onClick={() => handleStaffSelection(staff)}
                                        className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                                            isSelected 
                                                ? 'bg-primary bg-opacity-10 border-primary border' 
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        <div className="flex-shrink-0 mr-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                                isSelected 
                                                    ? 'bg-primary text-white' 
                                                    : 'bg-gray-300 text-gray-600'
                                            }`}>
                                                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium text-gray-900">{staff.name}</h4>
                                                {isSelected && (
                                                    <UserCheck className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{staff.role}</p>
                                            <p className="text-xs text-gray-400">{staff.email}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {selectedStaff.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-600 mb-2">Selected staff:</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedStaff.map((staff) => (
                                        <span
                                            key={staff.id}
                                            className="inline-flex items-center px-2 py-1 bg-primary bg-opacity-10 text-primary text-xs rounded-full"
                                        >
                                            {staff.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {errors.staff && <p className="mt-1 text-xs text-red-600">{errors.staff}</p>}
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Image *
                </label>
                
                {/* Image Preview */}
                {imagePreview && (
                    <div className="mb-4">
                        <img
                            src={imagePreview}
                            alt="Service preview"
                            className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                        />
                        {serviceData.image_url && (
                            <div className="mt-2 flex items-center text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Image uploaded successfully
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Area */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    errors.image ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-primary bg-gray-50'
                }`}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                    />
                    
                    <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                Click to upload image
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                                PNG, JPG up to 5MB
                            </span>
                        </div>
                    </label>
                </div>

                {imageFile && !serviceData.image_url && (
                    <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={imageUploading}
                        className="mt-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {imageUploading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Image
                            </>
                        )}
                    </button>
                )}

                {errors.image && <p className="mt-1 text-xs text-red-600">{errors.image}</p>}
            </div>

            {/* Dynamic Service Notice */}
            {serviceData.type === 'dynamic' && !editingService && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-800">Dynamic Service Setup</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                After creating this service, you'll be redirected to set up a custom form for pricing calculations.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                
                <button
                    type="submit"
                    disabled={loading || imageUploading}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                            {editingService ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        editingService ? 'Update Service' : 'Create Service'
                    )}
                </button>
            </div>
        </form>
    );
};

export default ServiceForm;