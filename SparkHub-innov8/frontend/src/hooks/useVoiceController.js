import { useNavigate } from 'react-router-dom';
import { useRef, useCallback, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const useVoiceController = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
 const [uploadState, setUploadState] = useState({
  step: 'IDLE',
  selectedFile: null,
  isFormActive: false,
  currentQuestion: null,
  formData: {
    cropType: '',
    quantity: '',
    price: '',
    location: ''
  },
  automationStep: 0,
  
  // ✅ NEW: Profile automation state
  profileStep: 'IDLE', // 'COLLECTING', 'EDITING', 'SUBMITTING', 'COMPLETED'
  profileQuestionIndex: 0,
  profileData: {
    farmName: '',
    location: '',
    description: '',
    contactEmail: '',
    phoneNumber: '',
    farmingType: 'conventional',
    farmSize: { value: '', unit: 'acres' },
    primaryCrops: '',
    expertise: ''
  }
});

  useEffect(() => {
    const handlePageChange = () => {
      if (uploadState.step !== 'IDLE' && uploadState.step !== 'COMPLETED') {
        console.log('🔄 Page changed, resetting automation');
        resetAutomation();
      }
    };

    window.addEventListener('popstate', handlePageChange);
    return () => window.removeEventListener('popstate', handlePageChange);
  }, [uploadState.step]);

  const executeAction = useCallback(async (action, speak, userText = '') => {
    if (!action) {
      console.log('⚠️ No action to execute');
      return;
    }

    console.log('🎯 Executing action:', action.type);

    try {
      switch (action.type) {
        case 'NAVIGATE':
          handleNavigation(action.params.route, speak);
          break;

        case 'UPLOAD_VIDEO':
          await startVideoUploadFlow(speak);
          break;



              case 'START_PROFILE_SETUP':
  await startProfileSetup(speak);
  break;

case 'START_PROFILE_EDIT':
  await startProfileEdit(speak);
  break;

case 'SET_PROFILE_FIELD':
  await handleProfileFieldUpdate(action.params.field, userText, speak);
  break;



             case 'COMPLETE_PROFILE':
      handleCompleteProfile(speakText);
      break;
      
    case 'SET_PROFILE_FIELD':
      handleSetProfileField(action.params.field, action.params.value, speakText);
      break;
                      



case 'SUBMIT_PROFILE':
  await handleProfileSubmit(speak);
  break;     




        case 'SET_CROP_TYPE':
          await handleSetCropType(userText || action.params?.text, speak);
          break;

        case 'SET_QUANTITY':
          await handleSetQuantity(userText || action.params?.text, speak);
          break;

        case 'SET_PRICE':
          await handleSetPrice(userText || action.params?.text, speak);
          break;

        case 'SET_LOCATION':
          await handleSetLocation(userText || action.params?.text, speak);
          break;

        case 'FINAL_CONFIRM':
          await handleFinalConfirm(speak);
          break;

        case 'CONFIRM_UPLOAD':
          await handleConfirmUpload(speak);
          break;

        case 'CANCEL':
          handleCancel(speak);
          break;

        case 'LOGOUT':
          handleLogout(speak);
          break;

        default:
          console.log('❓ Unknown action type:', action.type);
          speak?.('ಕ್ಷಮಿಸಿ, ಆ ಕ್ರಿಯೆ ಇನ್ನೂ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ');
      }
    } catch (error) {
      console.error('❌ Action execution error:', error);
      speak?.('ತಾಂತ್ರಿಕ ದೋಷ ಸಂಭವಿಸಿದೆ');
    }
  }, [navigate, logout]);

  const handleNavigation = (route, speak) => {
    console.log('🧭 Navigating to:', route);
    navigate(route);
    speak?.(`${route} ಗೆ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ`);
  };

  const handleLogout = (speak) => {
    speak?.('ಲಾಗ್ಔಟ್ ಆಗುತ್ತಿದೆ...');
    logout();
    navigate('/login');
  };

  const handleCancel = (speak) => {
    speak?.('ರದ್ದು ಮಾಡಲಾಗಿದೆ');
    resetAutomation();
  };

  const startVideoUploadFlow = async (speak) => {
    console.log('📹 Starting complete video upload automation...');
    
    setUploadState(prev => ({ 
      ...prev, 
      step: 'NAVIGATING',
      isFormActive: true,
      automationStep: 1
    }));
    
    speak?.('AI ಗ್ರೇಡರ್ ಪುಟಕ್ಕೆ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತಿದ್ದೇನೆ...');
    navigate('/ai-grader');
    
    setTimeout(() => {
      speak?.('ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬೆಳೆಯ ವೀಡಿಯೋವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ');
      triggerFilePicker(speak);
    }, 2000);
  };

  const triggerFilePicker = (speak) => {
    console.log('🔍 Triggering file picker...');
    
    setTimeout(() => {
      const fileInput = document.querySelector('input[type="file"][accept*="video"]') || 
                       document.querySelector('input[id="photo-upload"]') ||
                       document.querySelector('input[data-voice-upload="true"]');
      
      if (fileInput) {
        console.log('✅ Found file input, clicking...');
        
        const handleFileChange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            console.log('📁 File selected:', file.name);
            fileInput.removeEventListener('change', handleFileChange);
            processSelectedFile(file, speak);
          }
        };
        
        fileInput.addEventListener('change', handleFileChange, { once: true });
        fileInput.click();
        
        setUploadState(prev => ({ 
          ...prev, 
          step: 'AWAITING_FILE',
          automationStep: 2
        }));
        
      } else {
        console.error('❌ File input not found');
        speak?.('ವೀಡಿಯೋ ಅಪ್ಲೋಡ್ ಆಯ್ಕೆ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮ್ಯಾನ್ಯುಯಲ್ ಆಗಿ ಆಯ್ಕೆ ಮಾಡಿ');
        setUploadState(prev => ({ ...prev, step: 'IDLE' }));
      }
    }, 1500);
  };

  const processSelectedFile = (file, speak) => {
    console.log('✅ Processing file:', file.name);
    
    if (!file.type.startsWith('video/')) {
      speak?.('ಇದು ವೀಡಿಯೋ ಫೈಲ್ ಅಲ್ಲ. ದಯವಿಟ್ಟು ವೀಡಿಯೋವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ');
      resetAutomation();
      return;
    }
    
    setUploadState(prev => ({ 
      ...prev, 
      step: 'FILE_SELECTED',
      selectedFile: file,
      automationStep: 3
    }));
    
    const fileName = file.name.split('.')[0];
    speak?.(`${fileName} ವೀಡಿಯೋ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಫಾರ್ಮ್ ತುಂಬಿಸಲಾಗುತ್ತಿದೆ...`);
    
    setTimeout(() => {
      startAutoFillWorkflow(speak);
    }, 1000);
  };

  const startAutoFillWorkflow = async (speak) => {
    console.log('🚀 Starting auto-fill workflow...');
    
    setUploadState(prev => ({ 
      ...prev, 
      step: 'AUTO_FILLING',
      automationStep: 4
    }));
    
    await autoClickNextButton(speak, 'step1_to_step2');
    await autoSelectCropType(speak);
    await autoClickNextButton(speak, 'step2_to_step3');
    await autoFillFormFields(speak);
    await autoFillPhysicalParameters(speak);
    await autoClickNextButton(speak, 'step3_to_step4');
    await autoFillDetails(speak);
    await autoClickNextButton(speak, 'step4_to_step5');
    await autoSelectMarket(speak);
    await autoSubmitForm(speak);
  };

  const autoClickNextButton = async (speak, stepName) => {
    console.log(`🔄 Auto-clicking Next button for: ${stepName}`);
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const nextButton = findNextButton();
        
        if (nextButton && !nextButton.disabled) {
          clearInterval(checkInterval);
          
          console.log(`✅ Found Next button, clicking...`);
          nextButton.click();
          
          setUploadState(prev => ({ 
            ...prev, 
            automationStep: prev.automationStep + 1
          }));
          
          setTimeout(resolve, 1500);
        }
      }, 500);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log(`❌ Timeout waiting for Next button: ${stepName}`);
        speak?.('ಮುಂದಿನ ಬಟನ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಮ್ಯಾನ್ಯುಯಲ್ ಆಗಿ ಕ್ಲಿಕ್ ಮಾಡಿ');
        resolve();
      }, 10000);
    });
  };

  const autoSelectCropType = async (speak) => {
    console.log('🥕 Auto-selecting crop type...');
    
    const cropType = uploadState.formData.cropType || 'tomato';
    
    const select = document.querySelector('select[name="cropType"]');
    if (select) {
      select.value = cropType;
      
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
      
      console.log(`✅ Auto-selected crop: ${cropType}`);
    }
    
    setUploadState(prev => ({
      ...prev,
      formData: { ...prev.formData, cropType }
    }));
  };

  const autoFillFormFields = async (speak) => {
  console.log('📝 Auto-filling form fields...');
  
  const defaultData = {
    quantityKg: '100',
    pricePerKg: '50',
    location: 'ಬೆಂಗಳೂರು'
  };
  
  // ✅ DIRECTLY UPDATE REACT STATE via the page's updateFormData function
  if (window.updateAIGraderFormData) {
    window.updateAIGraderFormData(defaultData);
    console.log('✅ Updated form data via global function');
  } else {
    // Fallback: Try to update inputs AND trigger React events
    for (const [fieldName, value] of Object.entries(defaultData)) {
      const input = document.querySelector(`input[name="${fieldName}"]`);
      if (input) {
        // Method 1: Use React's internal setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeInputValueSetter.call(input, value);
        
        // Method 2: Trigger React event
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        console.log(`✅ Filled ${fieldName}: ${value}`);
      }
    }
  }
  
  // Small delay to ensure state propagates
  await new Promise(resolve => setTimeout(resolve, 500));
};

