export type Priority = 'high' | 'medium' | 'low';

export type Category = 'work' | 'study' | 'life' | 'project' | 'other';

export type TodoStatus = 'pending' | 'completed';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  category: Category;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TodoFilters {
  category: Category | 'all';
  priority: Priority | 'all';
  status: TodoStatus | 'all';
  searchKeyword: string;
}

export type CreateTodoInput = Pick<Todo, 'title' | 'priority' | 'category'> &
  Partial<Pick<Todo, 'description' | 'dueDate'>>;

export type UpdateTodoInput = Partial<
  Pick<Todo, 'title' | 'description' | 'dueDate' | 'priority' | 'category' | 'status'>
>;

export interface TodoStats {
  total: number;
  pending: number;
  completed: number;
  completionRate: number;
  overdue: number;
  dueToday: number;
}

export const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export const CATEGORIES: Category[] = ['work', 'study', 'life', 'project', 'other'];

export const TODO_STATUSES: TodoStatus[] = ['pending', 'completed'];

export const DEFAULT_TODO_FILTERS: TodoFilters = {
  category: 'all',
  priority: 'all',
  status: 'all',
  searchKeyword: '',
};
