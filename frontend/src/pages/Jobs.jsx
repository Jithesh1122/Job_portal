import { useEffect, useMemo, useState } from 'react';
import {
  applyForJob,
  getMyApplications,
} from '../api/applications.js';
import {
  createJob,
  deleteJob,
  getJobMatches,
  getJobs,
  updateJob,
} from '../api/jobs.js';
import { getStoredUser } from '../api/client.js';

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
        const skills = [
          ...new Set(data.jobs.flatMap((job) => job.skills || [])),
        ].sort();

        setFilterOptions({ locations, skills });
      } catch (jobsError) {
        setError(jobsError.message);
      }
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadJobs(filters);
      loadJobMatches(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

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

  const getJobMatch = (jobId) =>
    jobMatches[jobId] || {
      matchPercentage: 0,
      matchedSkills: [],
    };

  return (
    <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="mt-3 text-slate-300">
          Browse open roles. Recruiters can post, edit, and remove their own jobs.
        </p>

        {canManageJobs ? (
          <form
            className="mt-6 space-y-4 rounded-lg border border-white/10 bg-white/[0.04] p-6"
            onSubmit={handleSubmit}
          >
            <h2 className="text-xl font-semibold">{formTitle}</h2>
            {error ? (
              <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            {status ? (
              <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {status}
              </div>
            ) : null}
            <input
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
              name="title"
              onChange={handleChange}
              placeholder="Job title"
              required
              value={formData.title}
            />
            <textarea
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
              name="description"
              onChange={handleChange}
              placeholder="Job description"
              required
              rows="4"
              value={formData.description}
            />
            <input
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
              name="skills"
              onChange={handleChange}
              placeholder="React, Node.js, MongoDB"
              value={formData.skills}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                min="0"
                name="salary"
                onChange={handleChange}
                placeholder="Salary"
                type="number"
                value={formData.salary}
              />
              <input
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                name="location"
                onChange={handleChange}
                placeholder="Location"
                required
                value={formData.location}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
                type="submit"
              >
                {editingJobId ? 'Update job' : 'Post job'}
              </button>
              {editingJobId ? (
                <button
                  className="rounded-md border border-white/10 px-4 py-2 text-slate-200 transition hover:bg-white/10"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            Login as a recruiter to post jobs.
          </div>
        )}

        {canApplyForJobs ? (
          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Applied Jobs</h2>
            {applications.length === 0 ? (
              <p className="mt-3 text-sm text-slate-300">
                You have not applied for any jobs yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {applications.map((application) => (
                  <div
                    className="rounded-md bg-slate-900 p-4 text-sm text-slate-300"
                    key={application._id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {application.jobId?.title || 'Deleted job'}
                        </p>
                        <p className="mt-1 capitalize">
                          Status: {application.status}
                        </p>
                      </div>
                      <a
                        className="rounded-md border border-white/10 px-3 py-2 text-emerald-200 transition hover:bg-white/10"
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
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
            <input
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
              name="keyword"
              onChange={handleFilterChange}
              placeholder="Search title, description, skills"
              value={filters.keyword}
            />
            <select
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
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
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
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
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
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
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              onClick={clearFilters}
              type="button"
            >
              Clear
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Showing {jobs.length} matching {jobs.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>

        {isLoading ? <p className="text-slate-300">Loading jobs...</p> : null}
        {!isLoading && jobs.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            No jobs match the current filters.
          </div>
        ) : null}
        {jobs.map((job) => (
          <article
            className={`rounded-lg border p-6 ${
              canApplyForJobs && getJobMatch(job._id).matchPercentage >= 50
                ? 'border-emerald-400/50 bg-emerald-400/[0.08]'
                : 'border-white/10 bg-white/[0.04]'
            }`}
            key={job._id}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold">{job.title}</h2>
                  {canApplyForJobs ? (
                    <span className="rounded-md bg-slate-900 px-3 py-1 text-sm font-semibold text-emerald-200">
                      {getJobMatch(job._id).matchPercentage}% Match
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {job.location} {job.salary ? `| Salary: ${job.salary}` : ''}
                </p>
                {canApplyForJobs &&
                getJobMatch(job._id).matchedSkills.length > 0 ? (
                  <p className="mt-2 text-sm text-emerald-200">
                    Matched skills: {getJobMatch(job._id).matchedSkills.join(', ')}
                  </p>
                ) : null}
              </div>
              {canManageJobs && canEditJob(job) ? (
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    onClick={() => handleEdit(job)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-md border border-red-400/30 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                    onClick={() => handleDelete(job._id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
            <p className="mt-4 leading-7 text-slate-300">{job.description}</p>
            {job.skills?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    className="rounded-md bg-slate-900 px-3 py-1 text-sm text-emerald-200"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-4 text-sm text-slate-500">
              Posted by {job.recruiterId?.name || 'Recruiter'}
            </p>
            {canApplyForJobs ? (
              <div className="mt-5 rounded-md border border-white/10 bg-slate-900 p-4">
                {hasApplied(job._id) ? (
                  <p className="text-sm font-medium text-emerald-200">
                    You have already applied for this job.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      accept=".pdf,.doc,.docx"
                      className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-emerald-400 transition file:mr-3 file:rounded-md file:border-0 file:bg-emerald-400 file:px-3 file:py-1 file:font-semibold file:text-slate-950 focus:ring-2"
                      onChange={(event) =>
                        handleResumeChange(job._id, event.target.files?.[0] || null)
                      }
                      type="file"
                    />
                    <button
                      className="rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
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
        ))}
      </div>
    </section>
  );
}

export default Jobs;
