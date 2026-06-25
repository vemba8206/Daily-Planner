import {
  availableWorkWindows,
  formatDuration,
  formatTimeRange,
  taskDurationMinutes,
  totalScheduledMinutes,
} from "../utils/date";

export default function DailyTimePanel({
  tasks,
  label = "Today's Planned Time",
  dayCompleted = false,
  dayEndTime = "00:00",
  onDayComplete,
  onDayEndChange,
  onDayReopen,
  embedded = false,
}) {
  const timedTasks = tasks.filter((task) => taskDurationMinutes(task) > 0);
  const unscheduledTasks = tasks.length - timedTasks.length;
  const totalMinutes = totalScheduledMinutes(timedTasks);
  const openWindows = availableWorkWindows(tasks, dayEndTime);

  return (
    <section
      className={
        embedded ? "rounded-2xl bg-fuchsia-50/60 p-5 dark:bg-white/5" : "panel p-5"
      }
      data-animate-card
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-500">{label}</p>
        <div className="flex flex-wrap items-end gap-2">
          {onDayEndChange && (
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Day ends at
              <input
                className="field mt-1 w-32 py-2"
                onChange={(event) => onDayEndChange(event.target.value)}
                type="time"
                value={dayEndTime}
              />
            </label>
          )}
          {onDayComplete && (
            <button
              className={dayCompleted ? "button-secondary py-2" : "button-primary py-2"}
              onClick={dayCompleted ? onDayReopen : onDayComplete}
              type="button"
            >
              {dayCompleted ? "Reopen day" : "Day completed"}
            </button>
          )}
        </div>
      </div>
      {dayCompleted && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          This planner day is closed. Unfinished tasks are tracked as incomplete.
        </p>
      )}
      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
        {formatDuration(totalMinutes)}
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {timedTasks.length
          ? `${timedTasks.length} task${timedTasks.length === 1 ? "" : "s"} with planned effort`
          : "Add total time to calculate your workload."}
      </p>
      {unscheduledTasks > 0 && (
        <p className="mt-4 rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {unscheduledTasks} task{unscheduledTasks === 1 ? "" : "s"} without a valid time range not
          included.
        </p>
      )}
      <div className="mt-4 border-t border-violet-100 pt-4 dark:border-white/10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Open Work Windows
        </p>
        {openWindows.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {openWindows.slice(0, 4).map((window, index) => (
              <span
                className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500 shadow-sm dark:bg-[#101018] dark:text-slate-400"
                key={`${window.start}-${window.end}-${index}`}
              >
                {formatTimeRange(window.start, window.end)} - {formatDuration(window.minutes)}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            No open window remains after scheduled work windows.
          </p>
        )}
      </div>
    </section>
  );
}
