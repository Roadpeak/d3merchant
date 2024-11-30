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
                    className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-primary-dark transition"
                >
                    Add Service
                </button>
            }
        >
            <div className="overflow-x-auto mt-6">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                    <thead className="bg-primary text-white">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium">Service Name</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Price</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Duration</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services?.length > 0 ? (
                            services.map((service) => (
                                <tr key={service.id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm text-gray-900">{service.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">${service.price}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{service.duration} mins</td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => { } /* Implement edit */}
                                            className="bg-blue-500 text-white py-1 px-3 rounded-lg text-xs hover:bg-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => { } /* Implement delete */}
                                            className="bg-red-500 text-white py-1 px-3 rounded-lg text-xs ml-2 hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="py-3 px-4 text-center text-gray-600">
                                    No services available. Add a new service to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add Service">
                <ServiceForm onClose={() => setModalOpen(false)} onServiceAdded={refreshServices} />
            </Modal>
        </Layout>
    );
};

export default ServicesPage;
