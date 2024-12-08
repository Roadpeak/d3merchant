import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import OfferForm from './OfferForm';
import { createOffer, fetchOffers } from '../../services/api_service';

const OfferPage = () => {
    const [offers, setOffers] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);

    // Fetch the offers on page load
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

    // Refresh offers after adding new one
    const refreshOffers = async () => {
        try {
            const response = await fetchOffers();
            setOffers(response.offers);
        } catch (error) {
            toast.error('Failed to refresh offers');
        }
    };

    // Handle offer creation
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
                    className="bg-primary text-white py-1 px-6 text-[14px] rounded-lg shadow-md hover:bg-primary-dark transition"
                >
                    Create Offer
                </button>
            }
        >
            <div className="overflow-x-auto mt-6">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                    <thead className="bg-gray-100 text-primary">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium">Service</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Discount</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Expiration Date</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers?.length > 0 ? (
                            offers.map((offer) => (
                                <tr key={offer.id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm text-gray-900">{offer.service_name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{offer.discount}%</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(offer.expiration_date).toLocaleDateString()}</td>
                                    <td className="py-3 px-4 text-sm text-gray-600">{offer.status}</td>
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
                                <td colSpan="5" className="py-3 px-4 text-center text-gray-600">
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
