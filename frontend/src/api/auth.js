const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const requestAuth = async (path, payload) => {
  const response = await fetch(`${API_URL}/users/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

export const login = (payload) => requestAuth('login', payload);

export const register = (payload) => requestAuth('register', payload);
