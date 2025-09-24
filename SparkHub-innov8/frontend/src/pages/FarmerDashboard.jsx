import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, Star, Users, Edit, Eye } from 'lucide-react';

const FarmerDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState([
    { id: 1, title: 'Fresh Potatoes', status: 'Active', grade: 'Grade A' },
    { id: 2, title: 'Organic Carrots', status: 'Sold', grade: 'Grade B' },
    { id: 3, title: 'Sweet Onions', status: 'Under Review', grade: 'Grade C' },
  ]);

  // Simulate data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const gradeToPercentage = (grade) => {
    switch (grade) {
      case 'Grade A':
        return 100;
      case 'Grade B':
        return 75;
      case 'Grade C':
        return 50;
      case 'Grade D':
        return 25;
      default:
        return 0;
    }
  };

  const statIcons = {
    'Active Listings': Package,
    'Total Sales (INR)': DollarSign,
    'Avg. Grade': Star,
    'Buyers Connected': Users,
  };

  const stats = [
    { label: 'Active Listings', value: '5', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Total Sales (INR)', value: '₹15,000', color: 'text-green-600 dark:text-green-400' },
    { label: 'Avg. Grade', value: 'Grade A', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Buyers Connected', value: '12', color: 'text-orange-600 dark:text-orange-400' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-500">
        <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-slate-900 dark:to-slate-800 pt-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Farmer Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your produce listings and track sales</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, index) => {
            const Icon = statIcons[stat.label];
            return (
              <div
                key={index}
                className="bg-white/80 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Listings Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Your Produce Listings</h2>
          <div className="grid gap-6">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white/80 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-xl p-6 hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{listing.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{listing.status}</p>
                  </div>
                  <span className={`bg-green-200/50 text-green-700 dark:bg-green-600/20 dark:text-green-400 px-3 py-1 rounded-full text-sm`}>
                    {listing.grade}
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-600 to-teal-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${gradeToPercentage(listing.grade)}%` }}
                  ></div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                    <Edit className="w-4 h-4" />
                    Edit Listing
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

export default FarmerDashboard;