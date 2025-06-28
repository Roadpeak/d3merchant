import React from 'react';

const RevenueChart = () => {
  const products = [
    {
      name: 'Premium Headphones',
      category: 'Electronics',
      sales: '$12,450',
      trend: '+15%',
      positive: true,
      image: '🎧'
    },
    {
      name: 'Designer Backpack', 
      category: 'Fashion',
      sales: '$8,230',
      trend: '+8%',
      positive: true,
      image: '🎒'
    },
    {
      name: 'Smart Watch Pro',
      category: 'Electronics', 
      sales: '$15,680',
      trend: '+22%',
      positive: true,
      image: '⌚'
    },
    {
      name: 'Running Shoes',
      category: 'Sports',
      sales: '$6,940',
      trend: '-3%',
      positive: false,
      image: '👟'
    },
    {
      name: 'Coffee Maker',
      category: 'Home',
      sales: '$4,520',
      trend: '+5%',
      positive: true,
      image: '☕'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Most Booked</h3>
        <button className="text-purple-600 text-sm font-medium bg-purple-50 px-3 py-1 rounded-lg hover:bg-purple-100 transition-colors">
          View all
        </button>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              {product.image}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">{product.name}</h4>
              <p className="text-sm text-gray-500">{product.category}</p>
            </div>
            
            <div className="text-right">
              <p className="font-semibold text-gray-900 mb-1">{product.sales}</p>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${
                  product.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {product.trend}
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  product.positive ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart visualization placeholder */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="h-32 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 text-sm">Sales performance chart would go here</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;