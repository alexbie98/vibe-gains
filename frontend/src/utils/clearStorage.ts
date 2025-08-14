// Clear any existing localStorage data to ensure pure API dependency
export const clearLiftTrackerStorage = () => {
  try {
    localStorage.removeItem('liftTracker');
    console.log('✅ Cleared localStorage for lift tracker');
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

// Call this on app startup
clearLiftTrackerStorage();