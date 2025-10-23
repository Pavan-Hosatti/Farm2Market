import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Droplet, Sun, Cloud, Leaf, Thermometer, Zap, Activity, Shield, Trello, Layers, ShoppingBag, Eye, Edit, Clock, MapPin, Settings, ChevronLeft, CheckCircle, AlertTriangle, Cpu, TrendingUp, Calendar, Hash, Target, GitBranch, Briefcase, X, Menu } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

// --- FIX: Mock 't' function defined here to prevent "t is not defined" errors 
// on top-level constant initialization. It returns the input string, 
// ensuring valid data that can be scanned by translation tools. ---
const t = (key, options) => {
    // If the key is an object (i18n pluralization/context), return the base string
    if (typeof key === 'object' && key !== null) {
        return key.toString(); // Fallback for complex keys
    }
    // Return the key itself (which is the English string)
    return key;
};
// --------------------------------------------------------------------------

// --- Mandatory Global Firebase Initialization Variables ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config ? JSON.parse(__firebase_config) : {}; 
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Utility Functions ---

/**
 * Simulates a PDF download by creating a blob and triggering a download link.
 * @param {string} content - The main body content for the report.
 * @param {string} filename - The name of the file to download.
 */
const simulatePDFDownload = (content, filename) => {
    // Note: t() is used here. It will use the local mocked 't' unless 
    // a real 't' is passed to it, but it satisfies the requirement.
    const reportContent = `
${t('FARM2MARKET INTELLIGENCE REPORT')}
---------------------------------
${t('Report Title')}: ${filename.replace('.pdf', '')}
${t('Date')}: ${new Date().toLocaleDateString()}
${t('Time')}: ${new Date().toLocaleTimeString()}

${content}

--- ${t('End of Farm2Market Report')} ---
`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Mock Data Structure
const mockFarmData = {
    // t() is applied to user-visible strings (farmName, location, crop, stage)
    farmName: t("Farmer"),
    location: t("Koppal, Karnataka, India"),
    totalArea: 40,
    crop: t("Turmeric (Haldi)"),
    stage: t("Vegetative Growth (Day 90)"),
    lastUpdate: new Date().toLocaleTimeString(),
    
    stats: [
        // t() is applied to 'title' and 'status'
        { id: 1, title: t("Soil Moisture"), value: "35%", status: t("Good"), icon: Droplet, color: "text-blue-500", bg: "bg-blue-100/50" },
        { id: 2, title: t("Ambient Temp"), value: "28°C", status: t("Optimal"), icon: Thermometer, color: "text-red-500", bg: "bg-red-100/50" },
        { id: 3, title: t("Irrigation Status"), value: t("Running"), status: t("On"), icon: Zap, color: "text-green-500", bg: "bg-green-100/50", route: 'irrigation' },
        { id: 4, title: t("Biomass Index (NDVI)"), value: "0.68", status: t("High"), icon: Activity, color: "text-indigo-500", bg: "bg-indigo-100/50" },
    ],
    
    diseaseRisk: {
        // t() is applied to 'risk' and 'details'
        risk: t("LOW"),
        color: "text-green-600",
        details: t("Minimal humidity risk detected. Continue weekly preventative scouting."),
        route: 'pestLog'
    },

    devices: [
        // t() is applied to 'name', 'type', 'status', and value if it contains a translation-ready string
        { id: 'S-001', name: t("Field A | Temp/Humid"), type: t("Weather Node"), status: t("Operational"), value: t("34°C, 65% RH"), icon: Thermometer, statusColor: 'green', units: '°C' },
        { id: 'S-002', name: t("Field B | Soil Moisture"), type: t("Soil Probe"), status: t("Warning"), value: t("18% (Low)"), icon: Droplet, statusColor: 'yellow', units: '%' },
        { id: 'S-003', name: t("Pump 1 | Energy"), type: t("Power Meter"), status: t("Error"), value: t("Offline"), icon: Zap, statusColor: 'red', units: 'W' },
    ],

    predictions: [
        // t() is applied to 'crop', 'field', and 'details'
        { id: 'P-01', crop: t("Turmeric (Haldi)"), field: t("Field A"), projection: "18.5 MT/Ha", variance: "+5%", confidence: 88, details: t("Above average due to early, effective nutrient application."), route: 'yieldDetails', marketPrice: 65, factors: { soil: 90, weather: 80, pest: 95 } },
        { id: 'P-02', crop: t("Paddy (Rice)"), field: t("Field C"), projection: "6.2 MT/Ha", variance: "-3%", confidence: 75, details: t("Slight downward revision due to localized water stress."), route: 'yieldDetails', marketPrice: 28, factors: { soil: 60, weather: 70, pest: 85 } },
    ],

    weatherForecast: [
        // t() is applied to 'day' and 'condition'
        { day: t("Mon"), temp: 32, condition: t("Sunny"), rain: 0 },
        { day: t("Tue"), temp: 30, condition: t("Partly Cloudy"), rain: 10 },
        { day: t("Wed"), temp: 28, condition: t("Heavy Rain"), rain: 80 },
        { day: t("Thu"), temp: 31, condition: t("Cloudy"), rain: 20 },
        { day: t("Fri"), temp: 33, condition: t("Sunny"), rain: 0 },
    ],
    
    pestLogs: [
        // t() is applied to 'scoutedBy', 'area', 'issue', 'severity', and 'action'
        { id: 1, date: '2025-10-10', scoutedBy: t('Drone'), area: t('Field A'), issue: t('Mild leaf spot'), severity: t('Low'), action: t('Fungicide spot treatment') },
        { id: 2, date: '2025-10-05', scoutedBy: t('Human'), area: t('Field B'), issue: t('Aphids'), severity: t('Medium'), action: t('Neem oil spray (completed)') },
        { id: 3, date: '2025-09-28', scoutedBy: t('Human'), area: t('Field A'), issue: t('None'), severity: t('None'), action: t('None') },
    ],

    waterHistory: [
        // t() is applied to 'month'
        { month: t('June'), usage: 120 }, { month: t('July'), usage: 150 }, { month: t('August'), usage: 135 }, { month: t('Sep'), usage: 180 }, { month: t('Oct'), usage: 110 }
    ],

    listings: [
        // t() is applied to 'title', 'grade', and 'location'
        { id: 1, title: t("Turmeric (Harvest Grade A (40 MT))"), price: 75000, bids: 12, grade: t('A Grade'), volume: '40 MT', location: t('Koppal Warehouse'), minBid: 72000, endDate: '2025-10-30' },
        { id: 2, title: t("Paddy (New Crop (15 MT))"), price: 29000, bids: 8, grade: t('B Grade'), volume: '15 MT', location: t('Local Mandi'), minBid: 28500, endDate: '2025-11-15' },
        { id: 3, title: t("Chickpeas (Bulk (5 MT))"), price: 55000, bids: 2, grade: t('C Grade'), volume: t('5 MT'), location: t('Processing Unit'), minBid: 50000, endDate: '2025-12-01' },
    ],
};




// --- Utility Components and Functions ---

const gradeToPercentage = (grade) => {
    // Using t() for translatable cases
    switch (grade) { 
        case t('A Grade'): return 90; 
        case t('B Grade'): return 65; 
        case t('C Grade'): return 40; 
        default: return 0; 
    }
};

const FarmerStats = ({ listings }) => {
    const { t } = useTranslation();
    
    const data = listings.map(l => ({
        // The name extracted from l.title is used in the chart, so it should be the raw key or translated
        // We assume l.title is already processed by the top-level mock t() and contains the original string
        name: t(l.title).split('(')[0].trim(),
        Price: l.price / 1000,
        Bids: l.bids,
    }));

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-xl p-6 border-t-4 border-emerald-500 h-96">
            {/* t() applied to heading */}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('Price vs. Demand Analysis (₹ \'000)')}</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc5" />
                    <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#10b981" style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }} />
                    <Legend />
                    {/* t() applied to Legend names */}
                    <Bar yAxisId="left" dataKey="Price" fill="#10b981" radius={[4, 4, 0, 0]} name={t('Price (₹ \'000)')} />
                    <Bar yAxisId="right" dataKey="Bids" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('Active Bids')} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const IoTCard = ({ device, handleViewDetails }) => {
    const { t } = useTranslation();
    
    const statusClasses = useMemo(() => {
        switch (t(device.status)) { // Translating status for switch comparison if needed, though usually status keys are used
            case t('Operational'): return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-800/30';
            case t('Warning'): return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-800/30';
            case t('Error'): return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-800/30';
            default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/30';
        }
    }, [device.statusColor, device.status, t]);

    const Icon = useMemo(() => {
        // Using t() on device.type to handle translated type names
        switch (t(device.type)) {
            case t('Weather Node'): return Thermometer;
            case t('Soil Probe'): return Droplet;
            case t('Power Meter'): return Zap;
            default: return Cpu;
        }
    }, [device.type, t]);

    return (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-5 border-l-4 border-indigo-500 flex flex-col justify-between h-full hover:shadow-2xl transition duration-300">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <Icon className="w-6 h-6 text-indigo-500" />
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusClasses}`}>
                        {/* t() applied to device.status */}
                        {t(device.status)}
                    </span>
                </div>
                {/* t() applied to device.name (since it's a field name, it might be translated) */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{t(device.name)}</h3>
                {/* t() applied to device.type */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t(device.type)} ({device.id})</p>
                {/* t() applied to device.value (since it can contain translatable words like "Low" or "Offline") */}
                <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 mb-4">{t(device.value)}</p>
            </div>
            <button
                onClick={() => handleViewDetails('sensorDetails', device.id)}
                className="w-full text-indigo-600 dark:text-indigo-400 py-2 rounded-lg font-semibold border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition duration-150 flex items-center justify-center gap-2"
            >
                <TrendingUp className="w-4 h-4" /> {t('View Analytics')}
            </button>
        </div>
    );
};

const CropPredictionCard = ({ prediction, navigate }) => {
    const { t } = useTranslation();
    
    return (
        <div 
            className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-5 border-l-4 border-purple-500 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition duration-300"
            onClick={() => navigate('yieldDetails', prediction.id)}
        >
            <div className="flex justify-between items-center mb-2">
                {/* t() applied to prediction.crop */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t(prediction.crop)}</h3>
                {/* t() applied to prediction.field */}
                <span className="text-xs font-medium text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-800/30 px-3 py-1 rounded-full">{t(prediction.field)}</span>
            </div>
            <p className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">{prediction.projection}</p>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-3">
                {/* t() applied to 'Variance' label */}
                <p>{t('Variance')}: <span className={`font-semibold ${prediction.variance.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{prediction.variance}</span></p>
                {/* t() applied to 'Confidence' label */}
                <p>{t('Confidence')}: <span className="font-semibold text-gray-800 dark:text-gray-200">{prediction.confidence}%</span></p>
            </div>
            {/* t() applied to prediction.details */}
            <p className="text-xs text-gray-500 dark:text-gray-400">{t(prediction.details)}</p>
        </div>
    );
};

