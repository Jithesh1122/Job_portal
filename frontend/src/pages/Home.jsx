import { Link } from 'react-router-dom';

const highlights = [
  {
    label: 'For Candidates',
    text: 'Build a sharp profile, surface your strongest matches, and keep every application in one calm place.',
  },
  {
    label: 'For Recruiters',
    text: 'Post openings with company identity, review applicants, and move from shortlist to outreach without losing context.',
  },
  {
    label: 'For Admins',
    text: 'Approve recruiters, monitor platform activity, and keep the marketplace organized from one dashboard.',
  },
];

function Home() {
  return (
    <section className="page-fade-up space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-8 shadow-xl shadow-slate-200/35 dark:border-cyan-950/30 dark:bg-[#0f1b2a]/88 dark:shadow-black/25 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600 dark:text-cyan-300">
            Hireloom Platform
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
            A cleaner hiring experience for candidates, recruiters, and admins.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            Hireloom brings job discovery, recruiter workflows, AI-assisted matching,
            applications, and platform governance into one thoughtful hiring platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20"
              to="/register"
            >
              Join Hireloom
            </Link>
            <Link
              className="rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:scale-[1.02] hover:bg-slate-100 dark:border-cyan-950/35 dark:bg-[#132131] dark:text-slate-200 dark:hover:bg-[#18283a]"
              to="/login"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Matching</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Skill-aware
              </p>
            </div>
            <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Recruiting</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Structured
              </p>
            </div>
            <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
              <p className="text-sm text-slate-500 dark:text-slate-400">Governance</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Role-based
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map((item) => (
            <div
              className="lift-on-hover rounded-[26px] border border-slate-200/80 bg-white/84 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88"
              key={item.label}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-cyan-300">
                {item.label}
              </p>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lift-on-hover rounded-[24px] border border-slate-200/80 bg-white/84 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Discover the right roles
          </h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Search, filter, save, and revisit opportunities while Hireloom keeps
            recommendations close to your profile strengths.
          </p>
        </div>
        <div className="lift-on-hover rounded-[24px] border border-slate-200/80 bg-white/84 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Review applicants with context
          </h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Recruiters can review resumes, compare profile details, see match percentages,
            and reach shortlisted candidates without leaving the workflow.
          </p>
        </div>
        <div className="lift-on-hover rounded-[24px] border border-slate-200/80 bg-white/84 p-6 shadow-sm dark:border-cyan-950/25 dark:bg-[#101b28]/88">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Keep the platform healthy
          </h2>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            Admin tools keep recruiter approvals, user access, jobs, and application
            oversight properly structured as Hireloom grows.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Home;
