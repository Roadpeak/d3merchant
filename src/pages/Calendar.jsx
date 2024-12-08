// src/pages/Calendar.jsx
import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const Calendar = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dummyData = [
    { date: '2023-10-01', appointments: 3 },
    { date: '2023-10-02', appointments: 5 },
    { date: '2023-10-03', appointments: 2 },
    { date: '2023-10-04', appointments: 4 },
    { date: '2023-10-05', appointments: 1 },
    { date: '2023-10-06', appointments: 6 },
    { date: '2023-10-07', appointments: 3 },
  ];

  const getDayClass = (appointments) => {
    if (appointments > 4) return 'bg-red-500';
    if (appointments > 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="calendar-container p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <FaCalendarAlt className="mr-2" /> Calendar
      </h1>
      <div className="grid grid-cols-7 gap-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center font-semibold">
            {day}
          </div>
        ))}
        {dummyData.map((day) => (
          <div
            key={day.date}
            className={`p-4 rounded-lg text-white ${getDayClass(day.appointments)}`}
          >
            <div className="text-center">{new Date(day.date).getDate()}</div>
            <div className="text-center">{day.appointments} Appointments</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;