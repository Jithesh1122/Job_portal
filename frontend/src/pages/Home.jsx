function Home() {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Full Stack MERN
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          A clean starter for MongoDB, Express, React, and Node.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          The backend exposes an Express API on port 5000, while this Vite
          frontend runs on port 5173 with React Router and Tailwind ready.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-emerald-950/30">
        <h2 className="text-xl font-semibold">Project Modules</h2>
        <div className="mt-5 grid gap-3 text-sm text-slate-300">
          <div className="rounded-md bg-slate-900 p-4">Backend: Express + Mongoose</div>
          <div className="rounded-md bg-slate-900 p-4">Frontend: React + Vite</div>
          <div className="rounded-md bg-slate-900 p-4">Routing: React Router</div>
          <div className="rounded-md bg-slate-900 p-4">Styling: Tailwind CSS</div>
        </div>
      </div>
    </section>
  );
}

export default Home;
