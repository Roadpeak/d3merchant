import React, { useEffect, useState } from 'react';
import Layout from '../../elements/Layout';
import axios from 'axios';
import { fetchReviews } from '../../services/api_service';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getReviews = async () => {
            try {
                const response = await fetchReviews(); // Replace with dynamic store ID
                setReviews(response);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        getReviews();
    }, []);

    const renderStars = (rating = 0) => (
        <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
                <span
                    key={i}
                    className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    ★
                </span>
            ))}
        </div>
    );

    return (
        <Layout title="Reviews">
            <div className="p-6 space-y-6 min-h-screen">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-800"></h1>
                    <button className="px-6 py-1 text-[13px] font-medium text-white bg-primary rounded-md shadow hover:bg-blue-700">
                        Filter
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="loader border-t-2 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">
                                            {review.User?.firstName || 'Anonymous'}{' '}
                                            {review.User?.lastName || ''}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {review.User ? 'Verified User' : 'Anonymous User'}
                                        </p>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-gray-700 text-sm mb-4">{review.text || 'No comment provided.'}</p>
                                <div className="text-xs text-gray-500">
                                    Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 text-center">No reviews available for this store.</p>
                )}
            </div>
        </Layout>
    );
};

export default Reviews;
