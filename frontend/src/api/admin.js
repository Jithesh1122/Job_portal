import { apiRequest } from './client.js';

export const getAllUsers = () => apiRequest('/users/admin');

export const deleteUser = (userId) =>
  apiRequest(`/users/admin/${userId}`, {
    method: 'DELETE',
  });

export const toggleUserBlockStatus = (userId) =>
  apiRequest(`/users/admin/${userId}/block`, {
    method: 'PATCH',
  });

export const approveRecruiter = (userId) =>
  apiRequest(`/users/admin/${userId}/approve`, {
    method: 'PATCH',
  });

export const getAllJobsAdmin = () => apiRequest('/jobs/admin');

export const deleteJobAdmin = (jobId) =>
  apiRequest(`/jobs/${jobId}`, {
    method: 'DELETE',
  });

export const updateJobApprovalStatus = (jobId, status) =>
  apiRequest(`/jobs/admin/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const getPlatformStats = () => apiRequest('/jobs/admin/stats');

export const getAllApplications = () => apiRequest('/applications/admin');
