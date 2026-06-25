import { useEffect, useState } from "react";
import { localDateKey } from "../utils/date";

const MILESTONES_KEY = "planora.taskMilestones.v1";

function normalizeMilestone(value = {}) {
  return {
    id: value.id || crypto.randomUUID(),
    taskId: value.taskId || "",
    libraryTaskId: value.libraryTaskId || "",
    date: value.date || localDateKey(),
    target: String(value.target || "").trim(),
    completed: Boolean(value.completed),
    createdAt: value.createdAt || new Date().toISOString(),
  };
}

function readMilestones() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MILESTONES_KEY));
    return Array.isArray(parsed)
      ? parsed
          .map(normalizeMilestone)
          .filter((milestone) => (milestone.taskId || milestone.libraryTaskId) && milestone.target)
      : [];
  } catch {
    return [];
  }
}

export function useTaskMilestones() {
  const [milestones, setMilestones] = useState(readMilestones);

  useEffect(() => {
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));
  }, [milestones]);

  function addMilestone(values) {
    const milestone = normalizeMilestone(values);
    if ((!milestone.taskId && !milestone.libraryTaskId) || !milestone.target) return null;
    setMilestones((current) => [milestone, ...current]);
    return milestone;
  }

  function updateMilestone(id, updates) {
    setMilestones((current) =>
      current
        .map((milestone) =>
          milestone.id === id ? normalizeMilestone({ ...milestone, ...updates }) : milestone,
        )
        .filter((milestone) => (milestone.taskId || milestone.libraryTaskId) && milestone.target),
    );
  }

  function deleteMilestone(id) {
    setMilestones((current) => current.filter((milestone) => milestone.id !== id));
  }

  function toggleMilestone(id) {
    setMilestones((current) =>
      current.map((milestone) =>
        milestone.id === id ? { ...milestone, completed: !milestone.completed } : milestone,
      ),
    );
  }

  return { milestones, addMilestone, updateMilestone, deleteMilestone, toggleMilestone };
}
