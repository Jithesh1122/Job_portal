function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300/60 bg-white/80 px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-slate-900"
      onClick={onToggle}
      type="button"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          theme === 'dark' ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
      />
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}

export default ThemeToggle;
