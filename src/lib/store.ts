import { useState, useCallback } from "react";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export interface ReadingEntry {
  id: string;
  title: string;
  pagesRead: number;
  minutesSpent: number;
  date: string; // YYYY-MM-DD
}

function getStorageKey(key: string) {
  return `bloom_${key}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(key), JSON.stringify(value));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage("tasks", []));

  const save = useCallback((updated: Task[]) => {
    setTasks(updated);
    saveToStorage("tasks", updated);
  }, []);

  const addTask = useCallback((text: string, date: string) => {
    const task: Task = { id: crypto.randomUUID(), text, completed: false, date };
    save([...tasks, task]);
  }, [tasks, save]);

  const toggleTask = useCallback((id: string) => {
    save(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, [tasks, save]);

  const deleteTask = useCallback((id: string) => {
    save(tasks.filter(t => t.id !== id));
  }, [tasks, save]);

  const editTask = useCallback((id: string, text: string) => {
    save(tasks.map(t => t.id === id ? { ...t, text } : t));
  }, [tasks, save]);

  const getTasksForDate = useCallback((date: string) => {
    return tasks.filter(t => t.date === date);
  }, [tasks]);

  const getTasksForMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return tasks.filter(t => t.date.startsWith(prefix));
  }, [tasks]);

  return { tasks, addTask, toggleTask, deleteTask, editTask, getTasksForDate, getTasksForMonth };
}

export function useReadingLog() {
  const [entries, setEntries] = useState<ReadingEntry[]>(() => loadFromStorage("reading", []));

  const save = useCallback((updated: ReadingEntry[]) => {
    setEntries(updated);
    saveToStorage("reading", updated);
  }, []);

  const addEntry = useCallback((title: string, pagesRead: number, minutesSpent: number, date: string) => {
    const entry: ReadingEntry = { id: crypto.randomUUID(), title, pagesRead, minutesSpent, date };
    save([...entries, entry]);
  }, [entries, save]);

  const deleteEntry = useCallback((id: string) => {
    save(entries.filter(e => e.id !== id));
  }, [entries, save]);

  const getEntriesForDate = useCallback((date: string) => {
    return entries.filter(e => e.date === date);
  }, [entries]);

  const getEntriesForMonth = useCallback((year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return entries.filter(e => e.date.startsWith(prefix));
  }, [entries]);

  const getReadingStreak = useCallback(() => {
    const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
    if (dates.length === 0) return 0;
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const curr = new Date(dates[i]);
      const prev = new Date(dates[i + 1]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }, [entries]);

  return { entries, addEntry, deleteEntry, getEntriesForDate, getEntriesForMonth, getReadingStreak };
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
