import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import { createService, fetchServices, uploadImage } from '../../services/api_service';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [serviceData, setServiceData] = useState({
        name: '',
        price: '',
        duration: '',
        image_url: '',
        category: '',
        description: '',
        type: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadServices = async () => {
            try {
                const response = await fetchServices();
                setServices(response.services);
            } catch (error) {
                toast.error('Failed to fetch services');
            }
        };

        loadServices();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setServiceData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const response = await uploadImage(file);
            setServiceData((prev) => ({ ...prev, image_url: response.url }));
            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateService = async () => {
        if (!serviceData.name || !serviceData.price || !serviceData.image_url) {
            toast.error('Please fill out all required fields');
            return;
        }

        setLoading(true);
        try {
            await createService(serviceData);
            toast.success('Service created successfully');
            setModalOpen(false);
            setServiceData({
                name: '',
                price: '',
                duration: '',
                image_url: '',
                category: '',
                description: '',
                type: '',
            });
            // Reload services
            const response = await fetchServices();
            setServices(response.services);
        } catch (error) {
            toast.error('Failed to create service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            title="Services"
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary text-white py-2 px-4 rounded-md"
                >
                    Add Service
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {services?.length > 0 ? (
                    services?.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg shadow-md"
                        >
                            <img
                                src={service.image_url}
                                alt={service.name}
                                className="w-full h-40 object-cover rounded-md"
                            />
                            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{service.name}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{service.description}</p>
                            <p className="text-gray-900 dark:text-gray-300 mt-1">${service.price}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">No services available. Add a new service to get started.</p>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title="Add Service"
            >
                <div className="space-y-4">
                    <input
                        type="text"
                        name="name"
                        value={serviceData.name}
                        onChange={handleInputChange}
                        placeholder="Service Name"
                        className="w-full px-4 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        name="price"
                        value={serviceData.price}
                        onChange={handleInputChange}
                        placeholder="Service Price"
                        className="w-full px-4 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        name="duration"
                        value={serviceData.duration}
                        onChange={handleInputChange}
                        placeholder="Duration (e.g., 30 min)"
                        className="w-full px-4 py-2 border rounded-md"
                    />
                    <textarea
                        name="description"
                        value={serviceData.description}
                        onChange={handleInputChange}
                        placeholder="Description"
                        rows="3"
                        className="w-full px-4 py-2 border rounded-md"
                    ></textarea>
                    <select
                        name="category"
                        value={serviceData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md"
                    >
                        <option value="">Select Category</option>
                        <option value="Category1">Category 1</option>
                        <option value="Category2">Category 2</option>
                    </select>
                    <input
                        type="file"
                        onChange={handleImageUpload}
                        className="w-full px-4 py-2 border rounded-md"
                    />
                    {serviceData.image_url && (
                        <img
                            src={serviceData.image_url}
                            alt="Uploaded"
                            className="w-full h-32 object-cover rounded-md mt-2"
                        />
                    )}
                    <button
                        onClick={handleCreateService}
                        className={`w-full py-2 text-white rounded-md ${loading ? 'bg-gray-400' : 'bg-primary'}`}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Service'}
                    </button>
                </div>
            </Modal>
        </Layout>
    );
};

export default ServicesPage;
