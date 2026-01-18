// Utility to set the Gemini API key from environment variable
export const setGeminiAPIKey = () => {
  // Get API key from environment variable (for client-side use)
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  if (apiKey) {
    localStorage.setItem('gemini_api_key', apiKey);
    console.log('Gemini API key has been set successfully from environment variable');
    return apiKey;
  }
  return null;
};

// Auto-set the API key when this module is imported (only if available)
if (typeof window !== 'undefined') {
  setGeminiAPIKey();
}
