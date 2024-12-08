import React, { useEffect, useState } from 'react';
import Layout from '../../elements/Layout';
import { useParams } from 'react-router-dom';
import { fetchSingleBooking } from '../../services/api_service';

const BookingDetails = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const data = await fetchSingleBooking(id);
                setBooking(data);
            } catch (err) {
                setError('Failed to fetch booking details.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    if (loading) {
        return (
            <Layout title="Booking Details">
                <div className="container mx-auto p-6 w-full max-w-5xl">
                    <p className="text-center text-gray-600 dark:text-gray-400">Loading booking details...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title="Booking Details">
                <div className="container mx-auto p-6 w-full max-w-5xl">
                    <p className="text-center text-red-500 dark:text-red-400">{error}</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Booking Details">
            <div className="h-[90vh] overflow-y-auto">
                <div className="">
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Overview</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Booking ID</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p
                                    className={`text-base font-medium ${booking?.status === 'pending' ? 'text-yellow-500' : booking?.status === 'fulfilled' ? 'text-green-500' : 'text-red-500'
                                        }`}
                                >
                                    {booking?.status}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Start Time</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">
                                    {new Date(booking?.startTime)?.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">End Time</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">
                                    {new Date(booking?.endTime)?.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Payment Code</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.paymentUniqueCode || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{`${booking?.User?.firstName} ${booking?.User?.lastName}`}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.User?.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.User?.phoneNumber}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Details</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Service Name</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.Offer?.Service?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.Offer?.Service?.category}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">Kes. {booking?.Offer?.Service?.price}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Duration</p>
                                <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.Offer?.Service?.duration} minutes</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="text-base text-gray-900 dark:text-white">{booking?.Offer?.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Store Details */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Store Details</h2>
                        <div className="mt-4">
                            <p className="text-sm text-gray-500">Store Name</p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.Offer?.Service?.Store?.name}</p>
                            <p className="text-sm text-gray-500 mt-2">Location</p>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{booking?.Offer?.Service?.Store?.location}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BookingDetails;
