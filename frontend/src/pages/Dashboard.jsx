import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveRecruiter,
  deleteJobAdmin,
  deleteUser,
  getAllApplications,
  getAllJobsAdmin,
  getAllUsers,
  getPlatformStats,
  toggleUserBlockStatus,
} from '../api/admin.js';
import {
  getMyApplications,
  getRecruiterApplications,
  sendShortlistedMessage,
  updateApplicationStatus,
} from '../api/applications.js';
import { getStoredUser } from '../api/client.js';
import { getJobMatches, getJobs } from '../api/jobs.js';
import { getMyProfile } from '../api/profile.js';
import { SkeletonCard } from '../components/Skeleton.jsx';
import { getRecentlyViewedJobs, getSavedJobIds } from '../utils/localState.js';

const getRecruiterId = (job) =>
  typeof job.recruiterId === 'string' ? job.recruiterId : job.recruiterId?._id;

const calculateProfileStrength = (profile) => {
  if (!profile) {
    return 0;
  }

  let score = 0;

  if (profile.skills?.length) {
    score += 40;
  }

  if (profile.education?.length) {
    score += 30;
  }

  if (profile.experience?.length) {
    score += 30;
  }

  return score;
};

const StatCard = ({ label, value, accent = 'text-teal-600 dark:text-cyan-300' }) => (
  <div className="lift-on-hover rounded-3xl border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-2 text-4xl font-bold ${accent}`}>{value}</p>
  </div>
);

const SectionCard = ({ title, action, children, className = '' }) => (
  <section
    className={`lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88 ${className}`}
  >
    {(title || action) ? (
      <div className="flex items-center justify-between gap-4">
        {title ? (
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        ) : (
          <span />
        )}
        {action}
      </div>
    ) : null}
    <div className={title || action ? 'mt-5' : ''}>{children}</div>
  </section>
);

const DashboardShell = ({ eyebrow, title, error, children }) => (
  <section className="page-fade-up space-y-8">
    <div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
    </div>

    {error ? (
      <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    ) : null}

    {children}
  </section>
);

