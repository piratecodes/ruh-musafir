// Grab the base URL from your .env file, fallback to our NestJS port
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const fetchClient = async (endpoint, options = {}) => {
  // 1. Setup standard headers
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // 2. The Configuration
  const config = {
    ...options,
    headers,
    credentials: 'include', // <-- THIS IS THE MAGIC BULLET! It forces the browser to send the HttpOnly cookie.
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // 3. SECURITY NET: 401 Unauthorized
    // We throw a generic error here so Zustand's checkAuth can catch it and wipe the user state smoothly.
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    // 4. Catch backend error messages
    if (!response.ok) {
      if (response.status === 404 || options.method === 'GET') {
        return { data: {} }; 
      }
      throw new Error(data.message || 'An error occurred with the server.');
    }

    return data; 

  } catch (error) {
    throw error;
  }
};