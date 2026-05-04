import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getMyApplications,
  getRecruiterApplications,
  updateApplicationStatus,
} from '../api/applications.js';
import { getStoredUser } from '../api/client.js';
import { getJobMatches, getJobs } from '../api/jobs.js';
import { getMyProfile } from '../api/profile.js';
import MessageBox from '../components/MessageBox.jsx';

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

function CandidateDashboard() {
  const [applications, setApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [profileStrength, setProfileStrength] = useState(0);
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
    return <p className="text-slate-300">Loading dashboard...</p>;
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Candidate
        </p>
        <h1 className="text-4xl font-bold">Candidate Dashboard</h1>
      </div>

      {error ? (
        <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-slate-400">Applied Jobs</p>
          <p className="mt-2 text-4xl font-bold">{applications.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-slate-400">Recommended Jobs</p>
          <p className="mt-2 text-4xl font-bold">{recommendedJobs.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-slate-400">Profile Strength</p>
          <p className="mt-2 text-4xl font-bold">{profileStrength}%</p>
          <div className="mt-4 h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-emerald-400"
              style={{ width: `${profileStrength}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Applied Jobs</h2>
            <Link className="text-sm font-semibold text-emerald-300" to="/jobs">
              View jobs
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-slate-300">No applications yet.</p>
            ) : (
              applications.map((application) => (
                <div className="rounded-md bg-slate-900 p-4" key={application._id}>
                  <p className="font-semibold">
                    {application.jobId?.title || 'Deleted job'}
                  </p>
                  <p className="mt-1 text-sm capitalize text-slate-400">
                    Status: {application.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Recommended Jobs</h2>
          <div className="mt-4 space-y-3">
            {recommendedJobs.length === 0 ? (
              <p className="text-sm text-slate-300">
                Add more profile skills to improve recommendations.
              </p>
            ) : (
              recommendedJobs.map((job) => (
                <div className="rounded-md bg-slate-900 p-4" key={job._id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{job.title}</p>
                    <span className="rounded-md bg-emerald-400 px-2 py-1 text-sm font-bold text-slate-950">
                      {job.match}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{job.location}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <MessageBox />
    </section>
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
    return <p className="text-slate-300">Loading dashboard...</p>;
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          {user?.role}
        </p>
        <h1 className="text-4xl font-bold">Recruiter Dashboard</h1>
      </div>

      {error ? (
        <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-slate-400">Posted Jobs</p>
          <p className="mt-2 text-4xl font-bold">{postedJobs.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm text-slate-400">Applicants</p>
          <p className="mt-2 text-4xl font-bold">{applications.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Posted Jobs</h2>
            <Link className="text-sm font-semibold text-emerald-300" to="/jobs">
              Manage jobs
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {postedJobs.length === 0 ? (
              <p className="text-sm text-slate-300">No jobs posted yet.</p>
            ) : (
              postedJobs.map((job) => (
                <div className="rounded-md bg-slate-900 p-4" key={job._id}>
                  <p className="font-semibold">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{job.location}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-semibold">Applicants</h2>
          <div className="mt-4 space-y-3">
            {applications.length === 0 ? (
              <p className="text-sm text-slate-300">No applicants yet.</p>
            ) : (
              applications.map((application) => (
                <div className="rounded-md bg-slate-900 p-4" key={application._id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {application.userId?.name || 'Candidate'}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {application.jobId?.title || 'Deleted job'}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-400">
                        Status: {application.status}
                      </p>
                    </div>
                    <a
                      className="rounded-md border border-white/10 px-3 py-2 text-sm text-emerald-200 transition hover:bg-white/10"
                      href={application.resumeUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Resume
                    </a>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                      onClick={() =>
                        handleStatusChange(application._id, 'shortlisted')
                      }
                      type="button"
                    >
                      Shortlist
                    </button>
                    <button
                      className="rounded-md border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
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
    </section>
  );
}

function Dashboard() {
  const user = getStoredUser();

  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  }

  return <RecruiterDashboard user={user} />;
}

export default Dashboard;
