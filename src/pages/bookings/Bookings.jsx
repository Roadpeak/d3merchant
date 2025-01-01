import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../elements/Layout";
import { fetchBookings } from "../../services/api_service";
import moment from "moment";

const Booking = () => {
    const [bookings, setBookings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const response = await fetchBookings();
                setBookings(response);
            } catch (error) {
                toast.error("Failed to fetch bookings");
            }
        };

        loadBookings();
    }, []);

    return (
        <Layout title="Bookings">
            <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
                <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
                        <button
                            onClick={() => navigate("/dashboard/bookings/create")}
                            className="px-4 py-1 text-[14px] bg-primary text-white rounded-lg font-medium shadow"
                        >
                            New Booking
                        </button>
                    </div>

                    {/* Booking List */}
                    {bookings && bookings.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <li
                                    key={booking.id}
                                    className="py-4 px-4 bg-gray-50 hover:bg-gray-100 transition rounded-lg mb-4 flex justify-between items-center shadow-sm cursor-pointer"
                                    onClick={() => navigate(`/dashboard/bookings/${booking.id}/view`)}
                                >
                                    <div>
                                        <p className="text-lg font-medium text-gray-800">
                                            {booking.User?.firstName || "Unknown"}{" "}
                                            {booking.User?.lastName || "User"}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {moment(booking.startTime).format(
                                                "MMM DD, YYYY, hh:mm A"
                                            )}{" "}
                                            -{" "}
                                            {moment(booking.endTime).format(
                                                "MMM DD, YYYY, hh:mm A"
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">
                                            Service:{" "}
                                            <span className="text-primary font-medium">
                                                {booking.Offer?.Service?.name || "N/A"}
                                            </span>
                                        </p>
                                        <p className="text-sm font-semibold">
                                            <span
                                                className={`py-0.5 px-4 rounded-full text-[12px] ${booking.status === "Completed"
                                                    ? "bg-green-500"
                                                    : booking.status === "Pending"
                                                        ? "bg-yellow-500"
                                                        : "bg-red-200 text-red-500"
                                                    }`}
                                            >
                                                {booking.status || "Pending"}
                                            </span>
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No bookings available for this staff member.</p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Booking;
