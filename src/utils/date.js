const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

export function localDateKey(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function fromDateKey(dateKey) {
  if (!dateKey) return new Date();
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function nextDateKey(dateKey) {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + 1);
  return localDateKey(date);
}

export function formatDate(dateKey) {
  return DATE_FORMATTER.format(fromDateKey(dateKey));
}

export function formatMonth(date) {
  return MONTH_FORMATTER.format(date);
}

export function formatTime(time) {
  if (!time) return "Any time";
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

export function timeToMinutes(time) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTimeRange(start, end) {
  if (!start || !end) return "No window";
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function taskDurationMinutes(task) {
  const planned = Number(task.durationMinutes);
  if (planned > 0) return planned;
  if (Array.isArray(task.workWindows) && task.workWindows.length) {
    return task.workWindows.reduce((total, window) => total + workWindowDurationMinutes(window), 0);
  }
  if (!task.startTime || !task.endTime) return 0;
  const start = timeToMinutes(task.startTime);
  const end = timeToMinutes(task.endTime);
  if (start === null || end === null) return 0;
  return Math.max(0, end - start);
}

export function workWindowDurationMinutes(window) {
  const start = timeToMinutes(window.start);
  const end = timeToMinutes(window.end);
  if (start === null || end === null) return 0;
  return end > start ? end - start : end + 1440 - start;
}

export function totalWorkWindowMinutes(windows = []) {
  return windows.reduce((total, window) => total + workWindowDurationMinutes(window), 0);
}

export function totalScheduledMinutes(tasks) {
  return tasks.reduce((total, task) => total + taskDurationMinutes(task), 0);
}

export function formatDuration(minutes) {
  if (!minutes) return "0 min";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return `${hours} hr ${remainingMinutes} min`;
}

export function getPlannerDayRange(dateKey, dayEndTime = "00:00") {
  const start = combineDateAndTime(dateKey, dayEndTime || "00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function getCurrentPlannerDateKey(getDayEnd = () => "00:00", now = new Date()) {
  const todayKey = localDateKey(now);
  const previous = new Date(now);
  previous.setDate(previous.getDate() - 1);
  const previousKey = localDateKey(previous);
  const previousDayEnd = getPlannerDayRange(previousKey, getDayEnd(previousKey)).end;
  return now < previousDayEnd ? previousKey : todayKey;
}

function taskWindows(task) {
  if (Array.isArray(task.workWindows) && task.workWindows.length) {
    return task.workWindows.filter((window) => window.start && window.end);
  }
  if (task.startTime && task.endTime) return [{ start: task.startTime, end: task.endTime }];
  return [];
}

export function availableWorkWindows(tasks, dayEndTime = "00:00") {
  const selectedDayEnd = timeToMinutes(dayEndTime || "00:00") ?? 0;
  const startOfPlannerDay = selectedDayEnd;
  const dayEnd = startOfPlannerDay + 1440;
  const busy = tasks
    .flatMap(taskWindows)
    .map((window) => {
      let start = timeToMinutes(window.start);
      let end = timeToMinutes(window.end);
      if (start === null || end === null) return null;
      if (start < selectedDayEnd) start += 1440;
      if (end <= selectedDayEnd) end += 1440;
      if (end <= start) end += 1440;
      if (end <= startOfPlannerDay || start >= dayEnd) return null;
      return {
        start: Math.max(start, startOfPlannerDay),
        end: Math.min(end, dayEnd),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  const merged = [];
  busy.forEach((window) => {
    const latest = merged[merged.length - 1];
    if (!latest || window.start > latest.end) {
      merged.push({ ...window });
    } else {
      latest.end = Math.max(latest.end, window.end);
    }
  });

  const free = [];
  let cursor = startOfPlannerDay;
  merged.forEach((window) => {
    if (window.start > cursor) free.push({ start: cursor, end: window.start });
    cursor = Math.max(cursor, window.end);
  });
  if (cursor < dayEnd) free.push({ start: cursor, end: dayEnd });

  return free
    .filter((window) => window.end - window.start >= 15)
    .map((window) => ({
      start: minutesToTime(window.start),
      end: minutesToTime(window.end),
      minutes: window.end - window.start,
    }));
}

export function startOfWeek(date = new Date()) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function isDateInCurrentWeek(dateKey, today = new Date()) {
  const beginning = startOfWeek(today);
  const end = new Date(beginning);
  end.setDate(beginning.getDate() + 7);
  const value = fromDateKey(dateKey);
  return value >= beginning && value < end;
}

export function isSameMonth(dateKey, monthDate = new Date()) {
  const value = fromDateKey(dateKey);
  return (
    value.getMonth() === monthDate.getMonth() &&
    value.getFullYear() === monthDate.getFullYear()
  );
}

export function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getCalendarDays(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return {
      key: localDateKey(day),
      label: day.getDate(),
      inMonth: day.getMonth() === monthDate.getMonth(),
    };
  });
}

export function combineDateAndTime(dateKey, time) {
  const date = fromDateKey(dateKey);
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}
