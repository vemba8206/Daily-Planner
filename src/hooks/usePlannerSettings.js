import { useEffect, useState } from "react";

const SETTINGS_KEY = "planora.plannerSettings.v1";
const DEFAULT_SETTINGS = {
  defaultDayEnd: "04:00",
  dayEnds: {},
  completedDays: {},
};

function readSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return {
      ...DEFAULT_SETTINGS,
      ...(parsed || {}),
      defaultDayEnd:
        parsed?.defaultDayEnd && parsed.defaultDayEnd !== "00:00"
          ? parsed.defaultDayEnd
          : DEFAULT_SETTINGS.defaultDayEnd,
      dayEnds: { ...(parsed?.dayEnds || {}) },
      completedDays: { ...(parsed?.completedDays || {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function usePlannerSettings() {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  function getDayEnd(dateKey) {
    return settings.dayEnds[dateKey] || settings.defaultDayEnd;
  }

  function setDayEnd(dateKey, dayEndTime) {
    setSettings((current) => ({
      ...current,
      dayEnds: {
        ...current.dayEnds,
        [dateKey]: dayEndTime || current.defaultDayEnd,
      },
    }));
  }

  function isDayCompleted(dateKey) {
    return Boolean(settings.completedDays[dateKey]);
  }

  function completeDay(dateKey) {
    setSettings((current) => ({
      ...current,
      completedDays: {
        ...current.completedDays,
        [dateKey]: {
          completedAt: new Date().toISOString(),
          dayEnd: current.dayEnds[dateKey] || current.defaultDayEnd,
        },
      },
    }));
  }

  function reopenDay(dateKey) {
    setSettings((current) => {
      const nextCompletedDays = { ...current.completedDays };
      delete nextCompletedDays[dateKey];
      return { ...current, completedDays: nextCompletedDays };
    });
  }

  return { settings, getDayEnd, setDayEnd, isDayCompleted, completeDay, reopenDay };
}
