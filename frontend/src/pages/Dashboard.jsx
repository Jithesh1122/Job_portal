import { Link } from 'react-router-dom';
import { getStoredUser } from '../api/client.js';

const dashboardContent = {
  candidate: {
    title: 'Candidate Dashboard',
    copy: 'Keep your profile current so recruiters can understand your skills, education, and experience.',
    actions: ['Update profile', 'Track applications', 'Review recruiter messages'],
  },
  recruiter: {
    title: 'Recruiter Dashboard',
    copy: 'Review candidate profiles and shortlist people who match your hiring needs.',
    actions: ['Browse candidates', 'Review saved profiles', 'Contact applicants'],
  },
  admin: {
    title: 'Admin Dashboard',
    copy: 'Monitor platform activity, users, recruiters, and candidate profile quality.',
    actions: ['Manage users', 'Audit profiles', 'Review platform health'],
  },
};

function Dashboard() {
  const user = getStoredUser();
  const role = user?.role || 'candidate';
  const content = dashboardContent[role] || dashboardContent.candidate;

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          {role}
        </p>
        <h1 className="text-4xl font-bold">{content.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          {content.copy}
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
          to="/profile"
        >
          Edit profile
        </Link>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-xl font-semibold">Next Actions</h2>
        <div className="mt-5 space-y-3">
          {content.actions.map((action) => (
            <div className="rounded-md bg-slate-900 p-4 text-slate-300" key={action}>
              {action}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
