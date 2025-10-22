import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, Menu, X, Home, MessageCircle, Plus, Moon, Sun, ShoppingCart, Tractor, Leaf } from 'lucide-react';
// -----------------------------------------------------------
// 💡 NEW: Import useTranslation for internationalization
import { useTranslation } from 'react-i18next'; 
// -----------------------------------------------------------

// 💡 NEW: Import the useAuth hook to access user state globally
import { useAuth } from '../../context/AuthContext'; 

// --- MOCK DATA (Only keeping notifications) ---
// 💡 NOTE: The text here should also be wrapped in t() if it were dynamic (e.g., loaded from API).
// For static mock data, we will wrap it here for now. If you fetch this from the backend, 
// you'll need to translate the API response text *before* displaying it.
const mockNotifications = [
  { id: 1, text: 'Your produce "Organic Tomatoes" was approved!', read: false },
  { id: 2, text: 'John commented on your listing.', read: true },
  { id: 3, text: 'You have a new buyer inquiry.', read: false },
];
// ---------------------------------------------

// 💡 Props adjusted: We only need isDark and toggleTheme now, as auth is via context.
const Header = ({ isDark, toggleTheme }) => { 
  const location = useLocation();
  const navigate = useNavigate();
  
  // -----------------------------------------------------------
  // 💡 NEW: Get the translation function (t) and i18n instance
  const { t, i18n } = useTranslation(); 
  // -----------------------------------------------------------

  // 💡 FIX 1: Use the Context state for user and auth status
  const { user, isAuthenticated, logout } = useAuth();
  
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  const useClickOutsideLogic = (ref, handler) => {
    const listener = useCallback((event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    }, [ref, handler]);
    
    useEffect(() => {
      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);
      return () => {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      };
    }, [listener]);
  };
  
  useClickOutsideLogic(profileDropdownRef, () => setIsProfileOpen(false));
  useClickOutsideLogic(notificationsDropdownRef, () => setIsNotificationsOpen(false));

  // Theme initialization is now handled via prop from App.jsx
  
  const getUnreadNotificationCount = () => notifications.filter(n => !n.read).length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  // -----------------------------------------------------------
  // 💡 NEW: Function to change language on click
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  // -----------------------------------------------------------

  // 💡 FIX 2: Use the context logout function
  const handleLogout = () => {
    logout(); 
    setIsProfileOpen(false);
    navigate('/');
  };

  const handleProtectedNavigation = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate('/login');
    }
    setIsMenuOpen(false);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // 💡 FIX 3: Dynamic dashboard based on 'user?.role' from context
  const getDashboardInfo = () => {
    if (user?.role === 'buyer') {
      // -----------------------------------------------------------
      // 💡 WRAPPED TEXT: Buyer Dashboard
      return { name: t('Buyer Dashboard'), href: '/buyer-dashboard', icon: ShoppingCart };
    } else if (user?.role === 'farmer') {
      // 💡 WRAPPED TEXT: Farmer Dashboard
      return { name: t('Farmer'), href: '/farmer-dashboard', icon: Tractor };
    }
    // Default fallback
    // 💡 WRAPPED TEXT: Dashboard
    return { name: t('Dashboard'), href: '/dashboard', icon: User };
    // -----------------------------------------------------------
  };

  const dashboardInfo = isAuthenticated 
    ? getDashboardInfo() 
    // 💡 WRAPPED TEXT: Dashboard (for unauthenticated fallback)
    : { name: t('Dashboard'), href: '/login', icon: User };

  const navItems = [
    // 💡 WRAPPED TEXT: Home, Marketplace, AIGrader
    { name: t('Home'), href: '/', icon: Home, isProtected: false },
    { name: t('Marketplace'), href: '/marketplace', icon: MessageCircle, isProtected: false },
    { name: t('AIGrader'), href: '/aigrader', icon: Plus, isProtected: false },
    // Use the dynamic dashboardInfo here
    { name: dashboardInfo.name, href: dashboardInfo.href, icon: dashboardInfo.icon, isProtected: true }
  ];

  const unreadCount = getUnreadNotificationCount();
  
  // Custom Hook to prevent body scrolling when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
    return () => {
        document.body.style.overflow = 'auto'; // Cleanup
    };
  }, [isMenuOpen]);

  // Inline component for the link buttons to simplify the JSX
  const DropdownItem = ({ to, onClick, icon: Icon, children, isLogout = false }) => (
      <Link 
          to={to} 
          onClick={() => {
            onClick(); // Execute passed-in click handler
            setIsProfileOpen(false); // Close dropdown on navigation
          }} 
          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              isLogout 
              ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20' 
              : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-800'
          }`}
      >
          <Icon className="w-4 h-4" />
          <span>{children}</span>
      </Link>
  );


  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-500`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          
          {/* Group 1: Logo and Desktop Nav Links */}
          <div className="flex items-center space-x-6">

            {/* Left: Logo */}
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 flex-shrink-0">
              <Link to="/" className="flex items-center gap-2">
                {/* Logo Icon */}
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-white"/>
                </div>
                <div className="hidden sm:block">
                  {/* Brand Name */}
                  {/* 💡 WRAPPED TEXT: Farm2Market */}
                  <span className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white transition-colors duration-500">{t('Farm')}<span className="text-green-600 dark:text-green-400">2</span>{t('Market')}</span>
                  {/* 💡 WRAPPED TEXT: Your Local Harvest */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 font-medium tracking-wide transition-colors duration-500">{t('Your Local Harvest')}</div>
                </div>
              </Link>
            </motion.div>

            {/* Center: Desktop Navigation (Pill-shaped, Green Active Match) */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                // Determine props based on protection status
                const linkProps = (item.isProtected && !isAuthenticated)
                  ? { to: '/login', onClick: handleProtectedNavigation }
                  : { to: item.href };

                return (
                  <Link
                    key={index}
                    {...linkProps}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm
                      ${isActive
                        ? 'text-white bg-green-700 shadow-md shadow-green-500/30'
                        : 'text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {/* The name is already translated via navItems array, so no need for t() here */}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Group 2: Actions - Search, Notifications, Profile/Auth */}
          <div className="flex items-center gap-3">

            {/* Search Bar (Desktop) */}
            <div className="hidden md:block relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // 💡 WRAPPED TEXT: Search produce...
                  placeholder={t('Search produce...')}
                  className="w-64 pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 transition-all duration-200"
                />
              </form>
            </div>
            
            {/* ----------------------------------------------------------- */}
            {/* 💡 NEW UI ELEMENT: Language Switcher Buttons (Desktop View) */}
            <div className="hidden lg:flex items-center gap-2">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => changeLanguage('en')}
                    className={`text-sm font-medium transition-colors ${i18n.language === 'en' ? 'text-green-700 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400'}`}
                >
                    EN
                </motion.button>
                <span className="text-gray-400 dark:text-gray-600">|</span>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => changeLanguage('kn')}
                    className={`text-sm font-medium transition-colors ${i18n.language === 'kn' ? 'text-green-700 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400'}`}
                >
                    ಕನ್ನಡ
                </motion.button>
            </div>
            {/* ----------------------------------------------------------- */}

            {/* Theme Toggle (Uses prop from App.jsx) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              // 💡 WRAPPED TEXT: Switch to light/dark mode
              title={t(`Switch to ${isDark ? 'light' : 'dark'} mode`)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 hidden md:block"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </motion.button>

            {/* Conditional rendering based on authentication state (using context) */}
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative dropdown" ref={notificationsDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </motion.button>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-gray-700 shadow-xl"
                    >
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {notifications.map(notification => (
                            <div
                              key={notification.id}
                              onClick={() => markNotificationAsRead(notification.id)}
                              className={`p-4 transition-colors ${!notification.read ? 'bg-lime-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'} hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer`}
                            >
                              <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {/* 💡 WRAPPED TEXT: Notification content */}
                                {t(notification.text)} 
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          {/* 💡 WRAPPED TEXT: No notifications yet */}
                          <p>{t('No notifications yet')}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Profile Avatar (Renders if isAuthenticated is true) */}
                <div className="relative dropdown" ref={profileDropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full bg-green-700 hover:bg-green-600 transition-colors focus:ring-2 focus:ring-green-500"
                  >
                    <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {/* Displays the first letter of the user's name or 'U' */}
                      {user?.avatar || user?.name?.charAt(0) || t('U')} 
                    </div>
                  </motion.button>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-gray-700 shadow-xl overflow-hidden"
                    >
                      <div className="p-4 bg-green-50 dark:bg-green-950">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center text-white font-bold">
                            {user?.avatar || user?.name?.charAt(0) || t('U')}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                            {/* 💡 WRAPPED TEXT: Role (e.g., 'farmer' or 'buyer') */}
                            <p className="text-green-700 dark:text-lime-300 text-sm capitalize">{t(user?.role)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        {/* 💡 WRAPPED TEXT: My Profile */}
                        <DropdownItem to="/profile" onClick={() => {}} icon={User}>{t('My Profile')}</DropdownItem>
                        {/* 💡 WRAPPED TEXT: Settings */}
                        <DropdownItem to="/settings" onClick={() => {}} icon={Settings}>{t('Settings')}</DropdownItem>
                        <hr className="my-2 border-gray-200 dark:border-gray-700" />
                        {/* 💡 WRAPPED TEXT: Sign Out */}
                        <DropdownItem to="#" onClick={handleLogout} icon={LogOut} isLogout={true}>{t('Sign Out')}</DropdownItem>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              /* Auth Buttons (Renders if isAuthenticated is false) */
              <div className="hidden lg:flex items-center gap-3">
                <button onClick={() => navigate('/login')} className="text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors px-4 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 font-medium">
                  {/* 💡 WRAPPED TEXT: Login */}
                  {t('Login')}
                </button>
                <button onClick={() => navigate('/signup')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md shadow-green-500/30">
                  {/* 💡 WRAPPED TEXT: Signup */}
                  {t('Signup')}
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-lime-400 transition-colors rounded-full hover:bg-green-100 dark:hover:bg-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 overflow-y-auto max-h-[calc(100vh-64px)]">
            {/* Mobile Search */}
            <div className="mb-4">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  // 💡 WRAPPED TEXT: Search produce...
                  placeholder={t('Search produce...')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-green-600 focus:outline-none"
                />
              </form>
            </div>
            
            {/* ----------------------------------------------------------- */}
            {/* 💡 NEW UI ELEMENT: Language Switcher Buttons (Mobile View) */}
            <div className="flex justify-center gap-4 py-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                    onClick={() => changeLanguage('en')}
                    className={`text-lg font-bold transition-colors ${i18n.language === 'en' ? 'text-green-700 dark:text-green-400 underline underline-offset-4' : 'text-gray-600 dark:text-gray-400 hover:text-green-700'}`}
                >
                    English
                </button>
                <span className="text-gray-400 dark:text-gray-600">|</span>
                <button
                    onClick={() => changeLanguage('kn')}
                    className={`text-lg font-bold transition-colors ${i18n.language === 'kn' ? 'text-green-700 dark:text-green-400 underline underline-offset-4' : 'text-gray-600 dark:text-gray-400 hover:text-green-700'}`}
                >
                    ಕನ್ನಡ
                </button>
            </div>
            {/* ----------------------------------------------------------- */}

            {/* Mobile Navigation */}
            <div className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                const linkProps = (item.isProtected && !isAuthenticated)
                  ? { to: '/login', onClick: handleProtectedNavigation }
                  : { to: item.href, onClick: () => setIsMenuOpen(false) };

                return (
                  <Link
                    key={index}
                    {...linkProps}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
                      ${isActive
                        ? 'text-white bg-green-700'
                        : 'text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {/* Name is already translated from navItems array */}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth */}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 space-y-2">
                <button onClick={() => {navigate('/login'); setIsMenuOpen(false);}} className="w-full block text-center py-3 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium rounded-lg">
                  {/* 💡 WRAPPED TEXT: Login */}
                  {t('Login')}
                </button>
                <button onClick={() => {navigate('/signup'); setIsMenuOpen(false);}} className="w-full block text-center bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                  {/* 💡 WRAPPED TEXT: Join Farm2Market */}
                  {t('Join Farm2Market')}
                </button>
              </div>
            )}
            
            {/* If authenticated, show mobile sign out */}
            {isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-bold">
                  <LogOut className="w-5 h-5" />
                  {/* 💡 WRAPPED TEXT: Sign Out */}
                  <span>{t('Sign Out')}</span>
                </button>
              </div>
            )}

          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;