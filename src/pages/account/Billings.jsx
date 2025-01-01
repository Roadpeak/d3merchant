import React from 'react';
import Layout from '../../elements/Layout';
import { FaCcVisa, FaMobileAlt } from 'react-icons/fa';

const BillingPage = () => {
    return (
        <Layout title="Billing">
            <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen p-6 flex flex-col items-center">
                {/* Header Section */}
                <div className="w-full max-w-4xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg rounded-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-white">Merchant Billing</h1>
                    <p className="text-sm text-indigo-200 mt-1">
                        Manage your billing and stay on top of your payments.
                    </p>
                </div>

                {/* Invoice Summary */}
                <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Invoice</h2>
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <p className="text-sm text-gray-500">Billing Period</p>
                            <p className="text-lg font-medium text-gray-800">December 1 - December 30, 2025</p>
                        </div>
                        <div className="mb-4 md:mb-0">
                            <p className="text-sm text-gray-500">Amount Due</p>
                            <p className="text-lg font-bold text-red-500">Ksh. 300</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="text-lg font-medium text-gray-800">January 7, 2026</p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <button className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg font-medium shadow hover:scale-105 transform transition">
                            Pay Now
                        </button>
                        <button className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-medium shadow hover:bg-gray-200 hover:scale-105 transform transition">
                            Download Invoice
                        </button>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Methods</h2>
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Mpesa */}
                        <div className="flex-1 p-6 bg-gray-50 rounded-lg border hover:shadow-xl transition">
                            <div className="flex items-center gap-3">
                                <FaMobileAlt className="text-green-500 text-xl" />
                                <h3 className="text-lg font-medium text-gray-800">Mpesa</h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Pay using your Mpesa account securely.</p>
                            <button className="mt-6 px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:scale-105 transform transition">
                                Pay with Mpesa
                            </button>
                        </div>
                        {/* Visa/Mastercard */}
                        <div className="flex-1 p-6 bg-gray-50 rounded-lg border hover:shadow-xl transition">
                            <div className="flex items-center gap-3">
                                <FaCcVisa className="text-blue-500 text-xl" />
                                <h3 className="text-lg font-medium text-gray-800">Visa/Mastercard</h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Secure payment via your card.</p>
                            <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:scale-105 transform transition">
                                Pay with Card
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment History</h2>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border-b py-2 px-4 text-gray-600">Date</th>
                                <th className="border-b py-2 px-4 text-gray-600">Amount</th>
                                <th className="border-b py-2 px-4 text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">December 30, 2025</td>
                                <td className="py-2 px-4 border-b">Ksh. 300</td>
                                <td className="py-2 px-4 border-b text-green-500">Paid</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">November 30, 2025</td>
                                <td className="py-2 px-4 border-b">Ksh. 300</td>
                                <td className="py-2 px-4 border-b text-green-500">Paid</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">October 30, 2025</td>
                                <td className="py-2 px-4 border-b">Ksh. 300</td>
                                <td className="py-2 px-4 border-b text-red-500">Overdue</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default BillingPage;
