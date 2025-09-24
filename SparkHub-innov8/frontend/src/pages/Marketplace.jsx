import { motion } from 'framer-motion';
import { ShoppingCart, MessageCircle, Eye, TrendingUp, Filter, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

// New Modal Component
const ListingDetailsModal = ({ listing, onClose }) => {
  if (!listing) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-2xl w-full shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-indigo-900 dark:text-white mb-2">{listing.title}</h2>
        <p className="text-sm text-indigo-600 dark:text-gray-400 mb-4">by {listing.seller}</p>
        <p className="text-indigo-700 dark:text-gray-300 mb-4">{listing.description}</p>
        <div className="flex items-center gap-4 mb-4">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            {listing.category}
          </span>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
            {listing.price}
          </span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Availability: {listing.availability}</p>
        <div className="flex justify-end gap-4">
          <button className="flex items-center gap-2 text-indigo-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
            <MessageCircle className="w-5 h-5" />
            Message
          </button>
          <button className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-lg text-white font-medium hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Marketplace = () => {
  const allProduceListings = [
    {
      id: 1,
      title: 'Farm Fresh Tomatoes',
      seller: 'Green Acres Farm',
      description: 'Ripe and juicy tomatoes, hand-picked daily. Perfect for salads and sauces.',
      price: '₹120/kg',
      availability: '100 kg',
      category: 'Vegetables'
    },
    {
      id: 2,
      title: 'Organic Mangoes',
      seller: 'Sun Valley Orchards',
      description: 'Sweet, Alphonso mangoes from our organic farm. Chemical-free and delicious.',
      price: '₹250/kg',
      availability: '50 kg',
      category: 'Fruits'
    },
    {
      id: 3,
      title: 'Pure Basmati Rice',
      seller: 'Harvest Mills',
      description: 'Premium quality Basmati rice, aged for 12 months for the best aroma and flavour.',
      price: '₹90/kg',
      availability: '500 kg',
      category: 'Grains'
    },
    {
      id: 4,
      title: 'Crisp Bell Peppers',
      seller: 'Sunset Gardens',
      description: 'Vibrant and crunchy bell peppers, ideal for stir-fries and grilling.',
      price: '₹150/kg',
      availability: '75 kg',
      category: 'Vegetables'
    },
    {
      id: 5,
      title: 'Sweet Strawberries',
      seller: 'Berry Blossom Farm',
      description: 'Freshly picked, sweet strawberries. Great for desserts and smoothies.',
      price: '₹300/kg',
      availability: '30 kg',
      category: 'Fruits'
    },
    {
      id: 6,
      title: 'Premium Cumin Seeds',
      seller: 'Spice Route Exporters',
      description: 'Aromatic and high-quality cumin seeds, perfect for adding flavor to any dish.',
      price: '₹80/100g',
      availability: '15 kg',
      category: 'Spices'
    },
    {
      id: 7,
      title: 'Fresh Coriander',
      seller: 'Urban Greens',
      description: 'Locally grown fresh coriander with a strong, distinct aroma.',
      price: '₹40/bunch',
      availability: '20 bunches',
      category: 'Herbs'
    },
    {
      id: 8,
      title: 'Whole Wheat Flour',
      seller: 'Golden Grain Co.',
      description: 'Stone-ground whole wheat flour for wholesome and healthy baking.',
      price: '₹55/kg',
      availability: '200 kg',
      category: 'Grains'
    }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [filteredListings, setFilteredListings] = useState(allProduceListings);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  const handleFilter = (category) => {
    setLoading(true);
    setActiveFilter(category);
    setTimeout(() => {
      let updatedListings = allProduceListings;
      if (category !== 'All') {
        updatedListings = allProduceListings.filter(listing => listing.category === category);
      }
      setFilteredListings(updatedListings);
      setLoading(false);
    }, 500); // Simulate network latency
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const lowercasedQuery = query.toLowerCase();
    const filtered = allProduceListings.filter(
      listing =>
        (activeFilter === 'All' || listing.category === activeFilter) &&
        (listing.title.toLowerCase().includes(lowercasedQuery) ||
         listing.description.toLowerCase().includes(lowercasedQuery) ||
         listing.seller.toLowerCase().includes(lowercasedQuery))
    );
    setFilteredListings(filtered);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-white mb-4">Produce Marketplace</h1>
          <p className="text-indigo-700 dark:text-gray-300">Discover fresh produce and connect with local sellers</p>
        </motion.div>

        {/* Search Bar and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search for produce, sellers, or categories..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-white dark:bg-slate-800 rounded-full pl-10 pr-4 py-3 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {['All', 'Fruits', 'Vegetables', 'Grains', 'Spices', 'Herbs'].map((filter, index) => (
              <button
                key={index}
                onClick={() => handleFilter(filter)}
                className={`px-6 py-3 rounded-full font-medium transition-all hover:scale-105 ${
                  activeFilter === filter 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-white text-indigo-700 dark:bg-slate-800 dark:text-gray-300 shadow-md'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Listings Grid */}
        <div className="grid gap-8">
          {loading ? (
            <div className="text-center text-indigo-500 dark:text-gray-400 py-10">
              <p>Loading listings...</p>
            </div>
          ) : filteredListings.length > 0 ? (
            filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        {listing.category}
                      </span>
                      <span className="text-indigo-600 dark:text-gray-400 text-sm">by {listing.seller}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-3">{listing.title}</h3>
                    <p className="text-indigo-700 dark:text-gray-300">{listing.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-indigo-100 dark:border-gray-700">
                  <div className="flex items-center gap-6">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {listing.price}
                    </span>
                    <button className="flex items-center gap-2 text-indigo-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      Message
                    </button>
                    <button 
                      onClick={() => setSelectedListing(listing)}
                      className="flex items-center gap-2 text-indigo-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      Details
                    </button>
                  </div>
                  <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 rounded-lg text-white font-medium hover:scale-105 transition-transform">
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              <p>No listings found for this search/filter.</p>
            </div>
          )}
        </div>

        {/* Trending Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Trending Produce</h2>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {['Fresh Fruits', 'Organic Vegetables', 'Local Spices', 'Daily Harvest', 'Fair Trade'].map((topic, index) => (
              <span 
                key={index}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 rounded-full text-white font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {selectedListing && (
        <ListingDetailsModal 
          listing={selectedListing} 
          onClose={() => setSelectedListing(null)} 
        />
      )}
    </div>
  );
};

export default Marketplace;