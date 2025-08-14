import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Lift, Set, LiftContextType } from '../types';
import { apiService } from '../services/api';

const LiftContext = createContext<LiftContextType | undefined>(undefined);

export const useLiftContext = () => {
  const context = useContext(LiftContext);
  if (!context) {
    throw new Error('useLiftContext must be used within a LiftProvider');
  }
  return context;
};

interface LiftProviderProps {
  children: ReactNode;
}

export const LiftProvider: React.FC<LiftProviderProps> = ({ children }) => {
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create a consistent "today" value that all components can use
  const today = useMemo(() => new Date().toDateString(), []);

  // Function to detect PRs and enrich lift data
  const enrichLiftsWithPRs = (lifts: Lift[]): Lift[] => {
    const exerciseRecords: { [exercise: string]: number } = {};
    const exerciseFirstSeen: { [exercise: string]: boolean } = {};
    
    // Sort lifts by timestamp to process chronologically
    const sortedLifts = [...lifts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return sortedLifts.map(lift => {
      const maxWeight = Math.max(...lift.sets.map(set => set.weight));
      const previousRecord = exerciseRecords[lift.exercise] || 0;
      const isFirstInstance = !exerciseFirstSeen[lift.exercise];
      
      // A PR is only when you beat a previous record AND it's not the first time doing this exercise
      const isPersonalRecord = !isFirstInstance && maxWeight > previousRecord;
      
      // Mark this exercise as seen and update the record
      exerciseFirstSeen[lift.exercise] = true;
      exerciseRecords[lift.exercise] = Math.max(exerciseRecords[lift.exercise] || 0, maxWeight);
      
      return {
        ...lift,
        maxWeight,
        isPersonalRecord
      };
    });
  };

  // Load lifts from API on mount
  useEffect(() => {
    loadLifts();
  }, []);

  const loadLifts = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedLifts = await apiService.getLifts();
      const enrichedLifts = enrichLiftsWithPRs(fetchedLifts);
      setLifts(enrichedLifts);
    } catch (err) {
      console.error('Failed to load lifts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lifts');
      setLifts([]); // Clear lifts on error instead of fallback
    } finally {
      setLoading(false);
    }
  };

  const addLift = async (exercise: string, sets: Set[], date?: string) => {
    try {
      setError(null);
      let liftDate: string;
      
      if (date) {
        // Parse the date properly to avoid timezone issues
        // Date input gives us "YYYY-MM-DD" format, so we need to handle it carefully
        const [year, month, day] = date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day); // month is 0-indexed
        liftDate = localDate.toDateString();
      } else {
        liftDate = today;
      }
      
      const newLift = await apiService.createLift({
        exercise,
        sets,
        date: liftDate
      });
      // Re-enrich all lifts including the new one to detect PRs
      const updatedLifts = enrichLiftsWithPRs([newLift, ...lifts]);
      setLifts(updatedLifts);
    } catch (err) {
      console.error('Failed to create lift:', err);
      setError(err instanceof Error ? err.message : 'Failed to create lift');
      throw err; // Re-throw to let component handle the error
    }
  };

  const deleteLift = async (id: string) => {
    try {
      setError(null);
      await apiService.deleteLift(id);
      setLifts(prev => prev.filter(lift => lift.id !== id));
    } catch (err) {
      console.error('Failed to delete lift:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete lift');
      throw err; // Re-throw to let component handle the error
    }
  };

  const contextValue: LiftContextType & { loading: boolean; error: string | null; refreshLifts: () => Promise<void>; searchTerm: string; setSearchTerm: (term: string) => void; today: string } = {
    lifts,
    addLift,
    deleteLift: (id: string | number) => deleteLift(String(id)),
    loading,
    error,
    refreshLifts: loadLifts,
    searchTerm,
    setSearchTerm,
    today
  };

  return (
    <LiftContext.Provider value={contextValue}>
      {children}
    </LiftContext.Provider>
  );
};