import { apiRequest } from './client.js';

const requestAuth = async (path, payload) => {
  const data = await apiRequest(`/users/${path}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  sessionStorage.setItem('token', data.token);
  sessionStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

export const login = (payload) => requestAuth('login', payload);

export const register = (payload) => requestAuth('register', payload);
