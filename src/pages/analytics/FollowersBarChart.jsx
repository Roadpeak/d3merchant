import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FollowersBarChart = () => {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Male Followers',
                data: [500, 700, 800, 650, 900, 1000],
                backgroundColor: '#1A3664',
                borderColor: '#1A3664',
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: 'Female Followers',
                data: [400, 600, 700, 550, 750, 850],
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    const options = {
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
                title: {
                    display: true,
                    text: 'Month',
                },
                grid: {
                    display: false,
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Followers Count',
                },
                beginAtZero: true,
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="bg-white w-full">
            <Bar data={data} options={options} />
        </div>
    );
};

export default FollowersBarChart;
