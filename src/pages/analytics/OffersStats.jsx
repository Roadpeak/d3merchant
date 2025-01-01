import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registering chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OffersStats = () => {
    // Dummy data for the charts
    const offerPerformanceData = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
            {
                label: 'Offers Created',
                data: [30, 45, 60, 75, 90, 120],
                backgroundColor: '#1A3664',
                borderColor: '#1A3664',
                borderWidth: 1,
            },
            {
                label: 'Offers Redeemed',
                data: [15, 20, 30, 40, 50, 60],
                backgroundColor: '#3B82F6',
                borderColor: '#3B82F6',
                borderWidth: 1,
            },
        ],
    };

    const conversionRateData = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
            {
                label: 'Offer Conversion Rate (%)',
                data: [10, 15, 25, 30, 40, 45],
                borderColor: '#FF6A00',
                backgroundColor: 'rgba(255, 106, 0, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const revenueFromOffersData = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
            {
                label: 'Revenue from Offers ($)',
                data: [1000, 1500, 2000, 2500, 3000, 3500],
                backgroundColor: '#34D399',
                borderColor: '#34D399',
                borderWidth: 1,
            },
        ],
    };

    // Common chart options
    const commonOptions = {
        responsive: true,
        plugins: {
            title: {
                display: false,
            },
            legend: {
                display: false, // Hide the default legend
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                grid: {
                    display: false,
                },
                beginAtZero: true,
            },
        },
        elements: {
            bar: {
                borderRadius: 6,
            },
        },
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full">
            <div className="flex w-full flex-col md:flex-row gap-4 my-4">
                <div className="w-full border border-gray-100 p-4 rounded-md md:w-[60%]">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Offers Performance</h3>
                    <Bar data={offerPerformanceData} options={commonOptions} />
                </div>

                <div className="w-full border border-gray-100 p-4 rounded-md md:w-[40%]">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Offer Conversion Rate</h3>
                    <Line data={conversionRateData} options={commonOptions} />
                </div>
            </div>

            <div className="border border-gray-100 p-4 rounded-md">
                <h3 className="text-xl font-medium text-gray-800 mb-4">Revenue from Offers</h3>
                <Bar data={revenueFromOffersData} options={commonOptions} />
            </div>
        </div>
    );
};

export default OffersStats;