const handleCompleteProfile = (speakText) => {
  // Navigate to profile if not already there
  if (window.location.pathname !== '/profile') {
    window.location.href = '/profile';
    
    // Wait for navigation, then start questioning
    setTimeout(() => {
      startProfileQuestioning();
    }, 2000);
  } else {
    // Already on profile page
    startProfileQuestioning();
  }
};

const autoFillPhysicalParameters = async (speak) => {
  console.log('📊 Auto-filling physical parameters...');
  
  const physicalParams = {
    colorUniformity: '85',
    sizeConsistency: '80',
    defects: '5',
    freshness: '8',
    moisture: '12'
  };
  
  // ✅ DIRECTLY UPDATE via global function
  if (window.updateAIGraderPhysicalAudit) {
    window.updateAIGraderPhysicalAudit(physicalParams);
    console.log('✅ Updated physical audit via global function');
  } else {
    // Fallback to DOM manipulation
    for (const [key, value] of Object.entries(physicalParams)) {
      const input = document.querySelector(`input[name="${key}"]`);
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeInputValueSetter.call(input, value);
        
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
};

  const autoFillDetails = async (speak) => {
    console.log('📄 Auto-filling details...');
    
    const detailsText = 'ಈ ಬೆಳೆ ತಾಜಾ ಮತ್ತು ಉತ್ತಮ ಗುಣಮಟ್ಟದ್ದಾಗಿದೆ. ಸಾವಯವ ಕೃಷಿ ವಿಧಾನಗಳನ್ನು ಬಳಸಿ ಬೆಳೆಸಲಾಗಿದೆ.';
    
    const textarea = document.querySelector('textarea[name="details"]') ||
                    document.querySelector('textarea');
    
    if (textarea) {
      textarea.value = detailsText;
      
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      
      textarea.dispatchEvent(inputEvent);
      textarea.dispatchEvent(changeEvent);
      
      console.log('✅ Auto-filled details');
    }
  };

  const autoSelectMarket = async (speak) => {
    console.log('🏪 Auto-selecting market...');
    
    const primaryMarket = document.querySelector('div[data-market="primary"]') ||
                         document.querySelector('div[onclick*="primary"]');
    
    if (primaryMarket) {
      primaryMarket.click();
      console.log('✅ Auto-selected primary market');
    }
  };

  const autoSubmitForm = async (speak) => {
  console.log('📤 Starting smart auto-submit...');
  
  setUploadState(prev => ({ 
    ...prev, 
    step: 'SUBMITTING',
    automationStep: 11
  }));
  
  speak?.('ಫಾರ್ಮ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ತುಂಬಿಸಲಾಗಿದೆ. ಸಲ್ಲಿಸುತ್ತಿದ್ದೇನೆ...');
  
  let submitted = false;
  let attempts = 0;
  const maxAttempts = 30; // Increased from 20
  
  const pollForButton = async () => {
    if (submitted) return;
    
    attempts++;
    console.log(`🔍 Polling attempt ${attempts}/${maxAttempts}...`);
    
    // ✅ Check if form data is actually in React state
    const formDataCheck = window.__aiGraderFormData || {};
    const hasValues = formDataCheck.quantityKg && 
                      formDataCheck.pricePerKg && 
                      formDataCheck.location;
    
    console.log('📋 Form state check:', {
      quantity: formDataCheck.quantityKg || 'empty',
      price: formDataCheck.pricePerKg || 'empty',
      location: formDataCheck.location || 'empty',
      hasValues
    });
    
    if (hasValues && window.__submitButton && !window.__submitButton.disabled) {
      console.log('✅ All conditions met! Submitting...');
      submitted = true;
      performSubmitClick(speak);
      return;
    }
    
    if (attempts < maxAttempts) {
      setTimeout(pollForButton, 1000); // Reduced from 1500ms
    } else {
      console.error('❌ Auto-submit timeout after', attempts, 'attempts');
      console.error('Final state:', formDataCheck);
      speak?.('ಸ್ವಯಂಚಾಲಿತ ಸಲ್ಲಿಕೆ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಹಸ್ತಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಿ ಬಟನ್ ಒತ್ತಿರಿ');
    }
  };
  
  // Start polling after a delay
  setTimeout(pollForButton, 2000);
};

  const performSubmitClick = (speak) => {
    console.log('🖱️ Performing submit click...');
    
    if (window.__submitButton) {
      console.log('Method 1: Using global button ref');
      const button = window.__submitButton;
      
      button.disabled = false;
      button.click();
      
      button.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        composed: true
      }));
      
      console.log('✅ Clicked via global ref');
    } else {
      console.log('Method 2: Finding button manually');
      const button = findSubmitButton();
      
      if (button) {
        button.disabled = false;
        button.removeAttribute('disabled');
        
        setTimeout(() => button.click(), 100);
        setTimeout(() => {
          button.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true
          }));
        }, 300);
        
        console.log('✅ Clicked via manual find');
      } else {
        console.error('❌ Button not found for clicking');
      }
    }
    
    speak?.('ವೀಡಿಯೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ. ಗ್ರೇಡ್‌ಗಾಗಿ ದಯವಿಟ್ಟು ಕಾಯಿರಿ...');
    
    setTimeout(() => {
      startGradeMonitoring(speak);
    }, 2000);
  };

  const startGradeMonitoring = (speak) => {
    console.log('📊 Starting grade monitoring...');
    
    let checkCount = 0;
    const maxChecks = 60;
    let hasSpokenProcessing = false;
    
    const checkInterval = setInterval(() => {
      checkCount++;
      
      if (checkCount % 5 === 0 && !hasSpokenProcessing) {
        speak?.(`ಪ್ರಕ್ರಿಯೆ ಆಗುತ್ತಿದೆ... ${checkCount * 2} ಸೆಕೆಂಡ್‌ಗಳು ಕಳೆದಿವೆ`);
        hasSpokenProcessing = true;
      } else if (checkCount % 5 !== 0) {
        hasSpokenProcessing = false;
      }
      
      const gradeElement = document.querySelector('.text-4xl.font-extrabold') ||
                          document.querySelector('[class*="grade"]') ||
                          document.querySelector('h3.text-4xl');
      
      const scoreElement = document.querySelector('.text-3xl.font-extrabold.text-indigo-900') ||
                          document.querySelector('[class*="quality-score"]');
      
      if (gradeElement) {
        const grade = gradeElement.textContent?.trim() || '';
        
        console.log(`🔍 Found grade element: "${grade}"`);
        
        if (grade && grade !== 'Pending' && grade !== 'N/A' && grade.length > 0) {
          clearInterval(checkInterval);
          
          const score = scoreElement ? 
            scoreElement.textContent?.replace('%', '').trim() : 
            'ಅಜ್ಞಾತ';
          
          console.log('✅ Valid grade found:', grade, 'Score:', score);
          
          const gradeMessages = {
            'A': 'ಅತ್ಯುತ್ತಮ ಗ್ರೇಡ್ A',
            'B': 'ಉತ್ತಮ ಗ್ರೇಡ್ B', 
            'C': 'ಸಾಧಾರಣ ಗ್ರೇಡ್ C',
            'D': 'ಕಡಿಮೆ ಗ್ರೇಡ್ D'
          };
          
          const gradeMessage = gradeMessages[grade] || `ಗ್ರೇಡ್ ${grade}`;
          
          if (score !== 'ಅಜ್ಞಾತ') {
            speak?.(`🎉 ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಬೆಳೆಗೆ ${gradeMessage} ಸಿಕ್ಕಿದೆ. ಗುಣಮಟ್ಟ ಸ್ಕೋರ್ ${score} ಪರ್ಸೆಂಟ್.`);
          } else {
            speak?.(`🎉 ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಬೆಳೆಗೆ ${gradeMessage} ಸಿಕ್ಕಿದೆ.`);
          }
          
          setTimeout(() => {
            speak?.('ಈಗ ನೀವು ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗಿ ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಬಹುದು. ಧನ್ಯವಾದಗಳು!');
          }, 3000);
          
          setUploadState(prev => ({ 
            ...prev, 
            step: 'COMPLETED',
            automationStep: 12
          }));
          
          setTimeout(() => {
            resetAutomation();
          }, 10000);
        }
      }
      
      if (checkCount >= maxChecks) {
        clearInterval(checkInterval);
        console.log('⏱️ Grade monitoring timeout');
        speak?.('ಗ್ರೇಡಿಂಗ್ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಪುಟವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ');
        resetAutomation();
      }
    }, 2000);
  };

  const findNextButton = () => {
    const buttons = document.querySelectorAll('button');
    
    for (const button of buttons) {
      const text = button.textContent || '';
      if ((text.includes('Next') || text.includes('ನೆಕ್ಸ್ಟ್')) && 
          !button.disabled && 
          button.style.display !== 'none') {
        return button;
      }
    }
    
    return document.querySelector('button.bg-indigo-600:not([disabled])');
  };

  const findSubmitButton = () => {
    console.log('🔍 Searching for submit button...');
    
    if (window.__submitButton && window.__submitButton.offsetParent !== null) {
      console.log('✅ Found via global ref');
      return window.__submitButton;
    }
    
    const byId = document.getElementById('final-submit-button');
    if (byId && byId.offsetParent !== null) {
      console.log('✅ Found by ID');
      return byId;
    }
    
    const byData = document.querySelector('button[data-automation="submit-crop"]');
    if (byData && byData.offsetParent !== null) {
      console.log('✅ Found by data attribute');
      return byData;
    }
    
    const byVoice = document.querySelector('button[data-voice-submit="true"]');
    if (byVoice && byVoice.offsetParent !== null) {
      console.log('✅ Found by voice submit attribute');
      return byVoice;
    }
    
    const buttons = Array.from(document.querySelectorAll('button'));
    
    for (const btn of buttons) {
      const text = btn.textContent?.trim().toLowerCase() || '';
      const hasGradient = btn.className.includes('gradient');
      const isVisible = btn.offsetParent !== null;
      
      if (isVisible && (
          text.includes('submit') ||
          text.includes('ಸಲ್ಲಿಸು') ||
          (hasGradient && text.length < 50)
      )) {
        console.log('✅ Found by comprehensive search:', text);
        return btn;
      }
    }

    const gradientButtons = buttons.filter(btn => 
      btn.className.includes('gradient') && 
      btn.offsetParent !== null
    );
    
    if (gradientButtons.length > 0) {
      console.log('⚠️ Using last gradient button as fallback');
      return gradientButtons[gradientButtons.length - 1];
    }
    
    console.error('❌ Submit button not found by any method');
    return null;
  };

  const resetAutomation = () => {
    setUploadState({
      step: 'IDLE',
      selectedFile: null,
      isFormActive: false,
      currentQuestion: null,
      formData: {
        cropType: '',
        quantity: '',
        price: '',
        location: ''
      },
      automationStep: 0
    });
  };


  // ===== PROFILE AUTOMATION FUNCTIONS =====

