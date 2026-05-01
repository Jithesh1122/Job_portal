import { API_URL, getToken } from './client.js';

export const getMyApplications = async () => {
  const token = getToken();
  const response = await fetch(`${API_URL}/applications/me`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load applications');
  }

  return data;
};

export const applyForJob = async (jobId, resumeFile) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('resume', resumeFile);

  const response = await fetch(`${API_URL}/applications/jobs/${jobId}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to apply for job');
  }

  return data;
};
