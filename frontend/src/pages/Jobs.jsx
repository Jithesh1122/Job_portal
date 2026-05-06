import { useEffect, useMemo, useState } from 'react';
import {
  applyForJob,
  getMyApplications,
  getRecruiterApplications,
} from '../api/applications.js';
import { getStoredUser } from '../api/client.js';
import {
  createJob,
  deleteJob,
  getJobMatches,
  getJobs,
  updateJob,
} from '../api/jobs.js';
import { getMyProfile } from '../api/profile.js';
import { SkeletonCard } from '../components/Skeleton.jsx';
import {
  addRecentlyViewedJob,
  getSavedJobIds,
  toggleSavedJobId,
} from '../utils/localState.js';

const emptyForm = {
  title: '',
  description: '',
  skills: '',
  salary: '',
  location: '',
};

const emptyFilters = {
  keyword: '',
  location: '',
  skills: '',
  salaryRange: '',
};

const salaryRanges = [
  { label: 'Any salary', value: '' },
  { label: 'Under 30000', value: '0-30000' },
  { label: '30000 to 60000', value: '30000-60000' },
  { label: '60000 to 100000', value: '60000-100000' },
  { label: 'Above 100000', value: '100000-' },
];

const jobsPerPage = 4;

const getRecruiterId = (job) =>
  typeof job.recruiterId === 'string' ? job.recruiterId : job.recruiterId?._id;

const parseSalaryRange = (salaryRange) => {
  if (!salaryRange) {
    return {};
  }

  const [minSalary, maxSalary] = salaryRange.split('-');

  return {
    minSalary,
    maxSalary,
  };
};

const formatSalary = (salary) => (salary ? `Salary: ${salary}` : 'Salary not listed');

const getJobMatchFallback = {
  matchPercentage: 0,
  matchedSkills: [],
};

const isProfileComplete = (profile) =>
  Boolean(
    profile &&
      profile.skills?.length &&
      profile.education?.length,
  );

