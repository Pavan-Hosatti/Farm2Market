import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ShoppingCart, TrendingUp, Clock } from 'lucide-react';

const BuyerDashboard = () => {
  const purchases = [
    { id: 1, produce: 'Fresh Tomatoes', farmer: 'Farmstead Farms', lastActivity: '2 hours ago', finalPrice: '₹120/kg' },
    { id: 2, produce: 'Organic Carrots', farmer: 'Green Valley Produce', lastActivity: '1 day ago', finalPrice: '₹80/kg' },
    { id: 3, produce: 'Sweet Potatoes', farmer: 'Ridgefield Growers', lastActivity: '3 days ago', finalPrice: '₹50/kg' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-slate-900 dark:to-slate-800 pt-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Buyer Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your purchases and track your bids</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {[
            { label: 'Total Purchases', value: '7', icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Bids Placed', value: '15', icon: TrendingUp, color: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Avg. Price Per Kg', value: '₹95', icon: Clock, color: 'text-green-600 dark:text-green-400' },
            { label: 'Saved on Bids', value: '₹1,200', icon: MessageCircle, color: 'text-purple-600 dark:text-purple-400' },
          ].map((stat, index) => (
            <div 
              key={index} 
              className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-xl p-6 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Recent Purchases</h2>
          
          <div className="grid gap-6">
            {purchases.map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-xl p-6 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                      {purchase.produce.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{purchase.produce}</h3>
                      <p className="text-gray-500 dark:text-gray-400">Sold by {purchase.farmer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Final Price</p>
                    <p className="text-gray-900 dark:text-white">{purchase.finalPrice}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Message Farmer
                  </button>
                  <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl transition-colors">
                    View Receipt
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
