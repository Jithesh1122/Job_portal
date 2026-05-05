import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteJobAdmin,
  deleteUser,
  getAllApplications,
  getAllJobsAdmin,
  getAllUsers,
  getPlatformStats,
  toggleUserBlockStatus,
  updateJobApprovalStatus,
} from '../api/admin.js';
import {
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus,
} from '../api/applications.js';
import { getStoredUser } from '../api/client.js';
import { getJobMatches, getJobs } from '../api/jobs.js';
import { getMyProfile } from '../api/profile.js';
import MessageBox from '../components/MessageBox.jsx';
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

const StatCard = ({ label, value, accent = 'text-emerald-500 dark:text-emerald-300' }) => (
  <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-2 text-4xl font-bold ${accent}`}>{value}</p>
  </div>
);

const DashboardShell = ({ eyebrow, title, error, children }) => (
  <section className="space-y-8">
    <div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-300">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-bold">{title}</h1>
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
            .filter((job) => job.match >= 50)
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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applied Jobs" value={applications.length} />
        <StatCard label="Recommended Jobs" value={recommendedJobs.length} />
        <StatCard label="Saved Jobs" value={savedJobCount} />
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Profile Strength</p>
          <p className="mt-2 text-4xl font-bold text-emerald-500 dark:text-emerald-300">
            {profileStrength}%
          </p>
          <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-emerald-400"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Applied Jobs</h2>
              <Link className="text-sm font-semibold text-emerald-500 dark:text-emerald-300" to="/jobs">
                View jobs
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {applications.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">No applications yet.</p>
              ) : (
                applications.map((application) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                    key={application._id}
                  >
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {application.jobId?.title || 'Deleted job'}
                    </p>
                    <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                      Status: {application.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-semibold">Recommended Jobs</h2>
            <div className="mt-4 space-y-3">
              {recommendedJobs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Add more profile skills to improve recommendations.
                </p>
              ) : (
                recommendedJobs.map((job) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-xl font-semibold">Recently Viewed</h2>
            <div className="mt-4 space-y-3">
              {recentlyViewedJobs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Open a few roles from the jobs page and they will show up here.
                </p>
              ) : (
                recentlyViewedJobs.map((job) => (
                  <div
                    className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
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
          </div>

          <MessageBox />
        </div>
      </div>
    </DashboardShell>
  );
}

function RecruiterDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const postedJobs = useMemo(
    () =>
      user?.role === 'admin'
        ? jobs
        : jobs.filter((job) => getRecruiterId(job) === user?.id),
    [jobs, user],
  );

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

    try {
      await updateApplicationStatus(applicationId, status);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
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
      <div className="grid gap-5 md:grid-cols-2">
        <StatCard label="Posted Jobs" value={postedJobs.length} />
        <StatCard label="Applicants" value={applications.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Posted Jobs</h2>
            <Link className="text-sm font-semibold text-emerald-500 dark:text-emerald-300" to="/jobs">
              Manage jobs
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {postedJobs.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No jobs posted yet.</p>
            ) : (
              postedJobs.map((job) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                  key={job._id}
                >
                  <p className="font-semibold">{job.title}</p>
                  <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                    {job.location} {job.status ? `| ${job.status}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-xl font-semibold">Applicants</h2>
          <div className="mt-4 space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No applicants yet.</p>
            ) : (
              applications.map((application) => (
                <div
                  className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900"
                  key={application._id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {application.userId?.name || 'Candidate'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {application.jobId?.title || 'Deleted job'}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                        Status: {application.status}
                      </p>
                    </div>
                    <a
                      className="rounded-full border border-slate-200 px-3 py-2 text-sm text-emerald-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-emerald-200 dark:hover:bg-white/10"
                      href={application.resumeUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Resume
                    </a>
                  </div>
                  <div className="mt-4 flex gap-2">
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
                      onClick={() => handleStatusChange(application._id, 'rejected')}
                      type="button"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <MessageBox />
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDeleteJob = async (jobId) => {
    setError('');

    try {
      await deleteJobAdmin(jobId);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
  };

  const handleUpdateJobStatus = async (jobId, status) => {
    setError('');

    try {
      await updateJobApprovalStatus(jobId, status);
      await loadDashboard();
    } catch (dashboardError) {
      setError(dashboardError.message);
    }
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
      title="Admin Dashboard"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Jobs" value={stats.totalJobs} />
        <StatCard label="Applications" value={stats.totalApplications} />
        <StatCard label="Blocked Users" value={stats.blockedUsers} />
        <StatCard label="Pending Jobs" value={stats.pendingJobs} />
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
                        Status: {item.isBlocked ? 'Blocked' : 'Active'}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
          <div className="mt-4 space-y-3">
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No jobs found.</p>
            ) : (
              jobs.map((job) => (
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
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">
                        Status: {job.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.status !== 'approved' ? (
                        <button
                          className="rounded-full border border-emerald-400/30 px-3 py-2 text-sm text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-200"
                          onClick={() => handleUpdateJobStatus(job._id, 'approved')}
                          type="button"
                        >
                          Approve
                        </button>
                      ) : null}
                      {job.status !== 'rejected' ? (
                        <button
                          className="rounded-full border border-amber-400/30 px-3 py-2 text-sm text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-200"
                          onClick={() => handleUpdateJobStatus(job._id, 'rejected')}
                          type="button"
                        >
                          Reject
                        </button>
                      ) : null}
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
          <div className="mt-4 space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No applications found.</p>
            ) : (
              applications.map((application) => (
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

      <MessageBox />
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
