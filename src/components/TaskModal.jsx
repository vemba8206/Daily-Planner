import { useEffect, useState } from "react";
import {
  formatDuration,
  localDateKey,
  totalWorkWindowMinutes,
  workWindowDurationMinutes,
} from "../utils/date";
import {
  taskProgressFromWindows,
  workWindowProgress,
  workWindowWorkedMinutes,
} from "../utils/tasks";

function emptyWindow() {
  return {
    id: crypto.randomUUID(),
    start: "",
    end: "",
    workedMinutes: 0,
    completed: false,
    incomplete: false,
  };
}

function emptyForm(date) {
  return {
    title: "",
    description: "",
    date: date || localDateKey(),
    startTime: "",
    endTime: "",
    durationMinutes: "",
    workWindows: [emptyWindow()],
    priority: "medium",
    status: "pending",
    progress: 0,
    reminder: false,
  };
}

function formFromTask(task, date) {
  if (!task) return emptyForm(date);
  const workWindows =
    task.workWindows?.length > 0
      ? task.workWindows
      : task.startTime || task.endTime
        ? [{ ...emptyWindow(), start: task.startTime || "", end: task.endTime || "" }]
        : [emptyWindow()];
  return {
    ...emptyForm(date),
    ...task,
    durationMinutes: task.durationMinutes || "",
    workWindows: workWindows.map((window) => ({
      ...emptyWindow(),
      ...window,
      workedMinutes: workWindowWorkedMinutes(window),
      completed: Boolean(window.completed),
      incomplete: Boolean(window.incomplete),
    })),
  };
}

