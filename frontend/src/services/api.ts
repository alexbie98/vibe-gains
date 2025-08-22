import { Lift, Set, BodyWeight } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateLiftRequest {
  exercise: string;
  sets: Set[];
  date?: string;
}

export interface CreateBodyWeightRequest {
  weight: number;
  date?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, config);
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      console.log('📦 API Data:', data);

      if (!data.success) {
        console.error('❌ API Error:', data.error);
        throw new Error(data.error || 'API request failed');
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`🚫 Network Error: Cannot connect to backend at ${API_BASE_URL}`);
        throw new Error('Cannot connect to backend server. Please ensure the backend is running.');
      }
      console.error(`❌ API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Lift operations
  async getLifts(startDate?: string, endDate?: string): Promise<Lift[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    const endpoint = `/lifts${query ? `?${query}` : ''}`;
    
    return this.request<Lift[]>(endpoint);
  }

  async getLift(id: string): Promise<Lift> {
    return this.request<Lift>(`/lifts/${id}`);
  }

  async createLift(liftData: CreateLiftRequest): Promise<Lift> {
    return this.request<Lift>('/lifts', {
      method: 'POST',
      body: JSON.stringify(liftData),
    });
  }

  async updateLift(id: string, liftData: Partial<CreateLiftRequest>): Promise<Lift> {
    return this.request<Lift>(`/lifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(liftData),
    });
  }

  async deleteLift(id: string): Promise<void> {
    return this.request<void>(`/lifts/${id}`, {
      method: 'DELETE',
    });
  }

  // User operations
  async getDefaultUser(): Promise<any> {
    return this.request<any>('/users/default');
  }

  async getUsers(): Promise<any[]> {
    return this.request<any[]>('/users');
  }

  // Body weight operations
  async getBodyWeights(startDate?: string, endDate?: string): Promise<BodyWeight[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    const endpoint = `/body-weights${query ? `?${query}` : ''}`;
    
    return this.request<BodyWeight[]>(endpoint);
  }

  async getBodyWeight(id: string): Promise<BodyWeight> {
    return this.request<BodyWeight>(`/body-weights/${id}`);
  }

  async createBodyWeight(bodyWeightData: CreateBodyWeightRequest): Promise<BodyWeight> {
    return this.request<BodyWeight>('/body-weights', {
      method: 'POST',
      body: JSON.stringify(bodyWeightData),
    });
  }

  async updateBodyWeight(id: string, bodyWeightData: Partial<CreateBodyWeightRequest>): Promise<BodyWeight> {
    return this.request<BodyWeight>(`/body-weights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bodyWeightData),
    });
  }

  async deleteBodyWeight(id: string): Promise<void> {
    return this.request<void>(`/body-weights/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  }
}

export const apiService = new ApiService();