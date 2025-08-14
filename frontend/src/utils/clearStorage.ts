// Clear any existing localStorage data to ensure pure API dependency
export const clearVibeGainsStorage = () => {
  try {
    localStorage.removeItem('vibeGains');
    console.log('✅ Cleared localStorage for vibe gains');
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

// Call this on app startup
clearVibeGainsStorage();