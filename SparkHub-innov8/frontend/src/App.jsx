import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import VoiceBot from './components/Voicebot/VoiceBot'; // Add this import
import { AuthProvider } from './context/AuthContext';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }, [isDark]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
        
        <Header
          isDark={isDark}
          toggleTheme={toggleTheme}
        />

        <main className="pt-0">
          <Outlet />
        </main>

        {/* ✅ Add VoiceBot globally - will appear on all pages */}
        <VoiceBot />
        
      </div>
    </AuthProvider>
  );
}

export default App;
