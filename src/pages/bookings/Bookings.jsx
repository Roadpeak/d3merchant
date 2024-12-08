import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import { fetchBookings } from '../../services/api_service';
import moment from 'moment';

const Booking = () => {
    const [bookings, setBookings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const response = await fetchBookings();
                setBookings(response);
            } catch (error) {
                toast.error('Failed to fetch bookings');
            }
        };

        loadBookings();
    }, []);

    return (
        <Layout title="Bookings">

            <ul className="divide-y divide-gray-200">
                {bookings && bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <li
                            key={booking.id}
                            className="py-4 cursor-pointer hover:bg-gray-50 transition-all duration-300"
                            onClick={() => navigate(`/dashboard/bookings/${booking.id}/view`)}
                        >
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[15px] text-black font-medium">
                                        {booking.User?.firstName || ''} {booking.User?.lastName || ''}
                                    </p>
                                    <p className="text-[12px] text-gray-600">
                                        {moment(booking.startTime).format('MMM DD, YYYY, hh:mm A')} - {moment(booking.endTime).format('MMM DD, YYYY, hh:mm A')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">
                                        Service: <span className="uppercase text-[14px] font-medium">{booking.Offer?.Service?.name || 'N/A'}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Status: {booking.status || 'Pending'}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                    <p className="text-gray-500">No bookings available for this staff member.</p>
                )}
            </ul>
        </Layout>
    );
};

export default Booking;