import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';

const BookingsChart = () => {
  const data = [
    { month: 'Jan', revenue: 36000, orders: 32000 },
    { month: 'Feb', revenue: 70000, orders: 58000 },
    { month: 'Mar', revenue: 32000, orders: 38000 },
    { month: 'Apr', revenue: 55000, orders: 48000 },
    { month: 'May', revenue: 72000, orders: 58000 },
    { month: 'Jun', revenue: 45000, orders: 42000 },
    { month: 'Jul', revenue: 38000, orders: 28000 },
    { month: 'Aug', revenue: 62000, orders: 52000 },
    { month: 'Sep', revenue: 75000, orders: 68000 },
    { month: 'Oct', revenue: 55000, orders: 45000 },
    { month: 'Nov', revenue: 48000, orders: 38000 },
    { month: 'Dec', revenue: 82000, orders: 72000 }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Bookings Overview</h3>
        <div className="flex items-center gap-4">
          <select className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1 bg-white">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `${value/1000}k`}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8B5CF6" 
              strokeWidth={3}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              name="Offers"
              activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="orders" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              name="Services"
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BookingsChart;