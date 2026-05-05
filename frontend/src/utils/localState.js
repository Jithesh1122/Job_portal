const SAVED_JOBS_KEY = 'mern_saved_jobs';
const RECENTLY_VIEWED_JOBS_KEY = 'mern_recently_viewed_jobs';
const THEME_PREFERENCE_KEY = 'mern_theme_preference';
const MAX_RECENTLY_VIEWED_JOBS = 6;

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getSavedJobIds = () => readJson(SAVED_JOBS_KEY, []);

export const toggleSavedJobId = (jobId) => {
  const savedJobIds = getSavedJobIds();
  const nextSavedJobIds = savedJobIds.includes(jobId)
    ? savedJobIds.filter((savedId) => savedId !== jobId)
    : [jobId, ...savedJobIds];

  writeJson(SAVED_JOBS_KEY, nextSavedJobIds);
  return nextSavedJobIds;
};

export const getRecentlyViewedJobs = () => readJson(RECENTLY_VIEWED_JOBS_KEY, []);

export const addRecentlyViewedJob = (job) => {
  const recentlyViewedJobs = getRecentlyViewedJobs();
  const nextRecentlyViewedJobs = [
    {
      _id: job._id,
      title: job.title,
      location: job.location,
      salary: job.salary,
      skills: job.skills || [],
      recruiterName: job.recruiterId?.name || 'Recruiter',
      viewedAt: new Date().toISOString(),
    },
    ...recentlyViewedJobs.filter((item) => item._id !== job._id),
  ].slice(0, MAX_RECENTLY_VIEWED_JOBS);

  writeJson(RECENTLY_VIEWED_JOBS_KEY, nextRecentlyViewedJobs);
  return nextRecentlyViewedJobs;
};

export const getThemePreference = () => localStorage.getItem(THEME_PREFERENCE_KEY);

export const setThemePreference = (theme) => {
  localStorage.setItem(THEME_PREFERENCE_KEY, theme);
};
