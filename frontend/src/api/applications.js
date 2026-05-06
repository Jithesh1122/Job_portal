import { API_URL, apiRequest, getToken } from './client.js';

export const getApplicationResumeDownloadUrl = (applicationId) =>
  `${API_URL}/applications/${applicationId}/resume`;

export const getApplicationResumeDownload = async (applicationId) => {
  const token = getToken();
  const response = await fetch(getApplicationResumeDownloadUrl(applicationId), {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to prepare resume download');
  }

  const contentDisposition = response.headers.get('content-disposition') || '';
  const fileNameMatch = contentDisposition.match(/filename="?(.*?)"?$/i);

  return {
    blob: await response.blob(),
    fileName: fileNameMatch?.[1] || 'resume',
    contentType: response.headers.get('content-type') || 'application/octet-stream',
  };
};

export const getMyApplications = async () => {
  return apiRequest('/applications/me');
};

export const applyForJob = async (jobId, resumeFile) => {
  const formData = new FormData();
  formData.append('resume', resumeFile);

  return apiRequest(`/applications/jobs/${jobId}`, {
    method: 'POST',
    body: formData,
  });
};

export const getRecruiterApplications = async () => {
  return apiRequest('/applications/recruiter');
};

export const updateApplicationStatus = async (applicationId, status) => {
  return apiRequest(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const sendShortlistedMessage = async (applicationId, message) => {
  return apiRequest(`/applications/${applicationId}/message`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};
