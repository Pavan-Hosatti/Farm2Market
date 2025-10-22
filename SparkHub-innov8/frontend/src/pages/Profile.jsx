import { motion } from 'framer-motion';
import React, { useState, useMemo } from 'react';

// Placeholder t function for translation/i18n. 
// In a real application, this would be provided by a library like i18next or react-intl.
const t = (key) => key;

// --- Local Icon Definitions (Replaced lucide-react import) ---
// This ensures the component runs without needing to install an external package.

const IconWrapper = ({ children, className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

const Edit = (props) => (
  <IconWrapper {...props}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </IconWrapper>
);

const MapPin = (props) => (
  <IconWrapper {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </IconWrapper>
);

const Calendar = (props) => (
  <IconWrapper {...props}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </IconWrapper>
);

const Award = (props) => (
  <IconWrapper {...props}>
    <path d="m15.4 17.5 1.5 1.7a2.1 2.1 0 0 0 3.2 0l1.5-1.7" />
    <circle cx="12" cy="11" r="5" />
    <path d="M12 16l-3.2 4.4" />
    <path d="M12 16l3.2 4.4" />
    <path d="m8.6 17.5-1.5 1.7a2.1 2.1 0 0 1-3.2 0L2.4 17.5" />
  </IconWrapper>
);

const DollarSign = (props) => (
  <IconWrapper {...props}>
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </IconWrapper>
);

const Seedling = (props) => (
  <IconWrapper {...props}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-3-5s-4-4-4-4-2.2 4.5-4 6-3 3-3 5a7 7 0 0 0 7 7Z" />
    <path d="M12 10C10 10 7 12 7 15" />
  </IconWrapper>
);

const Truck = (props) => (
  <IconWrapper {...props}>
    <path d="M10 17H5a2 2 0 0 1-2-2V9.45l.9-.9c.7-.6 1.6-1 2.7-1h8.2a4 4 0 0 1 4 4v.7c0 1.5.8 2.8 2 3.4" />
    <path d="M7 17v-2" />
    <path d="M18 17v-2" />
    <path d="M8 12h8" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="18" cy="17" r="2" />
  </IconWrapper>
);

const Mail = (props) => (
  <IconWrapper {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </IconWrapper>
);

const CheckCircle = (props) => (
  <IconWrapper {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </IconWrapper>
);


// --- Default Data and Components ---

const INITIAL_PROFILE_DATA = {
  farmName: t('Green Acres Farm'),
  location: t('Springfield, IL'),
  description: t('Green Acres Farm is dedicated to sustainable, organic farming practices. We specialize in non-GMO vegetables and grass-fed dairy products. Our mission is to provide high-quality, locally sourced food directly to institutional buyers and restaurants.'),
  expertiseString: t('Organic Farming, Crop Rotation, Soil Health'),
  joinedDate: t('Oct 2023'),
  contactEmail: t('contact@greenacres.farm'),
  taxId: t('90123456')
};

const mockAchievements = [
    { title: t('Certified Organic'), description: t('USDA Organic Certification'), icon: Seedling },
    { title: t('Top Rated Supplier'), description: t('5-star average customer rating'), icon: Award },
    { title: t('Local Delivery Partner'), description: t('Certified for direct delivery'), icon: Truck },
];

const mockCurrentListings = [
    { id: 1, name: t('Organic Roma Tomatoes (200 lbs)'), status: t('Active Listing'), category: t('Produce') },
    { id: 2, name: t('Free-Range Chicken Eggs (Daily)'), status: t('Selling Daily'), category: t('Dairy/Protein') },
    { id: 3, name: t('Late-Season Honey'), status: t('Upcoming Harvest'), category: t('Specialty') },
];

// Profile Setup Form Component
const ProfileSetupForm = ({ profile, setProfile, setIsEditing }) => {
  const [formData, setFormData] = useState({
    farmName: profile.farmName === t('Green Acres Farm') ? '' : profile.farmName,
    location: profile.location === t('Springfield, IL') ? '' : profile.location,
    description: profile.description === t('Green Acres Farm is dedicated to sustainable, organic farming practices. We specialize in non-GMO vegetables and grass-fed dairy products. Our mission is to provide high-quality, locally sourced food directly to institutional buyers and restaurants.') ? '' : profile.description,
    expertiseString: profile.expertiseString === t('Organic Farming, Crop Rotation, Soil Health') ? '' : profile.expertiseString,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate initial setup: merge form data with default secondary data
    const newProfile = {
      ...INITIAL_PROFILE_DATA,
      ...formData,
      // Default dates/stats for a new user
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      taxId: t('PENDING_SETUP'),
      expertiseString: formData.expertiseString || t('General Farming')
    };
    
    setProfile(newProfile);
    setIsEditing(false); // Switch to view mode
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 border-gray-200 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 shadow-xl"
    >
      <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
        <Seedling className="w-8 h-8"/> {t('Welcome to Farm2Market!')}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {t('Tell us a little about your farm to get your profile ready for buyers.')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Farm/Business Name')}</label>
          <input
            type="text"
            id="farmName"
            name="farmName"
            value={formData.farmName}
            onChange={handleChange}
            placeholder={t('e.g., Green Acres Farm')}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Primary Location (City, State)')}</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder={t('e.g., Springfield, IL')}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Farm Description (max 3 sentences)')}</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('Describe your focus: organic, specialty livestock, etc.')}
            rows="3"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          ></textarea>
        </div>

        <div>
          <label htmlFor="expertiseString" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Key Expertise (Comma separated)')}</label>
          <input
            type="text"
            id="expertiseString"
            name="expertiseString"
            value={formData.expertiseString}
            onChange={handleChange}
            placeholder={t('e.g., Organic Farming, Crop Rotation, Local Distribution')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <motion.button 
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/50"
        >
          <CheckCircle className="w-5 h-5"/> {t('Complete Profile Setup')}
        </motion.button>
      </form>
    </motion.div>
  );
};


// --- Main Profile Component ---

const FarmerProfile = () => {
  // State to hold the profile data
  const [profile, setProfile] = useState(INITIAL_PROFILE_DATA);
  // State to manage whether the user is in editing/setup mode
  const [isEditing, setIsEditing] = useState(true); // Default to true for new user simulation

  // This hook converts the comma-separated string back to an array for display
  const expertiseArray = useMemo(() => 
    profile.expertiseString.split(',').map(s => s.trim()).filter(s => s)
  , [profile.expertiseString]);

  // If the profile is in the initial editing state, render the setup form
  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-200 dark:from-slate-900 dark:to-slate-800 pt-20 flex justify-center items-start p-4">
        <div className="max-w-xl w-full mx-auto">
          <ProfileSetupForm 
            profile={profile} 
            setProfile={setProfile} 
            setIsEditing={setIsEditing} 
          />
        </div>
      </div>
    );
  }

  // If the profile is set up, render the display view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-200 dark:from-slate-900 dark:to-slate-800 pt-20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-2xl p-8 sticky top-8"
            >
              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-r from-emerald-600 to-lime-600 rounded-full flex items-center justify-center text-4xl text-white font-bold mx-auto mb-4">
                    {profile.farmName.match(/\b(\w)/g)?.join('').toUpperCase() || t('F2M')}
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)} // Button to re-enter edit mode
                    className="absolute bottom-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{profile.farmName}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{t('Organic Produce & Dairy Supplier')}</p>
                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{t('Joined Farm2Market')} {profile.joinedDate}</span>
                </div>
              </div>

              {/* Contact Links */}
              <div className="space-y-3 mb-8">
                <a href={`mailto:${profile.contactEmail}`} className="flex items-center gap-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                  <Mail className="w-5 h-5" />
                  <span>{profile.contactEmail}</span>
                </a>
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 p-3 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                  <span>{t('Tax ID:')} {profile.taxId}</span>
                </div>
              </div>

              {/* Quick Stats (Static for this demo) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">42</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">{t('Listings')}</div>
                </div>
                <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">98%</div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">{t('Fulfillment')}</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('About the Farm')}</h2>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {profile.description}
              </p>
            </motion.div>

            {/* Expertise (formerly Skills) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Farming Expertise')}</h2>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {expertiseArray.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-emerald-600 to-lime-600 px-4 py-2 rounded-full text-white font-medium hover:scale-105 transition-transform cursor-pointer"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Current Listings (Mock Data) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('Current Listings')}</h2>
              <div className="space-y-4">
                {mockCurrentListings.map((listing) => (
                  <div key={listing.id} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{listing.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">{listing.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      listing.status === t('Selling Daily') 
                        ? 'bg-lime-200/50 text-lime-700 dark:bg-lime-600/20 dark:text-lime-400' 
                        : listing.status === t('Active Listing') 
                        ? 'bg-emerald-200/50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-400' 
                        : 'bg-gray-200/50 text-gray-700 dark:bg-gray-600/20 dark:text-gray-400'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievements (Mock Data) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/50 backdrop-blur-xl rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('Certifications & Awards')}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {mockAchievements.map((achievement, index) => (
                  <div key={index} className="text-center p-6 bg-gradient-to-br from-yellow-100/50 to-orange-100/50 rounded-xl border border-yellow-200 dark:from-yellow-600/10 dark:to-orange-600/10 dark:border-yellow-600/20">
                    <achievement.icon className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-gray-900 dark:text-white font-bold mb-2">{achievement.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;
