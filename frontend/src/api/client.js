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

export const apiRequest = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};
