export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getStoredUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getToken = () => sessionStorage.getItem('token');

export const clearAuth = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

const buildHeaders = (headers = {}, includeJson = true) => ({
  ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  ...headers,
});

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export const apiRequest = async (path, options = {}) => {
  const token = getToken();

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: buildHeaders(
        {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        options.body instanceof FormData ? false : !options.headers?.['Content-Type'] || options.headers['Content-Type'] === 'application/json',
      ),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      throw new Error(
        typeof data === 'object' && data?.message ? data.message : 'Request failed',
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the server. Please try again in a moment.');
    }

    throw error;
  }
};
