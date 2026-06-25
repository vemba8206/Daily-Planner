import {
  fromDateKey,
  getCurrentPlannerDateKey,
  getPlannerDayRange,
  isDateInCurrentWeek,
  isSameMonth,
  localDateKey,
  timeToMinutes,
  totalWorkWindowMinutes,
  workWindowDurationMinutes,
} from "./date";

export const PRIORITIES = ["low", "medium", "high"];
export const STATUSES = ["pending", "in-progress", "completed"];

function normalizeWorkWindows(values = []) {
  const windows = Array.isArray(values) ? values : [];
  return windows
    .map((window) => ({
      id: window.id || crypto.randomUUID(),
      start: window.start || "",
      end: window.end || "",
      completed: Boolean(window.completed),
      incomplete: Boolean(window.incomplete),
      workedMinutes: Math.max(0, Number(window.workedMinutes) || 0),
    }))
    .filter((window) => window.start || window.end);
}

const DEFAULT_WINDOW_BOUNDARY = "04:00";

function windowEndDate(taskDate, window, dayEndTime = DEFAULT_WINDOW_BOUNDARY) {
  if (!taskDate || !window.start || !window.end) return null;
  const date = fromDateKey(taskDate);
  const start = timeToMinutes(window.start);
  const end = timeToMinutes(window.end);
  const dayEnd = timeToMinutes(dayEndTime) ?? 0;
  if (start === null || end === null) return null;
  if (end <= start || end <= dayEnd) date.setDate(date.getDate() + 1);
  const hours = Math.floor(end / 60);
  const minutes = end % 60;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function markExpiredWindows(workWindows, taskDate, now = new Date(), dayEndTime = DEFAULT_WINDOW_BOUNDARY) {
  return workWindows.map((window) => {
    if (window.completed || window.incomplete) return window;
    const endDate = windowEndDate(taskDate, window, dayEndTime);
    return endDate && now > endDate ? { ...window, incomplete: true } : window;
  });
}

function statusFromWindows(workWindows, fallbackStatus = "pending") {
  const validWindows = workWindows.filter((window) => window.start && window.end);
  if (!validWindows.length) return fallbackStatus === "completed" ? "completed" : "pending";
  if (validWindows.every((window) => window.completed)) return "completed";
  if (validWindows.some((window) => window.completed)) return "in-progress";
  return "pending";
}

export function workWindowWorkedMinutes(window) {
  const duration = workWindowDurationMinutes(window);
  if (!duration) return 0;
  return window.completed ? duration : Math.min(duration, Math.max(0, Number(window.workedMinutes) || 0));
}

export function workWindowProgress(window) {
  const duration = workWindowDurationMinutes(window);
  return duration ? Math.round((workWindowWorkedMinutes(window) / duration) * 100) : 0;
}

export function taskProgressFromWindows(workWindows = [], durationMinutes = 0) {
  const allocatedMinutes = totalWorkWindowMinutes(workWindows);
  const totalMinutes = Math.max(Number(durationMinutes) || 0, allocatedMinutes);
  if (!totalMinutes) return 0;
  const workedMinutes = workWindows.reduce(
    (total, window) => total + workWindowWorkedMinutes(window),
    0,
  );
  return Math.min(100, Math.round((workedMinutes / totalMinutes) * 100));
}

export function createTask(values = {}, getDayEnd = null) {
  const taskDate = values.date || localDateKey();
  const dayEndTime = getDayEnd ? getDayEnd(taskDate) : DEFAULT_WINDOW_BOUNDARY;
  const workWindows = markExpiredWindows(normalizeWorkWindows(
    values.workWindows?.length
      ? values.workWindows
      : values.startTime || values.endTime
        ? [{ start: values.startTime || "", end: values.endTime || "" }]
        : [],
  ), taskDate, new Date(), dayEndTime);
  const firstWindow = workWindows.find((window) => window.start && window.end);
  const durationMinutes = Math.max(
    0,
    Number(values.durationMinutes) || 0,
    totalWorkWindowMinutes(workWindows),
  );
  const hasWindowTracking = workWindows.some(
    (window) => window.completed || Number(window.workedMinutes) > 0,
  );
  const progress = hasWindowTracking
    ? taskProgressFromWindows(workWindows, durationMinutes)
    : Math.max(0, Math.min(100, Number(values.progress) || 0));
  const windowStatus = statusFromWindows(workWindows, values.status);
  const completed = windowStatus === "completed" || progress === 100;
  return {
    id: values.id || crypto.randomUUID(),
    title: String(values.title || "").trim(),
    description: String(values.description || "").trim(),
    date: taskDate,
    durationMinutes,
    workWindows,
    startTime: firstWindow?.start || values.startTime || "",
    endTime: firstWindow?.end || values.endTime || "",
    priority: PRIORITIES.includes(values.priority) ? values.priority : "medium",
    status: completed ? "completed" : windowStatus,
    progress: completed ? 100 : Math.min(99, progress),
    reminder: Boolean(values.reminder),
    createdAt: values.createdAt || new Date().toISOString(),
    completedAt: completed ? values.completedAt || new Date().toISOString() : null,
  };
}

export function updateTaskValues(existingTask, updates, getDayEnd = null) {
  const merged = { ...existingTask, ...updates };
  const completed = merged.status === "completed" || Number(merged.progress) === 100;
  if (completed) {
    merged.status = "completed";
    merged.progress = 100;
    merged.completedAt = existingTask.completedAt || new Date().toISOString();
  } else {
    merged.progress = Math.max(0, Math.min(99, Number(merged.progress) || 0));
    merged.completedAt = null;
  }
  return createTask(merged, getDayEnd);
}

export function refreshExpiredTaskWindows(task, now = new Date(), getDayEnd = null) {
  const dayEndTime = getDayEnd ? getDayEnd(task.date) : DEFAULT_WINDOW_BOUNDARY;
  const workWindows = markExpiredWindows(normalizeWorkWindows(task.workWindows), task.date, now, dayEndTime);
  const changed = workWindows.some(
    (window, index) => Boolean(window.incomplete) !== Boolean(task.workWindows?.[index]?.incomplete),
  );
  if (!changed) return task;
  return createTask({ ...task, workWindows });
}

export function sortTasks(tasks) {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    return (
      a.date.localeCompare(b.date) ||
      (a.startTime || "99:99").localeCompare(b.startTime || "99:99") ||
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  });
}

