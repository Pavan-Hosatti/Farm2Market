import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Award, ChevronRight, Play, ArrowRight, Briefcase, Volume2, VolumeX } from 'lucide-react';
import VoiceBot from '../components/Voicebot/VoiceBot';

// IMPORT FOR I18N
import { useTranslation } from 'react-i18next'; 

// IMPORT FOR TTS HOOK (Adjust path as necessary)
import useTextToSpeech from '../hooks/useTextToSpeech'; 

gsap.registerPlugin(ScrollTrigger);

const Farm2Market = () => {
  // HOOK FOR I18N
  const { t, i18n } = useTranslation(); 
  
  // NEW: Text-to-Speech Hook Integration
  // This ensures the hook is aware of the currently active language ('kn' or 'en')
  const currentLangCode = i18n.resolvedLanguage;
  const { speak, stop, isSupported } = useTextToSpeech(currentLangCode);
  const [isMuted, setIsMuted] = useState(false); // To manage a global Mute state

  const containerRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);

  // NEW: Function to handle double-click speech
  const handleDoubleClickSpeech = (text) => {
    // Only speak if TTS is supported and not globally muted
    if (isSupported && !isMuted) {
      stop(); // Stop current speech before starting a new one
      speak(text);
    } else if (isSupported && isMuted) {
        // Optionally give feedback if muted
        console.log("TTS is currently muted. Click the speaker icon to unmute.");
    } else {
        console.warn("Text-to-Speech not supported in this browser.");
    }
  };
  
  // NEW: Function to toggle mute
  const toggleMute = () => {
    if (!isMuted) {
      stop(); // Stop immediately if we are muting
    }
    setIsMuted(prev => !prev);
  };


  useEffect(() => {
    if (!containerRef.current) return;

    // Auto-play stages every 5 seconds
    const stageInterval = setInterval(() => {
      setActiveStage(prev => (prev + 1) % 5);
    }, 5000);

    // --- GSAP ANIMATION LOGIC (UNCHANGED) ---
    const fadeElements = containerRef.current.querySelectorAll('.fade-in');
    fadeElements.forEach((el, idx) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: idx * 0.15, ease: 'power2.out' }
      );
    });

    const heroImage = containerRef.current.querySelector('.hero-image');
    if (heroImage) {
      gsap.to(heroImage, {
        scrollTrigger: {
          trigger: heroImage,
          start: 'top center',
          end: 'bottom center',
          scrub: 0.5,
        },
        y: 50,
        ease: 'none',
      });
    }

    const cards = containerRef.current.querySelectorAll('.farmer-card');
    cards.forEach((card, idx) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 0.5,
          },
          opacity: 1,
          y: 0,
          ease: 'power2.out',
        }
      );
    });

    const ctaSection = containerRef.current.querySelector('.cta-section');
    if (ctaSection) {
      gsap.fromTo(
        ctaSection,
        { opacity: 0, scale: 0.95 },
        {
          scrollTrigger: {
            trigger: ctaSection,
            start: 'top 70%',
            end: 'top 40%',
            scrub: 0.5,
          },
          opacity: 1,
          scale: 1,
          ease: 'power2.out',
        }
      );
    }
    // --- END GSAP ANIMATION LOGIC ---


    return () => {
      clearInterval(stageInterval);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Data for the Stats section
  const stats = [
    { value: '10K+', label: t('Active Farmers') },
    { value: '2K+', label: t('Jobs Created') },
    { value: '500+', label: t('Successful Auctions') },
    { value: '24hr', label: t('Avg Delivery') }
  ];

  // Data for the How It Works section
  const howItWorks = [
    { 
      icon: '🌱', 
      title: t('Plant with Purpose'), 
      desc: t('IoT sensors monitor soil health, weather patterns, and crop vitals in real-time.') 
    },
    { 
      icon: '🎯', 
      title: t('Harvest with Precision'), 
      desc: t('Advanced AI analyzes every harvest for quality grades A through D.') 
    },
    { 
      icon: '🏆', 
      title: t('Bid for Excellence'), 
      desc: t('Enter transparent real-time auctions connecting your produce to buyers.') 
    },
    { 
      icon: '📦', 
      title: t('Deliver with Speed'), 
      desc: t('Smart logistics dispatch ensures 24-hour farm-fresh delivery nationwide.') 
    },
    { 
      icon: '💰', 
      title: t('Profit Fairly'), 
      desc: t('Earn 30-40% more by eliminating middlemen and connecting directly to buyers.') 
    }
  ];

  // Data for the Why Farmers Choose Us section
  const farmerFeatures = [
    { icon: '📊', title: t('Real-Time Data'), desc: t('Monitor crops 24/7 with AI-powered insights') },
    { icon: '🚀', title: t('Higher Profits'), desc: t('30-40% more earnings with direct buyer access') },
    { icon: '🤝', title: t('Fair Pricing'), desc: t('Transparent auctions ensure competitive rates') },
    { icon: '⚡', title: t('Fast Delivery'), desc: t('24-hour nationwide logistics network') },
    { icon: '🎓', title: t('Expert Support'), desc: t('Guidance for every step of your journey') },
    { icon: '🌍', title: t('Scale Globally'), desc: t('Connect to buyers across the nation') }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden">
      
      {/* HERO SECTION WITH IMAGE */}
      <section className="relative w-full h-screen flex items-center overflow-hidden">
        {/* Hero Image Background - Image element has no visible text */}
        <div className="hero-image absolute inset-0 w-full h-full top-0">
          <img
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=800&fit=crop"
            alt={t("Farm Technology")} // Alt text translated
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/75 via-slate-900/60 to-emerald-900/65" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 flex items-center h-full">
          <div className="max-w-3xl">
            
                {/* NEW: Mute/Unmute Button (Top Right of Hero) */}
                {isSupported && (
                    <motion.button
                        onClick={toggleMute}
                        // Positioned relative to the whole screen for better visibility and avoiding content overlap
                        className="fixed top-6 right-24 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition z-[100] border border-white/20"
                        title={isMuted ? t('Unmute TTS') : t('Mute TTS')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </motion.button>
                )}
            
            <motion.div
              className="fade-in inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 backdrop-blur-md border border-emerald-300/60 rounded-full text-emerald-100 text-sm font-medium mb-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('Revolutionizing Agricultural Trade'))} 
            >
              <Award className="w-4 h-4" />
              <span>{t('Revolutionizing Agricultural Trade')}</span>
              <ChevronRight className="w-4 h-4" />
            </motion.div>

            <motion.h1
              className="fade-in text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight drop-shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(`${t('Farm2Market')}. ${t('From Soil to Success')}`)} 
            >
              {t('Farm2Market')}
              <span className="block text-emerald-200">{t('From Soil to Success')}</span>
            </motion.h1>

            <motion.p
              className="fade-in text-xl md:text-2xl text-gray-50 mb-10 leading-relaxed font-medium max-w-2xl drop-shadow-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('Connecting farmers directly to buyers through AI-powered grading, real-time bidding, and smart logistics.'))} 
            >
              {t('Connecting farmers directly to buyers through AI-powered grading, real-time bidding, and smart logistics.')}
            </motion.p>

            <motion.div
              className="fade-in flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <button className="px-10 py-4 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition-all duration-300 flex items-center gap-2 text-lg hover:shadow-lg">
                {t('Explore Marketplace')}
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="px-10 py-4 border-2 border-emerald-200 text-white font-bold rounded-full hover:bg-white/20 transition-all flex items-center gap-2 text-lg">
                <Play className="w-5 h-5" /> {t('Watch Demo')}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

---

      {/* STATS SECTION - BELOW HERO */}
      <section className="relative py-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true }}
                // TTS double-click added (read only the label)
                onDoubleClick={() => handleDoubleClickSpeech(stat.label)} 
              >
                <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-lg text-gray-700 dark:text-gray-300 font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

---

      {/* HOW IT WORKS */}
      <section className="relative py-32 lg:py-40 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 
                className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-6"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(`${t('How')} Farm2Market ${t('Works')}`)} 
            >
              {t('How')} <span className="text-emerald-600 dark:text-emerald-400">Farm2Market</span> {t('Works')}
            </h2>
          </motion.div>

          <div className="flex gap-3 justify-center flex-wrap mb-16">
            {['01', '02', '03', '04', '05'].map((num, idx) => (
              <motion.button
                key={idx}
                onClick={() => setActiveStage(idx)}
                className={`px-6 py-3 rounded-full font-bold transition-all duration-300 ${
                  activeStage === idx
                    ? 'bg-emerald-600 text-white scale-110 shadow-lg'
                    : 'bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-emerald-700'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {num}
              </motion.button>
            ))}
          </div>

          <motion.div
            className="p-12 bg-white/80 dark:bg-slate-800/80 rounded-3xl border border-emerald-200 dark:border-emerald-700 backdrop-blur-sm"
            key={activeStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            // TTS double-click added (reads title and description)
            onDoubleClick={() => handleDoubleClickSpeech(`${howItWorks[activeStage].title}. ${howItWorks[activeStage].desc}`)} 
          >
            <div className="text-6xl mb-6">
              {howItWorks[activeStage].icon}
            </div>
            <h3 className="text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-4">
              {howItWorks[activeStage].title}
            </h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {howItWorks[activeStage].desc}
            </p>
          </motion.div>
        </div>
      </section>

---

      {/* WHY FARMERS CHOOSE US */}
      <section className="relative py-32 lg:py-40 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 
                className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white mb-6"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(`${t('Why')} ${t('Farmers Choose Us')}`)} 
            >
            {t('Why')} <span className="text-emerald-600 dark:text-emerald-400">{t('Farmers Choose Us')}</span>
          </h2>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {farmerFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                className="farmer-card p-8 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-lg backdrop-blur-sm"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                viewport={{ once: true, margin: '-100px' }}
                whileHover={{ y: -5 }}
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(`${feature.title}. ${feature.desc}`)}
              >
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

---

      {/* CTA SECTION */}
      <section className="relative py-40 lg:py-48 overflow-hidden bg-gradient-to-br from-emerald-600 to-green-600">
        {/* Background divs have no text */}

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center cta-section">
          <motion.h2
            className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            // TTS double-click added
            onDoubleClick={() => handleDoubleClickSpeech(t('Ready to Transform Agriculture?'))} 
          >
            {t('Ready to Transform Agriculture?')}
          </motion.h2>

          <motion.p
            className="text-2xl md:text-3xl text-white/90 mb-12 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            // TTS double-click added
            onDoubleClick={() => handleDoubleClickSpeech(t('Join thousands of farmers already earning fair prices and growing their futures.'))} 
          >
            {t('Join thousands of farmers already earning fair prices and growing their futures.')}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <button className="px-12 py-5 bg-white text-emerald-600 font-black text-lg rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
              {t('Get Started Now')}
            </button>
            
            <button className="px-12 py-5 border-3 border-white text-white font-black text-lg rounded-full hover:bg-white/20 transition-all flex items-center gap-2">
              <Briefcase className="w-5 h-5" /> {t('Partner with Us')}
            </button>
          </motion.div>
        </div>
      </section>

---

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 
                className="text-3xl font-black text-emerald-400 mb-4"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('Farm2Market'))} 
              >
                {t('Farm2Market')}
              </h3>
              <p 
                className="text-slate-400"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('From Farm to Family — Fairly & Transparently'))} 
              >
                {t('From Farm to Family — Fairly & Transparently')}
              </p>
            </div>
            <div>
              <h4 
                className="font-semibold text-white mb-4"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('Platform'))} 
              >
                {t('Platform')}
              </h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('How it Works'))}>{t('How it Works')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('For Farmers'))}>{t('For Farmers')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('For Buyers'))}>{t('For Buyers')}</a></li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-semibold text-white mb-4"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('Resources'))} 
              >
                {t('Resources')}
              </h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('Documentation'))}>{t('Documentation')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('Help Center'))}>{t('Help Center')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('Community'))}>{t('Community')}</a></li>
              </ul>
            </div>
            <div>
              <h4 
                className="font-semibold text-white mb-4"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('Company'))} 
              >
                {t('Company')}
              </h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('About Us'))}>{t('About Us')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('Careers'))}>{t('Careers')}</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition" onDoubleClick={() => handleDoubleClickSpeech(t('Contact'))}>{t('Contact')}</a></li>
              </ul>
            </div>
          </div>
          <div 
                className="border-t border-slate-700 pt-8 text-center text-slate-500 text-sm"
                // TTS double-click added
                onDoubleClick={() => handleDoubleClickSpeech(t('© 2025 Farm2Market. Built with heart for farmers everywhere.'))}
            >
            <p>{t('© 2025 Farm2Market. Built with ❤️ for farmers everywhere.')}</p>
          </div>
        </div>
      </footer>
      
      {/* VoiceBot Placement: 
        We put it outside the main flow to ensure it floats on top of all page content 
        and is placed nicely in the bottom right corner (the default position for floating bots).
      */}
      <VoiceBot />
    </div>
  );
};

export default Farm2Market;