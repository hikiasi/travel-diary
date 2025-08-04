import { User, Travel, AuthResponse } from '../types';

const API_BASE_URL = '/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to set auth token
const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Helper function to remove auth token
const removeAuthToken = (): void => {
  localStorage.removeItem('token');
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setAuthToken(response.token);
    return response;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.token);
    return response;
  },

  logout: (): void => {
    removeAuthToken();
  },

  getProfile: async (): Promise<{ user: User }> => {
    return apiRequest<{ user: User }>('/auth/profile');
  },
};

// Travels API
export const travelsAPI = {
  getAll: async (): Promise<{ travels: Travel[] }> => {
    return apiRequest<{ travels: Travel[] }>('/travels');
  },

  getMy: async (): Promise<{ travels: Travel[] }> => {
    return apiRequest<{ travels: Travel[] }>('/travels/my');
  },

  create: async (travelData: Omit<Travel, 'id' | 'userId' | 'userName' | 'created_at'>): Promise<{ success: boolean; travel: Travel }> => {
    return apiRequest<{ success: boolean; travel: Travel }>('/travels', {
      method: 'POST',
      body: JSON.stringify(travelData),
    });
  },

  getById: async (id: string): Promise<{ travel: Travel }> => {
    return apiRequest<{ travel: Travel }>(`/travels/${id}`);
  },

  update: async (id: string, travelData: Partial<Omit<Travel, 'id' | 'userId' | 'userName' | 'created_at'>>): Promise<{ success: boolean; travel: Travel }> => {
    return apiRequest<{ success: boolean; travel: Travel }>(`/travels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(travelData),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/travels/${id}`, {
      method: 'DELETE',
    });
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
}; 