function completionDateKey(task, getDayEnd = () => DEFAULT_WINDOW_BOUNDARY) {
  return task.completedAt ? getCurrentPlannerDateKey(getDayEnd, new Date(task.completedAt)) : null;
}

export function getIncompleteTasks(
  tasks,
  today = new Date(),
  getDayEnd = () => "00:00",
  isDayCompleted = () => false,
) {
  return tasks.filter((task) => {
    if (task.status === "completed") return false;
    if (isDayCompleted(task.date)) return true;
    const dayEnd = getPlannerDayRange(task.date, getDayEnd(task.date)).end;
    return dayEnd < today;
  });
}

export function calculateStats(
  tasks,
  today = new Date(),
  getDayEnd = () => "00:00",
  isDayCompleted = () => false,
  currentPlannerDateKey = localDateKey(today),
) {
  const completed = tasks.filter((task) => task.status === "completed");
  const weekCompleted = completed.filter((task) =>
    isDateInCurrentWeek(completionDateKey(task, getDayEnd), today),
  ).length;
  const monthCompleted = completed.filter((task) =>
    isSameMonth(completionDateKey(task, getDayEnd), today),
  ).length;
  const incomplete = getIncompleteTasks(tasks, today, getDayEnd, isDayCompleted);
  const actionable = tasks.filter(
    (task) =>
      isDayCompleted(task.date) || getPlannerDayRange(task.date, getDayEnd(task.date)).end <= today,
  );
  const productivityBase = actionable.length ? actionable : tasks;
  const productivity = productivityBase.length
    ? Math.round(
        (productivityBase.filter((task) => task.status === "completed").length /
          productivityBase.length) *
          100,
      )
    : 0;

  const completedDays = new Set(completed.map((task) => completionDateKey(task, getDayEnd)).filter(Boolean));
  let streak = 0;
  const cursor = new Date(today);
  if (!completedDays.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (completedDays.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    total: tasks.length,
    complete: completed.length,
    today: tasks.filter((task) => task.date === currentPlannerDateKey && !isDayCompleted(task.date)).length,
    weekCompleted,
    monthCompleted,
    incomplete: incomplete.length,
    productivity,
    streak,
  };
}

export function getLastSevenDays(tasks) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return {
      key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      completed: tasks.filter((task) => completionDateKey(task) === key).length,
      planned: tasks.filter((task) => task.date === key).length,
    };
  });
}

export function getMonthlyProgress(tasks, monthDate = new Date()) {
  const monthTasks = tasks.filter((task) => isSameMonth(task.date, monthDate));
  const completed = monthTasks.filter((task) => task.status === "completed").length;
  return {
    planned: monthTasks.length,
    completed,
    percentage: monthTasks.length ? Math.round((completed / monthTasks.length) * 100) : 0,
  };
}

export function isOverdue(task) {
  return task.status !== "completed" && fromDateKey(task.date) < fromDateKey(localDateKey());
}
