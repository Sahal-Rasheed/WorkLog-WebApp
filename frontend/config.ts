// Application configuration
export const APP_CONFIG = {
  name: "Worklog",
  description: "Track your time, manage your projects",
  version: "2.0.0"
} as const;

// API configuration
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:4000' 
  : 'http://localhost:4000';