const startProfileSetup = async (speak) => {
  console.log('📝 Starting profile setup automation...');
  
  setUploadState(prev => ({ 
    ...prev, 
    profileStep: 'COLLECTING',
    profileQuestionIndex: 0
  }));
  
  speak?.('ಪ್ರೊಫೈಲ್ ಸೆಟಪ್ ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೇನೆ. ಮೊದಲು, ನಿಮ್ಮ ಫಾರ್ಮ್ ಅಥವಾ ಬ್ಯುಸಿನೆಸ್ ಹೆಸರು ಏನು?');
  
  // Navigate to profile page if not already there
  if (!window.location.pathname.includes('/profile')) {
    navigate('/profile');
  }
};

const startProfileEdit = async (speak) => {
  console.log('✏️ Starting profile edit automation...');
  
  setUploadState(prev => ({ 
    ...prev, 
    profileStep: 'EDITING',
    profileQuestionIndex: 0
  }));
  
  speak?.('ಪ್ರೊಫೈಲ್ ಎಡಿಟ್ ಮೋಡ್‌ಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ. ಯಾವ ಮಾಹಿತಿ ಬದಲಾಯಿಸಬೇಕು?');
  
  if (!window.location.pathname.includes('/profile')) {
    navigate('/profile');
  }
  
  // Trigger edit mode on Profile page
  setTimeout(() => {
    const editButton = document.querySelector('[data-profile-edit="true"]') ||
                       Array.from(document.querySelectorAll('button'))
                         .find(btn => btn.textContent.includes('Edit'));
    
    if (editButton) {
      editButton.click();
      console.log('✅ Clicked edit button');
    }
  }, 1500);
};