export default function TaskModal({ open, task, initialDate, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm(initialDate));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(formFromTask(task, initialDate));
    setError("");
  }, [initialDate, open, task]);

  if (!open) return null;

  const allocatedMinutes = totalWorkWindowMinutes(form.workWindows);
  const remainingMinutes = Math.max(0, (Number(form.durationMinutes) || 0) - allocatedMinutes);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function syncWindowTracking(current, workWindows) {
    const allocatedMinutes = totalWorkWindowMinutes(workWindows);
    const durationMinutes = Math.max(Number(current.durationMinutes) || 0, allocatedMinutes);
    const progress = taskProgressFromWindows(workWindows, durationMinutes);
    const validWindows = workWindows.filter((window) => window.start && window.end);
    const status = validWindows.length && validWindows.every((window) => window.completed)
      ? "completed"
      : validWindows.some((window) => window.completed)
        ? "in-progress"
        : "pending";
    return {
      ...current,
      durationMinutes: durationMinutes || "",
      progress,
      status,
      workWindows,
    };
  }

  function updateDuration(value) {
    setForm((current) => {
      const allocatedMinutes = totalWorkWindowMinutes(current.workWindows);
      const durationMinutes = Math.max(Number(value) || 0, allocatedMinutes);
      return {
        ...current,
        durationMinutes: durationMinutes || "",
        progress: taskProgressFromWindows(current.workWindows, durationMinutes),
      };
    });
  }

  function updateWindow(id, field, value) {
    setForm((current) => {
      const workWindows = current.workWindows.map((window) => {
        if (window.id !== id) return window;
        const nextWindow = { ...window, [field]: value };
        const duration = workWindowDurationMinutes(nextWindow);
        if (field === "completed") {
          nextWindow.completed = Boolean(value);
          nextWindow.incomplete = nextWindow.completed ? false : nextWindow.incomplete;
          nextWindow.workedMinutes = nextWindow.completed
            ? duration
            : Math.min(Number(nextWindow.workedMinutes) || 0, duration);
        } else if (field === "workedMinutes") {
          nextWindow.workedMinutes = Math.min(Math.max(0, Number(value) || 0), duration);
          nextWindow.completed = duration > 0 && nextWindow.workedMinutes >= duration;
          nextWindow.incomplete = nextWindow.completed ? false : nextWindow.incomplete;
        } else {
          nextWindow.workedMinutes = Math.min(Number(nextWindow.workedMinutes) || 0, duration);
          nextWindow.completed = duration > 0 && nextWindow.workedMinutes >= duration;
          nextWindow.incomplete = false;
        }
        return nextWindow;
      });
      return syncWindowTracking(current, workWindows);
    });
  }

  function addWindow() {
    setForm((current) => ({
      ...current,
      workWindows: [...current.workWindows, emptyWindow()],
    }));
  }

  function removeWindow(id) {
    setForm((current) => {
      const workWindows =
        current.workWindows.length === 1
          ? [emptyWindow()]
          : current.workWindows.filter((window) => window.id !== id);
      return syncWindowTracking(current, workWindows);
    });
  }

  function submit(event) {
    event.preventDefault();
    const validWindows = form.workWindows.filter((window) => window.start && window.end);
    const partialWindow = form.workWindows.some(
      (window) => (window.start && !window.end) || (!window.start && window.end),
    );
    if (partialWindow) {
      setError("Each work window needs both a start and end time.");
      return;
    }
    const firstWindow = validWindows[0];
    const durationMinutes = Math.max(
      Number(form.durationMinutes) || 0,
      totalWorkWindowMinutes(validWindows),
    );
    const progress = validWindows.length
      ? taskProgressFromWindows(validWindows, durationMinutes)
      : Number(form.progress);
    onSave({
      ...form,
      durationMinutes,
      progress,
      workWindows: validWindows,
      startTime: firstWindow?.start || "",
      endTime: firstWindow?.end || "",
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div
        aria-labelledby="task-form-title"
        aria-modal="true"
        className="panel max-h-[95vh] w-full max-w-2xl overflow-y-auto p-6"
        role="dialog"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Schedule</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white" id="task-form-title">
              {task ? "Edit task" : "Create task"}
            </h2>
          </div>
          <button aria-label="Close" className="icon-button text-lg" onClick={onClose} type="button">
            x
          </button>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="field-label">Title</span>
            <input
              autoFocus
              className="field"
              name="title"
              onChange={updateField}
              required
              value={form.title}
            />
          </label>
          <label className="block">
            <span className="field-label">Description</span>
            <textarea
              className="field min-h-24 resize-y"
              name="description"
              onChange={updateField}
              value={form.description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Date</span>
              <input className="field" name="date" onChange={updateField} required type="date" value={form.date} />
            </label>
            <label className="block">
              <span className="field-label">Total time to spend</span>
              <div className="flex gap-2">
                <input
                  className="field"
                  min="0"
                  name="durationMinutes"
                  onChange={(event) => updateDuration(event.target.value)}
                  placeholder="Minutes"
                  type="number"
                  value={form.durationMinutes}
                />
                <span className="grid min-w-28 place-items-center rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {formatDuration(Number(form.durationMinutes) || 0)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Remaining time: {formatDuration(remainingMinutes)}
              </p>
            </label>
          </div>

          <section className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Remaining time: {formatDuration(remainingMinutes)}
              </p>
              <button className="button-secondary shrink-0 px-3" onClick={addWindow} type="button">
                + Window
              </button>
            </div>
            <div className="space-y-3">
              {form.workWindows.map((window, index) => (
                <div
                  className={`rounded-xl border bg-white p-3 dark:bg-slate-900 ${
                    window.incomplete
                      ? "border-rose-300 bg-rose-50/70 dark:border-rose-500/40 dark:bg-rose-500/10"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  key={window.id}
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="block">
                      <span className="field-label">Start window {index + 1}</span>
                      <input
                        className="field"
                        onChange={(event) => updateWindow(window.id, "start", event.target.value)}
                        type="time"
                        value={window.start}
                      />
                    </label>
                    <label className="block">
                      <span className="field-label">End window {index + 1}</span>
                      <input
                        className="field"
                        onChange={(event) => updateWindow(window.id, "end", event.target.value)}
                        type="time"
                        value={window.end}
                      />
                    </label>
                    <button
                      className="button-secondary self-end px-3"
                      onClick={() => removeWindow(window.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr]">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        checked={Boolean(window.completed)}
                        className="h-4 w-4 accent-indigo-600"
                        onChange={(event) => updateWindow(window.id, "completed", event.target.checked)}
                        type="checkbox"
                      />
                      Window completed
                    </label>
                    <label className="block">
                      <span className="field-label">Minutes actually worked</span>
                      <input
                        className="field"
                        max={workWindowDurationMinutes(window) || undefined}
                        min="0"
                        onChange={(event) => updateWindow(window.id, "workedMinutes", event.target.value)}
                        type="number"
                        value={window.workedMinutes || ""}
                      />
                    </label>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Window total: {formatDuration(workWindowDurationMinutes(window))}
                      </span>
                      <span>
                        {formatDuration(workWindowWorkedMinutes(window))} worked - {workWindowProgress(window)}%
                      </span>
                    </div>
                    {window.incomplete && !window.completed && (
                      <p className="mb-2 text-xs font-semibold text-rose-500">Incomplete window</p>
                    )}
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${workWindowProgress(window)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Allocated window time: {formatDuration(totalWorkWindowMinutes(form.workWindows))}.
              Remaining time: {formatDuration(remainingMinutes)}.
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              <span className="field-label mb-1">Status</span>
              <p className="capitalize">{form.status.replace("-", " ")}</p>
              <p className="mt-1 text-xs">Updated automatically from window completion.</p>
            </div>
            <label className="block">
              <span className="field-label">Progress: {form.progress}%</span>
              <input
                className="mt-4 h-2 w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={form.workWindows.some((window) => window.start && window.end)}
                max="100"
                min="0"
                name="progress"
                onChange={updateField}
                type="range"
                value={form.progress}
              />
              {form.workWindows.some((window) => window.start && window.end) && (
                <span className="mt-2 block text-xs text-slate-400">
                  Calculated from window time worked.
                </span>
              )}
            </label>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="flex justify-end gap-3">
            <button className="button-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="button-primary" type="submit">
              {task ? "Save changes" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
