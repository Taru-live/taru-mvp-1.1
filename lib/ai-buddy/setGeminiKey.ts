// Utility to set the Gemini API key
export const setGeminiAPIKey = () => {
  const apiKey = 'AIzaSyAcy_v7mHTGEm8SdNsIGZQnSA4ft_RrueA';
  localStorage.setItem('gemini_api_key', apiKey);
  console.log('Gemini API key has been set successfully');
  return apiKey;
};

// Auto-set the API key when this module is imported
if (typeof window !== 'undefined') {
  setGeminiAPIKey();
}
