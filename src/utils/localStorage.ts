import type { Todo, TodoFilters } from '../types/todo';
import {
  CATEGORIES,
  DEFAULT_TODO_FILTERS,
  PRIORITIES,
  TODO_STATUSES,
} from '../types/todo';

export const TODO_STORAGE_KEY = 'todo-list-storage';
export const TODO_FILTERS_STORAGE_KEY = 'todo-list-filters';

interface TodoStoragePayload {
  todos: Todo[];
}

const isBrowserStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string => typeof value === 'string';

const isValidDateString = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value));

const isPriority = (value: unknown): value is Todo['priority'] =>
  isString(value) && PRIORITIES.includes(value as Todo['priority']);

const isCategory = (value: unknown): value is Todo['category'] =>
  isString(value) && CATEGORIES.includes(value as Todo['category']);

const isTodoStatus = (value: unknown): value is Todo['status'] =>
  isString(value) && TODO_STATUSES.includes(value as Todo['status']);

const isCategoryFilter = (value: unknown): value is TodoFilters['category'] =>
  value === 'all' || isCategory(value);

const isPriorityFilter = (value: unknown): value is TodoFilters['priority'] =>
  value === 'all' || isPriority(value);

const isStatusFilter = (value: unknown): value is TodoFilters['status'] =>
  value === 'all' || isTodoStatus(value);

export const isTodo = (value: unknown): value is Todo => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.title) &&
    value.title.trim().length > 0 &&
    (value.description === undefined || isString(value.description)) &&
    (value.dueDate === undefined || isValidDateString(value.dueDate)) &&
    isPriority(value.priority) &&
    isCategory(value.category) &&
    isTodoStatus(value.status) &&
    isValidDateString(value.createdAt) &&
    isValidDateString(value.updatedAt)
  );
};

const parseJson = <T>(rawValue: string | null, fallback: T): T => {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const readStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowserStorageAvailable()) {
    return fallback;
  }

  try {
    return parseJson<T>(window.localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
};

const writeStorage = <T>(key: string, value: T): boolean => {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const loadTodos = (): Todo[] => {
  const storedValue = readStorage<unknown>(TODO_STORAGE_KEY, []);

  if (Array.isArray(storedValue)) {
    return storedValue.filter(isTodo);
  }

  if (isRecord(storedValue) && Array.isArray(storedValue.todos)) {
    return storedValue.todos.filter(isTodo);
  }

  return [];
};

export const saveTodos = (todos: Todo[]): boolean =>
  writeStorage<TodoStoragePayload>(TODO_STORAGE_KEY, {
    todos: todos.filter(isTodo),
  });

export const clearTodos = (): boolean => {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(TODO_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const loadTodoFilters = (): TodoFilters => {
  const storedValue = readStorage<unknown>(TODO_FILTERS_STORAGE_KEY, DEFAULT_TODO_FILTERS);

  if (!isRecord(storedValue)) {
    return DEFAULT_TODO_FILTERS;
  }

  return {
    category: isCategoryFilter(storedValue.category)
      ? storedValue.category
      : DEFAULT_TODO_FILTERS.category,
    priority: isPriorityFilter(storedValue.priority)
      ? storedValue.priority
      : DEFAULT_TODO_FILTERS.priority,
    status: isStatusFilter(storedValue.status) ? storedValue.status : DEFAULT_TODO_FILTERS.status,
    searchKeyword: isString(storedValue.searchKeyword)
      ? storedValue.searchKeyword
      : DEFAULT_TODO_FILTERS.searchKeyword,
  };
};

export const saveTodoFilters = (filters: TodoFilters): boolean =>
  writeStorage<TodoFilters>(TODO_FILTERS_STORAGE_KEY, filters);

export const clearTodoStorage = (): boolean => {
  if (!isBrowserStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(TODO_STORAGE_KEY);
    window.localStorage.removeItem(TODO_FILTERS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};
