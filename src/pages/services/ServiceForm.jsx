import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; 
import { createService, uploadImage, getMerchantStores, fetchStaff, updateService } from '../../services/api_service';
import merchantAuthService from '../../services/merchantAuthService';
import branchService from '../../services/branchService';
import { 
    Upload, Image, AlertCircle, CheckCircle, Loader, Users, UserCheck, MapPin, Building, 
    Clock, Info, X, Plus, DollarSign, Calculator, HelpCircle, Eye, Trash2
} from 'lucide-react';

const EnhancedServiceForm = ({ onClose, onServiceAdded, editingService = null }) => {
    const [serviceData, setServiceData] = useState({
        name: '',
        price: '',
        duration: '',
        images: [], // Changed from image_url to images array
        category: '',
        description: '',
        type: 'fixed',
        store_id: '',
        branch_id: '',
        staffIds: [],
        // Dynamic service fields
        pricing_factors: [],
        price_range: '',
        consultation_required: false,
        // Booking capacity fields
        max_concurrent_bookings: 1,
        allow_overbooking: false,
        slot_interval: '',
        buffer_time: 0,
        min_advance_booking: 30,
        max_advance_booking: 10080,
        // SEO fields
        tags: [],
        featured: false
    });
    
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const [imageFiles, setImageFiles] = useState([null, null, null]); // Support for 3 images
    const [imagePreviews, setImagePreviews] = useState([null, null, null]);
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
        'Moving & Transportation',
        'Cleaning Services',
        'Repair & Maintenance',
        'Other'
    ];

    const PRICING_FACTORS = [
        'Distance',
        'Weight/Load',
        'Time Duration',
        'Complexity',
        'Materials Required',
        'Team Size',
        'Equipment Needed',
        'Location Access',
        'Urgency',
        'Custom Requirements'
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

                const storesResponse = await getMerchantStores();
                const stores = storesResponse?.stores || storesResponse || [];
                
                console.log('📋 Available stores:', stores);
                
                if (stores.length === 0) {
                    toast.error('Please create a store first before adding services');
                    onClose();
                    return;
                }

                const storeId = stores[0].id;
                setServiceData(prev => ({
                    ...prev,
                    store_id: storeId
                }));

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
                        images: editingService.images || (editingService.image_url ? [editingService.image_url] : []),
                        pricing_factors: editingService.pricing_factors || [],
                        price_range: editingService.price_range || '',
                        consultation_required: editingService.consultation_required || false,
                        max_concurrent_bookings: editingService.max_concurrent_bookings || 1,
                        allow_overbooking: editingService.allow_overbooking || false,
                        slot_interval: editingService.slot_interval?.toString() || '',
                        buffer_time: editingService.buffer_time || 0,
                        min_advance_booking: editingService.min_advance_booking || 30,
                        max_advance_booking: editingService.max_advance_booking || 10080,
                        tags: editingService.tags || [],
                        featured: editingService.featured || false
                    });
                    
                    // Set image previews
                    const existingImages = editingService.images || (editingService.image_url ? [editingService.image_url] : []);
                    const newPreviews = [null, null, null];
                    existingImages.forEach((img, index) => {
                        if (index < 3) newPreviews[index] = img;
                    });
                    setImagePreviews(newPreviews);

                    if (editingService.staff) {
                        setSelectedStaff(editingService.staff);
                    }

                    if (editingService.branch_id) {
                        await loadBranchStaff(editingService.branch_id);
                    }
                } else {
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

            if (branches.length === 1 && !editingService) {
                const mainBranch = branches[0];
                setServiceData(prev => ({
                    ...prev,
                    branch_id: mainBranch.id
                }));
                await loadBranchStaff(mainBranch.id);
            }

        } catch (error) {
            console.error('❌ Error loading branches:', error);
            toast.error('Failed to load store branches');
        } finally {
            setBranchesLoading(false);
        }
    };

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

    // Enhanced validation
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
    
        // Image validation
        const hasImages = serviceData.images.length > 0;
        const hasNewImages = imageFiles.some(file => file !== null);
        
        if (!hasImages && !hasNewImages) {
            if (process.env.NODE_ENV === 'production') {
                newErrors.images = 'Please upload at least one image for your service';
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

            // Validate concurrent booking fields for fixed services
            if (!serviceData.max_concurrent_bookings || parseInt(serviceData.max_concurrent_bookings) < 1) {
                newErrors.max_concurrent_bookings = 'Maximum concurrent bookings must be at least 1';
            } else if (parseInt(serviceData.max_concurrent_bookings) > 50) {
                newErrors.max_concurrent_bookings = 'Maximum concurrent bookings cannot exceed 50';
            }

        } else if (serviceData.type === 'dynamic') {
            // Validate dynamic service fields
            if (!serviceData.price_range.trim()) {
                newErrors.price_range = 'Please provide an estimated price range';
            }
            
            if (serviceData.pricing_factors.length === 0) {
                newErrors.pricing_factors = 'Please select at least one pricing factor';
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
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Auto-set slot_interval to duration if not set (for fixed services)
        if (name === 'duration' && value && !serviceData.slot_interval && serviceData.type === 'fixed') {
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

    // Enhanced image handling for multiple images
    const handleImageChange = (e, index) => {
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

        const newImageFiles = [...imageFiles];
        newImageFiles[index] = file;
        setImageFiles(newImageFiles);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newPreviews = [...imagePreviews];
            newPreviews[index] = e.target.result;
            setImagePreviews(newPreviews);
        };
        reader.readAsDataURL(file);

        if (errors.images) {
            setErrors(prev => ({ ...prev, images: '' }));
        }
    };

    const handleImageUpload = async (index) => {
        const file = imageFiles[index];
        if (!file) return null;
    
        try {
            setUploadingIndex(index);
            console.log(`📤 Uploading image ${index + 1}...`);
            
            const response = await uploadImage(file, 'services');
            const imageUrl = response.fileUrl || response.url || response.data?.url;
            
            if (imageUrl) {
                console.log(`✅ Image ${index + 1} uploaded:`, imageUrl);
                
                // Update images array
                const newImages = [...serviceData.images];
                newImages[index] = imageUrl;
                
                setServiceData((prev) => ({
                    ...prev,
                    images: newImages.filter(img => img) // Remove null/undefined values
                }));
                
                // Clear the file after successful upload
                const newImageFiles = [...imageFiles];
                newImageFiles[index] = null;
                setImageFiles(newImageFiles);
                
                toast.success(`Image ${index + 1} uploaded successfully`);
                return imageUrl;
            }
        } catch (uploadError) {
            console.log(`⚠️ Image ${index + 1} upload failed, trying fallback:`, uploadError.message);
            
            try {
                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onload = (e) => {
                        const base64Url = e.target.result;
                        console.log(`✅ Using base64 fallback for image ${index + 1}`);
                        
                        const newImages = [...serviceData.images];
                        newImages[index] = base64Url;
                        
                        setServiceData((prev) => ({
                            ...prev,
                            images: newImages.filter(img => img)
                        }));
                        
                        toast.success(`Image ${index + 1} processed successfully`);
                        resolve(base64Url);
                    };
                    reader.readAsDataURL(file);
                });
            } catch (fallbackError) {
                console.error(`❌ Image ${index + 1} processing failed:`, fallbackError);
                toast.error(`Failed to process image ${index + 1}`);
                return null;
            }
        } finally {
            setUploadingIndex(null);
        }
    };

    const removeImage = (index) => {
        const newImages = [...serviceData.images];
        newImages.splice(index, 1);
        
        const newImageFiles = [...imageFiles];
        newImageFiles[index] = null;
        
        const newPreviews = [...imagePreviews];
        newPreviews[index] = null;
        
        setServiceData(prev => ({ ...prev, images: newImages }));
        setImageFiles(newImageFiles);
        setImagePreviews(newPreviews);
    };

    // Pricing factors handling
    const handlePricingFactorToggle = (factor) => {
        const newFactors = serviceData.pricing_factors.includes(factor)
            ? serviceData.pricing_factors.filter(f => f !== factor)
            : [...serviceData.pricing_factors, factor];
        
        setServiceData(prev => ({ ...prev, pricing_factors: newFactors }));
        
        if (errors.pricing_factors) {
            setErrors(prev => ({ ...prev, pricing_factors: '' }));
        }
    };

    const handleSubmit = async () => {
        console.log('📤 Submitting service form...');

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        // Upload any pending images
        const pendingUploads = [];
        imageFiles.forEach((file, index) => {
            if (file) {
                pendingUploads.push(handleImageUpload(index));
            }
        });

        if (pendingUploads.length > 0) {
            setImageUploading(true);
            try {
                await Promise.all(pendingUploads);
            } catch (error) {
                console.error('❌ Some image uploads failed:', error);
                toast.error('Some images failed to upload. Please try again.');
                setImageUploading(false);
                return;
            }
            setImageUploading(false);
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
                staffIds: selectedStaff.map(staff => staff.id),
                // Ensure images array is properly formatted
                images: serviceData.images.filter(img => img && img.trim() !== '')
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

    if (storeLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Loading store information...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
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
                        : 'Dynamic services have pricing determined by various factors (distance, load, complexity, etc.)'
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

                    {/* Booking Capacity Settings for Fixed Services */}
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Time between slots (defaults to service duration)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center">
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
                    </div>
                </>
            )}

            {/* Dynamic Price Fields */}
            {serviceData.type === 'dynamic' && (
                <div className="space-y-4">
                    <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex items-start">
                            <Calculator className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-medium text-orange-800">Dynamic Pricing Service</h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    This service has flexible pricing based on specific requirements. Price will be determined through consultation.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="price_range" className="block text-sm font-semibold text-gray-700 mb-2">
                            Estimated Price Range (KES) *
                        </label>
                        <input
                            id="price_range"
                            type="text"
                            name="price_range"
                            value={serviceData.price_range}
                            onChange={handleInputChange}
                            placeholder="e.g., 500 - 5000"
                            className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                                errors.price_range ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        {errors.price_range && <p className="mt-1 text-xs text-red-600">{errors.price_range}</p>}
                        <p className="mt-1 text-xs text-gray-500">
                            Provide an estimated range to help customers understand expected costs
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Pricing Factors * <span className="text-xs text-gray-500">(Select all that apply)</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {PRICING_FACTORS.map((factor) => (
                                <label key={factor} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={serviceData.pricing_factors.includes(factor)}
                                        onChange={() => handlePricingFactorToggle(factor)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className="text-gray-700">{factor}</span>
                                </label>
                            ))}
                        </div>
                        {errors.pricing_factors && <p className="mt-1 text-xs text-red-600">{errors.pricing_factors}</p>}
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="consultation_required"
                            name="consultation_required"
                            checked={serviceData.consultation_required}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="consultation_required" className="ml-2 block text-sm text-gray-700">
                            Consultation required before service delivery
                        </label>
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
                    maxLength="500"
                    className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                        errors.description ? 'border-red-400' : 'border-gray-300'
                    }`}
                ></textarea>
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
                <p className="mt-1 text-xs text-gray-500">{serviceData.description.length}/500 characters</p>
            </div>

            {/* Multiple Images Upload */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Images * <span className="text-xs text-gray-500">(Up to 3 images)</span>
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="relative">
                            {imagePreviews[index] || serviceData.images[index] ? (
                                <div className="relative group">
                                    <img
                                        src={imagePreviews[index] || serviceData.images[index]}
                                        alt={`Service image ${index + 1}`}
                                        className="w-full h-40 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                                        {imageFiles[index] && (
                                            <button
                                                type="button"
                                                onClick={() => handleImageUpload(index)}
                                                disabled={uploadingIndex === index}
                                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full disabled:opacity-50"
                                            >
                                                {uploadingIndex === index ? (
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {serviceData.images[index] && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center transition-colors ${
                                    errors.images ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-primary bg-gray-50'
                                }`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, index)}
                                        className="hidden"
                                        id={`image-upload-${index}`}
                                    />
                                    
                                    <label htmlFor={`image-upload-${index}`} className="cursor-pointer flex flex-col items-center">
                                        <Image className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">
                                            Upload Image {index + 1}
                                        </span>
                                        <span className="text-xs text-gray-500 mt-1">
                                            {index === 0 ? '(Primary)' : '(Optional)'}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {errors.images && <p className="mt-1 text-xs text-red-600">{errors.images}</p>}
                <p className="mt-1 text-xs text-gray-500">
                    First image will be used as the primary image. Supported formats: PNG, JPG (max 5MB each)
                </p>
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

            {/* Additional Settings */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
                
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="featured"
                        name="featured"
                        checked={serviceData.featured}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                        Feature this service (appears prominently in listings)
                    </label>
                </div>
            </div>

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
                    {loading || imageUploading ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                            {imageUploading ? 'Uploading Images...' : (editingService ? 'Updating...' : 'Creating...')}
                        </>
                    ) : (
                        editingService ? 'Update Service' : 'Create Service'
                    )}
                </button>
            </div>
        </div>
    );
};

export default EnhancedServiceForm;