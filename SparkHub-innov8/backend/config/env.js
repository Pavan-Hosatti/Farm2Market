// config/env.js - Ensure environment variables are loaded properly
require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET
};

// Check for missing variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ MISSING ENVIRONMENT VARIABLES:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Make sure your .env file exists and contains these variables');
  process.exit(1);
}

// Log successful loading (but hide sensitive data)
console.log('✅ Environment variables loaded successfully:');
Object.keys(requiredEnvVars).forEach(key => {
  const value = requiredEnvVars[key];
  const displayValue = key.includes('KEY') || key.includes('SECRET') || key.includes('URI')
    ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
    : value;
  console.log(`   - ${key}: ${displayValue}`);
});

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL,
  mlServiceUrl: process.env.ML_SERVICE_URL,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtCookieExpire: process.env.JWT_COOKIE_EXPIRE || 30,
  geminiApiKey: process.env.GEMINI_API_KEY,
  kannadaLanguageCode: process.env.KANNADA_LANGUAGE_CODE || 'kn-IN',
  gcpServiceAccountKey: process.env.GCP_SERVICE_ACCOUNT_KEY
};
