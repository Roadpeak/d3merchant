import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { fetchServices, getServiceStaff } from '../../services/api_service';
import merchantAuthService from '../../services/merchantAuthService';
import { 
    AlertCircle, 
    Loader, 
    Tag, 
    Calendar, 
    Percent, 
    FileText, 
    Users, 
    UserCheck, 
    Star,
    Clock,
    DollarSign
} from 'lucide-react';

const OfferForm = ({ onClose, onOfferCreated, editingOffer = null }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [serviceStaff, setServiceStaff] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors: formErrors },
        reset,
        watch,
        setValue
    } = useForm({
        defaultValues: editingOffer ? {
            service_id: editingOffer.service_id || '',
            title: editingOffer.title || '',
            description: editingOffer.description || '',
            discount: editingOffer.discount || '',
            expiration_date: editingOffer.expiration_date ? 
                new Date(editingOffer.expiration_date).toISOString().split('T')[0] : '',
            status: editingOffer.status || 'active',
            featured: editingOffer.featured || false,
            max_redemptions: editingOffer.max_redemptions || '',
            terms_conditions: editingOffer.terms_conditions || ''
        } : {
            status: 'active',
            featured: false
        }
    });

    // Watch values for real-time updates
    const watchedDiscount = watch('discount');
    const watchedServiceId = watch('service_id');

    // Load services on component mount
    useEffect(() => {
        const loadServices = async () => {
            try {
                setLoading(true);
                const merchant = merchantAuthService.getCurrentMerchant();
                
                if (!merchant) {
                    toast.error('Please log in to continue');
                    return;
                }

                console.log('🔍 Loading services for offers...');
                const response = await fetchServices();
                const servicesList = response?.services || [];
                
                console.log('📋 Available services:', servicesList.length);
                
                if (servicesList.length === 0) {
                    setErrors({ services: 'No services available. Please create services first before adding offers.' });
                } else {
                    setServices(servicesList);
                }
            } catch (error) {
                console.error('❌ Failed to fetch services:', error);
                setErrors({ services: 'Failed to load services. Please try again.' });
                toast.error('Failed to load services');
            } finally {
                setLoading(false);
            }
        };

        loadServices();
    }, []);

    // Load staff when service is selected
    useEffect(() => {
        const loadServiceStaff = async () => {
            if (!watchedServiceId) {
                setServiceStaff([]);
                return;
            }

            try {
                setLoadingStaff(true);
                console.log('👥 Loading staff for service:', watchedServiceId);
                
                const response = await getServiceStaff(watchedServiceId);
                const staff = response?.staff || [];
                
                console.log('✅ Service staff loaded:', staff.length);
                setServiceStaff(staff);
            } catch (error) {
                console.error('❌ Failed to load service staff:', error);
                setServiceStaff([]);
            } finally {
                setLoadingStaff(false);
            }
        };

        loadServiceStaff();
    }, [watchedServiceId]);

    // Get selected service details
    const selectedService = services.find(service => service.id === watchedServiceId);

    // Handle form submission
    const onSubmit = async (data) => {
        try {
            setSubmitting(true);
            console.log('📤 Submitting offer:', data);

            // Validate expiration date
            const expirationDate = new Date(data.expiration_date);
            if (expirationDate <= new Date()) {
                toast.error('Expiration date must be in the future');
                return;
            }

            // Prepare offer data
            const offerData = {
                ...data,
                discount: parseFloat(data.discount),
                max_redemptions: data.max_redemptions ? parseInt(data.max_redemptions) : null,
                featured: Boolean(data.featured)
            };

            console.log('✅ Final offer data:', offerData);

            // Submit the offer data
            await onOfferCreated(offerData);
            
            toast.success(editingOffer ? 'Offer updated successfully!' : 'Offer created successfully!');
            reset();
        } catch (error) {
            console.error('❌ Error submitting offer:', error);
            toast.error('Failed to save offer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate savings preview
    const calculateSavings = () => {
        if (selectedService && watchedDiscount) {
            const originalPrice = parseFloat(selectedService.price) || 0;
            const discountAmount = (originalPrice * parseFloat(watchedDiscount)) / 100;
            const finalPrice = originalPrice - discountAmount;
            
            return {
                original: originalPrice,
                discount: discountAmount,
                final: finalPrice
            };
        }
        return null;
    };

    const savings = calculateSavings();

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-primary mr-2" />
                <span>Loading services...</span>
            </div>
        );
    }

    // Error state - no services
    if (errors.services) {
        return (
            <div className="p-6">
                <div className="flex items-center text-red-600 mb-4">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Unable to create offers</span>
                </div>
                <p className="text-gray-600 mb-4">{errors.services}</p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-h-[80vh] overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Service Selection */}
                <div>
                    <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-2">
                        <Tag className="w-4 h-4 inline mr-1" />
                        Select Service *
                    </label>
                    <select
                        id="service_id"
                        {...register('service_id', { required: 'Please select a service' })}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                            formErrors.service_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Choose a service for this offer</option>
                        {services.map((service) => (
                            <option key={service.id} value={service.id}>
                                {service.name} {service.price && `- KES ${service.price}`}
                            </option>
                        ))}
                    </select>
                    {formErrors.service_id && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {formErrors.service_id.message}
                        </p>
                    )}
                    
                    {/* Selected Service Details */}
                    {selectedService && (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-blue-900">{selectedService.name}</h4>
                                    <div className="flex items-center space-x-4 mt-2 text-sm text-blue-700">
                                        <div className="flex items-center">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            KES {selectedService.price || 'N/A'}
                                        </div>
                                        {selectedService.duration && (
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {selectedService.duration} minutes
                                            </div>
                                        )}
                                        <div className="flex items-center">
                                            <Tag className="w-4 h-4 mr-1" />
                                            {selectedService.category || 'General'}
                                        </div>
                                    </div>
                                    {selectedService.description && (
                                        <p className="text-sm text-blue-600 mt-2">{selectedService.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Service Staff Display */}
                {watchedServiceId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            <Users className="w-4 h-4 inline mr-1" />
                            Staff Available for This Offer
                        </label>
                        
                        {loadingStaff ? (
                            <div className="flex items-center justify-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                                <Loader className="w-5 h-5 animate-spin text-primary mr-2" />
                                <span className="text-gray-600">Loading staff...</span>
                            </div>
                        ) : serviceStaff.length > 0 ? (
                            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                                <div className="flex items-center mb-3">
                                    <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-green-800">
                                        {serviceStaff.length} staff member{serviceStaff.length !== 1 ? 's' : ''} available for bookings
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {serviceStaff.map((staff) => (
                                        <div key={staff.id} className="flex items-center p-3 bg-white border border-green-200 rounded-md">
                                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-medium mr-3">
                                                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-gray-900">{staff.name}</h4>
                                                <p className="text-xs text-gray-500">{staff.role || 'Staff'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-green-700 mt-3">
                                    ℹ️ Customers booking this offer can choose from any of these staff members
                                </p>
                            </div>
                        ) : (
                            <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                                <div className="flex items-center text-yellow-700 mb-2">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    <span className="font-medium">No staff assigned to this service</span>
                                </div>
                                <p className="text-sm text-yellow-600">
                                    You need to assign staff to this service before customers can book this offer. 
                                    Go to Services → Edit Service → Assign Staff.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Custom Offer Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Offer Title (Optional)
                    </label>
                    <input
                        type="text"
                        id="title"
                        {...register('title')}
                        placeholder="e.g., Summer Special, New Customer Deal, Weekend Discount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use the service name as the offer title
                    </p>
                </div>

                {/* Discount Percentage */}
                <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                        <Percent className="w-4 h-4 inline mr-1" />
                        Discount Percentage *
                    </label>
                    <input
                        type="number"
                        id="discount"
                        {...register('discount', {
                            required: 'Discount percentage is required',
                            min: { value: 1, message: 'Discount must be at least 1%' },
                            max: { value: 100, message: 'Discount cannot exceed 100%' },
                        })}
                        placeholder="Enter discount percentage (e.g., 20)"
                        min="1"
                        max="100"
                        step="0.01"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            formErrors.discount ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.discount && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {formErrors.discount.message}
                        </p>
                    )}
                    
                    {/* Price Calculator Preview */}
                    {savings && (
                        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-green-900 mb-2">💰 Price Preview</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Original Price:</span>
                                    <span className="line-through text-gray-500">KES {savings.original.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">You Save:</span>
                                    <span className="text-green-700 font-medium">-KES {savings.discount.toFixed(2)} ({watchedDiscount}% off)</span>
                                </div>
                                <div className="flex justify-between border-t border-green-200 pt-2">
                                    <span className="font-semibold text-green-900">Final Price:</span>
                                    <span className="font-bold text-green-900 text-lg">KES {savings.final.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Expiration Date */}
                <div>
                    <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Offer Expiration Date *
                    </label>
                    <input
                        type="date"
                        id="expiration_date"
                        {...register('expiration_date', { required: 'Expiration date is required' })}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                            formErrors.expiration_date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.expiration_date && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {formErrors.expiration_date.message}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        After this date, the offer will automatically expire and become unavailable
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 inline mr-1" />
                        Offer Description *
                    </label>
                    <textarea
                        id="description"
                        {...register('description', { 
                            required: 'Please describe what makes this offer special',
                            minLength: { value: 10, message: 'Description must be at least 10 characters' }
                        })}
                        placeholder="Describe what makes this offer special, what's included, any special benefits..."
                        rows="4"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                            formErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.description && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {formErrors.description.message}
                        </p>
                    )}
                </div>

                {/* Advanced Options */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Max Redemptions */}
                        <div>
                            <label htmlFor="max_redemptions" className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Uses (Optional)
                            </label>
                            <input
                                type="number"
                                id="max_redemptions"
                                {...register('max_redemptions')}
                                placeholder="e.g., 50"
                                min="1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Offer Status
                            </label>
                            <select
                                id="status"
                                {...register('status')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="active">Active - Customers can book</option>
                                <option value="inactive">Inactive - Hidden from customers</option>
                                <option value="paused">Paused - Temporarily disabled</option>
                            </select>
                        </div>
                    </div>

                    {/* Featured Toggle */}
                    <div className="mt-4">
                        <label className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                {...register('featured')}
                                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                    Feature this offer
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                    Featured offers appear prominently on your store page and in search results
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="mt-4">
                        <label htmlFor="terms_conditions" className="block text-sm font-medium text-gray-700 mb-2">
                            Terms & Conditions (Optional)
                        </label>
                        <textarea
                            id="terms_conditions"
                            {...register('terms_conditions')}
                            placeholder="e.g., Valid for new customers only, Cannot be combined with other offers, Advance booking required..."
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Optional conditions that apply to this offer
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || (watchedServiceId && serviceStaff.length === 0)}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {submitting ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin mr-2" />
                                {editingOffer ? 'Updating Offer...' : 'Creating Offer...'}
                            </>
                        ) : (
                            <>
                                {editingOffer ? 'Update Offer' : 'Create Offer'}
                            </>
                        )}
                    </button>
                </div>

                {/* Warning for no staff */}
                {watchedServiceId && serviceStaff.length === 0 && !loadingStaff && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center text-red-700">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Cannot create offer</p>
                                <p className="text-sm mt-1">
                                    This service needs at least one staff member before you can create offers. 
                                    Please assign staff to the service first.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default OfferForm;