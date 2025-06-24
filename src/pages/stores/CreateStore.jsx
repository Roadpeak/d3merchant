import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../services/api_service';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

const CreateStore = () => {
    const [step, setStep] = useState(1); // Step tracker
    const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        primary_email: '',
        phone_number: '',
        description: '',
        website_url: '',
        logo_url: '',
        opening_time: '',
        closing_time: '',
        working_days: [],
        status: 'open',
        merchant_id: '',
    });
    const [logoFile, setLogoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleDayToggle = (day) => {
        setFormData((prevData) => {
            const days = new Set(prevData.working_days);
            if (days.has(day)) {
                days.delete(day);
            } else {
                days.add(day);
            }
            return { ...prevData, working_days: Array.from(days) };
        });
    };

    const handleLogoUpload = async () => {
        if (!logoFile) {
            toast.error('Please select a logo to upload');
            return;
        }
        try {
            setIsUploading(true);
            const { fileUrl } = await uploadImage(logoFile); // Assuming `fileUrl` is returned
            setFormData((prevData) => ({
                ...prevData,
                logo_url: fileUrl,
            }));
            toast.success('Logo uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload logo');
        } finally {
            setIsUploading(false);
        }
    };

    // Validate form data
    const validateForm = () => {
        const requiredFields = ['name', 'location', 'primary_email', 'phone_number', 'description', 'opening_time', 'closing_time'];

        for (const field of requiredFields) {
            if (!formData[field].trim()) {
                toast.error(`${field.replace('_', ' ')} is required`);
                return false;
            }
        }

        if (formData.working_days.length === 0) {
            toast.error('Please select at least one working day');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.primary_email)) {
            toast.error('Please enter a valid email address');
            return false;
        }

        return true;
    };

    // Function to decrypt and get auth data
    const getAuthData = () => {
        try {
            const encryptedData = Cookies.get('auth_data');
            console.log('Encrypted data from cookie:', encryptedData);

            if (!encryptedData) {
                throw new Error('No authentication data found');
            }

            const secretKey = import.meta.env.VITE_SECRET_KEY;
            console.log('Secret key exists:', !!secretKey);

            const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
            const decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));

            console.log('Decrypted auth data:', decryptedData);

            return decryptedData;
        } catch (error) {
            console.error('Error decrypting auth data:', error);
            throw new Error('Failed to retrieve authentication data. Please log in again.');
        }
    };

    // Submit store data to API
    const submitStoreData = async (storeData) => {
        try {
            // Get decrypted auth data
            const authData = getAuthData();
            const token = authData.token;
            const merchantId = authData.merchant.id;

            console.log('Token extracted:', token ? 'Token exists' : 'No token');
            console.log('Merchant ID:', merchantId);

            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            // Add merchant_id to store data
            const storeDataWithMerchant = {
                ...storeData,
                merchant_id: merchantId
            };

            console.log('Request headers:', {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.substring(0, 10)}...`, // Log first 10 chars only for security
            });

            console.log('Store data being sent:', storeDataWithMerchant);

            const response = await fetch('http://localhost:4000/api/v1/stores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(storeDataWithMerchant),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error response:', errorData);
                throw new Error(errorData.message || 'Failed to create store');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error submitting store data:', error);
            throw error;
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare data for submission
            const submissionData = {
                ...formData,
                // Ensure working_days is properly formatted
                working_days: formData.working_days,
                // Add any additional processing here
            };

            console.log('Submitting form data:', submissionData);

            const result = await submitStoreData(submissionData);

            toast.success('Store created successfully!');
            console.log('Store created:', result);

            // Optional: Reset form or redirect
            // setFormData({ ... reset to initial state ... });
            // navigate('/stores'); // if using react-router

        } catch (error) {
            toast.error(error.message || 'Failed to create store. Please try again.');
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
                <h1 className="text-2xl font-medium text-center text-gray-800 dark:text-white mb-6">
                    {step === 1 ? 'Step 1: Basic Information' : 'Step 2: Additional Information'}
                </h1>
                <p className="text-center mb-4 -mt-4 text-gray-600">Let us now set up your store. Please take time to fill in this Information</p>
                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. "John Doe Store"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="location"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. "123 Main St, City"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="primary_email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Primary Email
                                </label>
                                <input
                                    type="email"
                                    id="primary_email"
                                    name="primary_email"
                                    value={formData.primary_email}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. johndoe@example.com'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="phone_number"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone_number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. +1234567890'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder='e.g. "We sell the best products in town"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="website_url"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Website URL
                                </label>
                                <input
                                    type="url"
                                    id="website_url"
                                    name="website_url"
                                    value={formData.website_url}
                                    onChange={handleChange}
                                    placeholder='e.g. "https://example.com"'
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="logo"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Store Logo
                                </label>
                                <input
                                    type="file"
                                    id="logo"
                                    onChange={(e) => setLogoFile(e.target.files[0])}
                                    className="mt-1 block w-full text-gray-500 dark:text-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleLogoUpload}
                                    disabled={isUploading}
                                    className="mt-2 bg-primary text-white py-1 px-6 rounded-md disabled:opacity-50"
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Logo'}
                                </button>
                            </div>
                            <div>
                                <label
                                    htmlFor="opening_time"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Opening Time
                                </label>
                                <input
                                    type="time"
                                    id="opening_time"
                                    name="opening_time"
                                    value={formData.opening_time}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="closing_time"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Closing Time
                                </label>
                                <input
                                    type="time"
                                    id="closing_time"
                                    name="closing_time"
                                    value={formData.closing_time}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 block w-full py-2 px-3 outline-none focus:border-primary focus:outline-none text-[14px] dark:border-gray-700 rounded-md border border-gray-300"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Working Days
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {DAYS_OF_WEEK.map((day) => (
                                        <label
                                            key={day}
                                            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                                        >
                                            <input
                                                type="checkbox"
                                                value={day}
                                                checked={formData.working_days.includes(day)}
                                                onChange={() => handleDayToggle(day)}
                                                className="form-checkbox text-primary border-gray-300 dark:border-gray-700"
                                            />
                                            <span className="capitalize">{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end gap-4">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep((prevStep) => prevStep - 1)}
                                disabled={isSubmitting}
                                className="bg-gray-300 text-black py-1 px-6 rounded-md disabled:opacity-50"
                            >
                                Back
                            </button>
                        )}
                        {step < 2 ? (
                            <button
                                type="button"
                                onClick={() => setStep((prevStep) => prevStep + 1)}
                                className="bg-primary text-white py-1 px-6 rounded-md"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary text-white py-1 px-6 rounded-md disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating Store...' : 'Submit'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStore;