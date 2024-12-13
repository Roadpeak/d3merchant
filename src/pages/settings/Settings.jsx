import React, { useState } from 'react';
import { FaCog, FaUserShield, FaBell, FaLanguage, FaPalette, FaKey } from 'react-icons/fa';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Layout from '../../elements/Layout';

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Layout title="Settings">
            <div className="flex h-screen">
                {/* Main Content */}
                <div className="flex-1 space-y-6 overflow-y-auto">
                    <Tabs selectedIndex={activeTab} onSelect={setActiveTab}>
                        <TabList className="flex space-x-4 border-b-2 border-primary">
                            <Tab
                                className="py-2 px-4 cursor-pointer text-primary hover:text-primary-dark"
                                selectedClassName="border-b-2 border-primary font-semibold"
                            >
                                General
                            </Tab>
                            <Tab
                                className="py-2 px-4 cursor-pointer text-primary hover:text-primary-dark"
                                selectedClassName="border-b-2 border-primary font-semibold"
                            >
                                Security
                            </Tab>
                            <Tab
                                className="py-2 px-4 cursor-pointer text-primary hover:text-primary-dark"
                                selectedClassName="border-b-2 border-primary font-semibold"
                            >
                                Billing
                            </Tab>
                            <Tab
                                className="py-2 px-4 cursor-pointer text-primary hover:text-primary-dark"
                                selectedClassName="border-b-2 border-primary font-semibold"
                            >
                                Notifications
                            </Tab>
                            <Tab
                                className="py-2 px-4 cursor-pointer text-primary hover:text-primary-dark"
                                selectedClassName="border-b-2 border-primary font-semibold"
                            >
                                Appearance
                            </Tab>
                        </TabList>

                        {/* General Tab */}
                        <TabPanel>
                            <h3 className="text-xl font-semibold">General Settings</h3>
                            <div className="mt-4 bg-white p-6 rounded-md shadow-md space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Company Name</label>
                                        <input
                                            type="text"
                                            className="p-2 border border-gray-300 rounded-md"
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Business Type</label>
                                        <select
                                            className="p-2 border border-gray-300 rounded-md"
                                            defaultValue="finance"
                                        >
                                            <option value="finance">Finance</option>
                                            <option value="insurance">Insurance</option>
                                            <option value="investment">Investment</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Currency</label>
                                        <select
                                            className="p-2 border border-gray-300 rounded-md"
                                            defaultValue="USD"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Security Tab */}
                        <TabPanel>
                            <h3 className="text-xl font-semibold">Security Settings</h3>
                            <div className="mt-4 bg-white p-6 rounded-md shadow-md space-y-6">
                                <div className="space-y-4">
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
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Enable Account Lock</label>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Billing Tab */}
                        <TabPanel>
                            <h3 className="text-xl font-semibold">Billing Settings</h3>
                            <div className="mt-4 bg-white p-6 rounded-md shadow-md space-y-6">
                                <div className="space-y-4">
                                    {/* Payment Method */}
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Payment Method</label>
                                        <select
                                            className="p-2 border border-gray-300 rounded-md"
                                            defaultValue="credit-card"
                                        >
                                            <option value="credit-card">Credit Card</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="bank-transfer">Bank Transfer</option>
                                        </select>
                                    </div>

                                    {/* Billing Address */}
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Billing Address</label>
                                        <input
                                            type="text"
                                            className="p-2 border border-gray-300 rounded-md"
                                            placeholder="Enter billing address"
                                        />
                                    </div>

                                    {/* Billing History */}
                                    <div className="space-y-4 mt-6">
                                        <h4 className="text-lg font-semibold">Billing History</h4>
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Last Payment</label>
                                            <p className="text-gray-700">$99.99 (Completed)</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Next Payment</label>
                                            <p className="text-gray-700">$99.99 (Due in 15 days)</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium">Payment Method</label>
                                            <p className="text-gray-700">Credit Card - **** 1234</p>
                                        </div>
                                    </div>

                                    {/* Change Payment Method */}
                                    <div className="flex justify-between items-center mt-6">
                                        <button className="text-primary hover:underline">Update Payment Method</button>
                                        <div className="text-sm text-gray-500">Switch to a new card or payment provider.</div>
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Notifications Tab */}
                        <TabPanel>
                            <h3 className="text-xl font-semibold">Notification Settings</h3>
                            <div className="mt-4 bg-white p-6 rounded-md shadow-md space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Email Notifications</label>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            defaultChecked
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">SMS Notifications</label>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            defaultChecked
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Push Notifications</label>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Appearance Tab */}
                        <TabPanel>
                            <h3 className="text-xl font-semibold">Appearance Settings</h3>
                            <div className="mt-4 bg-white p-6 rounded-md shadow-md space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Theme</label>
                                        <select
                                            className="p-2 border border-gray-300 rounded-md"
                                            defaultValue="light"
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Font Size</label>
                                        <input
                                            type="range"
                                            min="12"
                                            max="20"
                                            defaultValue="16"
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Primary Color</label>
                                        <input
                                            type="color"
                                            className="p-2 border border-gray-300 rounded-md"
                                            defaultValue="#1D4ED8"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    </Tabs>
                </div>
            </div>
        </Layout>
    );
};

export default SettingsPage;
