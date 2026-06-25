import { useEffect, useMemo, useState } from "react";
import { formatDate, fromDateKey, localDateKey } from "../utils/date";

function nextTenDates(anchorDateKey) {
  const start = fromDateKey(anchorDateKey);
  return Array.from({ length: 10 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateKey(date);
  });
}

export default function WeeklyScheduler({
  currentDateKey,
  libraryTasks,
  milestones,
  onAddLibraryTask,
  onAddMilestone,
  onDeleteMilestone,
  onUpdateMilestone,
  tasks,
}) {
  const activeLibraryTasks = libraryTasks.filter((task) => task.active);
  const fallbackTask = activeLibraryTasks[0];
  const days = useMemo(() => nextTenDates(currentDateKey), [currentDateKey]);
  const [form, setForm] = useState({
    libraryTaskId: fallbackTask?.id || "",
    date: currentDateKey,
    target: "",
  });
  const [libraryTitle, setLibraryTitle] = useState("");
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const libraryMap = useMemo(
    () => new Map(libraryTasks.map((task) => [task.id, task])),
    [libraryTasks],
  );

  useEffect(() => {
    if (!form.libraryTaskId && fallbackTask?.id) {
      setForm((current) => ({ ...current, libraryTaskId: fallbackTask.id }));
    }
  }, [fallbackTask?.id, form.libraryTaskId]);

  function milestoneTitle(milestone) {
    return (
      libraryMap.get(milestone.libraryTaskId)?.title ||
      taskMap.get(milestone.taskId)?.title ||
      "Deleted task"
    );
  }

  function isMilestoneDone(milestone) {
    const title = libraryMap.get(milestone.libraryTaskId)?.title;
    return (
      milestone.completed ||
      taskMap.get(milestone.taskId)?.status === "completed" ||
      Boolean(title && tasks.some((task) => task.title === title && task.status === "completed"))
    );
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name !== "libraryTaskId") return { ...current, [name]: value };
      const nextTaskTitle = libraryMap.get(value)?.title || "";
      const currentTaskTitle = libraryMap.get(current.libraryTaskId)?.title || "";
      const shouldUseSelectedTitle = !current.target || current.target === currentTaskTitle;
      return {
        ...current,
        libraryTaskId: value,
        target: shouldUseSelectedTitle ? nextTaskTitle : current.target,
      };
    });
  }

  function submit(event) {
    event.preventDefault();
    const libraryTaskId = form.libraryTaskId || fallbackTask?.id || "";
    const libraryTask = libraryMap.get(libraryTaskId);
    const linkedDailyTask = tasks.find((task) => task.title === libraryTask?.title);
    const milestone = onAddMilestone({
      ...form,
      libraryTaskId,
      taskId: linkedDailyTask?.id || "",
      target: form.target || libraryTask?.title || "",
    });
    if (milestone) {
      setForm((current) => ({ ...current, libraryTaskId, target: "" }));
    }
  }

  function createLibraryTask() {
    const task = onAddLibraryTask(libraryTitle);
    if (!task) return;
    setForm((current) => ({
      ...current,
      libraryTaskId: task.id,
      target: current.target || task.title,
    }));
    setLibraryTitle("");
  }

  return (
    <section className="panel relative min-w-0 overflow-hidden p-5" data-animate-card>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-[#ed2939]" />
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-500">
            Weekly Scheduler
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
            Next 10 days of dated targets
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pick a task, choose the date, and write what should be completed by then.
          </p>
        </div>
        <div className="flex min-w-0 gap-2">
          <input
            className="field w-44 py-2"
            onChange={(event) => setLibraryTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createLibraryTask();
              }
            }}
            placeholder="New task"
            value={libraryTitle}
          />
          <button className="button-secondary px-3 py-2" onClick={createLibraryTask} type="button">
            Create Task
          </button>
        </div>
      </div>

      <form className="grid min-w-0 gap-3" onSubmit={submit}>
        <select
          className="field"
          disabled={!activeLibraryTasks.length}
          name="libraryTaskId"
          onChange={updateField}
          value={form.libraryTaskId || fallbackTask?.id || ""}
        >
          {activeLibraryTasks.length ? (
            activeLibraryTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))
          ) : (
            <option value="">Create a library task first</option>
          )}
        </select>
        <input className="field" name="date" onChange={updateField} type="date" value={form.date} />
        <input
          className="field"
          name="target"
          onChange={updateField}
          placeholder="Example: Finish 40% of report"
          required
          value={form.target}
        />
        <button className="button-primary whitespace-nowrap" disabled={!activeLibraryTasks.length} type="submit">
          Add target
        </button>
      </form>

      <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
        {days.map((dateKey) => {
          const dayMilestones = milestones.filter((milestone) => milestone.date === dateKey);
          const selected = dateKey === form.date;
          return (
            <button
              className={`min-w-0 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                selected
                  ? "border-fuchsia-400 bg-fuchsia-50/80 shadow-fuchsia-500/10 dark:bg-fuchsia-500/10"
                  : "border-slate-200 bg-white/75 dark:border-slate-800 dark:bg-[#171722]/80"
              }`}
              key={dateKey}
              onClick={() => setForm((current) => ({ ...current, date: dateKey }))}
              type="button"
            >
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {formatDate(dateKey).replace(/, \d{4}$/, "")}
              </p>
              <div className="mt-3 space-y-2">
                {dayMilestones.length ? (
                  dayMilestones.slice(0, 2).map((milestone) => (
                    <div className="min-w-0 rounded-xl bg-slate-950/5 p-2 dark:bg-white/5" key={milestone.id}>
                      <p className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                        {milestoneTitle(milestone)}
                      </p>
                      <p className="mt-0.5 line-clamp-3 break-words text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        {milestone.target}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`text-[10px] ${
                            isMilestoneDone(milestone)
                              ? "text-emerald-500"
                              : "text-fuchsia-500"
                          }`}
                        >
                          {isMilestoneDone(milestone) ? "Done" : "Target"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400">No target yet</p>
                )}
                {dayMilestones.length > 2 && (
                  <p className="text-[10px] font-semibold text-fuchsia-500">
                    +{dayMilestones.length - 2} more target{dayMilestones.length - 2 === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid min-w-0 gap-2">
        {milestones
          .filter((milestone) => days.includes(milestone.date))
          .slice(0, 9)
          .map((milestone) => (
            <div
              className="flex min-w-0 items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300"
              key={milestone.id}
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isMilestoneDone(milestone)
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-200"
                }`}
              >
                {isMilestoneDone(milestone) ? "Done" : "Target"}
              </span>
              <button
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => onUpdateMilestone?.(milestone.id, { date: form.date })}
                title="Move this target to the selected scheduler date"
                type="button"
              >
                {milestoneTitle(milestone)} - {milestone.target}
              </button>
              <button
                className="shrink-0 font-semibold text-rose-500"
                onClick={() => onDeleteMilestone(milestone.id)}
                type="button"
              >
                Remove
              </button>
            </div>
          ))}
      </div>
    </section>
  );
}
