import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser } from './api/client.js';
import NotificationBell from './components/NotificationBell.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Jobs from './pages/Jobs.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import { getThemePreference, setThemePreference } from './utils/localState.js';

const publicNavItems = [
  { to: '/', label: 'Home' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
];

const basePrivateNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jobs', label: 'Jobs' },
];

function ProtectedRoute({ children, allowedRoles }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [theme, setTheme] = useState(() => {
    const savedTheme = getThemePreference();

    if (savedTheme) {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const navItems = user
    ? [
        ...basePrivateNavItems,
        ...(user.role === 'candidate' ? [{ to: '/profile', label: 'Profile' }] : []),
      ]
    : publicNavItems;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setThemePreference(theme);
  }, [theme]);

  const handleAuthChange = () => {
    setUser(getStoredUser());
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const roleLabel = user?.role
    ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`
    : '';

  return (
    <div className="min-h-screen text-slate-900 transition-colors dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/78 backdrop-blur-xl dark:border-cyan-950/30 dark:bg-[#0b1622]/84">
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 font-bold text-white shadow-sm shadow-cyan-900/20 gentle-float">
              H
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold tracking-wide text-slate-900 sm:text-lg dark:text-slate-100">
                Hireloom
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                Jobs, hiring, and decisions in one flow
              </span>
            </span>
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:items-end">
            {user ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-cyan-950/35 dark:bg-[#102030] dark:text-slate-300">
                  Signed in as {roleLabel}
                </span>
                <span className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {user.name}
                  {user.companyName ? ` • ${user.companyName}` : ''}
                </span>
              </div>
            ) : null}

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-sm shadow-cyan-900/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#122132] dark:hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <ThemeToggle onToggle={toggleTheme} theme={theme} />
              {user ? <NotificationBell /> : null}
              {user ? (
                <button
                  className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-[#122132] dark:hover:text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route
            path="/login"
            element={<Login onAuthSuccess={handleAuthChange} />}
          />
          <Route
            path="/register"
            element={<Register onAuthSuccess={handleAuthChange} />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
