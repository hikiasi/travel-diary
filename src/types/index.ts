export interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

export interface Travel {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  location: string;
  cost: number;
  images: string[];
  cultural_sites: string[];
  places_to_visit: string[];
  ratings: {
    mobility: number;
    safety: number;
    population: number;
    vegetation: number;
  };
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
} 