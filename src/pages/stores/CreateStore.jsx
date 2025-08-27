import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createStore, uploadImage } from '../../services/api_service';
import merchantAuthService from '../../services/merchantAuthService';
import { 
  Store, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Clock, 
  Upload, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';

const CreateStore = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        primary_email: '',
        phone_number: '',
        description: '',
        website_url: '',
        logo_url: '',
        opening_time: '09:00',
        closing_time: '18:00',
        working_days: [],
        status: 'open',
        category: '',
    });
    
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    
    // Category search states
    const [categorySearch, setCategorySearch] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState([]);
    
    const navigate = useNavigate();

    const DAYS_OF_WEEK = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
    ];

    const CATEGORIES = [
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

    // Check authentication on component mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!merchantAuthService.isAuthenticated()) {
                toast.error('Please log in to create a store');
                navigate('/accounts/sign-in');
                return;
            }
            
            // Pre-fill merchant email if available
            const merchant = merchantAuthService.getCurrentMerchant();
            if (merchant) {
                setFormData(prev => ({
                    ...prev,
                    primary_email: merchant.email_address || merchant.email || '',
                    phone_number: merchant.phone_number || ''
                }));
            }
        };

        checkAuth();
    }, [navigate]);

    // Filter categories based on search
    useEffect(() => {
        if (categorySearch.trim() === '') {
            setFilteredCategories(CATEGORIES);
        } else {
            const filtered = CATEGORIES.filter(category =>
                category.toLowerCase().includes(categorySearch.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    }, [categorySearch]);

    // Initialize filtered categories
    useEffect(() => {
        setFilteredCategories(CATEGORIES);
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleDayToggle = (day) => {
        setFormData((prevData) => {
            const days = new Set(prevData.working_days);
            if (days.has(day)) {
                days.delete(day);
            } else {
                days.add(day);
            }
            return { ...prevData, working_days: Array.from(days) };
        });
        
        // Clear working days error
        if (errors.working_days) {
            setErrors(prev => ({ ...prev, working_days: '' }));
        }
    };

    // Handle category search and selection
    const handleCategorySearch = (e) => {
        setCategorySearch(e.target.value);
        setShowCategoryDropdown(true);
    };

    const handleCategorySelect = (category) => {
        setFormData(prev => ({ ...prev, category }));
        setCategorySearch(category);
        setShowCategoryDropdown(false);
        
        // Clear category error
        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }
    };

    const handleCategoryInputFocus = () => {
        setShowCategoryDropdown(true);
        if (!categorySearch) {
            setCategorySearch('');
        }
    };

    const handleCategoryInputBlur = () => {
        // Delay hiding to allow for category selection
        setTimeout(() => setShowCategoryDropdown(false), 150);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
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
            
            setLogoFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Validation functions
    const validateStep1 = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Store name is required';
        }
        
        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }
        
        if (!formData.primary_email.trim()) {
            newErrors.primary_email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_email)) {
            newErrors.primary_email = 'Please enter a valid email address';
        }
        
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
            newErrors.description = 'Description should be at least 20 characters';
        }
        
        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        
        if (!formData.opening_time) {
            newErrors.opening_time = 'Opening time is required';
        }
        
        if (!formData.closing_time) {
            newErrors.closing_time = 'Closing time is required';
        }
        
        if (formData.opening_time && formData.closing_time && formData.opening_time >= formData.closing_time) {
            newErrors.closing_time = 'Closing time must be after opening time';
        }
        
        if (formData.working_days.length === 0) {
            newErrors.working_days = 'Please select at least one working day';
        }
        
        // Validate website URL if provided
        if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
            newErrors.website_url = 'Please enter a valid URL (starting with http:// or https://)';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        }
    };

    // Handle form submission with automatic logo upload
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep2()) {
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare store data
            let storeData = { ...formData };

            // Upload logo first if a file is selected
            if (logoFile) {
                try {
                    console.log('Uploading logo before creating store...');
                    const uploadResult = await uploadImage(logoFile, 'stores');
                    
                    if (uploadResult.success && (uploadResult.fileUrl || uploadResult.url)) {
                        storeData.logo_url = uploadResult.fileUrl || uploadResult.url;
                        console.log('Logo uploaded successfully:', storeData.logo_url);
                    } else {
                        throw new Error('Logo upload failed');
                    }
                } catch (logoError) {
                    console.error('Logo upload error:', logoError);
                    toast.error('Failed to upload logo. Creating store without logo.');
                    // Continue with store creation even if logo upload fails
                }
            }

            // Create the store with logo URL if available
            const result = await createStore(storeData);

            toast.success('Store created successfully! Welcome to Discoun3!');
            
            // Redirect to dashboard after successful creation
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (error) {
            console.error('Store creation error:', error);
            toast.error(error.message || 'Failed to create store. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Store Information</h2>
                <p className="text-gray-600">Let's start with the essential details about your store</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Store Name */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Store className="w-4 h-4 inline mr-2" />
                        Store Name *
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={`e.g. "John's Electronics Store"`}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.name ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Category - Searchable Dropdown */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Category *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={categorySearch || formData.category}
                            onChange={handleCategorySearch}
                            onFocus={handleCategoryInputFocus}
                            onBlur={handleCategoryInputBlur}
                            placeholder="Search or select a category..."
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors.category ? 'border-red-400' : 'border-gray-300'
                            }`}
                        />
                        
                        {/* Dropdown */}
                        {showCategoryDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((category) => (
                                        <div
                                            key={category}
                                            onClick={() => handleCategorySelect(category)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                        >
                                            {category}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-2 text-gray-500 text-sm">
                                        No categories found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Location *
                    </label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder='e.g. "Westlands, Nairobi"'
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.location ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Primary Email *
                    </label>
                    <input
                        type="email"
                        name="primary_email"
                        value={formData.primary_email}
                        onChange={handleChange}
                        placeholder="store@example.com"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.primary_email ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.primary_email && <p className="mt-1 text-sm text-red-600">{errors.primary_email}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+254 712 345 678"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.phone_number ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe your store, what you offer, and what makes you special..."
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                            errors.description ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    <p className="mt-1 text-sm text-gray-500">
                        {formData.description.length}/500 characters (minimum 20)
                    </p>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Operations & Branding</h2>
                <p className="text-gray-600">Set up your operating hours, logo, and additional details</p>
            </div>

            {/* Logo Upload */}
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        {logoPreview ? (
                            <img 
                                src={logoPreview} 
                                alt="Logo preview" 
                                className="w-24 h-24 rounded-lg object-cover border-2 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border-2 border-gray-200">
                                <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                    
                    <label className="cursor-pointer">
                        <span className="text-lg font-medium text-gray-700">Store Logo (Optional)</span>
                        <p className="text-sm text-gray-500 mb-4">Upload your store logo (max 5MB)</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                        <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <Upload className="w-4 h-4 mr-2" />
                            {logoFile ? 'Change Logo' : 'Choose Logo'}
                        </span>
                    </label>
                    
                    {logoFile && (
                        <div className="mt-2 flex items-center justify-center text-blue-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm">Logo selected! It will be uploaded when you create the store.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Website URL */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Website URL (Optional)
                </label>
                <input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    placeholder="https://yourstore.com"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.website_url ? 'border-red-400' : 'border-gray-300'
                    }`}
                />
                {errors.website_url && <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>}
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Opening Time *
                    </label>
                    <input
                        type="time"
                        name="opening_time"
                        value={formData.opening_time}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.opening_time ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.opening_time && <p className="mt-1 text-sm text-red-600">{errors.opening_time}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Closing Time *
                    </label>
                    <input
                        type="time"
                        name="closing_time"
                        value={formData.closing_time}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.closing_time ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errors.closing_time && <p className="mt-1 text-sm text-red-600">{errors.closing_time}</p>}
                </div>
            </div>

            {/* Working Days */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                    Working Days *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                        <label
                            key={day.value}
                            className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                                formData.working_days.includes(day.value)
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="checkbox"
                                value={day.value}
                                checked={formData.working_days.includes(day.value)}
                                onChange={() => handleDayToggle(day.value)}
                                className="hidden"
                            />
                            <span className="text-sm font-medium">{day.label}</span>
                        </label>
                    ))}
                </div>
                {errors.working_days && <p className="mt-2 text-sm text-red-600">{errors.working_days}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">Step {step} of 2</span>
                        <span className="text-sm text-gray-600">
                            {step === 1 ? 'Basic Information' : 'Operations & Branding'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${(step / 2) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 ? renderStep1() : renderStep2()}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                Continue
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {logoFile ? 'Uploading Logo & Creating Store...' : 'Creating Store...'}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Create Store
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStore;