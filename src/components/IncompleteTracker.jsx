import { formatDate } from "../utils/date";

export default function IncompleteTracker({ tasks, onEdit }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
            Not Completed
          </p>
          <h2 className="font-semibold text-slate-900 dark:text-white">Incomplete Tracker</h2>
        </div>
        <span className="badge bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
          {tasks.length}
        </span>
      </div>
      {tasks.length ? (
        <div className="space-y-2">
          {tasks.slice(0, 4).map((task) => (
            <button
              className="w-full rounded-xl bg-slate-50 p-3 text-left text-sm transition hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800"
              key={task.id}
              onClick={() => onEdit(task)}
              type="button"
            >
              <span className="block font-medium text-slate-800 dark:text-slate-100">{task.title}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Planned for {formatDate(task.date)}
              </span>
              <span className="mt-2 block">
                <span className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <span
                    className="block h-full rounded-full bg-rose-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </span>
              </span>
            </button>
          ))}
          {tasks.length > 4 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +{tasks.length - 4} more incomplete task{tasks.length - 4 === 1 ? "" : "s"}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nothing has slipped past its planner-day end. Nicely steady.
        </p>
      )}
    </section>
  );
}
