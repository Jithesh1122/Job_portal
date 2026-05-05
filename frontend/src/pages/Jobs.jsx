import { useEffect, useMemo, useState } from 'react';
import { applyForJob, getMyApplications } from '../api/applications.js';
import { getStoredUser } from '../api/client.js';
import {
  createJob,
  deleteJob,
  getJobMatches,
  getJobs,
  updateJob,
} from '../api/jobs.js';
import { SkeletonCard } from '../components/Skeleton.jsx';
import {
  addRecentlyViewedJob,
  getRecentlyViewedJobs,
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
  const [savedJobIds, setSavedJobIds] = useState(() => getSavedJobIds());
  const [recentlyViewedJobs, setRecentlyViewedJobs] = useState(() => getRecentlyViewedJobs());
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
      setJobs(data.jobs);
      setSelectedJobId((currentSelectedJobId) => {
        if (currentSelectedJobId && data.jobs.some((job) => job._id === currentSelectedJobId)) {
          return currentSelectedJobId;
        }

        return data.jobs[0]?._id || null;
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
    if (!canApplyForJobs) {
      return;
    }

    try {
      const data = await getMyApplications();
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
    const loadFilterOptions = async () => {
      try {
        const data = await getJobs();
        const locations = [
          ...new Set(data.jobs.map((job) => job.location).filter(Boolean)),
        ].sort();
        const skills = [...new Set(data.jobs.flatMap((job) => job.skills || []))].sort();

        setFilterOptions({ locations, skills });
      } catch (jobsError) {
        setError(jobsError.message);
      }
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadJobs(filters);
      loadJobMatches(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId) || jobs[0] || null,
    [jobs, selectedJobId],
  );

  const savedJobs = useMemo(
    () => jobs.filter((job) => savedJobIds.includes(job._id)),
    [jobs, savedJobIds],
  );

  const totalPages = Math.max(1, Math.ceil(jobs.length / jobsPerPage));

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    return jobs.slice(startIndex, startIndex + jobsPerPage);
  }, [currentPage, jobs]);

  const getJobMatch = (jobId) => jobMatches[jobId] || getJobMatchFallback;

  const handleSelectJob = (job) => {
    setSelectedJobId(job._id);
    setRecentlyViewedJobs(addRecentlyViewedJob(job));
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

  const handleApply = async (jobId) => {
    setError('');
    setStatus('');

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

  return (
    <section className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Search, save, and track roles in one place. Recruiters can also manage
            postings from here.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/80">
              <p className="text-sm text-slate-500 dark:text-slate-400">Saved</p>
              <p className="mt-2 text-3xl font-bold">{savedJobIds.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/80">
              <p className="text-sm text-slate-500 dark:text-slate-400">Recently viewed</p>
              <p className="mt-2 text-3xl font-bold">{recentlyViewedJobs.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900/80">
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing</p>
              <p className="mt-2 text-3xl font-bold">{jobs.length}</p>
            </div>
          </div>
        </div>

        {canManageJobs ? (
          <form
            className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            onSubmit={handleSubmit}
          >
            <h2 className="text-xl font-semibold">{formTitle}</h2>
            {error ? (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            {status ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {status}
              </div>
            ) : null}
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              name="title"
              onChange={handleChange}
              placeholder="Job title"
              required
              value={formData.title}
            />
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              name="description"
              onChange={handleChange}
              placeholder="Job description"
              required
              rows="4"
              value={formData.description}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              name="skills"
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB"
              value={formData.skills}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                min="0"
                name="salary"
                onChange={handleChange}
                placeholder="Salary"
                type="number"
                value={formData.salary}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                name="location"
                onChange={handleChange}
                placeholder="Location"
                required
                value={formData.location}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-full bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
                type="submit"
              >
                {editingJobId ? 'Update job' : 'Post job'}
              </button>
              {editingJobId ? (
                <button
                  className="rounded-full border border-slate-200 px-4 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            Login as a recruiter to post jobs.
          </div>
        )}

        {selectedJob ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-500 dark:text-emerald-300">
                  Selected role
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedJob.title}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {selectedJob.location} | {formatSalary(selectedJob.salary)}
                </p>
              </div>
              <button
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  savedJobIds.includes(selectedJob._id)
                    ? 'bg-emerald-400 text-slate-950'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10'
                }`}
                onClick={() => handleToggleSavedJob(selectedJob._id)}
                type="button"
              >
                {savedJobIds.includes(selectedJob._id) ? 'Saved' : 'Save'}
              </button>
            </div>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              {selectedJob.description}
            </p>
            {selectedJob.skills?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedJob.skills.map((skill) => (
                  <span
                    className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-200"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Posted by {selectedJob.recruiterId?.name || 'Recruiter'}
            </p>
          </div>
        ) : null}

        {canApplyForJobs ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-semibold">Applied Jobs</h2>
            {applications.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                You have not applied for any jobs yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {applications.map((application) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-slate-900"
                    key={application._id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {application.jobId?.title || 'Deleted job'}
                        </p>
                        <p className="mt-1 capitalize text-slate-500 dark:text-slate-400">
                          Status: {application.status}
                        </p>
                      </div>
                      <a
                        className="rounded-full border border-slate-200 px-3 py-2 text-emerald-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-emerald-200 dark:hover:bg-white/10"
                        href={application.resumeUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Resume
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </aside>

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_0.85fr_0.85fr_0.85fr_auto]">
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              name="keyword"
              onChange={handleFilterChange}
              placeholder="Search title, description, skills"
              value={filters.keyword}
            />
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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
              className="rounded-full border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing {jobs.length} matching {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {savedJobs.length > 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Saved Jobs</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quick shortlist from your bookmarks
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {savedJobs.slice(0, 4).map((job) => (
                <button
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

        {recentlyViewedJobs.length > 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recently Viewed</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Resume where you left off
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {recentlyViewedJobs.slice(0, 4).map((job) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                  key={job._id}
                >
                  <p className="font-semibold">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {job.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : null}

          {!isLoading && jobs.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
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
                    className={`rounded-3xl border p-6 shadow-sm transition ${
                      isSelected
                        ? 'border-emerald-400/60 bg-emerald-50/80 dark:bg-emerald-400/[0.08]'
                        : 'border-slate-200/80 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]'
                    }`}
                    key={job._id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-semibold">{job.title}</h2>
                          {isRecommended ? (
                            <span className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-semibold text-slate-950">
                              {jobMatch.matchPercentage}% Match
                            </span>
                          ) : null}
                          {job.status ? (
                            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                              {job.status}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {job.location} | {formatSalary(job.salary)}
                        </p>
                        {isRecommended && jobMatch.matchedSkills.length > 0 ? (
                          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-200">
                            Matched skills: {jobMatch.matchedSkills.join(', ')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                          onClick={() => handleSelectJob(job)}
                          type="button"
                        >
                          View details
                        </button>
                        <button
                          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                            isSaved
                              ? 'bg-emerald-400 text-slate-950'
                              : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10'
                          }`}
                          onClick={() => handleToggleSavedJob(job._id)}
                          type="button"
                        >
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                        {canManageJobs && canEditJob(job) ? (
                          <>
                            <button
                              className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                              onClick={() => handleEdit(job)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-red-400/30 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                              onClick={() => handleDelete(job._id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                      {job.description}
                    </p>
                    {job.skills?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <span
                            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-900 dark:text-emerald-200"
                            key={skill}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      Posted by {job.recruiterId?.name || 'Recruiter'}
                    </p>
                    {canApplyForJobs ? (
                      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
                        {hasApplied(job._id) ? (
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
                            You have already applied for this job.
                          </p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <input
                              accept=".pdf,.doc,.docx"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none ring-emerald-400 transition file:mr-3 file:rounded-full file:border-0 file:bg-emerald-400 file:px-3 file:py-1 file:font-semibold file:text-slate-950 focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                              onChange={(event) =>
                                handleResumeChange(job._id, event.target.files?.[0] || null)
                              }
                              type="file"
                            />
                            <button
                              className="rounded-full bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
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
        </div>

        {!isLoading && jobs.length > jobsPerPage ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
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
                      ? 'bg-emerald-400 text-slate-950'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10'
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
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default Jobs;
