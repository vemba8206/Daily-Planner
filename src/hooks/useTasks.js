import { useEffect, useState } from "react";
import { createTask, refreshExpiredTaskWindows, updateTaskValues } from "../utils/tasks";

const TASKS_KEY = "planora.tasks.v1";
const BACKUP_KEY = "planora.tasks.backup.v1";
const SAVED_AT_KEY = "planora.savedAt";

function parseTasks(value, getDayEnd = null) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((task) => createTask(task, getDayEnd)) : null;
  } catch {
    return null;
  }
}

function loadTasks(getDayEnd = null) {
  const tasks = parseTasks(localStorage.getItem(TASKS_KEY), getDayEnd);
  if (tasks) return tasks;
  const backup = parseTasks(localStorage.getItem(BACKUP_KEY), getDayEnd);
  return backup || [];
}

function persistTasks(tasks) {
  const existing = localStorage.getItem(TASKS_KEY);
  if (parseTasks(existing)) localStorage.setItem(BACKUP_KEY, existing);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  localStorage.setItem(SAVED_AT_KEY, new Date().toISOString());
}

export function useTasks(getDayEnd = null) {
  const [tasks, setTasks] = useState(() => loadTasks(getDayEnd));
  const [savedAt, setSavedAt] = useState(() => localStorage.getItem(SAVED_AT_KEY));

  useEffect(() => {
    persistTasks(tasks);
    setSavedAt(new Date().toISOString());
  }, [tasks]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTasks((current) => {
        const next = current.map((task) => refreshExpiredTaskWindows(task, new Date(), getDayEnd));
        return next.some((task, index) => task !== current[index]) ? next : current;
      });
    }, 60000);
    return () => window.clearInterval(timer);
  }, [getDayEnd]);

  function addTask(values) {
    const task = createTask(values, getDayEnd);
    setTasks((current) => [task, ...current]);
    return task;
  }

  function editTask(id, values) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? updateTaskValues(task, values, getDayEnd) : task)),
    );
  }

  function deleteTask(id) {
    const deleted = tasks.find((task) => task.id === id);
    setTasks((current) => current.filter((task) => task.id !== id));
    return deleted;
  }

  function restoreTask(task) {
    if (task) setTasks((current) => [task, ...current]);
  }

  function reorderTasks(draggedId, targetId) {
    if (!draggedId || draggedId === targetId) return;
    setTasks((current) => {
      const result = [...current];
      const sourceIndex = result.findIndex((task) => task.id === draggedId);
      const targetIndex = result.findIndex((task) => task.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const [moved] = result.splice(sourceIndex, 1);
      result.splice(targetIndex, 0, moved);
      return result;
    });
  }

  return { tasks, savedAt, addTask, editTask, deleteTask, restoreTask, reorderTasks };
}
