import {
  formatDate,
  formatDuration,
  formatTimeRange,
  taskDurationMinutes,
  totalWorkWindowMinutes,
  workWindowDurationMinutes,
} from "../utils/date";
import {
  taskProgressFromWindows,
  workWindowProgress,
  workWindowWorkedMinutes,
} from "../utils/tasks";

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onUpdate,
  onDragStart,
  onDrop,
  isTaskIncomplete = () => false,
  compact = false,
}) {
  const completed = task.status === "completed";
  const incomplete = isTaskIncomplete(task);
  const windows =
    task.workWindows?.length > 0
      ? task.workWindows.filter((window) => window.start && window.end)
      : task.startTime && task.endTime
        ? [{ start: task.startTime, end: task.endTime }]
        : [];
  const tracksWindows = task.workWindows?.some((window) => window.start && window.end);
  const allocatedMinutes = totalWorkWindowMinutes(windows);
  const remainingMinutes = Math.max(0, (Number(task.durationMinutes) || 0) - allocatedMinutes);

  function statusFromWindows(workWindows, progress) {
    const validWindows = workWindows.filter((window) => window.start && window.end);
    if (validWindows.length && validWindows.every((window) => window.completed)) return "completed";
    if (validWindows.some((window) => window.completed)) return "in-progress";
    return progress === 100 ? "completed" : "pending";
  }

  function updateTrackedWindow(windowId, updates) {
    const workWindows = task.workWindows.map((window) => {
      if (window.id !== windowId) return window;
      const nextWindow = { ...window, ...updates };
      const duration = workWindowDurationMinutes(nextWindow);

      if (Object.hasOwn(updates, "completed")) {
        nextWindow.completed = Boolean(updates.completed);
        nextWindow.incomplete = nextWindow.completed ? false : nextWindow.incomplete;
        nextWindow.workedMinutes = nextWindow.completed
          ? duration
          : Math.min(Number(nextWindow.workedMinutes) || 0, duration);
      } else if (Object.hasOwn(updates, "workedMinutes")) {
        nextWindow.workedMinutes = Math.min(
          Math.max(0, Number(updates.workedMinutes) || 0),
          duration,
        );
        nextWindow.completed = duration > 0 && nextWindow.workedMinutes >= duration;
        nextWindow.incomplete = nextWindow.completed ? false : nextWindow.incomplete;
      }

      return nextWindow;
    });
    const durationMinutes = Math.max(
      Number(task.durationMinutes) || 0,
      totalWorkWindowMinutes(workWindows),
    );
    const progress = taskProgressFromWindows(workWindows, durationMinutes);

    onUpdate(task.id, {
      workWindows,
      durationMinutes,
      progress,
      status: statusFromWindows(workWindows, progress),
    });
  }

  function toggleTaskCompleted() {
    const workWindows = task.workWindows?.map((window) => ({
      ...window,
      completed: !completed,
      incomplete: false,
      workedMinutes: completed ? 0 : workWindowDurationMinutes(window),
    }));
    onUpdate(task.id, {
      status: completed ? "pending" : "completed",
      progress: completed ? 0 : 100,
      ...(workWindows?.length ? { workWindows } : {}),
    });
  }

  return (
    <article
      className={`group rounded-2xl border bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm dark:bg-slate-900 dark:hover:border-indigo-500/40 ${
        completed
          ? "border-slate-100 opacity-75 dark:border-slate-800"
          : "border-slate-200 dark:border-slate-800"
      }`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={() => onDragStart(task.id)}
      onDrop={() => onDrop(task.id)}
    >
      <div className="flex items-start gap-3">
        <button
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
          className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[9px] font-bold transition ${
            completed
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-300 hover:border-indigo-500 dark:border-slate-600"
          }`}
          onClick={toggleTaskCompleted}
          type="button"
        >
          {completed && "OK"}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-semibold text-slate-900 dark:text-white ${
                completed ? "line-through" : ""
              }`}
            >
              {task.title}
            </h3>
            {incomplete && (
              <span className="badge bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                Incomplete
              </span>
            )}
          </div>
          {!compact && task.description && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatDate(task.date)}</span>
            <span>
              {taskDurationMinutes(task) ? formatDuration(taskDurationMinutes(task)) : "No duration"}
            </span>
            <span className="capitalize">{task.status.replace("-", " ")}</span>
            {task.durationMinutes > 0 && (
              <span>Remaining: {formatDuration(remainingMinutes)}</span>
            )}
          </div>
          {!compact && windows.length > 0 && (
            <div className="mt-3 space-y-2">
              {windows.map((window, index) => {
                const windowDuration = workWindowDurationMinutes(window);
                const windowProgress = workWindowProgress(window);
                return (
                  <div
                    className={`rounded-xl p-3 ${
                      window.incomplete && !window.completed
                        ? "bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30"
                        : "bg-slate-50 dark:bg-slate-800/70"
                    }`}
                    key={window.id || `${window.start}-${window.end}-${index}`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      {tracksWindows && (
                        <input
                          aria-label={`Complete work window ${index + 1}`}
                          checked={Boolean(window.completed)}
                          className="h-4 w-4 accent-indigo-600"
                          onChange={(event) =>
                            updateTrackedWindow(window.id, { completed: event.target.checked })
                          }
                          type="checkbox"
                        />
                      )}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {formatTimeRange(window.start, window.end)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Window total: {formatDuration(windowDuration)}
                      </span>
                      {window.incomplete && !window.completed && (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                          Incomplete
                        </span>
                      )}
                      {tracksWindows && (
                        <label className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          Worked
                          <input
                            aria-label={`Minutes worked in window ${index + 1}`}
                            className="field w-20 py-1.5"
                            max={windowDuration}
                            min="0"
                            onChange={(event) =>
                              updateTrackedWindow(window.id, {
                                workedMinutes: event.target.value,
                              })
                            }
                            type="number"
                            value={workWindowWorkedMinutes(window) || ""}
                          />
                          min
                        </label>
                      )}
                    </div>
                    {tracksWindows && (
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatDuration(workWindowWorkedMinutes(window))} worked</span>
                          <span>{windowProgress}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${windowProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <button className="icon-button" onClick={() => onEdit(task)} type="button">
            Edit
          </button>
          <button className="icon-button text-rose-500" onClick={() => onDelete(task.id)} type="button">
            Delete
          </button>
        </div>
      </div>
      {!compact && (
        <div className="mt-4 flex items-center gap-3">
          <input
            aria-label={`Progress for ${task.title}`}
            className="h-2 flex-1 cursor-pointer accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={tracksWindows}
            max="100"
            min="0"
            onChange={(event) => onUpdate(task.id, { progress: Number(event.target.value) })}
            type="range"
            value={task.progress}
          />
          <span className="w-10 text-right text-xs font-semibold text-slate-500">{task.progress}%</span>
        </div>
      )}
      {!compact && tracksWindows && (
        <p className="mt-2 text-right text-xs text-slate-400">
          Overall progress is calculated from the time worked in each window.
        </p>
      )}
    </article>
  );
}
