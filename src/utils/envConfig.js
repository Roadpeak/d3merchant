// utils/envConfig.js - Dead simple universal environment config

let API_BASE_URL = '${import.meta.env.VITE_API_BASE_URL}/api/v1';
let API_KEY = undefined;
let SECRET_KEY = 'default-development-secret-key';
let NODE_ENV = 'development';
let framework = 'Unknown';

// Try Vite first
try {
  if (import.meta && import.meta.env) {
    API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL;
    API_KEY = import.meta.env.VITE_API_KEY || API_KEY;
    SECRET_KEY = import.meta.env.VITE_SECRET_KEY || SECRET_KEY;
    NODE_ENV = import.meta.env.NODE_ENV || NODE_ENV;
    framework = 'Vite';
  }
} catch (e) {
  // Not Vite, try Create React App
  if (typeof process !== 'undefined' && process.env) {
    API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || API_BASE_URL;
    API_KEY = process.env.REACT_APP_API_KEY || API_KEY;
    SECRET_KEY = process.env.REACT_APP_SECRET_KEY || SECRET_KEY;
    NODE_ENV = process.env.NODE_ENV || NODE_ENV;
    framework = 'Create React App';
  }
}

const envConfig = {
  API_BASE_URL,
  API_KEY,
  SECRET_KEY,
  NODE_ENV,
  framework,
  isDev: NODE_ENV === 'development',
  isProd: NODE_ENV === 'production'
};

// Debug in development
if (envConfig.isDev) {
  console.log('🔧 Environment Config:', {
    framework: envConfig.framework,
    apiBaseUrl: envConfig.API_BASE_URL,
    hasApiKey: !!envConfig.API_KEY,
    hasSecretKey: !!envConfig.SECRET_KEY
  });
}

export default envConfig;