import { useState } from 'react';
import { motion } from 'framer-motion';

const AIGrader = () => {
  const [formData, setFormData] = useState({
    photo: [], // Changed to an array to hold multiple photos
    grade: '',
    suggestedPrice: '',
    details: '',
    marketChoice: 'primary',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Added a new step for confirmation

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // Logic to handle form submission
    console.log('Form Submitted:', formData);
    alert('Produce submitted to the marketplace successfully!');
  };
  
  // Corrected function to handle multiple file uploads
  const handlePhotoUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFormData(prev => ({ 
      ...prev, 
      photo: [...prev.photo, ...newFiles] // Appending new files to the existing array
    }));
  };

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
  
  const SubmitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-pink-400">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
      <path d="M2 7l10 5 10-5" />
      <path d="M12 17l10-5" />
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
              <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Upload Produce Photos</h2>
            </div>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 h-56">
              <input 
                type="file" 
                accept="image/*" 
                multiple // Allows multiple file selection
                onChange={handlePhotoUpload} // Calls the new handler
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
                <p className="text-sm">Click to upload or drag & drop</p>
              </label>
            </div>
            {formData.photo.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {formData.photo.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Produce photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-green-500 shadow-sm transition-transform transform group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}
            <p className="text-gray-400 dark:text-gray-400 text-sm mt-2">Our AI will analyze the images and grade your produce.</p>
          </div>
        );
      case 2:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <CheckIcon />
              <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Review AI Grade & Price</h2>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 border border-gray-300 dark:border-gray-600">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">AI Grade:</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">Grade A</h3>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Suggested Price:</p>
              <p className="text-2xl font-bold text-indigo-900 dark:text-white">₹250/kg</p>
              <p className="text-gray-400 dark:text-gray-400 text-sm mt-4">Based on quality, our AI recommends this price to maximize your profit.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <DetailsIcon />
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Provide Additional Details</h2>
              </div>
              <textarea
                value={formData.details}
                onChange={(e) => handleInputChange('details', e.target.value)}
                placeholder="Enter details like quantity, variety, or specific notes..."
                className="w-full h-40 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-6 border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
              />
              <p className="text-gray-400 dark:text-gray-400 text-sm mt-2">This helps buyers make informed decisions.</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <MarketIcon />
              <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Choose Your Market</h2>
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Primary Market</h3>
                    <p className="text-gray-400 dark:text-gray-400">For 'Grade A' and 'Grade B' produce. Live bidding for top value.</p>
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
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Zero Waste Market</h3>
                    <p className="text-gray-400 dark:text-gray-400">For lower-grade produce. Sold to food processors and biofuel producers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <SubmitIcon />
              <h2 className="text-2xl font-bold text-indigo-900 dark:text-white">Review & Confirm</h2>
            </div>
            <div className="space-y-4 text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600">
              <p>Your submission is ready to be listed on the marketplace.</p>
              <p>Photos Uploaded: <span className="font-bold text-green-500">{formData.photo.length}</span></p>
              <p>AI Grade: <span className="font-bold text-green-500">Grade A</span></p>
              <p>Market Choice: <span className="font-bold text-blue-500">{formData.marketChoice === 'primary' ? 'Primary Market' : 'Zero Waste Market'}</span></p>
              <p>Additional Details: <span className="font-bold italic">{formData.details || 'None provided'}</span></p>
            </div>
            <p className="text-gray-400 dark:text-gray-400 text-sm mt-4">Click 'Submit & List' to finalize your listing.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-white mb-4">AgriConnect AI Grader</h1>
          <p className="text-indigo-700 dark:text-gray-300">Instantly grade your produce and list it on the marketplace</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400 dark:text-gray-400">Step {currentStep} of {totalSteps}</span>
            <span className="text-gray-400 dark:text-gray-400">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></motion.div>
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg"
        >
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                currentStep === 1 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:scale-105 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
              }`}
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-transform animate-pulse-glow"
              >
                Submit & List
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIGrader;