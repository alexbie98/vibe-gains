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
  updateLift: (id: string, exercise: string, sets: Set[], date?: string) => Promise<void>;
  deleteLift: (id: string | number) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEditLift: (lift: Lift) => void;
}

export interface BodyWeight {
  id: string;
  userId: string;
  weight: number;
  date: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChartDataPoint {
  date: string;
  [exercise: string]: number | string | boolean;
}

export interface BodyWeightChartDataPoint {
  date: string;
  weight: number;
  dateValue: number;
}