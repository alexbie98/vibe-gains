export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface CreateLiftRequest {
  exercise: string;
  sets: Set[];
  date?: string;
}

export interface UpdateLiftRequest {
  exercise?: string;
  sets?: Set[];
  date?: string;
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

export interface CreateBodyWeightRequest {
  weight: number;
  date?: string;
}

export interface UpdateBodyWeightRequest {
  weight?: number;
  date?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}