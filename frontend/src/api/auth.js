import { API_URL } from './client.js';

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

  sessionStorage.setItem('token', data.token);
  sessionStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

export const login = (payload) => requestAuth('login', payload);

export const register = (payload) => requestAuth('register', payload);
