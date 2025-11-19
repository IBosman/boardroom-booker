// API configuration
export const API_BASE_URL = ''; // Empty for same-origin requests

// Helper function to handle API requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
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
    return apiRequest<{ user: any }>('/api/me');
  },
  logout: async () => {
    // You can implement a logout endpoint on the server if needed
    return Promise.resolve();
  },
};
