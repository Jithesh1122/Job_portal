import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.js';

function Login({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData);
      onAuthSuccess();
      navigate('/dashboard');
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-fade-up mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-8 shadow-xl shadow-slate-200/35 dark:border-cyan-950/30 dark:bg-[#0f1b2a]/88 dark:shadow-black/25 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-cyan-300">
          Hireloom Access
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Return to your Hireloom account.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Sign in to continue reviewing applicants, managing openings, tracking
          applications, and following up on the next step.
        </p>

        <div className="mt-8 grid gap-3">
          <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="font-medium text-slate-900 dark:text-slate-100">Candidate flow</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track saved roles, applications, and recommendation updates.
            </p>
          </div>
          <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="font-medium text-slate-900 dark:text-slate-100">Recruiter flow</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review applicants, shortlist talent, and keep job posts moving.
            </p>
          </div>
          <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="font-medium text-slate-900 dark:text-slate-100">Admin flow</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Oversee approvals, platform health, and user access in one place.
            </p>
          </div>
        </div>
      </div>

      <form
        className="lift-on-hover space-y-6 rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/30 dark:border-cyan-950/30 dark:bg-[#0f1824]/90 sm:p-10"
        onSubmit={handleSubmit}
      >
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Use the email and password linked to your Hireloom account.
          </p>
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
            name="email"
            onChange={handleChange}
            type="email"
            value={formData.email}
            placeholder="you@company.com"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
            name="password"
            onChange={handleChange}
            type="password"
            value={formData.password}
            placeholder="Enter your password"
            required
          />
        </label>
        <button
          className="w-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 font-semibold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Enter Hireloom'}
        </button>
      </form>
    </section>
  );
}

export default Login;
