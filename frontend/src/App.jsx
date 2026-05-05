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
  { to: '/jobs', label: 'Jobs' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
];

const privateNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/profile', label: 'Profile' },
];

function ProtectedRoute({ children }) {
  return getStoredUser() ? children : <Navigate to="/login" replace />;
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
  const navItems = user ? privateNavItems : publicNavItems;

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

  return (
    <div className="min-h-screen text-slate-900 transition-colors dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-wide">
            MERN Starter
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeToggle onToggle={toggleTheme} theme={theme} />
            {user ? (
              <>
                <NotificationBell />
                <button
                  className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
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
              <ProtectedRoute>
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
