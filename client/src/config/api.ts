// API configuration
export const API_BASE_URL = ''; // Empty for same-origin requests

// Helper function to handle API requests
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  isAuthenticated?: boolean;
  user?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options.headers,
  });

  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: data.message || 'Something went wrong',
        status: response.status,
        isAuthenticated: data.isAuthenticated || false
      };
    }

    return {
      data,
      status: response.status,
      isAuthenticated: data.isAuthenticated || false,
      user: data.user
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
      isAuthenticated: false
    };
  }
}

// Auth API functions
export const authApi = {
  login: async (username: string, password: string) => {
    return apiRequest<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  getMe: async () => {
    return apiRequest<{ user: any; isAuthenticated: boolean }>('/api/me');
  },
  logout: async () => {
    // You can implement a logout endpoint on the server if needed
    return Promise.resolve();
  },
};
