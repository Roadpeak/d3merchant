import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const RevenueAndPaymentsChart = () => {
    // Dummy data
    const data = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
            {
                label: 'Revenue ($)',
                data: [1500, 2000, 2500, 3000, 3500, 4000], // Revenue data
                backgroundColor: '#1A3664', // Dark blue for revenue
            },
            {
                label: 'Payments ($)',
                data: [1200, 1800, 2100, 2500, 3000, 3500], // Payments data
                backgroundColor: '#3B82F6', // Blue for payments
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            title: {
                display: false, // Hide the chart title
            },
            legend: {
                display: false, // Remove the default legend
            },
        },
        scales: {
            x: {
                grid: {
                    display: false, // Remove grid lines on the x-axis
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: false, // Remove grid lines on the y-axis
                },
            },
        },
        elements: {
            bar: {
                borderRadius: 10,
            },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 w-full rounded-lg">
                <div className="border border-gray-100 p-4 rounded-md w-full md:w-[35%]">
                    Recent Bookings
                </div>
                <div className="w-full md:w-[65%] p-4 rounded-md border border-gray-100">
                    <h2 className="text-xl font-semibold text-start text-gray-800 mb-6">Revenue and Payments Analytics</h2>
                    <div className="h-96">
                        <Bar data={data} options={options} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueAndPaymentsChart;
