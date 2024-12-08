import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStaff } from '../../services/api_service';

const StaffTable = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const getStaff = async () => {
            try {
                const response = await fetchStaff();
                setStaff(response);
            } catch (error) {
                console.error('Error fetching staff:', error);
            } finally {
                setLoading(false);
            }
        };

        getStaff();
    }, []);

    return (
        <div className="min-h-screen">
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="loader border-t-2 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((staffMember) => (
                        <div
                            key={staffMember.id}
                            className="bg-white rounded-lg shadow-lg border  hover:shadow-xl transition-shadow duration-300 p-6"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-medium text-gray-800">{staffMember.name}</h2>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${staffMember.status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {staffMember.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{staffMember.email}</p>
                            <p className="text-sm text-gray-600">{staffMember.phoneNumber}</p>

                            <div className="mt-4 flex space-x-3">
                                <button
                                    onClick={() => navigate(`/dashboard/staff/${staffMember.id}/view`)}
                                    className="bg-primary text-white px-6 py-1 text-[13px] rounded-md hover:bg-blue-600 transition"
                                >
                                    View Metrics
                                </button>
                                <button
                                    className="bg-red-500 text-white px-6 py-1 text-[13px] rounded-md hover:bg-red-600 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StaffTable;
