function Login() {
  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">Login</h1>
      <form className="mt-6 space-y-4 rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Email</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
            type="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-200">Password</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
            type="password"
            placeholder="Password"
          />
        </label>
        <button
          className="w-full rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
          type="submit"
        >
          Sign in
        </button>
      </form>
    </section>
  );
}

export default Login;
