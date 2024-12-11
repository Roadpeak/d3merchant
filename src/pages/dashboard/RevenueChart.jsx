import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip);

const RevenueChart = () => {
    const data = {
        labels: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ],
        datasets: [
            {
                label: 'Offers Revenue',
                data: [1200, 1500, 1700, 1900, 2200, 2500, 2700, 3000, 3200, 3500, 3700, 4000],
                borderColor: '#1A3664',
                backgroundColor: 'rgba(26, 54, 100, 0.2)',
                borderWidth: 2,
                tension: 0.4, // Adds curve to the line
            },
            {
                label: 'Services Revenue',
                data: [1000, 1300, 1600, 1800, 2000, 2300, 2600, 2900, 3100, 3300, 3500, 3800],
                borderColor: '#FFA726',
                backgroundColor: 'rgba(255, 167, 38, 0.2)',
                borderWidth: 2,
                tension: 0.4, // Adds curve to the line
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Hides the legend
            },
            title: {
                display: true,
                text: 'Revenue Over Time',
                color: '#1A3664',
                align: 'start',
                font: {
                    size: 16,
                    weight: 'bold',
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#1A3664',
                },
            },
            y: {
                grid: {
                    drawBorder: false,
                },
                ticks: {
                    color: '#1A3664',
                },
            },
        },
    };

    return (
        <div className="w-full p-4 bg-white rounded-lg border border-gray-200">
            <Line data={data} options={options} />
        </div>
    );
};

export default RevenueChart;
