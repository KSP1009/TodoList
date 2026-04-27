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

  return {
    ...todo,
    title: input.title !== undefined ? input.title.trim() : todo.title,
    description:
      input.description !== undefined ? normalizeOptionalText(input.description) : todo.description,
    dueDate: input.dueDate !== undefined ? normalizeOptionalText(input.dueDate) : todo.dueDate,
    priority: input.priority ?? todo.priority,
    category: input.category ?? todo.category,
    status: input.status ?? todo.status,
    updatedAt: new Date().toISOString(),
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
        state.todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                status: todo.status === 'completed' ? 'pending' : 'completed',
                updatedAt: new Date().toISOString(),
              }
            : todo,
        ),
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

export const getFilteredTodos = (todos: Todo[], filters: TodoFilters): Todo[] =>
  todos.filter(
    (todo) =>
      (filters.category === 'all' || todo.category === filters.category) &&
      (filters.priority === 'all' || todo.priority === filters.priority) &&
      (filters.status === 'all' || todo.status === filters.status) &&
      includesSearchKeyword(todo, filters.searchKeyword),
  );

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
