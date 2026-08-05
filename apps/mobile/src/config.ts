export const API_BASE_URL = 
  (typeof process !== 'undefined' && (process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL)) 
  || 'https://streamflix-hes5.onrender.com';