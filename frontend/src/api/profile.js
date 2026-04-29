import { apiRequest } from './client.js';

export const getMyProfile = () => apiRequest('/profile/me');

export const updateMyProfile = (payload) =>
  apiRequest('/profile/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const getCandidateProfiles = () => apiRequest('/profile/candidates');
