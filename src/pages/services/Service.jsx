import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import { fetchServices } from '../../services/api_service';
import ServiceForm from './ServiceForm';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);

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

    const refreshServices = async () => {
        try {
            const response = await fetchServices();
            setServices(response.services);
        } catch (error) {
            toast.error('Failed to refresh services');
        }
    };

    return (
        <Layout
            title="Services"
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary text-white py-2 px-4 rounded-lg shadow-lg hover:bg-primary-dark transition"
                >
                    Add Service
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                {services?.length > 0 ? (
                    services.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-6 rounded-lg shadow-xl hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <img
                                src={service.image_url}
                                alt={service.name}
                                className="w-full h-40 object-cover rounded-md mb-4"
                            />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                {service.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                {service.description}
                            </p>
                            <div className="flex justify-between items-center">
                                <p className="text-gray-900 dark:text-gray-300 text-lg font-bold">
                                    ${service.price}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {service.duration} mins
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">No services available. Add a new service to get started.</p>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Service">
                <ServiceForm onClose={() => setModalOpen(false)} onServiceAdded={refreshServices} />
            </Modal>
        </Layout>
    );
};

export default ServicesPage;