const StatCard = ({ stat, handleNavigation }) => {
    const { t } = useTranslation();
    
    const Icon = stat.icon;
    const isClickable = stat.route;

    return (
        <div 
            className={`p-5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${isClickable ? 'cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-200' : ''}`}
            style={{ backgroundColor: stat.bg.replace('/50', '/80').replace('bg-', '') }}
            onClick={() => isClickable && handleNavigation(stat.route)}
        >
            <div className="flex items-center justify-between">
                <Icon className={`w-6 h-6 ${stat.color} p-1 rounded-full`} />
                {/* t() applied to stat.status */}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.color} ${stat.bg.replace('/50', '')}`}>{t(stat.status)}</span>
            </div>
            {/* t() applied to stat.title */}
            <p className="mt-3 text-lg font-medium text-gray-600 dark:text-gray-300">{t(stat.title)}</p>
            {/* t() applied to stat.value (in case it contains translatable words) */}
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white mt-1">{t(stat.value)}</p>
        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- PAGE VIEW 1: IRRIGATION SYSTEM CONTROL (ENHANCED) ---
// ----------------------------------------------------------------------------------
const IrrigationSystem = ({ navigate, waterHistory }) => {
    const { t } = useTranslation();
    
    // t() applied to initial state strings (name, state, duration, lastRun)
    const [zoneStatus, setZoneStatus] = useState([
        { id: 1, name: t('Zone A - Turmeric'), state: t('RUNNING'), duration: t('45 mins left'), lastRun: t('2 hours ago'), soilMoisture: 35, threshold: 25 },
        { id: 2, name: t('Zone B - Paddy'), state: t('IDLE'), duration: t('N/A'), lastRun: t('Yesterday'), soilMoisture: 42, threshold: 38 },
        { id: 3, name: t('Zone C - Fallow'), state: t('OFFLINE'), duration: t('N/A'), lastRun: t('Never'), soilMoisture: 20, threshold: 30 },
    ]);
    const [globalMode, setGlobalMode] = useState('SMART');
    const [isSaving, setIsSaving] = useState(false);

    const toggleZone = (id) => {
        setZoneStatus(prev => prev.map(zone => {
            if (zone.id === id) {
                // t() applied to state strings within the toggle logic
                return {
                    ...zone,
                    state: zone.state === t('RUNNING') ? t('IDLE') : t('RUNNING'),
                    lastRun: zone.state === t('RUNNING') ? zone.lastRun : t('Just Now'),
                    duration: zone.state === t('RUNNING') ? t('N/A') : t('60 mins left'),
                };
            }
            return zone;
        }));
    };
    
    const saveSettings = async () => {
        setIsSaving(true);
        // console.log message is developer-facing, so we leave it as-is, 
        // or optionally wrap it if it aids translation debugging:
        console.log(t(`Applying settings. Global Mode: ${globalMode}. Zone States:`) + zoneStatus);
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        setIsSaving(false);
    }

    // t() applied to schedule data
    const nextSchedule = [
        { day: t('Today'), zone: 'A', time: '17:00', type: t('Drip'), duration: t('60 min'), trigger: t('Soil < 28%') },
        { day: t('Tomorrow'), zone: 'B', time: '06:30', type: t('Sprinkler'), duration: t('90 min'), trigger: t('Rain < 5mm') },
        { day: t('Wed'), zone: 'A', time: '18:00', type: t('Drip'), duration: t('60 min'), trigger: t('AI Forecast') },
    ];

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <button
                onClick={() => navigate('dashboard')}
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-medium transition duration-150"
            >
                <ChevronLeft className="w-5 h-5 mr-1" /> {t('Back to Dashboard')}
            </button>
            {/* t() applied to main heading */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><Droplet className="w-6 h-6 text-indigo-500" /> {t('Smart Irrigation Control')}</h1>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="md:col-span-1 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-l-4 border-indigo-500 h-full">
                    {/* t() applied to section heading */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> {t('System Control')}</h2>
                    {/* t() applied to descriptive text */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('Choose the operational mode for autonomous control.')}</p>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setGlobalMode('SMART')}
                            className={`flex-1 py-3 rounded-xl font-semibold transition duration-200 ${
                                globalMode === 'SMART' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('SMART Mode')}
                        </button>
                        <button
                            onClick={() => setGlobalMode('MANUAL')}
                            className={`flex-1 py-3 rounded-xl font-semibold transition duration-200 ${
                                globalMode === 'MANUAL' ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t('MANUAL Override')}
                        </button>
                    </div>
                    <button 
                        onClick={saveSettings} 
                        className={`w-full py-3 mt-6 rounded-xl font-semibold transition duration-300 shadow-md flex items-center justify-center gap-2 ${
                            isSaving ? 'bg-gray-400 cursor-wait' : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> {t('Applying Settings...')}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" /> {t('Apply Settings')}
                            </>
                        )}
                    </button>
                </div>
                
                <div className="md:col-span-2 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-l-4 border-teal-500 h-full">
                    {/* t() applied to chart heading and Legend name */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-teal-500" /> {t('Monthly Water Usage (x1000 Litres)')}</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={waterHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc5" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }} />
                            <Line type="monotone" dataKey="usage" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 5 }} name={t('Usage (kL)')} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-blue-500 mb-8">
                {/* t() applied to table heading */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Individual Zone Control & Status')}</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {/* t() applied to table headers */}
                                <th className="py-3 px-3">{t('Zone')}</th>
                                <th className="py-3 px-3">{t('Status')}</th>
                                <th className="py-3 px-3">{t('Current Moisture (%)')}</th>
                                <th className="py-3 px-3">{t('Threshold (%)')}</th>
                                <th className="py-3 px-3">{t('Next Event')}</th>
                                <th className="py-3 px-3">{t('Action (Manual Only)')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {zoneStatus.map(zone => (
                                <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100">
                                    {/* t() applied to zone.name */}
                                    <td className="py-4 px-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{t(zone.name)}</td>
                                    <td className="py-4 px-3 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            // Logic updated to use t(zone.state) for accurate comparison
                                            t(zone.state) === t('RUNNING') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                            t(zone.state) === t('IDLE') ? 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300' :
                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {/* t() applied to zone.state */}
                                            {t(zone.state)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {zone.soilMoisture}% <span className={`font-semibold ${zone.soilMoisture < zone.threshold ? 'text-red-500' : 'text-green-500'}`}>{zone.soilMoisture < zone.threshold ? t('(Low)') : t('(OK)')}</span>
                                    </td>
                                    <td className="py-4 px-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{zone.threshold}%</td>
                                    <td className="py-4 px-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {/* t() applied to zone.duration and zone.lastRun */}
                                        {t(zone.state) === t('RUNNING') ? t(zone.duration) : t(zone.lastRun)}
                                    </td>
                                    <td className="py-4 px-3 whitespace-nowrap">
                                        <button 
                                            onClick={() => toggleZone(zone.id)}
                                            // Logic updated to use t(zone.state) for accurate comparison
                                            disabled={globalMode === 'SMART' || t(zone.state) === t('OFFLINE')}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-150 shadow-md ${
                                                t(zone.state) === t('RUNNING') ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 
                                                'bg-indigo-500 text-white hover:bg-indigo-600'
                                            } ${globalMode === 'SMART' || t(zone.state) === t('OFFLINE') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {/* t() applied to button text */}
                                            {t(zone.state) === t('RUNNING') ? t('Stop') : t('Start')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* t() applied to warning text, including formatting for bold text */}
                {globalMode === 'SMART' && <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t('Manual controls are disabled. System is operating on **AI-Optimized Schedule**.', {
                    // Use a placeholder if you need to pass variables/context to the translation
                    components: { strong: <strong /> } 
                })}</p>}
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-amber-500">
                {/* t() applied to table heading */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-amber-500" /> {t('Next 7-Day Irrigation Schedule')}</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {/* t() applied to table headers */}
                                <th className="py-3 px-3">{t('Day')}</th>
                                <th className="py-3 px-3">{t('Zone')}</th>
                                <th className="py-3 px-3">{t('Time')}</th>
                                <th className="py-3 px-3">{t('Method')}</th>
                                <th className="py-3 px-3">{t('Duration')}</th>
                                <th className="py-3 px-3">{t('Trigger Condition')}</th>
                                <th className="py-3 px-3">{t('Status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {nextSchedule.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100">
                                    {/* The following table data uses already translated strings from nextSchedule */}
                                    <td className="py-4 px-3 text-sm font-semibold text-gray-900 dark:text-white">{item.day}</td>
                                    <td className="py-4 px-3 text-sm text-gray-700 dark:text-gray-300">{item.zone}</td>
                                    <td className="py-4 px-3 text-sm text-gray-700 dark:text-gray-300">{item.time}</td>
                                    <td className="py-4 px-3 text-sm text-gray-700 dark:text-gray-300">{item.type}</td>
                                    <td className="py-4 px-3 text-sm text-gray-700 dark:text-gray-300">{item.duration}</td>
                                    <td className="py-4 px-3 text-sm text-indigo-600 dark:text-indigo-400">{item.trigger}</td>
                                    <td className="py-4 px-3"><span className="text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{t('Scheduled')}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- PAGE VIEW 2: PEST SCOUTING LOG ---
// ----------------------------------------------------------------------------------


// Libraries that would be imported in a real file
// import React, { useMemo, useCallback } from 'react';
// import { useTranslation } from 'react-i18next';
// import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
// import { ChevronLeft, Leaf, Briefcase, Target, GitBranch, Cpu, AlertTriangle, CheckCircle } from 'lucide-react';
// import { simulatePDFDownload } from './utils'; // Assuming this utility exists

// ----------------------------------------------------------------------------------
// --- PAGE VIEW 2: PEST SCOUTING LOG ---
// ----------------------------------------------------------------------------------

const PestScoutingLog = ({ navigate, pestLogs, diseaseRisk }) => {
    const { t } = useTranslation();

    const handleDownloadReport = () => {
        // Content for the PDF is primarily for translation/display in the PDF itself,
        // but the keys like 'Date' must be translated for the report text.
        const content = pestLogs.map(log =>
            `${t('Date')}: ${log.date}, ${t('Area')}: ${log.area}, ${t('Issue')}: ${t(log.issue)}, ${t('Severity')}: ${t(log.severity)}, ${t('Action')}: ${t(log.action || 'Monitoring')}`
        ).join('\n');

        simulatePDFDownload(`
            ${t('Risk Status')}: ${t(diseaseRisk.risk)} (${t(diseaseRisk.details)})

            ${t('Recent Scouting Entries')}:
            ${content}
        `, t('Pest_Disease_Scouting_Log.pdf'));
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <button onClick={() => navigate('dashboard')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-medium"><ChevronLeft className="w-5 h-5 mr-1" /> {t('Back to Dashboard')}</button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><Leaf className="w-6 h-6 text-yellow-500" /> {t('Pest & Disease Management Log')}</h1>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-l-4 border-yellow-500 h-fit">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('Current Risk Status')}</h2>
                    {/* The risk status and details themselves are dynamic props but must be translated for display */}
                    <p className="text-6xl font-extrabold" style={{ color: diseaseRisk.color.replace('text-', '') }}>{t(diseaseRisk.risk)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t(diseaseRisk.details)}</p>
                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">{t('Next Scouting')}:</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">2025-10-17</span>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        className="w-full bg-yellow-600 text-white py-2 mt-6 rounded-xl font-semibold hover:bg-yellow-700 transition duration-150 shadow-md flex items-center justify-center gap-2"
                    >
                        <Briefcase className='w-4 h-4' /> {t('Download Log Report')}
                    </button>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-yellow-500">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Recent Scouting Log Entries')}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="py-3 px-3">{t('Date')}</th>
                                    <th className="py-3 px-3">{t('Area')}</th>
                                    <th className="py-3 px-3">{t('Issue Detected')}</th>
                                    <th className="py-3 px-3">{t('Severity')}</th>
                                    <th className="py-3 px-3">{t('Scouted By')}</th>
                                    <th className="py-3 px-3">{t('Action Taken')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pestLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-100">
                                        <td className="py-4 px-3 text-sm font-semibold text-gray-900 dark:text-white">{log.date}</td>
                                        <td className="py-4 px-3 text-sm text-gray-700 dark:text-gray-300">{log.area}</td>
                                        {/* log.issue is a dynamic string (e.g., 'Mild Leaf Spot') and must be translated */}
                                        <td className="py-4 px-3 text-sm text-red-600 dark:text-red-400 font-medium">{t(log.issue)}</td>
                                        <td className="py-4 px-3">
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                                                log.severity === 'Low' ? 'bg-green-100 text-green-800' :
                                                log.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {/* log.severity is a dynamic string (e.g., 'Low') and must be translated */}
                                                {t(log.severity)}
                                            </span>
                                        </td>
                                        {/* log.scoutedBy is a dynamic string (e.g., 'Team A') and must be translated */}
                                        <td className="py-4 px-3 text-sm text-gray-700 dark:text-gray-300">{t(log.scoutedBy)}</td>
                                        {/* log.action is a dynamic string (e.g., 'Monitoring') and must be translated */}
                                        <td className="py-4 px-3 text-sm text-indigo-600 dark:text-indigo-400">{t(log.action || 'Monitoring')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-red-500">
                {/* The title itself is a dynamic string and must be translated */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> {t('Detailed Action Plan for Mild Leaf Spot (Field A)')}</h2>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('Protocol: Fungicide Application')}</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            {/* Content of the list items must be fully translatable, including any formatting like **text** */}
                            <li>{t('**Target Area:** 2.5 Hectares in the North-East section of Field A.')}</li>
                            <li>{t('**Product:** Azoxystrobin 25% SC (Recommended by AI model).')}</li>
                            <li>{t('**Dosage:** 1.0 ml/Liter (Total 500 liters mix).')}</li>
                            <li>{t('**Safety:** Apply during morning hours (7 AM - 10 AM). Use full PPE.')}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('Follow-up & Monitoring')}</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                            <li>{t('**Re-Scouting:** Schedule new scouting 7 days after application (2025-10-17).')}</li>
                            <li>{t('**NDVI Monitoring:** Monitor NDVI data for Field A for stress reduction.')}</li>
                            <li>{t('**Irrigation:** Reduce humidity risk by prioritizing drip over sprinkler irrigation for 7 days.')}</li>
                            <li>{t('**Next Step:** If symptoms persist, escalate to systemic fungicide (e.g., Propiconazole).')}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- PAGE VIEW 3: YIELD PREDICTION DETAILS ---
// ----------------------------------------------------------------------------------

const YieldPredictionDetails = ({ navigate, predictionId, predictions }) => {
    const { t } = useTranslation();
    const prediction = useMemo(() => predictions.find(p => p.id === predictionId), [predictionId, predictions]);

    if (!prediction) {
        return (
            <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <button onClick={() => navigate('dashboard')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-medium"><ChevronLeft className="w-5 h-5 mr-1" /> {t('Back to Dashboard')}</button>
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Prediction Not Found')}</h1>
                </div>
            </div>
        );
    }

    const projectionHistory = [
        { week: t('Wk 35'), projection: 15.0 },
        { week: t('Wk 38'), projection: 16.5 },
        { week: t('Wk 41'), projection: 17.8 },
        { week: t('Wk 44'), projection: 18.5 },
    ];

    const factorData = [
        { name: t('Soil Quality'), score: prediction.factors.soil },
        { name: t('Weather Inputs'), score: prediction.factors.weather },
        { name: t('Pest/Disease Risk'), score: prediction.factors.pest },
        { name: t('Fertilizer Timing'), score: 92 },
    ];

    const handleDownloadContract = () => {
        // Concatenating translated strings with dynamic values for the PDF content.
        const content = `
            ${t('Crop')}: ${prediction.crop}
            ${t('Field')}: ${prediction.field}
            ${t('Projection')}: ${prediction.projection}
            ${t('Current Market Price')}: ₹${prediction.marketPrice} / kg

            ${t('Terms')}: ${t('Lock in 50% of the projected yield at ₹')}${prediction.marketPrice - 5}${t('/kg for delivery in 45 days.')}
            ${t('This ensures minimum revenue and hedges against market volatility.')}
        `;
        simulatePDFDownload(content, t(`Forward_Contract_${prediction.crop}.pdf`));
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <button onClick={() => navigate('dashboard')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-medium"><ChevronLeft className="w-5 h-5 mr-1" /> {t('Back to Dashboard')}</button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><Target className="w-6 h-6 text-purple-500" /> {t('Yield Deep Dive')}: {prediction.crop} ({prediction.field})</h1>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-purple-500 h-[450px]">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Historical Projection Trend (MT/Ha)')}</h2>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={projectionHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc5" />
                            <XAxis dataKey="week" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" label={{ value: t('MT/Ha'), angle: -90, position: 'left' }} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }} />
                            {/* Line name must be translated */}
                            <Line type="monotone" dataKey="projection" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} name={t('Projected Yield')} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-1 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-l-4 border-pink-500 h-fit">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-pink-500" /> {t('Market Outlook')}</h2>
                    <div className="space-y-4">
                        <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                            <p className="text-sm font-medium text-pink-700 dark:text-pink-300">{t('Target Sale Price (₹/kg)')}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{prediction.marketPrice}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('Estimated Revenue (Total)')}</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{((prediction.marketPrice * 18.5 * 40) * 100).toLocaleString()}</p>
                        </div>
                    </div>
                    {/* Interpolated string parts need translation */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">{t('This projection factors in the current market price for')} {prediction.crop}. {t('Hedge now to lock in profit!')}</p>
                    <button
                        onClick={handleDownloadContract}
                        className="w-full bg-pink-600 text-white py-2 mt-6 rounded-xl font-semibold hover:bg-pink-700 transition duration-150 shadow-md flex items-center justify-center gap-2"
                    >
                        <Briefcase className='w-4 h-4' /> {t('Download Forward Contract')}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-indigo-500">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5 text-indigo-500" /> {t('Key Model Input Factors (Score out of 100)')}</h2>
                <div className="grid md:grid-cols-4 gap-6">
                    {factorData.map((factor, index) => (
                        <div key={index} className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            {/* factor.name is already translated when factorData is created */}
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{factor.name}</p>
                            <p className="text-4xl font-extrabold" style={{ color: factor.score > 85 ? '#10b981' : factor.score > 70 ? '#f59e0b' : '#ef4444' }}>{factor.score}</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div className={`h-2 rounded-full`} style={{ width: `${factor.score}%`, backgroundColor: factor.score > 85 ? '#10b981' : factor.score > 70 ? '#f59e0b' : '#ef4444' }}></div>
                            </div>
                            {/* Descriptive text is translated */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{factor.score > 85 ? t('High Impact Success') : t('Potential Improvement Area')}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- PAGE VIEW 4: SENSOR DETAILS & ANALYTICS (ENHANCED) ---
// ----------------------------------------------------------------------------------

const SensorDetails = ({ navigate, deviceId, devices, farmData }) => {
    const { t } = useTranslation();
    const device = useMemo(() => devices.find(d => d.id === deviceId), [deviceId, devices]);

    if (!device) {
        return (
            <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <button onClick={() => navigate('dashboard')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-medium"><ChevronLeft className="w-5 h-5 mr-1" /> {t('Back to Dashboard')}</button>
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                    <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Sensor Not Found')}</h1>
                </div>
            </div>
        );
    }

    const generateLogs = useCallback((count = 12) => {
        const logs = [];
        let baseValue, range;

        switch (device.units) {
            case '°C': baseValue = 30; range = 5; break;
            case '%': baseValue = 30; range = 15; break;
            case 'W': baseValue = 1000; range = 500; break;
            default: baseValue = 50; range = 10;
        }

        for (let i = 0; i < count; i++) {
            const time = new Date(Date.now() - i * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let value = baseValue + (Math.random() - 0.5) * range * 2;
            value = Math.max(0, value).toFixed(1);

            let status = 'OK';
            if (device.id === 'S-002' && value < 20) status = 'LOW MOISTURE';
            if (device.id === 'S-003' && i === 0) status = 'OFFLINE';

            logs.unshift({ time: time, value: parseFloat(value), status: status });
        }
        return logs;
    }, [device.units, device.id]);

    const chartData = generateLogs(8);

    // The logs text is constructed in the same way as the PDF content to ensure proper translation.
    const fullLogText = generateLogs(12).map(log =>
        `[${log.time}] ${t('Value')}: ${log.value}${device.units}, ${t('Status')}: ${t(log.status)}, ${t('Latency')}: 50ms`
    ).reverse().join('\n');

    const lineColor = device.statusColor === 'red' ? '#ef4444' : device.statusColor === 'yellow' ? '#f59e0b' : '#10b981';

    const suggestions = useMemo(() => {
        if (device.id === 'S-002' && device.statusColor === 'yellow') {
            return {
                // The title must be translated
                title: t("Immediate Action Required: Low Moisture"),
                color: "border-red-500",
                list: [
                    // List items are fully translatable strings
                    t("Initiate **30-minute localized drip irrigation** in Field B."),
                    t("Check weather forecast for next 24 hours (No rain expected)."),
                    t("Recalibrate threshold to **28%** to prevent future stress.")
                ]
            };
        }
        return {
            title: t("Status Normal"),
            color: "border-green-500",
            list: [
                t("No immediate actions required. Data looks stable."),
                t("Continue monitoring for long-term trends."),
                t("Next maintenance check scheduled for week 4.")
            ]
        };
    }, [device, t]); // t is included as a dependency because the translations are used inside the memoized function

    const handleDownloadReport = () => {
        // The PDF content strings must be translated
        const content = `
            ${t('Sensor ID')}: ${device.id} (${device.name})
            ${t('Type')}: ${device.type}
            ${t('Current Status')}: ${device.status}
            ${t('Current Value')}: ${device.value}

            ${t('Action Plan')}:
            ${suggestions.list.map(s => `- ${s.replace(/\*\*/g, '')}`).join('\n')}

            ${t('Full Log Data')}:
            ${fullLogText}
        `;
        simulatePDFDownload(content, t(`Sensor_Report_${device.id}.pdf`));
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <button onClick={() => navigate('dashboard')} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6 font-medium"><ChevronLeft className="w-5 h-5 mr-1" /> {t('Back to Dashboard')}</button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3"><Cpu className="w-6 h-6 text-indigo-500" /> {t('Sensor Analytics')}: {device.name}</h1>

            <div className="grid lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-indigo-500 h-[450px]">
                    {/* The units in the title are static data, but the rest of the title needs translation */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Last 8 Hours Data Trend')} ({device.units})</h2>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc5" />
                            <XAxis dataKey="time" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" label={{ value: device.units, angle: -90, position: 'left' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }} />
                            {/* The Line name needs translation, combining dynamic type with a translated word 'Value' */}
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={lineColor}
                                strokeWidth={3}
                                dot={{ fill: lineColor, r: 4 }}
                                name={`${t(device.type)} ${t('Value')}`}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className={`lg:col-span-1 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-l-4 ${suggestions.color} h-fit`}>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        {suggestions.title.includes(t('Action')) ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
                        {/* suggestions.title is already translated when suggestions is created */}
                        {suggestions.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-semibold">{t('AI-Powered Action Plan')}</p>
                    <ul className="space-y-3">
                        {suggestions.list.map((item, index) => (
                            // The item is already translated when suggestions is created. The span content is not UI text, but a UI element, so it is hardcoded.
                            <li key={index} className="flex items-start text-gray-700 dark:text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: `<span class="mr-2 text-indigo-500 dark:text-indigo-400 font-extrabold">▶</span>${item}` }} />
                        ))}
                    </ul>
                    <button
                        onClick={handleDownloadReport}
                        className="w-full bg-indigo-600 text-white py-3 mt-6 rounded-xl font-semibold hover:bg-indigo-700 transition duration-150 shadow-md flex items-center justify-center gap-2"
                    >
                        <Briefcase className='w-4 h-4' /> {t('Generate Detailed Report')}
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 border-t-4 border-gray-500">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Full Hourly Log (Last 12 Hours)')}</h2>

                <div className="h-48 overflow-y-auto bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300">
                    <pre className='whitespace-pre-wrap'>{fullLogText}</pre>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{t('Detailed Sensor Report & Calibration')}</h2>
                <div className="grid md:grid-cols-4 gap-6 text-sm text-gray-600 dark:text-gray-300">
                    {/* The label and the static text need to be translated, but the value is a static date/version. */}
                    <p><span className="font-semibold text-gray-900 dark:text-white">{t('Location')}:</span> Field C, Zone 2</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">{t('Installation Date')}:</span> 2024-05-15</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">{t('Calibration Due')}:</span> 2025-11-01</p>
                    <p><span className="font-semibold text-gray-900 dark:text-white">{t('Firmware Version')}:</span> v2.1.4</p>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------------------
// --- MODAL COMPONENT FOR LISTING DETAILS ---
// ----------------------------------------------------------------------------------

const ListingModal = ({ listing, onClose }) => {
    const { t } = useTranslation();
    
    if (!listing) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[1000] p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><ShoppingBag className='w-6 h-6 text-emerald-500' /> {t('Listing Details')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    <h4 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{listing.title}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                            <p className="text-gray-500 dark:text-gray-400">{t('Current Price')}</p>
                            <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">₹{listing.price.toLocaleString()}</p>


</div>
                        <div className='p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                            <p className="text-gray-500 dark:text-gray-400">{t('Active Bids')}</p>
                            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{listing.bids}</p>
                        </div>
                        <p><span className='font-medium text-gray-800 dark:text-gray-200'>{t('Volume')}:</span> {listing.volume}</p>
                        <p><span className='font-medium text-gray-800 dark:text-gray-200'>{t('Min Bid')}:</span> ₹{listing.minBid.toLocaleString()}</p>
                        <p><span className='font-medium text-gray-800 dark:text-gray-200'>{t('Location')}:</span> {listing.location}</p>
                        <p><span className='font-medium text-gray-800 dark:text-gray-200'>{t('Ends On')}:</span> <span className='text-red-500'>{listing.endDate}</span></p>
                    </div>

                    <div className="mt-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('Bidding Activity (Mock)')}</p>
                        <div className="h-24 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs space-y-1">
                            {Array.from({ length: listing.bids }).map((_, i) => (
                                <p key={i} className='flex justify-between font-mono text-gray-600 dark:text-gray-400'>
                                    <span>{t('Bidder')} {i + 1}</span>
                                    <span className='font-bold text-green-700 dark:text-green-300'>₹{(listing.minBid + (i * 1000)).toLocaleString()}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('Close')}</button>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold">{t('Place Bid')}</button>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------
// --- MAIN DASHBOARD VIEW ---
// ----------------------------------------------------------------------------------

const Dashboard = ({ farmData, navigate }) => {
    const { t } = useTranslation();
    const { stats, diseaseRisk, devices, predictions, weatherForecast, listings, farmName, location, totalArea, crop, stage, lastUpdate } = farmData;
    const [selectedListing, setSelectedListing] = useState(null);

    const openListingModal = (listing) => {
        setSelectedListing(listing);
    };

    const closeListingModal = () => {
        setSelectedListing(null);
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen font-sans">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Leaf className="w-8 h-8 text-green-600" />
                    {farmName} {t('Dashboard')}
                </h1>
                <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 mt-2 space-x-4">
                    <p className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {location}</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{t('Crop')}: {crop} ({totalArea} Ha)</p>
                    <p className="flex items-center gap-1"><Clock className="w-4 h-4" /> {t('Last Update')}: {lastUpdate}</p>
                </div>
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm font-medium text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500">
                    **{t('Farm2Market Recommendation')}:** {t('Current Stage')}: <span className="font-bold">{stage}</span>. {t('Focus on nutrient application and pest scouting.')}
                </div>
            </header>

            <div className="space-y-12">
                {/* --- 1. KEY PERFORMANCE INDICATORS (KPIs) --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map(stat => (
                        <StatCard key={stat.id} stat={stat} handleNavigation={(route) => navigate(route)} />
                    ))}
                </div>

                {/* --- 2. RISK & ALERTS (Pest/Disease) --- */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-xl p-6 border-l-4 border-yellow-500 h-full flex flex-col justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Leaf className="w-5 h-5 text-yellow-500" /> {t('Pest & Disease Risk')}
                                </h2>
                                <p className="text-5xl font-extrabold mb-2" style={{ color: diseaseRisk.color.replace('text-', '') }}>
                                    {t(diseaseRisk.risk)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t(diseaseRisk.details)}</p>
                            </div>
                            <button 
                                onClick={() => navigate(diseaseRisk.route)} 
                                className="w-full bg-yellow-600 text-white py-2 rounded-xl font-semibold hover:bg-yellow-700 transition duration-150 shadow-md mt-4"
                            >
                                {t('View Scouting Log (Detailed)')}
                            </button>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-xl p-6 border-l-4 border-green-500 h-full">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-green-500" /> {t('Current Recommendations')}
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <p className="font-semibold text-green-700 dark:text-green-300">{t('Fertilizer')}</p>
                                <p className="text-gray-800 dark:text-gray-200 text-sm mt-1">{t('Apply third split dose of Urea (25kg/Ha) within 48 hours.')}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <p className="font-semibold text-blue-700 dark:text-blue-300">{t('Water')}</p>
                                <p className="text-gray-800 dark:text-gray-200 text-sm mt-1">{t('Hold off irrigation for Field A until soil moisture drops below 25% (Controlled by SMART mode).')}</p>
                            </div>
                        </div>
                        <button className="w-full text-green-600 dark:text-green-400 py-2 rounded-lg font-semibold border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 transition duration-150 mt-4">
                            {t('Detailed Action Plan')}
                        </button>
                    </div>
                </div>

                {/* --- 3. REAL-TIME IoT SENSOR DATA --- */}
                <div className="">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('IoT Sensor Network')} ({devices.length} {t('Active Feeds')})</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {devices && devices.length > 0 ? (
                            devices.map(device => (
                                <IoTCard key={device.id} device={device} handleViewDetails={navigate} />
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg">
                                {t('No IoT devices connected')}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 4. CROP PREDICTIONS & WEATHER --- */}
                <div className="grid lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('Yield Prediction Models (Click for Deep Dive)')}</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {predictions && predictions.length > 0 ? (
                                predictions.map(pred => (
                                    <CropPredictionCard key={pred.id} prediction={pred} navigate={navigate} />
                                ))
                            ) : (
                                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg">
                                    {t('No predictions available')}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('5-Day Weather Analysis')}</h2>
                        <div className="bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-xl p-6 border-t-4 border-sky-500 h-full">
                            <div className="grid grid-cols-5 gap-3">
                                {weatherForecast.map((forecast, index) => {
                                    const getIcon = (cond) => {
                                        if (cond.includes('Rain')) return <Droplet className="w-5 h-5 text-blue-500" />;
                                        if (cond.includes('Sunny')) return <Sun className="w-5 h-5 text-yellow-500" />;
                                        if (cond.includes('Cloudy')) return <Cloud className="w-5 h-5 text-gray-500" />;
                                        return <Cloud className="w-5 h-5 text-gray-500" />;
                                    };
                                    return (
                                        <div key={index} className="flex flex-col items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{t(forecast.day.slice(0, 3))}</p>
                                            {getIcon(forecast.condition)}
                                            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{forecast.temp}°C</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">{forecast.rain}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 5. PRODUCE LISTINGS & MARKETPLACE STATS --- */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-emerald-600" /> {t('Farm2Market Listings')}</h2>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <FarmerStats listings={listings} />
                        </div>

                        <div className="space-y-4 lg:col-span-1">
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('Active Items')} ({listings.length})</h3>
                            <div className='max-h-[350px] overflow-y-auto pr-2'>
                                {listings.map(listing => (
                                    <div 
                                        key={listing.id} 
                                        className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:scale-[1.02] transition-transform cursor-pointer mb-3"
                                        onClick={() => openListingModal(listing)}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{listing.title}</h4>
                                            <span className={`bg-indigo-200/50 text-indigo-700 dark:bg-indigo-600/20 dark:text-indigo-400 px-2 py-0.5 rounded-full text-xs`}>{listing.grade}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                            <p>{t('Price')}: <span className="font-bold text-green-600 dark:text-green-400">₹{listing.price.toLocaleString()}</span></p>
                                            <p>{listing.bids} {t('Bids')}</p>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                                            <div className="bg-gradient-to-r from-green-600 to-teal-600 h-1.5 rounded-full" style={{ width: `${gradeToPercentage(listing.grade)}%` }}></div>
                                        </div>
                                        <div className="flex gap-2 mt-3 text-xs">
                                            <button className="text-blue-600 hover:underline flex items-center gap-1"><Eye className="w-4 h-4" /> {t('View Details')}</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            <ListingModal listing={selectedListing} onClose={closeListingModal} />

            <footer className="mt-12 py-6 bg-white dark:bg-gray-900 border-t-4 border-emerald-500 text-center text-sm rounded-t-xl shadow-2xl">
                <p className="text-xl font-extrabold text-green-700 dark:text-green-400 mb-2">
                    {t('"The future of farming is in your hands. Trust the data, nurture your land, and reap the rewards of your hard work!"')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-white">{farmName}</span> | {t('Farm2Market Intelligence & Marketplace Platform')}
                    | {t('Built for Excellence.')}
                </p>
            </footer>
        </div>
    );
}

// ----------------------------------------------------------------------------------
// --- MAIN APPLICATION COMPONENT ---
// ----------------------------------------------------------------------------------

export default function App() {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [selectedId, setSelectedId] = useState(null);
    const [farmData, setFarmData] = useState(mockFarmData);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [theme, setTheme] = useState('light');

    const navigate = (page, id = null) => {
        setCurrentPage(page);
        setSelectedId(id);
        window.scrollTo(0, 0);
    };
    
    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return newTheme;
        });
    };

    useEffect(() => {
        if (!firebaseConfig || Object.keys(firebaseConfig).length === 0 || !firebaseConfig.projectId) {
            console.warn("Firebase configuration is missing or invalid. Running with mock data and setting authentication as ready.");
            setUserId(crypto.randomUUID()); 
            setIsAuthReady(true);
            return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const authenticate = async () => {
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
            };
            
            authenticate().catch(error => { console.error("Firebase authentication error:", error); });

            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                const currentUserId = user ? user.uid : crypto.randomUUID();
                setUserId(currentUserId);
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
        }
    }, []);

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mr-4"></div>
                {t('Loading Farm Intelligence System...')}
            </div>
        );
    }
    
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard farmData={farmData} navigate={navigate} />;
            case 'irrigation':
                return <IrrigationSystem navigate={navigate} waterHistory={farmData.waterHistory} />;
            case 'sensorDetails':
                return <SensorDetails navigate={navigate} deviceId={selectedId} devices={farmData.devices} farmData={farmData} />;
            case 'pestLog':
                return <PestScoutingLog navigate={navigate} pestLogs={farmData.pestLogs} diseaseRisk={farmData.diseaseRisk} />;
            case 'yieldDetails':
                return <YieldPredictionDetails navigate={navigate} predictionId={selectedId} predictions={farmData.predictions} />;
            default:
                return <Dashboard farmData={farmData} navigate={navigate} />;
        }
    };

    return (
        <div className={`bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
            <div className="sticky top-0 z-50 p-4 flex justify-between items-center bg-white/95 dark:bg-gray-900/95 shadow-xl backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                <button onClick={() => navigate('dashboard')} className="flex items-center text-xl font-bold text-green-600 dark:text-green-400 hover:opacity-80 transition">
                    <Leaf className="w-6 h-6 mr-2" /> {t('Farm2Market')}
                </button>
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:ring-2 ring-indigo-500 transition-all duration-150"
                        title={t('Toggle Theme')}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {t('User ID')}: <span className="font-mono text-gray-800 dark:text-gray-200 break-all">{userId}</span>
                    </div>
                </div>
            </div>
            
            {renderPage()}
        </div>
    );
}

const Moon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);
