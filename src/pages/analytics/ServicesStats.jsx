import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement } from 'chart.js';
import FollowersBarChart from './FollowersBarChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement);

const ServicesStats = () => {
    const mostPopularServicesData = {
        labels: ['Service A', 'Service B', 'Service C', 'Service D', 'Service E'],
        datasets: [
            {
                label: 'Bookings',
                data: [120, 150, 200, 100, 75],
                backgroundColor: ['#1A3664', '#3B82F6', '#34D399', '#F59E0B', '#EF4444'],
            },
        ],
    };

    const servicePerformanceData = {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
            {
                label: 'Service A Performance',
                data: [30, 40, 60, 70, 90, 100],
                borderColor: '#1A3664',
                backgroundColor: 'rgba(26, 54, 100, 0.2)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Service B Performance',
                data: [20, 30, 50, 60, 80, 95],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const serviceFeedbackData = {
        labels: ['Service A', 'Service B', 'Service C', 'Service D', 'Service E'],
        datasets: [
            {
                label: 'Average Rating',
                data: [4.5, 3.8, 4.2, 4.7, 4.0],
                backgroundColor: ['#1A3664', '#3B82F6', '#34D399', '#F59E0B', '#EF4444'],
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
                grid: {
                    display: false,
                },
                beginAtZero: true,
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

    const customLegend = (labels, colors) => {
        return labels.map((label, index) => (
            <div key={label} className="flex items-center mb-2">
                <div
                    style={{ backgroundColor: colors[index] }}
                    className="w-4 h-4 rounded-full mr-2"
                ></div>
                <span className="text-sm text-gray-800">{label}</span>
            </div>
        ));
    };

    return (
        <div className="bg-white mt-4 rounded-lg h-auto">
            <div className="flex w-full items-start gap-4">
                <div className="w-full md:w-[35%] mb-8 border p-4 rounded-md">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Most Popular Services</h3>
                    <Pie data={mostPopularServicesData} options={pieOptions} />
                </div>

                <div className="w-full md:w-[65%] mb-8 border p-4 rounded-md h-auto">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Service Performance</h3>
                    <Line data={servicePerformanceData} options={commonOptions} />
                    <div className="mt-4">
                        {customLegend(
                            servicePerformanceData.datasets.map((dataset) => dataset.label),
                            servicePerformanceData.datasets.map((dataset) => dataset.borderColor)
                        )}
                    </div>
                </div>
            </div>

            <div className="flex w-full gap-4 flex-col md:flex-row">
                <div className="w-full md:w-[50%] mb-8 border p-4 rounded-md">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Followers over time</h3>
                    <FollowersBarChart />
                </div>
                <div className="w-full md:w-[50%] border p-4 border-gray-100 rounded-md">
                    <h3 className="text-xl font-medium text-gray-800 mb-4">Service Rating</h3>
                    <Bar
                        data={serviceFeedbackData}
                        options={{
                            ...commonOptions,
                            elements: {
                                bar: {
                                    borderRadius: 10,
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ServicesStats;
