import { apiRequest } from './client.js';

export const getJobs = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();

  return apiRequest(`/jobs${queryString ? `?${queryString}` : ''}`);
};

export const getJobMatches = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();

  return apiRequest(`/jobs/matches${queryString ? `?${queryString}` : ''}`);
};

export const createJob = (payload) =>
  apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateJob = (jobId, payload) =>
  apiRequest(`/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteJob = (jobId) =>
  apiRequest(`/jobs/${jobId}`, {
    method: 'DELETE',
  });
