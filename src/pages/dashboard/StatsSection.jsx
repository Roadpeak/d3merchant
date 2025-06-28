import React from 'react';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, BarChart3 } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "$280k",
      change: "+2.09%",
      subtitle: "VS / last week",
      positive: true,
      icon: DollarSign,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Total Bookings", 
      value: "2,352",
      change: "+5.27%",
      subtitle: "VS / last week",
      positive: true,
      icon: Package,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Total Customers",
      value: "48,254", 
      change: "-1.04%",
      subtitle: "VS / last week",
      positive: false,
      icon: Users,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Growth",
      value: "+30.56%",
      change: "+4.87%", 
      subtitle: "VS / last week",
      positive: true,
      icon: BarChart3,
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 -mt-8 relative z-10">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
          <div className="flex items-center mt-2">
            {stat.positive ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change}
            </span>
            <span className="text-gray-500 text-sm ml-1">{stat.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSection;