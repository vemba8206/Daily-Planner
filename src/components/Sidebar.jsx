export default function Sidebar({ stats, theme, onToggleTheme, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-[#0d0d14]/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-20 flex-col items-center border-r border-violet-100 bg-white/90 px-3 py-5 shadow-2xl shadow-violet-950/5 backdrop-blur-xl transition-transform dark:border-white/10 dark:bg-[#101018]/95 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-[#ed2939] text-xl font-bold text-white shadow-lg shadow-fuchsia-500/25">
          P
        </div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Planora
        </p>

        <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl border border-violet-100 bg-fuchsia-50/70 text-center dark:border-white/10 dark:bg-white/5">
          <div>
            <p className="text-xl font-bold leading-none text-slate-950 dark:text-white">{stats.today}</p>
            <p className="mt-1 text-[9px] uppercase text-slate-400">Today</p>
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-100 bg-white/80 text-sm font-bold text-fuchsia-600 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:bg-fuchsia-50 dark:border-white/10 dark:bg-white/5 dark:text-fuchsia-200"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            type="button"
          >
            {theme === "dark" ? "L" : "D"}
          </button>
        </div>
      </aside>
    </>
  );
}