function Jobs() {
  const user = getStoredUser();
  const canManageJobs = user?.role === 'recruiter' || user?.role === 'admin';
  const canApplyForJobs = user?.role === 'candidate';
  const [jobs, setJobs] = useState([]);
  const [jobMatches, setJobMatches] = useState({});
  const [applications, setApplications] = useState([]);
  const [resumeFiles, setResumeFiles] = useState({});
  const [filters, setFilters] = useState(emptyFilters);
  const [formData, setFormData] = useState(emptyForm);
  const [editingJobId, setEditingJobId] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApplicantsJobId, setSelectedApplicantsJobId] = useState(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(() => getSavedJobIds());
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(canApplyForJobs);
  const [profileReadyToApply, setProfileReadyToApply] = useState(!canApplyForJobs);
  const [filterOptions, setFilterOptions] = useState({
    locations: [],
    skills: [],
  });

  const formTitle = useMemo(
    () => (editingJobId ? 'Edit Job' : 'Post a Job'),
    [editingJobId],
  );

  const loadJobs = async (activeFilters = filters) => {
    try {
      setIsLoading(true);
      const data = await getJobs({
        keyword: activeFilters.keyword,
        location: activeFilters.location,
        skills: activeFilters.skills,
        ...parseSalaryRange(activeFilters.salaryRange),
      });

      const locations = [
        ...new Set(data.jobs.map((job) => job.location).filter(Boolean)),
      ].sort();
      const skills = [...new Set(data.jobs.flatMap((job) => job.skills || []))].sort();

      setJobs(data.jobs);
      setFilterOptions({ locations, skills });
      setSelectedJobId((currentSelectedJobId) => {
        if (currentSelectedJobId && data.jobs.some((job) => job._id === currentSelectedJobId)) {
          return currentSelectedJobId;
        }

        return canManageJobs ? data.jobs[0]?._id || null : null;
      });
    } catch (jobsError) {
      setError(jobsError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobMatches = async (activeFilters = filters) => {
    if (!canApplyForJobs) {
      return;
    }

    try {
      const data = await getJobMatches({
        keyword: activeFilters.keyword,
        location: activeFilters.location,
        skills: activeFilters.skills,
        ...parseSalaryRange(activeFilters.salaryRange),
      });
      const matchesByJobId = Object.fromEntries(
        data.matches.map((match) => [match.jobId, match]),
      );
      setJobMatches(matchesByJobId);
    } catch (matchError) {
      setError(matchError.message);
    }
  };

  const loadApplications = async () => {
    try {
      const data = canApplyForJobs
        ? await getMyApplications()
        : await getRecruiterApplications();
      setApplications(data.applications);
    } catch (applicationError) {
      setError(applicationError.message);
    }
  };

  useEffect(() => {
    loadJobs(filters);
    loadJobMatches(filters);
  }, []);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!canApplyForJobs) {
        return;
      }

      try {
        setIsProfileLoading(true);
        const data = await getMyProfile();
        setProfileReadyToApply(isProfileComplete(data.profile));
      } catch (profileError) {
        setError(profileError.message);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [canApplyForJobs]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadJobs(filters);
      loadJobMatches(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const getJobMatch = (jobId) => jobMatches[jobId] || getJobMatchFallback;

  const rankedJobs = useMemo(() => {
    if (!canApplyForJobs) {
      return jobs;
    }

    return [...jobs].sort((a, b) => {
      const matchDifference =
        getJobMatch(b._id).matchPercentage - getJobMatch(a._id).matchPercentage;

      if (matchDifference !== 0) {
        return matchDifference;
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [canApplyForJobs, jobs, jobMatches]);

  const savedJobs = useMemo(
    () => rankedJobs.filter((job) => savedJobIds.includes(job._id)),
    [rankedJobs, savedJobIds],
  );

  const totalPages = Math.max(1, Math.ceil(rankedJobs.length / jobsPerPage));

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return rankedJobs.slice(startIndex, startIndex + jobsPerPage);
  }, [currentPage, rankedJobs]);

  const handleSelectJob = (job) => {
    const jobIndex = rankedJobs.findIndex((rankedJob) => rankedJob._id === job._id);

    if (jobIndex >= 0) {
      setCurrentPage(Math.floor(jobIndex / jobsPerPage) + 1);
    }

    setSelectedJobId((currentSelectedJobId) =>
      currentSelectedJobId === job._id ? null : job._id,
    );
    addRecentlyViewedJob(job);
  };

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFilterChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  const handleResumeChange = (jobId, file) => {
    setResumeFiles((current) => ({
      ...current,
      [jobId]: file,
    }));
  };

  const buildPayload = () => ({
    title: formData.title,
    description: formData.description,
    skills: formData.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    salary: formData.salary,
    location: formData.location,
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingJobId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    try {
      if (editingJobId) {
        await updateJob(editingJobId, buildPayload());
        setStatus('Job updated successfully');
      } else {
        await createJob(buildPayload());
        setStatus('Job posted successfully');
      }

      resetForm();
      await loadJobs(filters);
      await loadJobMatches(filters);
    } catch (jobError) {
      setError(jobError.message);
    }
  };

  const handleEdit = (job) => {
    setEditingJobId(job._id);
    setSelectedJobId(job._id);
    setFormData({
      title: job.title || '',
      description: job.description || '',
      skills: (job.skills || []).join(', '),
      salary: job.salary ?? '',
      location: job.location || '',
    });
    setStatus('');
    setError('');
  };

  const handleDelete = async (jobId) => {
    setError('');
    setStatus('');

    try {
      await deleteJob(jobId);
      setStatus('Job deleted successfully');
      await loadJobs(filters);
      await loadJobMatches(filters);
    } catch (jobError) {
      setError(jobError.message);
    }
  };

  const handleToggleSavedJob = (jobId) => {
    setSavedJobIds(toggleSavedJobId(jobId));
  };

  const canEditJob = (job) =>
    user?.role === 'admin' || getRecruiterId(job) === user?.id;

  const hasApplied = (jobId) =>
    applications.some((application) => application.jobId?._id === jobId);

  const applicationsForJob = (jobId) =>
    applications.filter((application) => application.jobId?._id === jobId);

  const handleApply = async (jobId) => {
    setError('');
    setStatus('');

    if (!profileReadyToApply) {
      setError(
        'Complete your profile with skills and education before applying',
      );
      return;
    }

    const resumeFile = resumeFiles[jobId];

    if (!resumeFile) {
      setError('Please choose a resume before applying');
      return;
    }

    try {
      await applyForJob(jobId, resumeFile);
      setStatus('Application submitted successfully');
      setResumeFiles((current) => ({
        ...current,
        [jobId]: null,
      }));
      await loadApplications();
    } catch (applicationError) {
      setError(applicationError.message);
    }
  };

  const handleResumeView = (resumeUrl) => {
    setError('');
    setStatus('Resume opened in a new tab');
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleToggleApplicants = (jobId) => {
    setSelectedApplicantsJobId((currentJobId) =>
      currentJobId === jobId ? null : jobId,
    );
    setSelectedApplicantId(null);
  };

  const handleToggleApplicantDetails = (applicationId) => {
    setSelectedApplicantId((currentApplicationId) =>
      currentApplicationId === applicationId ? null : applicationId,
    );
  };

  return (
    <section className="page-fade-up space-y-8">
      <section className="lift-on-hover overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88 lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-cyan-300">
                {canManageJobs ? 'Recruiter Workspace' : 'Job Discovery'}
              </p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900 dark:text-slate-100">
                {canManageJobs ? 'Manage openings and track applicants clearly.' : 'Find roles worth your next move.'}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                {canManageJobs
                  ? 'Post roles, update listings, and review candidate activity from one cleaner hiring workspace.'
                  : 'Search roles, compare fit, save strong leads, and keep every application in one easy-to-scan place.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {canManageJobs ? 'Posted Jobs' : 'Saved Jobs'}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {canManageJobs ? jobs.filter((job) => canEditJob(job)).length : savedJobIds.length}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
                <p className="text-sm text-slate-500 dark:text-slate-400">Showing</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{jobs.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {canManageJobs ? 'Applicants' : 'Applications'}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{applications.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {canManageJobs ? 'Open Review Panels' : 'Profile Ready'}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {canManageJobs
                    ? selectedApplicantsJobId
                      ? 1
                      : 0
                    : isProfileLoading
                      ? '...'
                      : profileReadyToApply
                        ? 'Yes'
                        : 'No'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-5 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {canManageJobs ? 'Hiring Focus' : 'Application Readiness'}
            </p>
            {canManageJobs ? (
              <>
                <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Keep job cards lightweight, and open applicants only when you need them.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Use the posting form below to publish openings, then expand individual listings to review applicants, resumes, and match details without crowding the full page.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Save interesting roles and apply only when your profile is ready.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  We keep saved roles and application status close by so you can browse calmly instead of losing track of what you have already touched.
                </p>
                {!profileReadyToApply ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                    {isProfileLoading
                      ? 'Checking your profile before applications are enabled.'
                      : 'Complete your profile with skills and education before applying.'}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-800 dark:text-cyan-200">
          {status}
        </div>
      ) : null}

      {canManageJobs ? (
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <form
            className="lift-on-hover space-y-5 rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88"
            onSubmit={handleSubmit}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-cyan-300">
                  Posting Panel
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {formTitle}
                </h2>
              </div>
              {editingJobId ? (
                <button
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="grid gap-4">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
                name="title"
                onChange={handleChange}
                placeholder="Job title"
                required
                value={formData.title}
              />
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
                name="description"
                onChange={handleChange}
                placeholder="Describe the role, responsibilities, and expectations"
                required
                rows="5"
                value={formData.description}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
                name="skills"
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
                value={formData.skills}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
                  min="0"
                  name="salary"
                  onChange={handleChange}
                  placeholder="Salary"
                  type="number"
                  value={formData.salary}
                />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
                  name="location"
                  onChange={handleChange}
                  placeholder="Location"
                  required
                  value={formData.location}
                />
              </div>
            </div>

            <button
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:from-teal-400 hover:to-cyan-400"
              type="submit"
            >
              {editingJobId ? 'Update job' : 'Post job'}
            </button>
          </form>

          <div className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-cyan-300">
                  Recent Applicants
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Hiring activity at a glance
                </h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {applications.slice(0, 4).length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Once candidates start applying, their activity will show up here for a quick scan.
                </p>
              ) : (
                applications.slice(0, 4).map((application) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]"
                    key={application._id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {application.userId?.name || 'Candidate'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {application.jobId?.title || 'Deleted job'}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold capitalize text-white dark:bg-cyan-400 dark:text-slate-950">
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {canApplyForJobs ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Applied Jobs</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Keep the roles you already acted on close by.
                </p>
              </div>
            </div>
            {applications.length === 0 ? (
              <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
                You have not applied for any jobs yet.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {applications.map((application) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]"
                    key={application._id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {application.jobId?.title || 'Deleted job'}
                        </p>
                        <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                          Status: {application.status}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-slate-200 px-3 py-2 text-sm text-teal-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-cyan-200 dark:hover:bg-white/10"
                        onClick={() => handleResumeView(application.resumeUrl)}
                        type="button"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {savedJobs.length > 0 ? (
            <div className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Saved Jobs</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Open any saved role and jump straight to its full details.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 dark:bg-[#132131] dark:text-slate-300">
                  {savedJobs.length} saved
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {savedJobs.map((job) => (
                  <button
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-white/10"
                    key={job._id}
                    onClick={() => handleSelectJob(job)}
                    type="button"
                  >
                    {job.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-cyan-300">
              Search and Filter
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Narrow the list without losing the bigger picture.
            </h2>
          </div>
          <div className="grid gap-3 xl:grid-cols-[1.5fr_0.9fr_0.9fr_0.9fr_auto]">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
              name="keyword"
              onChange={handleFilterChange}
              placeholder="Search title, description, skills"
              value={filters.keyword}
            />
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
              name="location"
              onChange={handleFilterChange}
              value={filters.location}
            >
              <option value="">All locations</option>
              {filterOptions.locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
              name="skills"
              onChange={handleFilterChange}
              value={filters.skills}
            >
              <option value="">All skills</option>
              {filterOptions.skills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
              name="salaryRange"
              onChange={handleFilterChange}
              value={filters.salaryRange}
            >
              {salaryRanges.map((range) => (
                <option key={range.label} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-full border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing {jobs.length} matching {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : null}

        {!isLoading && jobs.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200/80 bg-white/88 p-6 text-slate-600 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88 dark:text-slate-300">
            No jobs match the current filters.
          </div>
        ) : null}

        {!isLoading
          ? paginatedJobs.map((job) => {
              const jobMatch = getJobMatch(job._id);
              const isRecommended = canApplyForJobs && jobMatch.matchPercentage >= 50;
              const isSaved = savedJobIds.includes(job._id);
              const isSelected = selectedJobId === job._id;

              return (
                <article
                  className={`lift-on-hover rounded-[28px] border p-6 shadow-sm transition ${
                    isSelected
                      ? 'border-teal-400/50 bg-teal-50/75 dark:border-cyan-400/25 dark:bg-cyan-400/[0.07]'
                      : 'border-slate-200/80 bg-white/88 dark:border-cyan-950/25 dark:bg-[#101b28]/88'
                  }`}
                  key={job._id}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                          {job.title}
                        </h2>
                        {isRecommended ? (
                          <span className="rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 px-3 py-1 text-sm font-semibold text-slate-950">
                            {jobMatch.matchPercentage}% Match
                          </span>
                        ) : null}
                        {job.status ? (
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-cyan-950/30 dark:text-slate-400">
                            {job.status}
                          </span>
                        ) : null}
                      </div>
                      {job.skills?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.skills.map((skill) => (
                            <span
                              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-[#132131] dark:text-cyan-200"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
                        onClick={() => handleSelectJob(job)}
                        type="button"
                      >
                        {isSelected ? 'Hide details' : 'View details'}
                      </button>
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          isSaved
                            ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10'
                        }`}
                        onClick={() => handleToggleSavedJob(job._id)}
                        type="button"
                      >
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      {canManageJobs && canEditJob(job) ? (
                        <>
                          <button
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
                            onClick={() => handleToggleApplicants(job._id)}
                            type="button"
                          >
                            {selectedApplicantsJobId === job._id
                              ? 'Hide applicants'
                              : `View applicants (${applicationsForJob(job._id).length})`}
                          </button>
                          <button
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
                            onClick={() => handleEdit(job)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                            onClick={() => handleDelete(job._id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="mt-5 grid gap-4 rounded-[24px] border border-slate-200/80 bg-slate-50/85 p-5 dark:border-cyan-950/25 dark:bg-[#132131] lg:grid-cols-[0.9fr_1.1fr]">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-cyan-950/20 dark:bg-[#101b28]">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Quick Facts
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {job.location}
                            <br />
                            {formatSalary(job.salary)}
                          </p>
                        </div>
                        {isRecommended && jobMatch.matchedSkills.length > 0 ? (
                          <div className="rounded-2xl border border-teal-300/40 bg-teal-500/10 p-4 dark:border-cyan-400/20">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-cyan-200">
                              Matched Skills
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              {jobMatch.matchedSkills.join(', ')}
                            </p>
                          </div>
                        ) : null}
                        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-cyan-950/20 dark:bg-[#101b28]">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Posted By
                          </p>
                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                            {job.recruiterId?.name || 'Recruiter'}
                            {job.recruiterId?.companyName
                              ? ` at ${job.recruiterId.companyName}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 dark:border-cyan-950/20 dark:bg-[#101b28]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Role Description
                        </p>
                        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                          {job.description}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {canManageJobs && selectedApplicantsJobId === job._id ? (
                    <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-slate-50/85 p-5 dark:border-cyan-950/25 dark:bg-[#132131]">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Applicants
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                            Candidates for {job.title}
                          </h3>
                        </div>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-cyan-400 dark:text-slate-950">
                          {applicationsForJob(job._id).length} applicants
                        </span>
                      </div>
                      <div className="mt-5 space-y-3">
                        {applicationsForJob(job._id).length === 0 ? (
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            No applicants for this job yet.
                          </p>
                        ) : (
                          applicationsForJob(job._id).map((application) => (
                            <div
                              className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 dark:border-cyan-950/20 dark:bg-[#101b28]"
                              key={application._id}
                            >
                              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                      {application.userId?.name || 'Candidate'}
                                    </p>
                                    <span className="rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 px-2.5 py-1 text-xs font-bold text-slate-950">
                                      {application.matchPercentage || 0}% match
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {application.userId?.email}
                                  </p>
                                  <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                                    Status: {application.status}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
                                    onClick={() => handleToggleApplicantDetails(application._id)}
                                    type="button"
                                  >
                                    {selectedApplicantId === application._id
                                      ? 'Hide details'
                                      : 'View details'}
                                  </button>
                                  <button
                                    className="rounded-full border border-slate-200 px-4 py-2 text-sm text-teal-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-cyan-200 dark:hover:bg-white/10"
                                    onClick={() => handleResumeView(application.resumeUrl)}
                                    type="button"
                                  >
                                    Resume
                                  </button>
                                </div>
                              </div>
                              {selectedApplicantId === application._id ? (
                                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      Contact
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                      {application.candidateProfile?.contactDetails?.phone ||
                                      application.candidateProfile?.contactDetails?.alternateEmail
                                        ? [
                                            application.candidateProfile?.contactDetails?.phone,
                                            application.candidateProfile?.contactDetails?.alternateEmail,
                                          ]
                                            .filter(Boolean)
                                            .join(' | ')
                                        : 'No contact details added'}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      Skills
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                      {application.candidateProfile?.skills?.length
                                        ? application.candidateProfile.skills.join(', ')
                                        : 'No profile skills added'}
                                    </p>
                                  </div>
                                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      Education
                                    </p>
                                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                      {application.candidateProfile?.education?.length
                                        ? `${application.candidateProfile.education[0].degree || 'Degree'}${application.candidateProfile.education[0].institution ? `, ${application.candidateProfile.education[0].institution}` : ''}`
                                        : 'No education details'}
                                    </p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}

                  {canApplyForJobs ? (
                    <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-slate-50/85 p-5 dark:border-cyan-950/25 dark:bg-[#132131]">
                      {hasApplied(job._id) ? (
                        <p className="text-sm font-medium text-teal-700 dark:text-cyan-200">
                          You have already applied for this job.
                        </p>
                      ) : (
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                          <input
                            accept=".pdf,.doc,.docx"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none ring-cyan-500 transition file:mr-3 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-teal-400 file:to-cyan-400 file:px-3 file:py-1 file:font-semibold file:text-slate-950 focus:ring-2 dark:border-cyan-950/30 dark:bg-[#101b28] dark:text-white"
                            onChange={(event) =>
                              handleResumeChange(job._id, event.target.files?.[0] || null)
                            }
                            type="file"
                          />
                          <button
                            className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-2.5 font-semibold text-slate-950 transition hover:from-teal-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isProfileLoading || !profileReadyToApply}
                            onClick={() => handleApply(job._id)}
                            type="button"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          : null}
      </section>

      {!isLoading && jobs.length > jobsPerPage ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            type="button"
          >
            Previous
          </button>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
                key={page}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-white/10"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

export default Jobs;
