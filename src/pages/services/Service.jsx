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
                    className="bg-primary text-white py-2 px-6 rounded-md text-sm font-semibold hover:bg-primary-dark transition duration-300"
                >
                    Add Service
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-6">
                {services?.length > 0 ? (
                    services.map((service) => (
                        <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                            <img
                                src={service.image_url}
                                alt={service.name}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 capitalize">
                                    {service.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Price: <span className="font-semibold text-primary">KES {service.price}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Duration: <span className="font-semibold">{service.duration} mins</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 truncate">{service.description}</p>
                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => { } /* Implement edit */}
                                        className="bg-primary text-white px-6 py-1 rounded-md text-sm font-semibold hover:bg-blue-600 transition duration-300"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => { } /* Implement delete */}
                                        className="bg-red-500 text-white px-6 py-1 rounded-md text-sm font-semibold hover:bg-red-600 transition duration-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-600 dark:text-gray-400">
                        No services available. Add a new service to get started.
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Service">
                <ServiceForm onClose={() => setModalOpen(false)} onServiceAdded={refreshServices} />
            </Modal>
        </Layout>
    );
};

export default ServicesPage;
