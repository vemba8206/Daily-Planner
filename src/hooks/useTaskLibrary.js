import { useEffect, useState } from "react";

const LIBRARY_KEY = "planora.taskLibrary.v1";

function normalizeLibraryTask(value = {}) {
  return {
    id: value.id || crypto.randomUUID(),
    title: String(value.title || "").trim(),
    active: value.active !== false,
    createdAt: value.createdAt || new Date().toISOString(),
  };
}

function readLibrary() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIBRARY_KEY));
    return Array.isArray(parsed)
      ? parsed.map(normalizeLibraryTask).filter((task) => task.title)
      : [];
  } catch {
    return [];
  }
}

export function useTaskLibrary() {
  const [libraryTasks, setLibraryTasks] = useState(readLibrary);

  useEffect(() => {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryTasks));
  }, [libraryTasks]);

  function addLibraryTask(title) {
    const cleanTitle = String(title || "").trim();
    if (!cleanTitle) return null;
    const existing = libraryTasks.find(
      (task) => task.title.toLowerCase() === cleanTitle.toLowerCase() && task.active,
    );
    if (existing) return existing;
    const task = normalizeLibraryTask({ title: cleanTitle });
    setLibraryTasks((current) => [task, ...current]);
    return task;
  }

  return { libraryTasks, addLibraryTask };
}
