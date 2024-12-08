import React, { useState } from 'react';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaHistory, FaBell } from 'react-icons/fa';
import Layout from '../../elements/Layout';

const AccountPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [userInfo, setUserInfo] = useState({
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        businessName: "FinTech Corp",
        businessType: "Finance",
        subscriptionPlan: "Premium",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    return (
        <Layout title="Account Settings">
            <div className="flex h-screen">
                <div className="flex-1 space-y-6 overflow-y-auto">
                    <div className="flex space-x-4">
                        <button
                            className={`py-2 px-4 w-full text-left ${activeTab === 0 ? 'border-b-2 border-primary font-semibold' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(0)}
                        >
                            Profile
                        </button>
                        <button
                            className={`py-2 px-4 w-full text-left ${activeTab === 1 ? 'border-b-2 border-primary font-semibold' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(1)}
                        >
                            Security
                        </button>
                        <button
                            className={`py-2 px-4 w-full text-left ${activeTab === 2 ? 'border-b-2 border-primary font-semibold' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(2)}
                        >
                            Subscription
                        </button>
                        <button
                            className={`py-2 px-4 w-full text-left ${activeTab === 3 ? 'border-b-2 border-primary font-semibold' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(3)}
                        >
                            Activity
                        </button>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === 0 && (
                        <div className="mt-4 bg-white p-6 rounded-md border">
                            <h3 className="text-xl font-semibold">Profile Information</h3>
                            <div className="mt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={userInfo.name}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md w-1/2"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={userInfo.email}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md w-1/2"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Phone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={userInfo.phone}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md w-1/2"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Business Name</label>
                                    <input
                                        type="text"
                                        name="businessName"
                                        value={userInfo.businessName}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md w-1/2"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Business Type</label>
                                    <select
                                        name="businessType"
                                        value={userInfo.businessType}
                                        onChange={handleInputChange}
                                        className="p-2 border border-gray-300 rounded-md w-1/2"
                                    >
                                        <option value="finance">Finance</option>
                                        <option value="insurance">Insurance</option>
                                        <option value="investment">Investment</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 1 && (
                        <div className="mt-4 bg-white p-6 rounded-md shadow-md">
                            <h3 className="text-xl font-semibold">Security Settings</h3>
                            <div className="mt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Enable Two-Factor Authentication</label>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        defaultChecked
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Change Password</label>
                                    <button className="text-primary hover:underline">Change Password</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 2 && (
                        <div className="mt-4 bg-white p-6 rounded-md shadow-md">
                            <h3 className="text-xl font-semibold">Subscription</h3>
                            <div className="mt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Plan</label>
                                    <p className="text-gray-700">{userInfo.subscriptionPlan}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <button className="bg-primary text-white py-2 px-4 rounded-md">Upgrade Plan</button>
                                    <button className="text-primary hover:underline">Cancel Subscription</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 3 && (
                        <div className="mt-4 bg-white p-6 rounded-md shadow-md">
                            <h3 className="text-xl font-semibold">Account Activity</h3>
                            <div className="mt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Recent Logins</label>
                                    <button className="text-primary hover:underline">View All</button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Recent Changes</label>
                                    <button className="text-primary hover:underline">View All</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AccountPage;
