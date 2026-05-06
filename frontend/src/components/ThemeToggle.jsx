function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-cyan-500/40 hover:bg-slate-50 dark:border-cyan-950/40 dark:bg-[#102030]/90 dark:text-slate-200 dark:hover:border-cyan-500/35 dark:hover:bg-[#132536]"
      onClick={onToggle}
      type="button"
    >
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          theme === 'dark' ? 'bg-cyan-300' : 'bg-teal-600'
        }`}
      />
      {theme === 'dark' ? 'Night' : 'Day'}
    </button>
  );
}

export default ThemeToggle;
