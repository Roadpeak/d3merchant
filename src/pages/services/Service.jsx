import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import { fetchServices } from '../../services/api_service';
import ServiceForm from './ServiceForm';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  Plus,
  AlertCircle,
  RefreshCw,
  Calculator,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Tag,
  Calendar,
  CheckCircle,
  Star,
  Settings
} from 'lucide-react';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching services...');
            
            const response = await fetchServices();
            console.log('Services response:', response);
            
            // Handle different response structures
            const servicesData = response?.services || response?.data || response || [];
            setServices(Array.isArray(servicesData) ? servicesData : []);
            
        } catch (error) {
            console.error('Failed to fetch services:', error);
            setError(error.message || 'Failed to fetch services');
            toast.error(error.message || 'Failed to fetch services');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    const refreshServices = async () => {
        await loadServices();
    };

    const handleViewService = (service) => {
        console.log('=== VIEW SERVICE DEBUG ===');
        console.log('Service object:', service);
        console.log('Service.images:', service.images);
        console.log('Service.image_url:', service.image_url);
        console.log('=========================');
        
        setSelectedService(service);
        setCurrentImageIndex(0);
        setViewModalOpen(true);
    };

    const handleEditService = (service) => {
        console.log('Opening edit modal for service:', service.name);
        setSelectedService(service);
        setViewModalOpen(false); // Close view modal if open
        setEditModalOpen(true); // Open edit modal
    };

    const handleDeleteService = async (service) => {
        if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
            try {
                // Import deleteService function and implement
                // await deleteService(service.id);
                toast.success('Service deleted successfully');
                refreshServices();
            } catch (error) {
                toast.error('Failed to delete service');
            }
        }
    };

    // Complete Service Details Modal Component
    const ServiceDetailsModal = () => {
        if (!selectedService) return null;

        const getAllImages = (service) => {
            console.log('🔍 Debugging images for service:', service.name);
            console.log('🔍 service.images:', service.images);
            console.log('🔍 service.image_url:', service.image_url);
            
            let allImages = [];
            
            // Check images array first
            if (service.images && Array.isArray(service.images)) {
                console.log('📸 Found images array with length:', service.images.length);
                allImages = service.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
                console.log('📸 Valid images after filter:', allImages);
            }
            
            // Fallback to image_url
            if (allImages.length === 0 && service.image_url && service.image_url.trim() !== '') {
                console.log('📸 Using image_url as fallback:', service.image_url);
                allImages = [service.image_url];
            }
            
            console.log('📸 Final images array:', allImages);
            return allImages;
        };

        const images = getAllImages(selectedService);
        const hasMultipleImages = images.length > 1;

        const nextImage = () => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        };

        const prevImage = () => {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        };

        return (
            <Modal 
                isOpen={isViewModalOpen} 
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedService(null);
                    setCurrentImageIndex(0);
                }} 
                title={selectedService.name}
            >
                <div className="max-h-[80vh] overflow-y-auto">
                    {/* Debug Info - Make it always visible for now */}
                    <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded text-sm">
                        <strong>Debug Info:</strong><br/>
                        Images Array Length: {images.length}<br/>
                        Has image_url: {selectedService.image_url ? 'Yes' : 'No'}<br/>
                        Images: {JSON.stringify(images)}<br/>
                        Selected Service Images: {JSON.stringify(selectedService.images)}
                    </div>

                    {/* Image Gallery Section - Always show placeholder if no images */}
                    <div className="relative mb-6">
                        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                            {images.length > 0 ? (
                                <>
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={`${selectedService.name} - Image ${currentImageIndex + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error('Failed to load image:', images[currentImageIndex]);
                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNEMUQ1RDkiLz4KPHBhdGggZD0iTTEzNSA5MEgxNjVWMTEwSDEzNVY5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgRXJyb3I8L3RleHQ+Cjwvc3ZnPg==';
                                        }}
                                    />
                                    
                                    {hasMultipleImages && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                            
                                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                                {currentImageIndex + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                // Placeholder when no images
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No images available</p>
                                        <p className="text-gray-400 text-xs">Add images when editing this service</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Image Thumbnails */}
                        {hasMultipleImages && (
                            <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                            index === currentImageIndex ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Service Information */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">{selectedService.name}</h3>
                                <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${
                                    selectedService.type === 'fixed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {selectedService.type === 'fixed' ? (
                                        <>
                                            <DollarSign className="w-3 h-3" />
                                            Fixed Price
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="w-3 h-3" />
                                            Dynamic Price
                                        </>
                                    )}
                                </span>
                            </div>
                            
                            {selectedService.description && (
                                <p className="text-gray-600 mb-4 leading-relaxed">{selectedService.description}</p>
                            )}
                            
                            {selectedService.category && (
                                <div className="flex items-center mb-4">
                                    <Tag className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{selectedService.category}</span>
                                </div>
                            )}
                        </div>

                        {/* Pricing Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Pricing Information
                            </h4>
                            
                            {selectedService.type === 'fixed' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded border">
                                        <p className="text-sm text-gray-600">Price</p>
                                        <p className="text-lg font-semibold text-primary">KES {selectedService.price}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="text-sm text-gray-600">Duration</p>
                                        <p className="text-lg font-semibold flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {selectedService.duration} minutes
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-3 bg-white p-3 rounded border">
                                        <p className="text-sm text-gray-600">Estimated Price Range</p>
                                        <p className="text-lg font-semibold text-primary">
                                            {selectedService.price_range || 'Contact for pricing'}
                                        </p>
                                    </div>
                                    
                                    {selectedService.pricing_factors && selectedService.pricing_factors.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-600 mb-2">Pricing Factors</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedService.pricing_factors.map((factor, index) => (
                                                    <span 
                                                        key={index}
                                                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                                    >
                                                        {factor}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedService.consultation_required && (
                                        <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                            <p className="text-sm text-orange-700 flex items-center">
                                                <AlertCircle className="w-4 h-4 mr-2" />
                                                Consultation required before service delivery
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Staff Assignment */}
                        {selectedService.staff && selectedService.staff.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    Assigned Staff ({selectedService.staff.length})
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedService.staff.map((staff) => (
                                        <div key={staff.id} className="flex items-center p-3 bg-gray-50 rounded-lg border">
                                            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{staff.name}</p>
                                                <p className="text-sm text-gray-500">{staff.email}</p>
                                                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                                                    staff.status === 'active' 
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {staff.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Service Settings for Fixed Services */}
                        {selectedService.type === 'fixed' && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Booking Settings
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded border">
                                            <p className="text-sm text-gray-600">Max Concurrent Bookings</p>
                                            <p className="font-medium text-lg">{selectedService.max_concurrent_bookings || 1}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <p className="text-sm text-gray-600">Slot Interval</p>
                                            <p className="font-medium text-lg">{selectedService.slot_interval || selectedService.duration} min</p>
                                        </div>
                                    </div>
                                    
                                    {selectedService.buffer_time > 0 && (
                                        <div className="bg-white p-3 rounded border">
                                            <p className="text-sm text-gray-600">Buffer Time</p>
                                            <p className="font-medium">{selectedService.buffer_time} minutes between bookings</p>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-3 rounded border">
                                            <p className="text-sm text-gray-600">Min Advance Booking</p>
                                            <p className="font-medium">{selectedService.min_advance_booking || 30} minutes</p>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <p className="text-sm text-gray-600">Max Advance Booking</p>
                                            <p className="font-medium">{Math.floor((selectedService.max_advance_booking || 10080) / 1440)} days</p>
                                        </div>
                                    </div>
                                    
                                    {selectedService.allow_overbooking && (
                                        <div className="flex items-center text-orange-600 bg-orange-50 p-3 rounded border">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            <span className="text-sm">Overbooking is allowed</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {selectedService.tags && selectedService.tags.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Tag className="w-4 h-4 mr-2" />
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedService.tags.map((tag, index) => (
                                        <span 
                                            key={index}
                                            className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full border"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status Indicators */}
                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                            {selectedService.featured && (
                                <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border">
                                    <Star className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Featured Service</span>
                                </div>
                            )}
                            
                            {selectedService.booking_enabled !== false && (
                                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full border">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">Booking Enabled</span>
                                </div>
                            )}
                            
                            <div className="flex items-center text-gray-500 bg-gray-50 px-3 py-1 rounded-full border">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span className="text-sm">
                                    Created {new Date(selectedService.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-6 border-t">
                            <button
                                onClick={() => {
                                    setViewModalOpen(false);
                                    handleEditService(selectedService);
                                }}
                                className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition duration-300 flex items-center justify-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Service
                            </button>
                            
                            {selectedService.type === 'dynamic' && (
                                <button
                                    onClick={() => {
                                        setViewModalOpen(false);
                                        navigate(`/dashboard/dynamic-form/${selectedService.id}`);
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-300 flex items-center justify-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Manage Form
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        );
    };

    const EmptyState = () => (
        <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
                <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No Services Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
                Start by adding your first service to showcase what you offer to your customers.
            </p>
            <button
                onClick={() => setModalOpen(true)}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition duration-300 flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Your First Service
            </button>
        </div>
    );

    const ErrorState = () => (
        <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-6 mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Failed to Load Services
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
                {error}
            </p>
            <button
                onClick={refreshServices}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition duration-300 flex items-center gap-2"
            >
                <RefreshCw className="w-4 h-4" />
                Try Again
            </button>
        </div>
    );

    const LoadingState = () => (
        <div className="col-span-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden animate-pulse">
                        <div className="w-full h-48 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="p-6">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4 w-1/2"></div>
                            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const ServiceCard = ({ service }) => {
        // Helper function to get primary image with proper error handling
        const getPrimaryImage = (service) => {
            // Check images array first (new format)
            if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                // Filter out any null/empty values and return first valid image
                const validImages = service.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
                if (validImages.length > 0) {
                    return validImages[0];
                }
            }
            
            // Fallback to image_url (backward compatibility)
            if (service.image_url && service.image_url.trim() !== '') {
                return service.image_url;
            }
            
            // Default placeholder - use base64 SVG that always works
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNEMUQ1RDkiLz4KPHBhdGggZD0iTTEzNSA5MEgxNjVWMTEwSDEzNVY5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VydmljZSBJbWFnZTwvdGV4dD4KPC9zdmc+';
        };

        const getAllImages = (service) => {
            let allImages = [];
            
            // Get images from array
            if (service.images && Array.isArray(service.images)) {
                allImages = service.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }
            
            // If no images in array, check image_url
            if (allImages.length === 0 && service.image_url && service.image_url.trim() !== '') {
                allImages = [service.image_url];
            }
            
            return allImages;
        };

        const primaryImage = getPrimaryImage(service);
        const allImages = getAllImages(service);
        
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                <div className="relative">
                    <img
                        src={primaryImage}
                        alt={service.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            console.error('Image failed to load:', primaryImage);
                            // Set a proper base64 placeholder image
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzAgOTBIMTcwVjExMEgxMzBWOTBaIiBmaWxsPSIjRDFENUQ5Ii8+CjxwYXRoIGQ9Ik0xNDAgMTAwSDE2MFYxMjBIMTQwVjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                        }}
                    />
                    
                    {/* Image count indicator */}
                    {allImages.length > 1 && (
                        <div className="absolute top-2 left-2">
                            <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {allImages.length}
                            </span>
                        </div>
                    )}
                    
                    {/* Service type indicator */}
                    <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                            service.type === 'fixed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                            {service.type === 'fixed' ? (
                                <>
                                    <DollarSign className="w-3 h-3" />
                                    Fixed Price
                                </>
                            ) : (
                                <>
                                    <Calculator className="w-3 h-3" />
                                    Dynamic
                                </>
                            )}
                        </span>
                    </div>
                </div>
                
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 capitalize mb-2 line-clamp-1">
                        {service.name}
                    </h3>
                    
                    {/* Fixed service pricing */}
                    {service.type === 'fixed' && (
                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center text-primary">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span className="font-semibold">KES {service.price}</span>
                            </div>
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="text-sm">{service.duration} mins</span>
                            </div>
                        </div>
                    )}

                    {/* Dynamic service pricing */}
                    {service.type === 'dynamic' && service.price_range && (
                        <div className="mb-3">
                            <div className="flex items-center text-primary">
                                <Calculator className="w-4 h-4 mr-1" />
                                <span className="font-semibold">{service.price_range}</span>
                            </div>
                            {service.consultation_required && (
                                <p className="text-xs text-orange-600 mt-1">Consultation required</p>
                            )}
                        </div>
                    )}

                    {/* Category */}
                    {service.category && (
                        <div className="mb-3">
                            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                                {service.category}
                            </span>
                        </div>
                    )}
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {service.description || 'No description available'}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2">
                        {service.type === 'dynamic' && (
                            <button
                                onClick={() => navigate(`/dashboard/dynamic-form/${service.id}`)}
                                className="bg-primary text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-600 transition duration-300 flex items-center gap-1"
                            >
                                <Edit className="w-3 h-3" />
                                Form
                            </button>
                        )}

                        <div className="flex items-center gap-1 ml-auto">
                            <button
                                onClick={() => handleViewService(service)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1.5 rounded-md text-xs transition duration-300"
                                title="View Service"
                            >
                                <Eye className="w-3 h-3" />
                            </button>
                            
                            <button
                                onClick={() => handleEditService(service)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1.5 rounded-md text-xs transition duration-300"
                                title="Edit Service"
                            >
                                <Edit className="w-3 h-3" />
                            </button>
                            
                            <button
                                onClick={() => handleDeleteService(service)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded-md text-xs transition duration-300"
                                title="Delete Service"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Staff info if available */}
                    {service.staff && service.staff.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Assigned Staff:</p>
                            <div className="flex flex-wrap gap-1">
                                {service.staff.slice(0, 2).map((staff) => (
                                    <span
                                        key={staff.id}
                                        className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                                    >
                                        {staff.name}
                                    </span>
                                ))}
                                {service.staff.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                                        +{service.staff.length - 2} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Debug info in development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 text-xs text-gray-400 border-t pt-2">
                            <div>Images: {allImages.length}</div>
                            <div>Type: {service.type}</div>
                            {allImages.length > 0 && (
                                <div>Primary: {primaryImage.substring(0, 30)}...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Layout
            title="Services"
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary text-white py-2 px-6 rounded-md text-sm font-semibold hover:bg-primary-dark transition duration-300 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Service
                </button>
            }
        >
            <div className="mt-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <LoadingState />
                    </div>
                ) : error ? (
                    <div className="grid grid-cols-1">
                        <ErrorState />
                    </div>
                ) : services.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    Your Services ({services.length})
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Manage and organize your service offerings
                                </p>
                            </div>
                            <button
                                onClick={refreshServices}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition duration-300"
                                title="Refresh Services"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {services.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1">
                        <EmptyState />
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add New Service">
                <ServiceForm 
                    onClose={() => setModalOpen(false)} 
                    onServiceAdded={refreshServices} 
                />
            </Modal>

            {/* Service Details Modal */}
            <ServiceDetailsModal />

            {/* Edit Service Modal */}
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setEditModalOpen(false);
                    setSelectedService(null);
                }} 
                title="Edit Service"
            >
                <ServiceForm 
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedService(null);
                    }} 
                    onServiceAdded={() => {
                        refreshServices();
                        setEditModalOpen(false);
                        setSelectedService(null);
                    }}
                    editingService={selectedService}
                />
            </Modal>
        </Layout>
    );
};

export default ServicesPage;