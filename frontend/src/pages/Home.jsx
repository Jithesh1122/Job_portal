function Home() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-300">
          Full Stack MERN
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
          A hiring platform starter with cleaner flows and room to grow.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          The backend exposes an Express API on port 5000, while this Vite
          frontend runs on port 5173 with React Router and Tailwind ready for
          candidates, recruiters, and admins.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm text-slate-500 dark:text-slate-400">Workflows</p>
            <p className="mt-2 text-2xl font-bold">3</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm text-slate-500 dark:text-slate-400">Modules</p>
            <p className="mt-2 text-2xl font-bold">Auth + Jobs</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm text-slate-500 dark:text-slate-400">UI Mode</p>
            <p className="mt-2 text-2xl font-bold">Light / Dark</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-2xl shadow-slate-200/50 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-emerald-950/30">
        <h2 className="text-xl font-semibold">Project Modules</h2>
        <div className="mt-5 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            Backend: Express + Mongoose
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            Frontend: React + Vite
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            Routing: React Router
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            Styling: Tailwind CSS
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;