function CandidateDashboard() {
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [profileStrength, setProfileStrength] = useState(0);
  const [savedJobCount, setSavedJobCount] = useState(0);
  const [recentlyViewedJobs, setRecentlyViewedJobs] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const shortlistedApplications = useMemo(
    () => applications.filter((application) => application.status === 'shortlisted'),
    [applications],
  );

  const rejectedApplications = useMemo(
    () => applications.filter((application) => application.status === 'rejected'),
    [applications],
  );

  const normalizedCandidateSearch = jobSearch.trim().toLowerCase();

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) => {
        if (!normalizedCandidateSearch) {
          return true;
        }

        return `${application.jobId?.title || ''} ${application.jobId?.location || ''}`
          .toLowerCase()
          .includes(normalizedCandidateSearch);
      }),
    [applications, normalizedCandidateSearch],
  );

  const filteredRecommendedJobs = useMemo(
    () =>
      recommendedJobs.filter((job) => {
        if (!normalizedCandidateSearch) {
          return true;
        }

        return `${job.title} ${job.location || ''} ${(job.matchedSkills || []).join(' ')}`
          .toLowerCase()
          .includes(normalizedCandidateSearch);
      }),
    [recommendedJobs, normalizedCandidateSearch],
  );

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profileData, applicationsData, jobsData, matchesData] =
          await Promise.all([
            getMyProfile(),
            getMyApplications(),
            getJobs(),
            getJobMatches(),
          ]);

        const matchesByJobId = Object.fromEntries(
          matchesData.matches.map((match) => [match.jobId, match]),
        );

        setProfileStrength(calculateProfileStrength(profileData.profile));
        setApplications(applicationsData.applications);
        setSavedJobCount(getSavedJobIds().length);
        setRecentlyViewedJobs(getRecentlyViewedJobs());
        setRecommendedJobs(
          jobsData.jobs
            .map((job) => ({
              ...job,
              match: matchesByJobId[job._id]?.matchPercentage || 0,
              matchedSkills: matchesByJobId[job._id]?.matchedSkills || [],
            }))
            .filter((job) => job.match >= 1)
            .sort((a, b) => b.match - a.match)
            .slice(0, 5),
        );
      } catch (dashboardError) {
        setError(dashboardError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <DashboardShell
      error={error}
      eyebrow="Candidate"
      title="Candidate Dashboard"
    >
      <SectionCard className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-600 dark:text-cyan-300">
                Overview
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                Keep your applications, matches, and progress in one focused view.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
                Track where you have applied, see where your profile is strongest,
                and quickly spot roles recruiters are moving forward on.
              </p>
            </div>
            <label className="block max-w-2xl">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Search jobs
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
                onChange={(event) => setJobSearch(event.target.value)}
                placeholder="Search applied or recommended jobs"
                value={jobSearch}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-cyan-950/25 dark:bg-[#132131]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Profile Strength</p>
              <p className="mt-2 text-4xl font-bold text-teal-600 dark:text-cyan-300">
                {profileStrength}%
              </p>
              <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                  style={{ width: `${profileStrength}%` }}
                />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-cyan-950/25 dark:bg-[#132131]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Saved + recent</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {savedJobCount + recentlyViewedJobs.length}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Keep moving between shortlisted roles, saved jobs, and recently viewed opportunities.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applied Jobs" value={applications.length} />
        <StatCard label="Recommended Jobs" value={recommendedJobs.length} />
        <StatCard label="Shortlisted" value={shortlistedApplications.length} />
        <StatCard label="Saved Jobs" value={savedJobCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard
            action={(
              <Link className="text-sm font-semibold text-teal-600 dark:text-cyan-300" to="/jobs">
                View jobs
              </Link>
            )}
            title="Applied Jobs"
          >
            <div className="mt-4 space-y-3">
              {filteredApplications.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No applications yet.</p>
              ) : (
                filteredApplications.map((application) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]"
                    key={application._id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {application.jobId?.title || 'Deleted job'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {application.jobId?.location || 'Location not available'}
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
          </SectionCard>

          <SectionCard title="Recommended Jobs">
            <div className="mt-4 space-y-3">
              {filteredRecommendedJobs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Add more profile skills to improve recommendations.
                </p>
              ) : (
                filteredRecommendedJobs.map((job) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]"
                    key={job._id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{job.title}</p>
                      <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-sm font-bold text-slate-950">
                        {job.match}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {job.location}
                    </p>
                    {job.recruiterId?.companyName ? (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {job.recruiterId.companyName}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            action={(
              <p className="text-sm text-teal-600 dark:text-cyan-300">
                Recruiters want to move forward
              </p>
            )}
            title="Shortlisted Jobs"
          >
            <div className="mt-4 space-y-3">
              {shortlistedApplications.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No shortlisted updates yet.
                </p>
              ) : (
                shortlistedApplications.map((application) => (
                  <div
                    className="rounded-2xl border border-teal-300/40 bg-teal-500/10 p-4 dark:border-cyan-400/20"
                    key={application._id}
                  >
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {application.jobId?.title || 'Deleted job'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {application.jobId?.location || 'Location not available'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            action={(
              <p className="text-sm text-rose-600 dark:text-rose-300">
                Keep an eye on feedback in notifications
              </p>
            )}
            title="Rejected Updates"
          >
            <div className="mt-4 space-y-3">
              {rejectedApplications.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No rejected applications right now.
                </p>
              ) : (
                rejectedApplications.map((application) => (
                  <div
                    className="rounded-2xl border border-rose-300/40 bg-rose-500/10 p-4 dark:border-rose-400/20"
                    key={application._id}
                  >
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {application.jobId?.title || 'Deleted job'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Status updated to rejected.
                    </p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            action={(
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Resume where you left off
              </p>
            )}
            title="Recently Viewed"
          >
            <div className="mt-4 space-y-3">
              {recentlyViewedJobs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Open a few roles from the jobs page and they will show up here.
                </p>
              ) : (
                recentlyViewedJobs.map((job) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]"
                    key={job._id}
                  >
                    <p className="font-semibold">{job.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {job.location}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}

function RecruiterDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');

  const postedJobs = useMemo(
    () =>
      user?.role === 'admin'
        ? jobs
        : jobs.filter((job) => getRecruiterId(job) === user?.id),
    [jobs, user],
  );

  const applicationsByJob = useMemo(() => {
    const groupedApplications = new Map();

    applications.forEach((application) => {
      const jobId = application.jobId?._id || 'unknown';
      const currentGroup = groupedApplications.get(jobId);

      if (currentGroup) {
        currentGroup.applications.push(application);
        return;
      }

      groupedApplications.set(jobId, {
        job: application.jobId,
        applications: [application],
      });
    });

    return [...groupedApplications.values()].sort(
      (a, b) => (b.applications?.length || 0) - (a.applications?.length || 0),
    );
  }, [applications]);

  const loadDashboard = async () => {
    try {
      const [jobsData, applicationsData] = await Promise.all([
        getJobs(),
        getRecruiterApplications(),
      ]);

      setJobs(jobsData.jobs);
      setApplications(applicationsData.applications);
    } catch (dashboardError) {
      setError(dashboardError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (applicationId, status) => {
    setError('');
    setStatus('');

    try {
      await updateApplicationStatus(applicationId, status);
      setStatus(`Candidate ${status} successfully`);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
  };

  const handleResumeView = (resumeUrl) => {
    setError('');
    setStatus('Resume opened in a new tab');
    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendMessage = async (application) => {
    const message = window.prompt(
      `Message for ${application.userId?.name || 'candidate'} about ${application.jobId?.title || 'this job'}:`,
    );

    if (!message || !message.trim()) {
      return;
    }

    setError('');
    setStatus('');

    try {
      await sendShortlistedMessage(application._id, message.trim());
      setStatus('Message sent successfully');
    } catch (messageError) {
      setError(messageError.message);
    }
  };

  const handleToggleApplicationDetails = (applicationId) => {
    setSelectedApplicationId((currentApplicationId) =>
      currentApplicationId === applicationId ? null : applicationId,
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <DashboardShell
      error={error}
      eyebrow={user?.role}
      title="Recruiter Dashboard"
    >
      <SectionCard className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-600 dark:text-cyan-300">
              Hiring overview
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              Stay on top of active roles, applicants, and recruiter decisions.
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
              Use this dashboard to track every open role, compare candidate quality,
              and move strong applicants toward a conversation quickly.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="text-sm text-slate-500 dark:text-slate-400">Current queue</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {applications.length} applicant{applications.length === 1 ? '' : 's'}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Review match scores, resumes, contact details, and next actions from one place.
            </p>
          </div>
        </div>
      </SectionCard>

      {status ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          {status}
        </div>
      ) : null}
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Posted Jobs" value={postedJobs.length} />
        <StatCard label="Applicants" value={applications.length} />
        <StatCard
          label="Average Match"
          value={
            applications.length
              ? `${Math.round(
                  applications.reduce(
                    (sum, application) => sum + (application.matchPercentage || 0),
                    0,
                  ) / applications.length,
                )}%`
              : '0%'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
        <SectionCard
          action={(
            <Link className="text-sm font-semibold text-teal-600 dark:text-cyan-300" to="/jobs">
              Manage jobs
            </Link>
          )}
          title="Posted Jobs"
        >
          <div className="mt-4 space-y-3">
            {postedJobs.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No jobs posted yet.</p>
            ) : (
              postedJobs.map((job) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-4 dark:border-cyan-950/20 dark:bg-[#132131]"
                  key={job._id}
                >
                  <p className="font-semibold">{job.title}</p>
                  <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                    {job.location} {job.status ? `| ${job.status}` : ''}
                  </p>
                  {job.recruiterId?.companyName ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {job.recruiterId.companyName}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Applicants by Job">
          <div className="mt-4 space-y-3">
            {applicationsByJob.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No applicants yet.</p>
            ) : (
              applicationsByJob.map((group) => (
                <div
                  className="rounded-3xl border border-slate-200/70 bg-slate-50/85 p-5 dark:border-cyan-950/20 dark:bg-[#132131]"
                  key={group.job?._id || group.job?.title}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {group.job?.title || 'Deleted job'}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                        {group.job?.location} {group.job?.status ? `| ${group.job.status}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-sm font-semibold text-white">
                      {group.applications.length} applicants
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {group.applications.map((application) => (
                      <div
                        className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-cyan-950/20 dark:bg-[#0c1521]"
                        key={application._id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="font-semibold">
                                {application.userId?.name || 'Candidate'}
                              </p>
                              <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950">
                                {application.matchPercentage || 0}% match
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {application.userId?.email}
                            </p>
                            <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                              Status: {application.status}
                            </p>
                            {application.matchedSkills?.length ? (
                              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-200">
                                Matched skills: {application.matchedSkills.join(', ')}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-slate-200 dark:hover:bg-[#132131]"
                              onClick={() => handleToggleApplicationDetails(application._id)}
                              type="button"
                            >
                              {selectedApplicationId === application._id
                                ? 'Hide details'
                                : 'View details'}
                            </button>
                            <a
                              className="rounded-full border border-slate-200 px-3 py-2 text-sm text-teal-700 transition hover:bg-slate-100 dark:border-cyan-950/30 dark:text-cyan-300 dark:hover:bg-[#132131]"
                              href="#resume-view"
                              onClick={(event) => {
                                event.preventDefault();
                                handleResumeView(application.resumeUrl);
                              }}
                            >
                              Resume
                            </a>
                          </div>
                        </div>

                        {selectedApplicationId === application._id ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-3 dark:border-cyan-950/20 dark:bg-[#132131]">
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
                            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-3 dark:border-cyan-950/20 dark:bg-[#132131]">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Skills
                              </p>
                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                {application.candidateProfile?.skills?.length
                                  ? application.candidateProfile.skills.join(', ')
                                  : 'No profile skills added'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-3 dark:border-cyan-950/20 dark:bg-[#132131]">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Education
                              </p>
                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                {application.candidateProfile?.education?.length
                                  ? `${application.candidateProfile.education[0].degree || 'Degree'}${application.candidateProfile.education[0].institution ? `, ${application.candidateProfile.education[0].institution}` : ''}`
                                  : 'No education details'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/85 p-3 dark:border-cyan-950/20 dark:bg-[#132131]">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                Experience
                              </p>
                              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                                {application.candidateProfile?.experience?.length
                                  ? `${application.candidateProfile.experience[0].title || 'Experience'}${application.candidateProfile.experience[0].company ? `, ${application.candidateProfile.experience[0].company}` : ''}`
                                  : 'No experience details'}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 flex gap-2">
                          {application.status !== 'shortlisted' &&
                          application.status !== 'rejected' ? (
                            <>
                              <button
                                className="rounded-full bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                                onClick={() =>
                                  handleStatusChange(application._id, 'shortlisted')
                                }
                                type="button"
                              >
                                Shortlist
                              </button>
                              <button
                                className="rounded-full border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
                                onClick={() =>
                                  handleStatusChange(application._id, 'rejected')
                                }
                                type="button"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                Decision recorded
                              </span>
                              {application.status === 'shortlisted' ? (
                                <button
                                  className="rounded-full border border-emerald-400/30 px-3 py-2 text-sm text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-200"
                                  onClick={() => handleSendMessage(application)}
                                  type="button"
                                >
                                  Message candidate
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

    </DashboardShell>
  );
}

function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    blockedUsers: 0,
        pendingJobs: 0,
  });
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobSearch, setJobSearch] = useState('');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const normalizedJobSearch = jobSearch.trim().toLowerCase();
  const normalizedApplicationSearch = applicationSearch.trim().toLowerCase();

  const loadDashboard = async () => {
    try {
      const [statsData, usersData, jobsData, applicationsData] = await Promise.all([
        getPlatformStats(),
        getAllUsers(),
        getAllJobsAdmin(),
        getAllApplications(),
      ]);

      setStats(statsData.stats);
      setUsers(usersData.users);
      setJobs(jobsData.jobs);
      setApplications(applicationsData.applications);
    } catch (dashboardError) {
      setError(dashboardError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleDeleteUser = async (userId) => {
    setError('');

    try {
      await deleteUser(userId);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
  };

  const handleToggleUserBlock = async (userId) => {
    setError('');

    try {
      await toggleUserBlockStatus(userId);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
  };

  const handleApproveRecruiter = async (userId) => {
    setError('');

    try {
      await approveRecruiter(userId);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    setError('');

    try {
      await deleteJobAdmin(jobId);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
  };

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (!normalizedJobSearch) {
          return true;
        }

        return `${job.title} ${job.location || ''} ${job.recruiterId?.name || ''} ${job.recruiterId?.companyName || ''}`
          .toLowerCase()
          .includes(normalizedJobSearch);
      }),
    [jobs, normalizedJobSearch],
  );

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) => {
        if (!normalizedApplicationSearch) {
          return true;
        }

        return `${application.userId?.name || ''} ${application.userId?.email || ''} ${application.jobId?.title || ''} ${application.status || ''}`
          .toLowerCase()
          .includes(normalizedApplicationSearch);
      }),
    [applications, normalizedApplicationSearch],
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <DashboardShell
      error={error}
      eyebrow={user?.role}
      title="Admin Dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Jobs" value={stats.totalJobs} />
        <StatCard label="Applications" value={stats.totalApplications} />
        <StatCard label="Blocked Users" value={stats.blockedUsers} />
        <StatCard label="Pending Recruiters" value={stats.pendingJobs} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-xl font-semibold">Users</h2>
          <div className="mt-4 space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No users found.</p>
            ) : (
              users.map((item) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                  key={item._id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.email}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                        Role: {item.role}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Approval: {item.role === 'recruiter' ? (item.isApproved ? 'Approved' : 'Pending') : 'Not required'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Status: {item.isBlocked ? 'Blocked' : 'Active'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {item.role === 'recruiter' && !item.isApproved ? (
                        <button
                          className="rounded-full border border-emerald-400/30 px-3 py-2 text-sm text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-200"
                          onClick={() => handleApproveRecruiter(item._id)}
                          type="button"
                        >
                          Approve recruiter
                        </button>
                      ) : null}
                      {item._id !== user?.id ? (
                        <button
                          className={`rounded-full px-3 py-2 text-sm transition ${
                            item.isBlocked
                              ? 'border border-emerald-400/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-200'
                              : 'border border-amber-400/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-200'
                          }`}
                          onClick={() => handleToggleUserBlock(item._id)}
                          type="button"
                        >
                          {item.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      ) : null}
                      {item._id !== user?.id ? (
                        <button
                          className="rounded-full border border-red-400/30 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                          onClick={() => handleDeleteUser(item._id)}
                          type="button"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-xl font-semibold">Jobs</h2>
          <input
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            onChange={(event) => setJobSearch(event.target.value)}
            placeholder="Search jobs by title, recruiter, or location"
            value={jobSearch}
          />
          <div className="mt-4 space-y-3">
            {filteredJobs.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No jobs found.</p>
            ) : (
              filteredJobs.map((job) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                  key={job._id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{job.location}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Recruiter: {job.recruiterId?.name || 'Unknown'}
                      </p>
                      {job.recruiterId?.companyName ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Company: {job.recruiterId.companyName}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                        Recruiter approval: {job.recruiterId?.isApproved ? 'Approved' : 'Pending'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-red-400/30 px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                        onClick={() => handleDeleteJob(job._id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-xl font-semibold">Applications Overview</h2>
          <input
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            onChange={(event) => setApplicationSearch(event.target.value)}
            placeholder="Search applications by candidate, email, job, or status"
            value={applicationSearch}
          />
          <div className="mt-4 space-y-3">
            {filteredApplications.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No applications found.</p>
            ) : (
              filteredApplications.map((application) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                  key={application._id}
                >
                  <p className="font-semibold">
                    {application.userId?.name || 'Candidate'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Job: {application.jobId?.title || 'Deleted job'}
                  </p>
                  <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                    Status: {application.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </DashboardShell>
  );
}

function Dashboard() {
  const user = getStoredUser();

  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} />;
  }

  return <RecruiterDashboard user={user} />;
}

export default Dashboard;
