import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedAura from "./components/AnimatedAura";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TaskModal from "./components/TaskModal";
import Toast from "./components/Toast";
import { usePlannerSettings } from "./hooks/usePlannerSettings";
import { useTaskLibrary } from "./hooks/useTaskLibrary";
import { useTaskMilestones } from "./hooks/useTaskMilestones";
import { useTasks } from "./hooks/useTasks";
import { useTheme } from "./hooks/useTheme";
import { formatDate, fromDateKey, getCurrentPlannerDateKey, localDateKey, nextDateKey } from "./utils/date";
import { calculateStats, getIncompleteTasks } from "./utils/tasks";
import Dashboard from "./views/Dashboard";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { settings, getDayEnd, setDayEnd, isDayCompleted, completeDay, reopenDay } =
    usePlannerSettings();
  const { tasks, savedAt, addTask, editTask, deleteTask, restoreTask, reorderTasks } = useTasks(getDayEnd);
  const { libraryTasks, addLibraryTask } = useTaskLibrary();
  const {
    milestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  } = useTaskMilestones();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskModal, setTaskModal] = useState({ open: false, task: null, date: localDateKey() });
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const draggedTask = useRef(null);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [search, statusFilter, tasks]);

  const currentPlannerDateKey = useMemo(
    () => getCurrentPlannerDateKey(getDayEnd),
    [settings],
  );
  const activePlannerDateKey = useMemo(() => {
    let dateKey = currentPlannerDateKey;
    let guard = 0;
    while (isDayCompleted(dateKey) && guard < 30) {
      dateKey = nextDateKey(dateKey);
      guard += 1;
    }
    return dateKey;
  }, [currentPlannerDateKey, settings]);
  const lastCompletedPlannerDateKey = useMemo(() => {
    const completedKeys = Object.keys(settings.completedDays || {}).filter(
      (dateKey) => fromDateKey(dateKey) < fromDateKey(activePlannerDateKey),
    );
    return completedKeys.sort().at(-1) || null;
  }, [activePlannerDateKey, settings]);
  const stats = useMemo(
    () => calculateStats(tasks, new Date(), getDayEnd, isDayCompleted, activePlannerDateKey),
    [activePlannerDateKey, settings, tasks],
  );
  const incompleteTasks = useMemo(
    () => getIncompleteTasks(tasks, new Date(), getDayEnd, isDayCompleted),
    [settings, tasks],
  );
  const incompleteTaskIds = useMemo(
    () => new Set(incompleteTasks.map((task) => task.id)),
    [incompleteTasks],
  );
  const dashboardTasks = useMemo(
    () => filteredTasks.filter((task) => !isDayCompleted(task.date)),
    [filteredTasks, settings],
  );
  const filtersActive = Boolean(search) || statusFilter !== "all";

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openNewTask(date = activePlannerDateKey) {
    setTaskModal({ open: true, task: null, date });
  }

  function openEditTask(task) {
    setTaskModal({ open: true, task, date: task.date });
  }

  function saveTask(values) {
    if (taskModal.task) {
      editTask(taskModal.task.id, values);
      setToast({ message: "Task updated." });
    } else {
      addTask(values);
      setToast({ message: "Task added to your planner." });
    }
    setTaskModal((current) => ({ ...current, open: false }));
  }

  function removeTask(id) {
    const removed = deleteTask(id);
    setToast({
      message: "Task deleted.",
      actionLabel: "Undo",
      onAction: () => {
        restoreTask(removed);
        setToast({ message: "Task restored." });
      },
    });
  }

  function onDrop(targetId) {
    reorderTasks(draggedTask.current, targetId);
    draggedTask.current = null;
  }

  const cardHandlers = {
    onEdit: openEditTask,
    onDelete: removeTask,
    onUpdate: editTask,
    onDragStart: (id) => {
      draggedTask.current = id;
    },
    onDrop,
    isTaskIncomplete: (task) => incompleteTaskIds.has(task.id),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4ff] text-slate-700 dark:bg-[#0d0d14] dark:text-slate-200">
      <AnimatedAura />
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleTheme={toggleTheme}
        stats={stats}
        theme={theme}
      />

      <main className="relative z-10 min-h-screen px-4 py-5 sm:px-7 lg:ml-20 lg:px-9 lg:py-8">
        <Header
          onAddTask={() => openNewTask()}
          onOpenMenu={() => setSidebarOpen(true)}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          savedAt={savedAt}
          search={search}
          statusFilter={statusFilter}
        />
        <Dashboard
          allTasks={tasks}
          currentDateKey={activePlannerDateKey}
          dayCompleted={isDayCompleted(activePlannerDateKey)}
          dayEndTime={getDayEnd(activePlannerDateKey)}
          lastCompletedDateLabel={lastCompletedPlannerDateKey ? formatDate(lastCompletedPlannerDateKey) : ""}
          filtersActive={filtersActive}
          handlers={cardHandlers}
          incompleteTasks={incompleteTasks}
          libraryTasks={libraryTasks}
          milestones={milestones}
          onAddTask={() => openNewTask()}
          onAddLibraryTask={addLibraryTask}
          onAddMilestone={addMilestone}
          onDeleteMilestone={deleteMilestone}
          onDayComplete={() => {
            completeDay(activePlannerDateKey);
            setToast({ message: "Planner day completed. Unfinished tasks moved to incomplete." });
          }}
          onDayEndChange={(time) => setDayEnd(activePlannerDateKey, time)}
          onLastDayReopen={
            lastCompletedPlannerDateKey
              ? () => {
                  reopenDay(lastCompletedPlannerDateKey);
                  setToast({ message: `Reopened ${formatDate(lastCompletedPlannerDateKey)}.` });
                }
              : null
          }
          onDayReopen={() => {
            reopenDay(activePlannerDateKey);
            setToast({ message: "Planner day reopened." });
          }}
          onUpdateMilestone={updateMilestone}
          stats={stats}
          tasks={dashboardTasks}
        />
      </main>

      <TaskModal
        initialDate={taskModal.date}
        onClose={() => setTaskModal((current) => ({ ...current, open: false }))}
        onSave={saveTask}
        open={taskModal.open}
        task={taskModal.task}
      />
      <Toast
        actionLabel={toast?.actionLabel}
        message={toast?.message}
        onAction={toast?.onAction}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
