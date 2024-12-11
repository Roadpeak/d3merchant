import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const BookingsChart = () => {
    const data = {
        labels: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ],
        datasets: [
            {
                data: [50, 70, 90, 40, 60, 100, 80, 120, 110, 95, 85, 70],
                backgroundColor: '#1A3664',
                borderRadius: 10,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Monthly Bookings Overview',
                color: '#1A3664',
                align: 'start'
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
            <Bar data={data} options={options} />
        </div>
    );
};

export default BookingsChart;
