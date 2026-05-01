import { create } from 'zustand';
import type {
  CreateTodoInput,
  Todo,
  TodoFilters,
  TodoStats,
  UpdateTodoInput,
} from '../types/todo';
import { DEFAULT_TODO_FILTERS } from '../types/todo';
import {
  clearTodoStorage,
  loadTodoFilters,
  loadTodos,
  saveTodoFilters,
  saveTodos,
} from '../utils/localStorage';

export interface TodoStore {
  todos: Todo[];
  filters: TodoFilters;
  addTodo: (input: CreateTodoInput) => void;
  updateTodo: (id: string, input: UpdateTodoInput) => void;
  deleteTodo: (id: string) => void;
  toggleTodoStatus: (id: string) => void;
  setFilters: (filters: Partial<TodoFilters>) => void;
  clearFilters: () => void;
  clearAllTodos: () => void;
}

const createTodoId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeOptionalText = (value: string | undefined): string | undefined => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

const persistTodos = (todos: Todo[]): Todo[] => {
  saveTodos(todos);
  return todos;
};

const persistFilters = (filters: TodoFilters): TodoFilters => {
  saveTodoFilters(filters);
  return filters;
};

const createTodo = (input: CreateTodoInput): Todo | null => {
  const title = input.title.trim();

  if (!title) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: createTodoId(),
    title,
    description: normalizeOptionalText(input.description),
    dueDate: normalizeOptionalText(input.dueDate),
    priority: input.priority,
    category: input.category,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
};

const applyTodoUpdate = (todo: Todo, input: UpdateTodoInput): Todo => {
  if (input.title !== undefined && !input.title.trim()) {
    return todo;
  }

  const now = new Date().toISOString();
  const nextStatus = input.status ?? todo.status;
  const completedAt =
    nextStatus === 'completed'
      ? todo.status === 'completed'
        ? todo.completedAt
        : now
      : undefined;

  return {
    ...todo,
    title: input.title !== undefined ? input.title.trim() : todo.title,
    description:
      input.description !== undefined ? normalizeOptionalText(input.description) : todo.description,
    dueDate: input.dueDate !== undefined ? normalizeOptionalText(input.dueDate) : todo.dueDate,
    priority: input.priority ?? todo.priority,
    category: input.category ?? todo.category,
    status: nextStatus,
    completedAt,
    updatedAt: now,
  };
};

const mergeFilters = (currentFilters: TodoFilters, filters: Partial<TodoFilters>): TodoFilters => ({
  category: filters.category ?? currentFilters.category,
  priority: filters.priority ?? currentFilters.priority,
  status: filters.status ?? currentFilters.status,
  searchKeyword: filters.searchKeyword ?? currentFilters.searchKeyword,
});

export const useTodoStore = create<TodoStore>((set) => ({
  todos: loadTodos(),
  filters: loadTodoFilters(),

  addTodo: (input) => {
    const todo = createTodo(input);

    if (!todo) {
      return;
    }

    set((state) => ({
      todos: persistTodos([todo, ...state.todos]),
    }));
  },

  updateTodo: (id, input) => {
    set((state) => ({
      todos: persistTodos(
        state.todos.map((todo) => (todo.id === id ? applyTodoUpdate(todo, input) : todo)),
      ),
    }));
  },

  deleteTodo: (id) => {
    set((state) => ({
      todos: persistTodos(state.todos.filter((todo) => todo.id !== id)),
    }));
  },

  toggleTodoStatus: (id) => {
    set((state) => ({
      todos: persistTodos(
        state.todos.map((todo) => {
          if (todo.id !== id) {
            return todo;
          }

          const now = new Date().toISOString();
          const isCompleted = todo.status === 'completed';

          return {
            ...todo,
            status: isCompleted ? 'pending' : 'completed',
            completedAt: isCompleted ? undefined : now,
            updatedAt: now,
          };
        }),
      ),
    }));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: persistFilters(mergeFilters(state.filters, filters)),
    }));
  },

  clearFilters: () => {
    set({
      filters: persistFilters(DEFAULT_TODO_FILTERS),
    });
  },

  clearAllTodos: () => {
    clearTodoStorage();
    set({
      todos: [],
      filters: DEFAULT_TODO_FILTERS,
    });
  },
}));

const includesSearchKeyword = (todo: Todo, searchKeyword: string): boolean => {
  const keyword = searchKeyword.trim().toLowerCase();

  if (!keyword) {
    return true;
  }

  return [todo.title, todo.description, todo.category].some((value) =>
    value?.toLowerCase().includes(keyword),
  );
};

const priorityRank: Record<Todo['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const statusRank: Record<Todo['status'], number> = {
  pending: 0,
  completed: 1,
};

const getDueDateSortValue = (todo: Todo): number => {
  if (!todo.dueDate) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(todo.dueDate).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

const getCompletedSortValue = (todo: Todo): number => {
  const timestamp = new Date(todo.completedAt ?? todo.updatedAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const compareTodos = (firstTodo: Todo, secondTodo: Todo): number => {
  const statusComparison = statusRank[firstTodo.status] - statusRank[secondTodo.status];

  if (statusComparison !== 0) {
    return statusComparison;
  }

  if (firstTodo.status === 'completed' && secondTodo.status === 'completed') {
    return getCompletedSortValue(secondTodo) - getCompletedSortValue(firstTodo);
  }

  const priorityComparison = priorityRank[firstTodo.priority] - priorityRank[secondTodo.priority];

  if (priorityComparison !== 0) {
    return priorityComparison;
  }

  const dueDateComparison = getDueDateSortValue(firstTodo) - getDueDateSortValue(secondTodo);

  if (dueDateComparison !== 0) {
    return dueDateComparison;
  }

  return new Date(secondTodo.createdAt).getTime() - new Date(firstTodo.createdAt).getTime();
};

export const getFilteredTodos = (todos: Todo[], filters: TodoFilters): Todo[] =>
  todos
    .filter(
      (todo) =>
        (filters.category === 'all' || todo.category === filters.category) &&
        (filters.priority === 'all' || todo.priority === filters.priority) &&
        (filters.status === 'all' || todo.status === filters.status) &&
        includesSearchKeyword(todo, filters.searchKeyword),
    )
    .sort(compareTodos);

const isSameLocalDate = (value: string, date: Date): boolean => {
  const parsedDate = new Date(value);

  return (
    parsedDate.getFullYear() === date.getFullYear() &&
    parsedDate.getMonth() === date.getMonth() &&
    parsedDate.getDate() === date.getDate()
  );
};

export const getTodoStats = (todos: Todo[]): TodoStats => {
  const today = new Date();
  const completed = todos.filter((todo) => todo.status === 'completed').length;
  const pending = todos.length - completed;
  const overdue = todos.filter(
    (todo) =>
      todo.status === 'pending' &&
      todo.dueDate !== undefined &&
      new Date(todo.dueDate).getTime() < new Date(today.toDateString()).getTime(),
  ).length;
  const dueToday = todos.filter(
    (todo) => todo.dueDate !== undefined && isSameLocalDate(todo.dueDate, today),
  ).length;

  return {
    total: todos.length,
    pending,
    completed,
    completionRate: todos.length === 0 ? 0 : Math.round((completed / todos.length) * 100),
    overdue,
    dueToday,
  };
};

export const selectTodos = (state: TodoStore): Todo[] => state.todos;

export const selectFilters = (state: TodoStore): TodoFilters => state.filters;
