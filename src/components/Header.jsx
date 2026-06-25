export default function Header({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  savedAt,
  onAddTask,
  onOpenMenu,
}) {
  return (
    <header className="mb-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Open navigation"
            className="button-secondary px-3 lg:hidden"
            onClick={onOpenMenu}
            type="button"
          >
            Menu
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {savedAt ? `Auto-saved ${new Date(savedAt).toLocaleTimeString()}` : "Ready to plan"}
            </p>
          </div>
        </div>
        <button className="button-primary shrink-0" onClick={onAddTask} type="button">
          + New Task
        </button>
      </div>

      <div className="panel flex flex-col gap-3 p-3 md:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search tasks</span>
          <input
            className="field pl-16"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks or descriptions"
            type="search"
            value={search}
          />
          <span className="absolute left-3 top-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Search
          </span>
        </label>
        <select
          aria-label="Filter by status"
          className="field md:w-44"
          onChange={(event) => onStatusFilterChange(event.target.value)}
          value={statusFilter}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </header>
  );
}
