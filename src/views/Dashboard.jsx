import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import DailyTimePanel from "../components/DailyTimePanel";
import EmptyState from "../components/EmptyState";
import IncompleteTracker from "../components/IncompleteTracker";
import ProgressRing from "../components/ProgressRing";
import TaskCard from "../components/TaskCard";
import WeeklyScheduler from "../components/WeeklyScheduler";
import { formatDate } from "../utils/date";

export default function Dashboard({
  tasks,
  allTasks,
  currentDateKey,
  dayCompleted,
  dayEndTime,
  lastCompletedDateLabel,
  stats,
  filtersActive,
  handlers,
  incompleteTasks,
  libraryTasks,
  milestones,
  onDayComplete,
  onDayEndChange,
  onLastDayReopen,
  onDayReopen,
  onAddTask,
  onAddLibraryTask,
  onAddMilestone,
  onDeleteMilestone,
  onUpdateMilestone,
}) {
  const rootRef = useRef(null);
  const currentDayTasks = tasks.filter((task) => task.date === currentDateKey);
  const futureTasks = tasks.filter((task) => task.date > currentDateKey);
  const allCurrentDayTasks = allTasks.filter((task) => task.date === currentDateKey);
  const displayTasks = dayCompleted
    ? futureTasks
    : currentDayTasks.length
      ? currentDayTasks
      : futureTasks.length
        ? futureTasks
        : tasks;

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-animate-card]",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" },
      );
    }, rootRef);
    return () => context.revert();
  }, [currentDateKey]);

  return (
    <div className="space-y-6" ref={rootRef}>
      <section className="grid min-w-0 gap-3 sm:grid-cols-3">
          <div className="panel p-3" data-animate-card>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-500">
              Productivity
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {stats.productivity}%
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Due so far
            </p>
          </div>
          <div className="panel p-3" data-animate-card>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#ed2939]">
              Incomplete
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {stats.incomplete}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Past day end
            </p>
          </div>
          <div className="panel p-3" data-animate-card>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-500">
              Streak
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {stats.streak}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              day{stats.streak === 1 ? "" : "s"}
            </p>
          </div>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3 p-4" data-animate-card>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-500">
            Present Working Day
          </p>
          <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
            {formatDate(currentDateKey)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Based on your planner-day boundary.
          </p>
        </div>
        {onLastDayReopen && (
          <button className="button-secondary py-2" onClick={onLastDayReopen} type="button">
            Reopen {lastCompletedDateLabel}
          </button>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0 space-y-6">
          <div className="panel p-5" data-animate-card>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {!dayCompleted && currentDayTasks.length ? "Current Planner Day" : "Upcoming Tasks"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Drag cards to arrange your workflow.
                </p>
              </div>
              <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {displayTasks.length} tasks
              </span>
            </div>
            {displayTasks.length ? (
              <div className="space-y-3">
                {displayTasks.map((task) => (
                  <TaskCard key={task.id} task={task} {...handlers} />
                ))}
              </div>
            ) : (
              <EmptyState filtered={filtersActive && allTasks.length > 0} onAddTask={onAddTask} />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="panel flex items-center justify-between p-5" data-animate-card>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Overall Completion
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {stats.complete} of {stats.total} tasks finished
                </p>
              </div>
              <ProgressRing
                percentage={stats.total ? Math.round((stats.complete / stats.total) * 100) : 0}
              />
            </div>
            <DailyTimePanel
              dayCompleted={dayCompleted}
              dayEndTime={dayEndTime}
              onDayComplete={onDayComplete}
              onDayEndChange={onDayEndChange}
              onDayReopen={onDayReopen}
              tasks={allCurrentDayTasks}
            />
          </div>
          <IncompleteTracker onEdit={handlers.onEdit} tasks={incompleteTasks} />
        </div>

        <aside className="min-w-0 xl:sticky xl:top-8 xl:self-start">
          <WeeklyScheduler
            currentDateKey={currentDateKey}
            libraryTasks={libraryTasks}
            milestones={milestones}
            onAddLibraryTask={onAddLibraryTask}
            onAddMilestone={onAddMilestone}
            onDeleteMilestone={onDeleteMilestone}
            onUpdateMilestone={onUpdateMilestone}
            tasks={allTasks}
          />
        </aside>
      </section>
    </div>
  );
}