const profileQuestions = [
  { field: 'farmName', question: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಅಥವಾ ಬ್ಯುಸಿನೆಸ್ ಹೆಸರು ಏನು?' },
  { field: 'location', question: 'ನಿಮ್ಮ ಸ್ಥಳ ಎಲ್ಲಿದೆ? ನಗರ ಮತ್ತು ರಾಜ್ಯ ಹೇಳಿ' },
  { field: 'description', question: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ' },
  { field: 'contactEmail', question: 'ನಿಮ್ಮ ಸಂಪರ್ಕ ಇಮೇಲ್ ಏನು?' },
  { field: 'phoneNumber', question: 'ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ ಏನು?' },
  { field: 'farmingType', question: 'ನೀವು ಯಾವ ರೀತಿಯ ಕೃಷಿ ಮಾಡುತ್ತೀರಿ? ಸಾವಯವ ಅಥವಾ ಸಾಂಪ್ರದಾಯಿಕ?' },
  { field: 'farmSize', question: 'ನಿಮ್ಮ ಫಾರ್ಮ್ ಗಾತ್ರ ಎಷ್ಟು? ಎಕರೆಗಳಲ್ಲಿ ಹೇಳಿ' },
  { field: 'primaryCrops', question: 'ನೀವು ಮುಖ್ಯವಾಗಿ ಯಾವ ಬೆಳೆಗಳನ್ನು ಬೆಳೆಯುತ್ತೀರಿ?' },
  { field: 'expertise', question: 'ನಿಮ್ಮ ಪರಿಣಾಮಕಾರಿತ್ವ ಏನು? ಉದಾಹರಣೆಗೆ ಸಾವಯವ ಕೃಷಿ, ನೀರಾವರಿ ನಿರ್ವಹಣೆ' }
];

const handleProfileFieldUpdate = async (field, userText, speak) => {
  console.log(`📝 Updating profile field: ${field} with value: ${userText}`);
  
  // Parse the user's response based on field type
  let value = userText.trim();
  
  // Special parsing for specific fields
  if (field === 'farmSize') {
    const match = userText.match(/(\d+)\s*(ಎಕರೆ|acres|acre|hectare)/i);
    if (match) {
      value = { value: match[1], unit: 'acres' };
    }
  } else if (field === 'farmingType') {
    if (userText.includes('ಸಾವಯವ') || userText.includes('organic')) {
      value = 'organic';
    } else {
      value = 'conventional';
    }
  }
  
  // Update state
  setUploadState(prev => ({
    ...prev,
    profileData: {
      ...prev.profileData,
      [field]: value
    },
    profileQuestionIndex: prev.profileQuestionIndex + 1
  }));
  
  // Update the actual form field on the page
  setTimeout(() => {
    const input = document.querySelector(`input[name="${field}"]`) ||
                  document.querySelector(`textarea[name="${field}"]`) ||
                  document.querySelector(`select[name="${field}"]`);
    
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeInputValueSetter.call(input, typeof value === 'object' ? value.value : value);
      
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
      
      console.log(`✅ Updated form field: ${field}`);
    }
  }, 500);
  
  // Ask next question
  const currentIndex = uploadState.profileQuestionIndex + 1;
  
  if (currentIndex < profileQuestions.length) {
    const nextQ = profileQuestions[currentIndex];
    speak?.(nextQ.question);
  } else {
    // All questions answered
    speak?.('ಎಲ್ಲಾ ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ಈಗ ಸಲ್ಲಿಸುತ್ತಿದ್ದೇನೆ...');
    setTimeout(() => handleProfileSubmit(speak), 1500);
  }
};

const handleProfileSubmit = async (speak) => {
  console.log('📤 Submitting profile...');
  
  setUploadState(prev => ({ 
    ...prev, 
    profileStep: 'SUBMITTING'
  }));
  
  // Find and click submit button
  const submitButton = document.querySelector('button[type="submit"]') ||
                       Array.from(document.querySelectorAll('button'))
                         .find(btn => btn.textContent.includes('Complete') || 
                                      btn.textContent.includes('Update') ||
                                      btn.textContent.includes('Save'));
  
  if (submitButton) {
    submitButton.click();
    console.log('✅ Clicked submit button');
    
    speak?.('ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!');
    
    setTimeout(() => {
      setUploadState(prev => ({ 
        ...prev, 
        profileStep: 'COMPLETED'
      }));
      
      setTimeout(() => resetAutomation(), 3000);
    }, 2000);
  } else {
    console.error('❌ Submit button not found');
    speak?.('ಸಬ್ಮಿಟ್ ಬಟನ್ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹಸ್ತಚಾಲಿತವಾಗಿ ಸಲ್ಲಿಸಿ');
  }
};

  return {
    executeAction,
    uploadState,
    setUploadState,
    resetAutomation
  };
};

export default useVoiceController;
