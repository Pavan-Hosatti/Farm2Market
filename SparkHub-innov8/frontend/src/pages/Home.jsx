import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';



// Custom CSS for animations and proper styling
const customStyles = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulse-glow {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0px rgba(34, 197, 94, 0.5);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.2);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0px rgba(34, 197, 94, 0.5);
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 6s ease infinite;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .btn-shimmer {
    position: relative;
    overflow: hidden;
  }

  .btn-shimmer:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .btn-shimmer:hover:before {
    left: 100%;
  }
`;

// Helper function to get SVG icons
const getIcon = (name) => {
  const icons = {
    ArrowRight: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
    Leaf: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>
    ),
    Users: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    Target: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    Star: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    TrendingUp: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 12 14 6 20" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    Zap: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    ChevronRight: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    ),
    Play: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    CheckCircle: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-8.68" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
    BarChart: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    Heart: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    Award: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="m9 12 2 2 4-4" />
        <path d="M21 12c.5 2.5-1.5 4.5-4 4.5-1 0-2-.5-2.5-1.5-.5 1-1.5 1.5-2.5 1.5s-2-.5-2.5-1.5c-.5 1-1.5 1.5-2.5 1.5-2.5 0-4.5-2-4-4.5" />
      </svg>
    ),
    Truck: (props) => (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624L20.3 11.4a1 1 0 0 0-.78-.4h-2.5" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    )
  };
  return icons[name];
};

// Button Component
const Button = ({ size, variant, className, rightIcon, leftIcon, children, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 transform hover:scale-105';
  
  const sizeClasses = {
    xl: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 shadow-lg hover:shadow-xl',
    ghost: 'bg-transparent text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300',
    outline: 'bg-transparent text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-green-500 dark:hover:border-green-400'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size] || ''} ${variantClasses[variant] || ''} ${className || ''}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

// Card Component
const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Main Home Component
const Home = ({ setCurrentPage }) => {
  const ArrowRight = getIcon('ArrowRight');
  const Leaf = getIcon('Leaf');
  const Users = getIcon('Users');
  const Target = getIcon('Target');
  const Star = getIcon('Star');
  const TrendingUp = getIcon('TrendingUp');
  const Zap = getIcon('Zap');
  const ChevronRight = getIcon('ChevronRight');
  const Play = getIcon('Play');
  const CheckCircle = getIcon('CheckCircle');
  const BarChart = getIcon('BarChart');
  const Heart = getIcon('Heart');
  const Award = getIcon('Award');
  const Truck = getIcon('Truck');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <style>{customStyles}</style>
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-blue-100/20 to-green-100/20 dark:from-green-900/10 dark:via-blue-900/10 dark:to-green-900/10" />
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-green-400/10 dark:bg-green-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}} />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-16 h-16 rounded-full border-2 border-green-300/30 dark:border-green-500/30 animate-float" />
        <div className="absolute bottom-40 right-32 w-24 h-24 rounded-xl border-2 border-blue-300/30 dark:border-blue-500/30 animate-float" style={{animationDelay: '2s'}} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-8 shadow-sm">
              <Award className="w-4 h-4" />
              <span>Revolutionizing Agricultural Trade</span>
              <ChevronRight className="w-4 h-4" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Farm2Market:
              <span className="block bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                Farm to Market Revolution
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-200 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
              Connecting farmers directly to buyers through AI-powered grading, real-time bidding, and smart logistics. Creating jobs while ensuring fair prices for quality produce.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button 
                onClick={() => setCurrentPage && setCurrentPage('marketplace')}
                size="xl" 
                variant="primary"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="px-8 py-4 text-lg btn-shimmer"
              >
                Explore Marketplace
              </Button>
              <Button 
                onClick={() => setCurrentPage && setCurrentPage('demo')}
                size="xl" 
                variant="outline"
                leftIcon={<Play className="w-5 h-5" />}
                className="px-8 py-4 text-lg"
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { value: '10K+', label: 'Active Farmers', icon: Users },
                { value: '2K+', label: 'Jobs Created', icon: Star },
                { value: '500+', label: 'Partner Shops', icon: Target },
                { value: '24hr', label: 'Avg Delivery', icon: Truck }
              ].map((stat, index) => (
                <Card 
                  key={index}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-3 text-green-600 dark:text-green-400">
                      {React.createElement(stat.icon, { className: "w-8 h-8" })}
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-medium text-center">
                      {stat.label}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-green-300 dark:via-green-700 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>How Farm2Market Works</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Transforming agriculture with{' '}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                technology & community
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-200 max-w-3xl mx-auto">
              Our platform connects every stakeholder in the agricultural value chain, ensuring fair prices and creating opportunities.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: 'Target', 
                title: 'Local Collection', 
                description: 'Farmers bring produce to nearby Kirana shops, making the process accessible and convenient for rural communities.',
                gradient: 'from-green-400 to-emerald-500'
              },
              { 
                icon: 'Zap', 
                title: 'AI Quality Grading', 
                description: 'Advanced AI analyzes produce photos and assigns accurate grades (A, B, C, D) ensuring consistent quality standards.',
                gradient: 'from-blue-400 to-indigo-500'
              },
              { 
                icon: 'TrendingUp', 
                title: 'Live Market Bidding', 
                description: 'Graded produce enters a transparent, real-time bidding platform connecting farmers to buyers nationwide.',
                gradient: 'from-purple-400 to-pink-500'
              },
              { 
                icon: 'Users', 
                title: 'Youth Employment', 
                description: 'Unemployed youth become certified agents, earning commissions while helping farmers navigate the digital marketplace.',
                gradient: 'from-orange-400 to-red-500'
              },
              { 
                icon: 'Truck', 
                title: 'Smart Logistics', 
                description: 'Automated dispatch system connects buyers with local transporters for efficient 24-hour delivery nationwide.',
                gradient: 'from-teal-400 to-cyan-500'
              },
              { 
                icon: 'Heart', 
                title: 'Shared Success', 
                description: 'Everyone wins: farmers get fair prices, youth find employment, shops earn commissions, and buyers get quality produce.',
                gradient: 'from-rose-400 to-pink-500'
              }
            ].map((feature, index) => {
              const IconComponent = getIcon(feature.icon);
              return (
                <Card 
                  key={index}
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group cursor-pointer"
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-0.5 mb-6 group-hover:animate-pulse-glow`}>
                    <div className="w-full h-full bg-white/90 dark:bg-slate-900/90 rounded-2xl flex items-center justify-center">
                      <IconComponent className="w-7 h-7 text-gray-800 dark:text-white" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    <span className="mr-2">Learn more</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative bg-gradient-to-b from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-300 dark:via-green-700 to-transparent" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 md:p-16 rounded-3xl border border-gray-200/50 dark:border-slate-700/50 shadow-2xl overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-400/10 dark:bg-green-900/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
                <CheckCircle className="w-4 h-4" />
                <span>Join the Agricultural Revolution</span>
              </div>
              
              {/* Heading */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to transform
                <span className="block bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
                  agriculture together?
                </span>
              </h2>
              
              {/* Description */}
              <p className="text-lg text-gray-600 dark:text-gray-200 mb-10 max-w-2xl mx-auto">
                Whether you're a farmer seeking fair prices, a youth looking for opportunities, or a business wanting quality produce, AgriConnect has a place for you.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setCurrentPage && setCurrentPage('register')}
                  size="xl" 
                  variant="primary"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="px-10 py-4 text-lg btn-shimmer"
                >
                  Get Started Today
                </Button>
                <Button 
                  onClick={() => setCurrentPage && setCurrentPage('contact')}
                  size="xl" 
                  variant="outline"
                  className="px-10 py-4 text-lg"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </Card>
        </div>
        
      </section>
 {/* Detailed Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
        {/* Stats Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Farmers Empowered', value: '50,000+', icon: Users },
                { label: 'Kirana Partners', value: '5,000+', icon: Users },
                { label: 'Successful Bids', value: '20,000+', icon: Lightbulb },
                { label: 'Communities Impacted', value: '1,000+', icon: MessageCircle }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <stat.icon className="w-8 h-8 text-blue-500 dark:text-blue-400 transition-colors duration-200" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-200 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 transition-colors duration-200 text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">F</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Farm2Market</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200 mb-6 leading-relaxed">
                  Building a transparent agricultural marketplace where farmers, kirana shops, youth, and transporters 
                  collaborate to ensure crops reach customers within 24 hours — with fairness, dignity, and zero waste.
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200 mb-4">
                  <strong className="text-blue-500 dark:text-blue-400 transition-colors duration-200">From Farm to Family — Fairly & Transparently</strong>
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="mb-6">
                <h4 className="text-gray-900 dark:text-white transition-colors duration-200 font-semibold mb-3">Stay Updated</h4>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm transition-colors duration-200"
                  />
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium">
                    Subscribe
                  </button>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-gray-900 dark:text-white transition-colors duration-200 font-semibold mb-3">Follow Us</h4>
                <div className="flex gap-3">
                  <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition-colors duration-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition-colors duration-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition-colors duration-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition-colors duration-200">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.747 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.012.001z.005-.001z"/></svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="lg:col-span-1">
              <h4 className="text-gray-900 dark:text-white transition-colors duration-200 font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/how-it-works" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">How it Works</Link></li>
                <li><Link to="/farmers" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">For Farmers</Link></li>
                <li><Link to="/kirana" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">For Kirana Shops</Link></li>
                <li><Link to="/youth" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">For Youth Partners</Link></li>
                <li><Link to="/transport" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">For Transporters</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-gray-900 dark:text-white transition-colors duration-200 font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/docs" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Documentation</Link></li>
                <li><Link to="/help" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Help Center</Link></li>
                <li><Link to="/community" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Community</Link></li>
                <li><Link to="/blog" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Stories from the Field</Link></li>
                <li><Link to="/api" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">API Reference</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-gray-900 dark:text-white transition-colors duration-200 font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">About Us</Link></li>
                <li><Link to="/careers" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Careers</Link></li>
                <li><Link to="/press" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Press</Link></li>
                <li><Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Contact</Link></li>
                <li><Link to="/partners" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Partners</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h4 className="text-gray-900 dark:text-white transition-colors duration-200 font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Terms of Service</Link></li>
                <li><Link to="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Cookie Policy</Link></li>
                <li><Link to="/conduct" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 text-sm block py-1">Code of Conduct</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-12 transition-colors duration-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 transition-colors duration-200 text-sm">
                <span>&copy; 2025 AgriConnect. All rights reserved.</span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1">
                  Built with ❤️ for farmers by CodeScripters.
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      
    </div>

    




  );
};

export default Home;