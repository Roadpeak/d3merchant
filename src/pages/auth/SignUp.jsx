import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { signupUser } from '../../services/api_service';
import CryptoJS from 'crypto-js';
import Cookies from 'js-cookie';

const SignupPage = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await signupUser(formData);

            const secretKey = import.meta.env.VITE_SECRET_KEY;
            const encryptedData = CryptoJS.AES.encrypt(
                JSON.stringify({
                    merchant: response.merchant,
                    token: response.access_token,
                }),
                secretKey
            ).toString();

            Cookies.set('auth_data', encryptedData, { expires: 1, secure: true });

            toast.success('Signup successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/stores/create';
            }, 1500);
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Signup failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} min-h-screen flex items-center justify-center`}>
            <div className="absolute top-4 right-4">
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="text-sm px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md shadow hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>

            <div className="w-full max-w-md px-6 py-8 bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <h2 className="text-2xl font-semibold text-center mb-6">Merchant Signup</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${loading && 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Already have an account? <a href="/login" className="text-primary hover:underline">Log In</a>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
