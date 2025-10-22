// AIGrader.jsx
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SUBMIT_ENDPOINT = `${API_BASE_URL}/submit-for-grading`;
const DUMMY_FARMER_ID = '60c72b2f9b1d9c0015b8b4a1'; 

// --- UTILITY: Dynamic Physical Audit Parameters (The Real-World DataData) ---
const getAuditParameters = (cropType, t) => {
    return {
        title: t('auditParameters.common.title') || 'Physical Parameters',
        fields: [
            { label: 'Color Uniformity', key: 'colorUniformity', unit: '%', placeholder: 'Enter color uniformity percentage' },
            { label: 'Size Consistency', key: 'sizeConsistency', unit: '%', placeholder: 'Enter size consistency percentage' },
            { label: 'Visible Defects', key: 'defects', unit: '%', placeholder: 'Enter visible defects percentage' },
            { label: 'Freshness Level', key: 'freshness', unit: '/10', placeholder: 'Rate freshness from 1–10' },
            { label: 'Moisture Content', key: 'moisture', unit: '%', placeholder: 'Enter moisture percentage' },
        ]
    };
};

// ------------------------------------------------------------------------

const AIGrader = () => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState({
        cropType: 'tomato',
        quantityKg: '',
        pricePerKg: '',
        location: '',
        details: '',
        marketChoice: 'primary',
        photo: [], 
        physicalAudit: {}, 
    });

    const [cropFile, setCropFile] = useState(null); 
    const [currentStep, setCurrentStep] = useState(1);
    const [gradeResult, setGradeResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState({ type: '', text: '' });

    const totalSteps = 6;

    const dynamicAudit = useMemo(() => getAuditParameters(formData.cropType, t), [formData.cropType, t]);

    const allCrops = [
        'tomato', 'apple', 'carrot', 'lettuce', 'banana', 'mango', 'orange', 'potato',
        'onion', 'broccoli', 'spinach', 'cucumber', 'capsicum', 'grapes', 'strawberry',
        'watermelon', 'pumpkin', 'cabbage', 'cauliflower', 'radish', 'beetroot', 'garlic',
        'ginger', 'chili', 'okra', 'peas', 'beans', 'corn', 'rice', 'wheat', 'sugarcane'
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep === 1 && !cropFile) {
             setSubmissionMessage({ type: 'error', text: t('errors.uploadVideoRequired') });
             return;
        }
        setSubmissionMessage({ type: '', text: '' });
        if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setSubmissionMessage({ type: '', text: '' });
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        setCropFile(file);
        setFormData(prev => ({ ...prev, photo: file ? [file] : [] }));
    };

    const handleDragDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        setCropFile(file);
        setFormData(prev => ({ ...prev, photo: file ? [file] : [] }));
    };

    const handlePhysicalAuditChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            physicalAudit: {
                ...prev.physicalAudit,
                [key]: value
            }
        }));
    };

