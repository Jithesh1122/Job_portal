import { apiRequest } from './client.js';

export const getNotifications = () => apiRequest('/notifications');

export const markNotificationsRead = () =>
  apiRequest('/notifications/read', {
    method: 'PATCH',
  });
