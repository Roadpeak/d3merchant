import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; 
import { createService, uploadImage, getMerchantStores, fetchStaff, updateService } from '../../services/api_service';
import merchantAuthService from '../../services/merchantAuthService';
import branchService from '../../services/branchService';
import { Upload, Image, AlertCircle, CheckCircle, Loader, Users, UserCheck, MapPin, Building, Clock, Info } from 'lucide-react';

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
        branch_id: '',
        dynamicFields: [],
        staffIds: [],
        // CONCURRENT BOOKING FIELDS
        max_concurrent_bookings: 1,
        allow_overbooking: false,
        slot_interval: '',
        buffer_time: 0,
        min_advance_booking: 30,
        max_advance_booking: 10080, // 7 days in minutes
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

                console.log('🏪 Loading store data for merchant:', merchant.id);

                // Get merchant's stores
                const storesResponse = await getMerchantStores();
                const stores = storesResponse?.stores || storesResponse || [];
                
                console.log('📋 Available stores:', stores);
                
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

                console.log('✅ Using store:', storeId);

                // Load branches for the store
                await loadStoreBranches(storeId);

                // If editing, populate form
                if (editingService) {
                    console.log('✏️ Editing service:', editingService);
                    
                    setServiceData({
                        ...editingService,
                        store_id: editingService.store_id || storeId,
                        branch_id: editingService.branch_id || '',
                        price: editingService.price?.toString() || '',
                        duration: editingService.duration?.toString() || '',
                        staffIds: editingService.staff?.map(staff => staff.id) || [],
                        // CONCURRENT BOOKING FIELDS with defaults
                        max_concurrent_bookings: editingService.max_concurrent_bookings || 1,
                        allow_overbooking: editingService.allow_overbooking || false,
                        slot_interval: editingService.slot_interval?.toString() || '',
                        buffer_time: editingService.buffer_time || 0,
                        min_advance_booking: editingService.min_advance_booking || 30,
                        max_advance_booking: editingService.max_advance_booking || 10080,
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
                    // For new services, load staff for store initially
                    console.log('➕ Creating new service');
                    await loadStoreStaff(storeId);
                }

            } catch (error) {
                console.error('❌ Error loading store data:', error);
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
            console.error('❌ Error loading branches:', error);
            toast.error('Failed to load store branches');
        } finally {
            setBranchesLoading(false);
        }
    };

    // Load staff methods
    const loadStoreStaff = async (storeId) => {
        try {
            setStaffLoading(true);
            console.log('👥 Loading staff for store:', storeId);
            
            const staffResponse = await fetchStaff({
                storeId: storeId,
                status: 'active'
            });
            
            const staff = staffResponse?.staff || [];
            console.log('📋 Staff loaded for store:', staff.length);
            
            setAvailableStaff(staff);
        } catch (error) {
            console.error('❌ Error loading staff:', error);
            toast.error('Failed to load staff members');
            setAvailableStaff([]);
        } finally {
            setStaffLoading(false);
        }
    };

    const loadBranchStaff = async (branchId) => {
        try {
            setStaffLoading(true);
            console.log('👥 Loading staff for branch:', branchId);

            if (branchId.startsWith('store-')) {
                const storeId = branchId.replace('store-', '');
                console.log('🏢 Loading staff for main branch of store:', storeId);
                await loadStoreStaff(storeId);
                return;
            }

            let staffResponse;
            try {
                staffResponse = await fetchStaff({
                    storeId: serviceData.store_id,
                    branchId: branchId,
                    status: 'active'
                });
            } catch (branchError) {
                console.log('⚠️ Branch-specific staff fetch failed, falling back to store staff');
                staffResponse = await fetchStaff({
                    storeId: serviceData.store_id,
                    status: 'active'
                });
            }
            
            const staff = staffResponse?.staff || [];
            console.log('📋 Staff loaded for branch:', staff.length);
            
            setAvailableStaff(staff);

        } catch (error) {
            console.error('❌ Error loading branch staff:', error);
            toast.error('Failed to load staff for selected branch');
            setAvailableStaff([]);
        } finally {
            setStaffLoading(false);
        }
    };

    // Handle branch selection change
    const handleBranchChange = async (e) => {
        const branchId = e.target.value;
        
        console.log('🔄 Branch changed to:', branchId);
        
        setServiceData(prev => ({
            ...prev,
            branch_id: branchId,
            staffIds: []
        }));
        
        setSelectedStaff([]);
        
        if (errors.branch_id) {
            setErrors(prev => ({ ...prev, branch_id: '' }));
        }

        if (branchId) {
            await loadBranchStaff(branchId);
        } else {
            setAvailableStaff([]);
        }
    };

    // Enhanced validation with concurrent booking fields
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
            if (process.env.NODE_ENV === 'production') {
                newErrors.image = 'Please upload an image for your service';
            } else {
                console.log('🚧 Development mode: image not required');
            }
        }
    
        if (serviceData.type === 'fixed') {
            if (!serviceData.price || parseFloat(serviceData.price) <= 0) {
                newErrors.price = 'Please enter a valid price';
            }
    
            if (!serviceData.duration || parseInt(serviceData.duration) <= 0) {
                newErrors.duration = 'Please enter a valid duration';
            }

            // Validate concurrent booking fields
            if (!serviceData.max_concurrent_bookings || parseInt(serviceData.max_concurrent_bookings) < 1) {
                newErrors.max_concurrent_bookings = 'Maximum concurrent bookings must be at least 1';
            } else if (parseInt(serviceData.max_concurrent_bookings) > 50) {
                newErrors.max_concurrent_bookings = 'Maximum concurrent bookings cannot exceed 50';
            }

            if (serviceData.slot_interval && parseInt(serviceData.slot_interval) < 1) {
                newErrors.slot_interval = 'Slot interval must be at least 1 minute';
            }

            if (serviceData.buffer_time && parseInt(serviceData.buffer_time) < 0) {
                newErrors.buffer_time = 'Buffer time cannot be negative';
            }

            if (!serviceData.min_advance_booking || parseInt(serviceData.min_advance_booking) < 0) {
                newErrors.min_advance_booking = 'Minimum advance booking time is required';
            }

            if (!serviceData.max_advance_booking || parseInt(serviceData.max_advance_booking) <= parseInt(serviceData.min_advance_booking)) {
                newErrors.max_advance_booking = 'Maximum advance booking must be greater than minimum';
            }
        }
    
        if (selectedStaff.length === 0) {
            newErrors.staff = 'Please select at least one staff member for this service';
        }
    
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' ? checked : value;
        
        setServiceData((prev) => ({ ...prev, [name]: inputValue }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Auto-set slot_interval to duration if not set
        if (name === 'duration' && value && !serviceData.slot_interval) {
            setServiceData(prev => ({ ...prev, slot_interval: value }));
        }
    };

    const handleStaffSelection = (staff) => {
        const isSelected = selectedStaff.some(s => s.id === staff.id);
        
        console.log('👤 Staff selection changed:', staff.name, 'Selected:', !isSelected);
        
        if (isSelected) {
            setSelectedStaff(prev => prev.filter(s => s.id !== staff.id));
            setServiceData(prev => ({
                ...prev,
                staffIds: prev.staffIds.filter(id => id !== staff.id)
            }));
        } else {
            setSelectedStaff(prev => [...prev, staff]);
            setServiceData(prev => ({
                ...prev,
                staffIds: [...prev.staffIds, staff.id]
            }));
        }

        if (errors.staff) {
            setErrors(prev => ({ ...prev, staff: '' }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setImageFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

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
            console.log('📤 Uploading image...');
            
            try {
                const response = await uploadImage(imageFile, 'services');
                const imageUrl = response.fileUrl || response.url || response.data?.url;
                
                if (imageUrl) {
                    console.log('✅ Image uploaded:', imageUrl);
                    setServiceData((prev) => ({
                        ...prev,
                        image_url: imageUrl,
                    }));
                    toast.success('Image uploaded successfully');
                    
                    if (errors.image) {
                        setErrors(prev => ({ ...prev, image: '' }));
                    }
                    return;
                }
            } catch (uploadError) {
                console.log('⚠️ Main upload failed, trying fallback method:', uploadError.message);
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Url = e.target.result;
                    console.log('✅ Using base64 fallback');
                    
                    setServiceData((prev) => ({
                        ...prev,
                        image_url: base64Url,
                    }));
                    
                    toast.success('Image processed successfully (using fallback method)');
                    
                    if (errors.image) {
                        setErrors(prev => ({ ...prev, image: '' }));
                    }
                };
                reader.onerror = () => {
                    throw new Error('Failed to process image file');
                };
                reader.readAsDataURL(imageFile);
            }
            
        } catch (error) {
            console.error('❌ Image upload error:', error);
            toast.error('Failed to upload image. You can proceed without an image for now.');
            
            if (process.env.NODE_ENV === 'development') {
                console.log('🚧 Development mode: allowing service creation without image');
                setErrors(prev => ({ ...prev, image: '' }));
            }
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async () => {
        console.log('📤 Submitting service form...');

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
                max_concurrent_bookings: parseInt(serviceData.max_concurrent_bookings),
                slot_interval: serviceData.slot_interval ? parseInt(serviceData.slot_interval) : null,
                buffer_time: parseInt(serviceData.buffer_time) || 0,
                min_advance_booking: parseInt(serviceData.min_advance_booking) || 30,
                max_advance_booking: parseInt(serviceData.max_advance_booking) || 10080,
                staffIds: selectedStaff.map(staff => staff.id)
            };

            console.log('📋 Service payload:', servicePayload);

            let response;
            if (editingService) {
                console.log('🔄 Updating service:', editingService.id);
                response = await updateService(editingService.id, servicePayload);
                toast.success('Service updated successfully');
            } else {
                console.log('➕ Creating new service');
                response = await createService(servicePayload);
                toast.success('Service created successfully');
            }

            console.log('✅ Service operation successful:', response);

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
            console.error('❌ Service submission error:', error);
            toast.error(error.message || 'Failed to save service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Calculate estimated daily slots
    const calculateDailySlots = () => {
        if (!serviceData.duration) return 0;
        const duration = parseInt(serviceData.duration);
        const slotInterval = parseInt(serviceData.slot_interval) || duration;
        const bufferTime = parseInt(serviceData.buffer_time) || 0;
        
        // Assuming 10-hour workday (600 minutes)
        const workingMinutes = 600;
        const totalSlotTime = slotInterval + bufferTime;
        
        return Math.floor(workingMinutes / totalSlotTime);
    };

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
        <div className="space-y-6">
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
                <>
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

                    {/* CONCURRENT BOOKING SETTINGS */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-blue-600" />
                            Booking Capacity Settings
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="max_concurrent_bookings" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Concurrent Bookings *
                                </label>
                                <input
                                    id="max_concurrent_bookings"
                                    type="number"
                                    name="max_concurrent_bookings"
                                    value={serviceData.max_concurrent_bookings}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="50"
                                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.max_concurrent_bookings ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.max_concurrent_bookings && <p className="mt-1 text-xs text-red-600">{errors.max_concurrent_bookings}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    Number of customers that can book the same time slot
                                </p>
                            </div>

                            <div>
                                <label htmlFor="slot_interval" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Slot Interval (minutes)
                                </label>
                                <input
                                    id="slot_interval"
                                    type="number"
                                    name="slot_interval"
                                    value={serviceData.slot_interval}
                                    onChange={handleInputChange}
                                    placeholder={serviceData.duration || "60"}
                                    min="1"
                                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.slot_interval ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.slot_interval && <p className="mt-1 text-xs text-red-600">{errors.slot_interval}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    Time between slots (defaults to service duration)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="buffer_time" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Buffer Time (minutes)
                                </label>
                                <input
                                    id="buffer_time"
                                    type="number"
                                    name="buffer_time"
                                    value={serviceData.buffer_time}
                                    onChange={handleInputChange}
                                    min="0"
                                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.buffer_time ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.buffer_time && <p className="mt-1 text-xs text-red-600">{errors.buffer_time}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    Cleanup time between bookings
                                </p>
                            </div>

                            <div>
                                <label htmlFor="min_advance_booking" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Min Advance (minutes) *
                                </label>
                                <input
                                    id="min_advance_booking"
                                    type="number"
                                    name="min_advance_booking"
                                    value={serviceData.min_advance_booking}
                                    onChange={handleInputChange}
                                    min="0"
                                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.min_advance_booking ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.min_advance_booking && <p className="mt-1 text-xs text-red-600">{errors.min_advance_booking}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    {Math.ceil(serviceData.min_advance_booking / 60)} hours minimum
                                </p>
                            </div>

                            <div>
                                <label htmlFor="max_advance_booking" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Advance (minutes) *
                                </label>
                                <input
                                    id="max_advance_booking"
                                    type="number"
                                    name="max_advance_booking"
                                    value={serviceData.max_advance_booking}
                                    onChange={handleInputChange}
                                    min={parseInt(serviceData.min_advance_booking) + 1}
                                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                        errors.max_advance_booking ? 'border-red-400' : 'border-gray-300'
                                    }`}
                                />
                                {errors.max_advance_booking && <p className="mt-1 text-xs text-red-600">{errors.max_advance_booking}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    {Math.ceil(serviceData.max_advance_booking / (60 * 24))} days maximum
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center">
                            <input
                                type="checkbox"
                                id="allow_overbooking"
                                name="allow_overbooking"
                                checked={serviceData.allow_overbooking}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="allow_overbooking" className="ml-2 block text-sm text-gray-700">
                                Allow overbooking (accept bookings beyond max concurrent)
                            </label>
                        </div>

                        {/* Booking Capacity Preview */}
                        {serviceData.duration && serviceData.max_concurrent_bookings && (
                            <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-md">
                                <div className="flex items-start">
                                    <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                                    <div className="text-sm text-blue-800">
                                        <strong>Capacity Preview:</strong>
                                        <ul className="mt-1 space-y-1">
                                            <li>• {serviceData.max_concurrent_bookings} customers per {serviceData.duration}-minute slot</li>
                                            <li>• Estimated {calculateDailySlots()} slots per day</li>
                                            <li>• Daily capacity: up to {calculateDailySlots() * serviceData.max_concurrent_bookings} bookings</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
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
                    maxLength="500"
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
                    </div>
                ) : (
                    <div className={`border rounded-md p-4 ${errors.staff ? 'border-red-400' : 'border-gray-300'}`}>
                        <div className="mb-3">
                            <p className="text-sm text-gray-600">
                                Select staff members ({selectedStaff.length} selected)
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
                                            <p className="text-xs text-gray-500">{staff.role || 'Staff'}</p>
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
                            <Image className="w-8 h-8 text-gray-400 mb-2" />
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
                    type="button"
                    onClick={handleSubmit}
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
        </div>
    );
};

export default ServiceForm;