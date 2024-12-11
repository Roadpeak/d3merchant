import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import OfferForm from './OfferForm';
import { createOffer, fetchOffers } from '../../services/api_service';

const OfferPage = () => {
    const [offers, setOffers] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const loadOffers = async () => {
            try {
                const response = await fetchOffers();
                setOffers(response.offers);
            } catch (error) {
                toast.error('Failed to fetch offers');
            }
        };

        loadOffers();
    }, []);

    const refreshOffers = async () => {
        try {
            const response = await fetchOffers();
            setOffers(response.offers);
        } catch (error) {
            toast.error('Failed to refresh offers');
        }
    };

    const handleCreateOffer = async (offerData) => {
        try {
            await createOffer(offerData);
            toast.success('Offer created successfully');
            setModalOpen(false);
            refreshOffers();
        } catch (error) {
            toast.error('Failed to create offer');
        }
    };

    return (
        <Layout
            title="Offers"
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-primary text-white py-2 px-6 text-sm font-semibold rounded-md shadow-md hover:bg-primary-dark transition duration-300"
                >
                    Create Offer
                </button>
            }
        >
            <div className="overflow-x-auto mt-6">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-primary">
                        <tr>
                            <th className="py-3 px-6 text-left text-sm font-medium">Service</th>
                            <th className="py-3 px-6 text-left text-sm font-medium">Discount</th>
                            <th className="py-3 px-6 text-left text-sm font-medium">Expiration Date</th>
                            <th className="py-3 px-6 text-left text-sm font-medium">Status</th>
                            <th className="py-3 px-6 text-left text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers?.length > 0 ? (
                            offers.map((offer) => (
                                <tr key={offer.id} className="border-t border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="py-3 px-6 text-sm text-gray-900 dark:text-gray-100">{offer.service_name}</td>
                                    <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">{offer.discount}%</td>
                                    <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(offer.expiration_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-6 text-sm text-gray-600 dark:text-gray-400">
                                        <span
                                            className={`${offer.status === 'active' ? 'text-green-600' : 'text-red-600'
                                                } font-semibold`}
                                        >
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 flex gap-2">
                                        <button
                                            onClick={() => { } /* Implement edit */}
                                            className="bg-blue-500 text-white py-1 px-3 rounded-lg text-xs font-semibold hover:bg-blue-600 transition duration-300"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => { } /* Implement delete */}
                                            className="bg-red-500 text-white py-1 px-3 rounded-lg text-xs font-semibold hover:bg-red-600 transition duration-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-3 px-6 text-center text-gray-600 dark:text-gray-400">
                                    No offers available. Add a new offer to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Offer Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Create Offer">
                <OfferForm onClose={() => setModalOpen(false)} onOfferCreated={handleCreateOffer} />
            </Modal>
        </Layout>
    );
};

export default OfferPage;