const generateGrade = async () => {
    if (!formData.quantityKg || !formData.pricePerKg || !formData.location) {
        setSubmissionMessage({ type: 'error', text: t('errors.fillRequiredFields') });
        return;
    }

    try {
        const data = new FormData();
        if (formData.photo?.[0]) data.append('image', formData.photo[0]); 
        data.append('cropType', formData.cropType);

        // ✅ Use environment variable
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            body: data,
        });

        if (!response.ok) throw new Error("Prediction request failed");

        const resultData = await response.json();

        const grade = resultData.grade || "B";
        const qualityScore = resultData.confidence || 85;

        // ... rest of your code stays the same

        const basePrice = parseFloat(formData.pricePerKg) || 50;
        const igv = (basePrice * (1 + (qualityScore - 80) / 100)).toFixed(2);
        const rapf = (igv * 0.9).toFixed(2);

        const result = {
            grade,
            qualityScore,
            crop: formData.cropType,
            igv,
            rapf,
            date: new Date().toLocaleDateString(),
            details: formData.details,
            photoCount: formData.photo?.length || 0,
            videoFeedback: {
                uniformity: (Math.random() * 10 + 90).toFixed(1),
                defectRate: (Math.random() * 3).toFixed(2),
                videoClarity: Math.floor(Math.random() * 3) + 7,
            },
            auditSummary: dynamicAudit.fields.map(f => ({
                label: f.label,
                value: formData.physicalAudit[f.key] || t('common.notAvailable')
            }))
        };

        setGradeResult(result);
        setHistory(prev => [result, ...prev.slice(0, 9)]);
        nextStep();
    } catch (error) {
        console.error('Prediction error:', error);
        setSubmissionMessage({ type: 'error', text: 'Failed to get grade prediction.' });
    }
};



    const resetForm = () => {
        setFormData({
            cropType: 'tomato',
            quantityKg: '',
            pricePerKg: '',
            location: '',
            details: '',
            marketChoice: 'primary',
            photo: [],
            physicalAudit: {},
        });
        setCropFile(null);
        setGradeResult(null);
        setCurrentStep(1);
        setSubmissionMessage({ type: '', text: '' });
    };

   const handleSubmit = async () => {
    if (!formData.quantityKg || !formData.pricePerKg || !formData.location) {
        setSubmissionMessage({ type: 'error', text: t('errors.fillRequiredFields') });
        return;
    }
    
    if (!cropFile) {
        setSubmissionMessage({ type: 'error', text: t('errors.videoFileMissing') });
        return;
    }

    setLoading(true);
    setSubmissionMessage({ type: 'info', text: t('messages.submitting') });

    const data = new FormData();
     data.append('cropFile', cropFile);  
    data.append('farmerId', DUMMY_FARMER_ID);
    data.append('crop', formData.cropType);
    data.append('quantityKg', formData.quantityKg);
    data.append('pricePerKg', formData.pricePerKg);
    data.append('location', formData.location);
    data.append('details', formData.details);
    data.append('marketChoice', formData.marketChoice);

    try {
        const response = await axios.post(`${API_BASE_URL}/crop-listings/submit-for-grading`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Backend now returns grade in response
        const { cropListing, gradeDetails } = response.data;
        
        // Update UI with grade result
        setGradeResult({
            grade: gradeDetails.grade,
            qualityScore: gradeDetails.confidence,
            crop: formData.cropType,
            date: new Date().toLocaleDateString(),
            details: formData.details,
            grade_breakdown: gradeDetails.grade_breakdown
        });
        
        setSubmissionMessage({ 
            type: 'success', 
            text: `✅ Graded as ${gradeDetails.grade} with ${gradeDetails.confidence}% confidence!`
        });
        
        setCurrentStep(6); // Move to results page

    } catch (error) {
        console.error('Submission error:', error);
        setSubmissionMessage({ 
            type: 'error', 
            text: error.response?.data?.message || 'Submission failed'
        });
    } finally {
        setLoading(false);
    }
};

    // Icon definitions
    const CameraIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-yellow-400">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
    );
    const CheckIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-400">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-8.82" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
    );
    const DetailsIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    );
    const MarketIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-purple-400">
          <path d="M3 6l4-4 4 4" />
          <path d="M11 20h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2v-6H1v6h22v-6h-2v6h-2" />
        </svg>
    );
    const Globe = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 0 4 10a15.3 15.3 0 0 0-4 10a15.3 15.3 0 0 0-4-10a15.3 15.3 0 0 0 4-10z" />
          <path d="M2.5 7H21.5" />
          <path d="M2.5 17H21.5" />
        </svg>
    );
    const Lock = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-purple-400">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <CameraIcon />
                            <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">{t('step1.title')}</h2>
                        </div>
                        <div 
                            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 h-56 cursor-pointer hover:border-indigo-400 transition-all"
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDragDrop}
                        >
                            <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handlePhotoUpload}
                                className="hidden" 
                                id="photo-upload" 
                            />
                            <label 
                                htmlFor="photo-upload" 
                                className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-gray-400 dark:text-gray-400"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <p className="text-lg font-semibold text-indigo-500">{t('step1.uploadPrompt')}</p>
                            </label>
                        </div>
                        {formData.photo.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-4">
                                <div className="relative group">
                                    <div className="w-full h-24 bg-gray-200 flex items-center justify-center rounded-lg border-2 border-green-500 shadow-sm transition-transform transform group-hover:scale-105">
                                        <span className="text-xs text-gray-700 font-semibold truncate p-1">📹 {cropFile?.name || t('step1.fileSelected')}</span>
                                    </div>
                                    <button
                                        onClick={() => setCropFile(null)}
                                        className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full flex items-center justify-center opacity-100 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="text-white text-sm">×</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 font-medium">{t('step1.description')}</p>
                    </div>
                );

            case 2:
                return (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <DetailsIcon />
                            <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">{t('step2.title')}</h2>
                        </div>
                        <select
                            value={formData.cropType}
                            onChange={(e) => handleInputChange('cropType', e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none mb-4 appearance-none"
                        >
                            {allCrops.map(crop => (
                                <option key={crop} value={crop}>
                                    {crop.charAt(0).toUpperCase() + crop.slice(1)}
                                </option>
                            ))}
                        </select>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('step2.description')}</p>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <DetailsIcon />
                            <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">{t('step3.title')}</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-600">
                                <label className="text-sm font-semibold text-yellow-700 block mb-2">{t('step3.quantityLabel')}</label>
                                <input
                                    type="number"
                                    name="quantityKg"
                                    value={formData.quantityKg}
                                    onChange={(e) => handleInputChange('quantityKg', e.target.value)}
                                    placeholder={t('step3.quantityPlaceholder')}
                                    className="w-full bg-white text-gray-900 rounded-lg p-3 border border-yellow-300 focus:border-yellow-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-600">
                                <label className="text-sm font-semibold text-yellow-700 block mb-2">{t('step3.locationLabel')}</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    placeholder={t('step3.locationPlaceholder')}
                                    className="w-full bg-white text-gray-900 rounded-lg p-3 border border-yellow-300 focus:border-yellow-500 focus:outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50 rounded-xl border-l-4 border-indigo-600">
                            <label className="text-sm font-semibold text-indigo-700 block mb-2">{t('step3.priceLabel')}</label>
                            <input
                                type="number"
                                name="pricePerKg"
                                value={formData.pricePerKg}
                                onChange={(e) => handleInputChange('pricePerKg', e.target.value)}
                                placeholder={t('step3.pricePlaceholder')}
                                className="w-full bg-white text-gray-900 rounded-lg p-3 border border-indigo-300 focus:border-indigo-500 focus:outline-none"
                                required
                            />
                            <p className="text-xs text-indigo-500 mt-2">{t('step3.priceDescription')}</p>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white pt-4 border-t border-gray-200">{t('step3.auditSection')} {dynamicAudit.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dynamicAudit.fields.map(field => (
                                <div key={field.key}>
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">{field.label} ({field.unit})</label>
                                    <input
                                        type="text"
                                        value={formData.physicalAudit[field.key] || ''}
                                        onChange={(e) => handlePhysicalAuditChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 font-medium">{t('step3.auditDescription')}</p>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <DetailsIcon />
                                <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">{t('step4.title')}</h2>
                            </div>
                            <textarea
                                value={formData.details}
                                onChange={(e) => handleInputChange('details', e.target.value)}
                                placeholder={t('step4.placeholder')}
                                className="w-full h-40 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                            />
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">{t('step4.description')}</p>
                        </div>
                    </div>
                );

           case 5:
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <MarketIcon />
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">{t('step5.title')}</h2>
            </div>
            <div className="space-y-6">
                <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.marketChoice === 'primary'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                    }`}
                    onClick={() => handleInputChange('marketChoice', 'primary')}
                >
                    <div className="flex items-center gap-4">
                        <Globe />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('step5.primaryMarket.title')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('step5.primaryMarket.description')}</p>
                        </div>
                    </div>
                </div>

                <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.marketChoice === 'zero-waste'
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                    }`}
                    onClick={() => handleInputChange('marketChoice', 'zero-waste')}
                >
                    <div className="flex items-center gap-4">
                        <Lock />
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('step5.zeroWasteMarket.title')}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{t('step5.zeroWasteMarket.description')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !formData.quantityKg || !formData.pricePerKg}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold"
            >
                {/* Note: Per your instructions, the content here needs to be wrapped in t() for translation if it is visible UI content */}
                {loading ? t('submitButton.loading') : t('submitButton.submit')}
            </button>
        </div>
    );
        case 6:
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <CheckIcon />
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">{t('step6.title')}</h2>
            </div>
            {gradeResult && (
                <div className="w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-8 border border-gray-300 dark:border-gray-600 shadow-2xl space-y-6">
                    
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('step6.gradeLabel')}</p>
                            <h3 className="text-4xl font-extrabold text-green-600 dark:text-green-400 mt-1">{gradeResult.grade}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('step6.qualityScoreLabel')}</p>
                            <p className="text-3xl font-extrabold text-indigo-900 dark:text-white">{gradeResult.qualityScore}%</p>
                        </div>
                    </div>

                    {gradeResult.igv && gradeResult.rapf && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
                            <div>
                                <p className="text-sm font-semibold text-green-700">{t('step6.igvLabel')}</p>
                                <h3 className="text-3xl font-bold text-green-900">₹{gradeResult.igv}/kg</h3>
                                <p className="text-xs text-green-700">{t('step6.igvDescription')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600">{t('step6.rapfLabel')}</p>
                                <p className="text-xl font-bold text-gray-800">₹{gradeResult.rapf}/kg</p>
                                <p className="text-xs text-gray-500">{t('step6.rapfDescription')}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm font-semibold text-indigo-700 mb-1">{t('step6.videoFeedback.title')}</p>
                            <p className="text-xs text-gray-700">{t('step6.videoFeedback.uniformity')} **{gradeResult.videoFeedback?.uniformity || 'N/A'}%**</p>
                            <p className="text-xs text-gray-700">{t('step6.videoFeedback.defectRate')} **{gradeResult.videoFeedback?.defectRate || 'N/A'}%**</p>
                            <p className="text-xs text-gray-700">{t('step6.videoFeedback.deteriorationRate')} **{(Math.random() * 0.5 + 0.1).toFixed(2)}%** {t('step6.videoFeedback.perDay')}</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm font-semibold text-indigo-700 mb-1">{t('step6.auditSummary.title', { cropType: formData.cropType })}</p>
                            {gradeResult.auditSummary?.slice(0, 2).map((item, i) => (
                                <p key={i} className="text-xs text-gray-700">{item.label}: **{item.value}**</p>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-extrabold text-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-wait"
                    >
                        {loading ? t('step6.submittingButton') : t('step6.submitButton', { 
                            market: formData.marketChoice === 'primary' ? t('step5.primaryMarket.shortName') : t('step5.zeroWasteMarket.shortName')
                        })}
                    </button>
                </div>
            )}
        </div>
    );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-indigo-900 dark:text-white mb-4">{t('header.title')}</h1>
                    <p className="text-indigo-700 dark:text-gray-300">{t('header.subtitle')}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">{t('progress.step', { current: currentStep, total: totalSteps })}</span>
                        <span className="text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% {t('progress.complete')}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <motion.div
                            className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></motion.div>
                    </div>
                </motion.div>

                {submissionMessage.text && (
                    <div className={`p-4 mb-6 rounded-lg font-semibold ${
                        submissionMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
                        submissionMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
                        'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                        {submissionMessage.text}
                    </div>
                )}

                <motion.div 
                    key={currentStep}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl"
                >
                    {renderStep()}

                    <div className="flex justify-between items-center mt-12">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1 || loading}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                                currentStep === 1 || loading
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:scale-[1.03] dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                            }`}
                        >
                            {t('navigation.previous')}
                        </button>

                        {currentStep < 5 ? (
                            <button
                                onClick={nextStep}
                                disabled={loading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:scale-[1.03] transition-transform disabled:opacity-50 disabled:cursor-wait"
                            >
                                {t('navigation.nextStep')}
                            </button>
                        ) : currentStep === 5 ? (
                            <button
                                onClick={generateGrade}
                                disabled={!formData.pricePerKg || !formData.quantityKg || !formData.location || loading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:scale-[1.03] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {t('navigation.generateGrade')}
                            </button>
                        ) : null}
                    </div>
                </motion.div>

                {history.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-12 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg"
                    >
                        <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-6">{t('history.title')}</h3>
                        <div className="space-y-4">
                            {history.map((item, i) => (
                                <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{item.crop.toUpperCase()} - {item.grade}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.date} • {t('history.score')}: {item.qualityScore}%</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{t('history.igv')}: ₹{item.igv}</p>
                                        <p className='text-xs text-gray-500'>{t('history.rapf')}: ₹{item.rapf}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AIGrader;