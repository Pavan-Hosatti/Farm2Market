import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home, Users, Lightbulb, MessageCircle, User, Menu, X, Sun, Moon } from 'lucide-react';
import Header from './components/layout/Header'; // Ensure this path is correct

function App() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 1. Authentication state is now managed here
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 2. Handlers to change the authentication state
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Toggle theme function
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Apply theme class to html element
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Community', href: '/community', icon: MessageCircle },
    { name: 'Student Dashboard', href: '/student-dashboard', icon: Users },
    { name: 'Submit Idea', href: '/submit-idea', icon: Lightbulb },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Pass isAuthenticated and handleLogout to the Header */}
      <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="pt-0">
       
        <Outlet />
      </main>

     
    </div>
  );
}

export default App;
