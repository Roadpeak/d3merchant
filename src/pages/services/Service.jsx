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
  RefreshCw
} from 'lucide-react';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
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
        // Navigate to service details or open a view modal
        console.log('Viewing service:', service);
        // You can implement this based on your needs
    };

    const handleEditService = (service) => {
        // Navigate to edit page or open edit modal
        console.log('Editing service:', service);
        // You can implement this based on your needs
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

    const ServiceCard = ({ service }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group">
            <div className="relative">
                <img
                    src={service.image_url || '/placeholder-service.jpg'}
                    alt={service.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzAgOTBIMTcwVjExMEgxMzBWOTBaIiBmaWxsPSIjRDFENUQ5Ii8+CjxwYXRoIGQ9Ik0xNDAgMTAwSDE2MFYxMjBIMTQwVjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                    }}
                />
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        service.type === 'fixed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                    }`}>
                        {service.type === 'fixed' ? 'Fixed Price' : 'Dynamic Price'}
                    </span>
                </div>
            </div>
            
            <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 capitalize mb-2 line-clamp-1">
                    {service.name}
                </h3>
                
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

                {service.category && (
                    <div className="mb-3">
                        <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                            {service.category}
                        </span>
                    </div>
                )}
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {service.description || 'No description available'}
                </p>

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
            </div>
        </div>
    );

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
        </Layout>
    );
};

export default ServicesPage;