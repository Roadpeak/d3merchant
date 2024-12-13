import React, { useEffect, useState } from 'react';
import Layout from '../../elements/Layout';
import { getProfile } from '../../services/api_service';

const AccountPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [info, setInfo] = useState(null);

    const getInfo = async () => {
        try {
            const response = await getProfile();
            setInfo(response.merchantProfile);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getInfo();
    }, []);

    return (
        <Layout title="Account Settings">
            <div className="flex h-screen">
                <div className="flex-1 space-y-6 overflow-y-auto">
                    <div className="flex mt-2 border-b">
                        <button
                            className={`py-1 px-4 w-full text-center text-[14px] hover:bg-gray-100 rounded-md ${activeTab === 0 ? 'bg-gray-200 rounded-md font-medium' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(0)}
                        >
                            Profile
                        </button>
                        <button
                            className={`py-1 px-4 w-full text-center text-[14px] hover:bg-gray-100 rounded-md  ${activeTab === 1 ? 'bg-gray-200 rounded-md font-medium' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(1)}
                        >
                            Security
                        </button>
                        <button
                            className={`py-1 px-4 w-full text-center text-[14px] hover:bg-gray-100 rounded-md ${activeTab === 2 ? 'bg-gray-200 rounded-md font-medium' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(2)}
                        >
                            Subscription
                        </button>
                        <button
                            className={`py-1 px-4 w-full text-center text-[14px] hover:bg-gray-100 rounded-md ${activeTab === 3 ? 'bg-gray-200 rounded-md font-medium' : 'text-primary hover:text-primary-dark'}`}
                            onClick={() => setActiveTab(3)}
                        >
                            Activity
                        </button>
                    </div>

                    {activeTab === 0 && info && (
                        <div className="mt-4 bg-white p-6 rounded-md border">
                            <h3 className="text-xl font-semibold">Profile Information</h3>
                            <div className="mt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Name</label>
                                    <div className="text-gray-700">{info.first_name} {info.last_name}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Email</label>
                                    <div className="text-gray-700">{info.email_address}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Phone</label>
                                    <div className="text-gray-700">{info.phone_number}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Business Name</label>
                                    <div className="text-gray-700">{info.store?.name}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Location</label>
                                    <div className="text-gray-700">{info.store?.location}</div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Store Email</label>
                                    <div className="text-gray-700">{info.store?.primary_email}</div>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {activeTab === 2 && (
                        <div className="mt-4 bg-white p-6 rounded-md shadow-md">
                            <h3 className="text-xl font-semibold">Subscription</h3>
                            <div className="mt-6 space-y-4">
                                {/* Plan Info */}
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Your Current Plan</label>
                                    <p className="text-gray-700 font-semibold">Pro Plan</p> {/* Placeholder for subscription plan */}
                                </div>

                                {/* Plan Benefits */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Features</label>
                                        <p className="text-gray-700">Access to basic features, advanced analytics</p> {/* Placeholder for features */}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Usage</label>
                                        <p className="text-gray-700">10 GB used of 50 GB</p> {/* Placeholder for usage */}
                                    </div>
                                </div>

                                {/* Upgrade Option */}
                                <div className="flex justify-between items-center">
                                    <button className="bg-primary text-white py-2 px-6 rounded-md">Upgrade Plan</button>
                                    <div className="text-sm text-gray-500">Unlock advanced features, higher usage limits, and priority support.</div>
                                </div>

                                {/* Cancel Subscription */}
                                <div className="flex justify-between items-center mt-4">
                                    <button className="text-red-500 hover:underline">Cancel Subscription</button>
                                    <div className="text-sm text-gray-500">Note: You will lose access to premium features upon cancellation.</div>
                                </div>
                            </div>
                        </div>
                    )}


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
