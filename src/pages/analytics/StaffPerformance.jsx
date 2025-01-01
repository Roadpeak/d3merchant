import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement);

const StaffPerformance = () => {
    const staffPerformanceData = {
        labels: ['Staff A', 'Staff B', 'Staff C', 'Staff D'],
        datasets: [
            {
                label: 'Bookings Completed',
                data: [150, 120, 180, 90],
                backgroundColor: '#1A3664',
                borderRadius: 10,
            },
        ],
    };

    const staffRatingsData = {
        labels: ['Staff A', 'Staff B', 'Staff C', 'Staff D'],
        datasets: [
            {
                label: 'Average Rating',
                data: [4.8, 4.2, 4.5, 4.7],
                backgroundColor: ['#1A3664', '#3B82F6', '#34D399', '#F59E0B'],
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        plugins: {
            title: {
                display: false,
            },
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: false,
                },
            },
        },
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
            },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg border-t mt-4">
            <div className="flex w-full flex-col md:flex-row gap-4">
                <div className="mb-8 border border-gray-100 p-4 rounded-md w-full md:w-[65%]">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Staff Bookings Completed</h3>
                    <Bar data={staffPerformanceData} options={commonOptions} />
                </div>

                <div className="border border-gray-100 p-4 rounded-md w-full md:w-[35%]">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Staff Average Ratings</h3>
                    <Pie data={staffRatingsData} options={pieOptions} />
                </div>
            </div>
        </div>
    );
};

export default StaffPerformance;
