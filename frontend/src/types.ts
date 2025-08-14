export interface Set {
  weight: number;
  reps: number;
}

export interface Lift {
  id: string;
  userId: string;
  exercise: string;
  sets: Set[];
  date: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  isPersonalRecord?: boolean;
  maxWeight?: number;
}

export interface LiftContextType {
  lifts: Lift[];
  addLift: (exercise: string, sets: Set[], date?: string) => Promise<void>;
  deleteLift: (id: string | number) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export interface ChartDataPoint {
  date: string;
  [exercise: string]: number | string | boolean;
}