import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/auth.js';

function Register({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    role: 'candidate',
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
      await register(formData);
      onAuthSuccess();
      navigate('/dashboard');
    } catch (authError) {
      setError(authError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-fade-up mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="lift-on-hover rounded-[28px] border border-slate-200/80 bg-white/88 p-8 shadow-xl shadow-slate-200/35 dark:border-cyan-950/30 dark:bg-[#0f1b2a]/88 dark:shadow-black/25 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-cyan-300">
          Join Hireloom
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Create an account that fits the way you hire or apply.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Candidates can build a strong profile and track job opportunities.
          Recruiters can register their company, publish roles, and manage the full
          applicant journey.
        </p>

        <div className="mt-8 space-y-3">
          <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="font-medium text-slate-900 dark:text-slate-100">Candidate account</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Complete your profile, receive recommendations, save roles, and apply with your resume.
            </p>
          </div>
          <div className="lift-on-hover rounded-2xl border border-slate-200/80 bg-slate-50/85 p-4 dark:border-cyan-950/25 dark:bg-[#132131]">
            <p className="font-medium text-slate-900 dark:text-slate-100">Recruiter account</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Register your company identity, wait for approval, then post openings and review talent.
            </p>
          </div>
        </div>
      </div>

      <form
        className="lift-on-hover space-y-5 rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/30 dark:border-cyan-950/30 dark:bg-[#0f1824]/90 sm:p-10"
        onSubmit={handleSubmit}
      >
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Create account
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Start with the role that matches your place in Hireloom.
          </p>
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
            name="name"
            onChange={handleChange}
            type="text"
            value={formData.name}
            placeholder="Your full name"
            required
          />
        </label>
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
            minLength="6"
            name="password"
            onChange={handleChange}
            type="password"
            value={formData.password}
            placeholder="Create a secure password"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Role</span>
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
            name="role"
            onChange={handleChange}
            value={formData.role}
          >
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </label>
        {formData.role === 'recruiter' ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Company Name
            </span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none ring-cyan-500 transition focus:ring-2 dark:border-cyan-950/30 dark:bg-[#132131] dark:text-white"
              name="companyName"
              onChange={handleChange}
              type="text"
              value={formData.companyName}
              placeholder="Your organization"
              required
            />
          </label>
        ) : null}
        <button
          className="w-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 font-semibold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creating account...' : 'Create Hireloom account'}
        </button>
      </form>
    </section>
  );
}

export default Register;
