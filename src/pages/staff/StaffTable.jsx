import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStaff } from '../../services/api_service';

const StaffTable = () => {
    const [staff, setStaff] = useState([]);
    const navigate = useNavigate();

    const getStaff = async () => {
        try {
            const response = await fetchStaff();
            setStaff(response)
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getStaff()
    }, []);

    return (
        <div className="overflow-x-auto bg-white rounded-lg border">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                <thead className="bg-gray-100 text-primary">
                    <tr>
                        <th className="py-3 px-4 text-left text-sm font-medium uppercase">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium uppercase">Email</th>
                        <th className="py-3 px-4 text-left text-sm font-medium uppercase">Phone</th>
                        <th className="py-3 px-4 text-left text-sm font-medium uppercase">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-medium uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {staff.map(staffMember => (
                        <tr key={staffMember.id} className='text-[14px] text-gray-700'>
                            <td className="p-4">{staffMember.name}</td>
                            <td className="p-4">{staffMember.email}</td>
                            <td className="p-4">{staffMember.phoneNumber}</td>
                            <td className="p-4">{staffMember.status}</td>
                            <td className="p-4 flex space-x-2">
                                <button
                                    onClick={() => navigate(`/dashboard/staff/${staffMember.id}/view`)}
                                    className="bg-green-500 text-white px-6 py-1 rounded-md">View Metrics</button>
                                <button
                                    className="bg-red-400 text-white px-6 py-1 rounded-md"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StaffTable;
