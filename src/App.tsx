import { useEffect, useMemo, useState } from 'react';
import { format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';
import AddTodo from './components/AddTodo';
import type { Category, Priority, Todo, TodoFilters, TodoStatus } from './types/todo';
import { CATEGORIES, PRIORITIES, TODO_STATUSES } from './types/todo';
import {
  selectFilters,
  selectTodos,
  getFilteredTodos,
  getTodoStats,
  useTodoStore,
} from './store/todoStore';

const categoryLabels: Record<Category, string> = {
  work: '工作',
  study: '学习',
  life: '生活',
  project: '项目',
  other: '其他',
};

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const statusLabels: Record<TodoStatus, string> = {
  pending: '待完成',
  completed: '已完成',
};

const priorityStyles: Record<Priority, string> = {
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const formatDueDate = (dueDate: string): string => {
  const date = parseISO(dueDate);
  return format(date, 'yyyy-MM-dd');
};

const getDueDateState = (todo: Todo): string => {
  if (!todo.dueDate || todo.status === 'completed') {
    return '';
  }

  const date = parseISO(todo.dueDate);

  if (isToday(date)) {
    return '今天截止';
  }

  if (isBefore(date, startOfToday())) {
    return '已逾期';
  }

  return '';
};

const getDueDateTone = (dueDateState: string): string => {
  if (dueDateState === '已逾期') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (dueDateState === '今天截止') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
};

const FilterButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) => (
  <button
    className={`h-9 rounded-md border px-3 text-sm font-medium transition ${
      active
        ? 'border-slate-950 bg-slate-950 text-white'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
    }`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
);

function FilterSection({
  filters,
  setFilters,
}: {
  filters: TodoFilters;
  setFilters: (filters: Partial<TodoFilters>) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">筛选</h2>
        <button
          className="text-sm font-medium text-slate-500 hover:text-slate-950"
          onClick={() =>
            setFilters({
              category: 'all',
              priority: 'all',
              status: 'all',
              searchKeyword: '',
            })
          }
          type="button"
        >
          重置
        </button>
      </div>

      <div className="grid gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">分类</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.category === 'all'}
              onClick={() => setFilters({ category: 'all' })}
            >
              全部
            </FilterButton>
            {CATEGORIES.map((category) => (
              <FilterButton
                active={filters.category === category}
                key={category}
                onClick={() => setFilters({ category })}
              >
                {categoryLabels[category]}
              </FilterButton>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">优先级</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.priority === 'all'}
              onClick={() => setFilters({ priority: 'all' })}
            >
              全部
            </FilterButton>
            {PRIORITIES.map((priority) => (
              <FilterButton
                active={filters.priority === priority}
                key={priority}
                onClick={() => setFilters({ priority })}
              >
                {priorityLabels[priority]}
              </FilterButton>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">状态</p>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filters.status === 'all'}
              onClick={() => setFilters({ status: 'all' })}
            >
              全部
            </FilterButton>
            {TODO_STATUSES.map((status) => (
              <FilterButton
                active={filters.status === status}
                key={status}
                onClick={() => setFilters({ status })}
              >
                {statusLabels[status]}
              </FilterButton>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TodoCard({ todo }: { todo: Todo }) {
  const deleteTodo = useTodoStore((state) => state.deleteTodo);
  const toggleTodoStatus = useTodoStore((state) => state.toggleTodoStatus);
  const dueDateState = getDueDateState(todo);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          checked={todo.status === 'completed'}
          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
          onChange={() => toggleTodoStatus(todo.id)}
          type="checkbox"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-base font-semibold ${
                todo.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-950'
              }`}
            >
              {todo.title}
            </h3>
            <span className={`rounded border px-2 py-0.5 text-xs ${priorityStyles[todo.priority]}`}>
              {priorityLabels[todo.priority]}
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
              {categoryLabels[todo.category]}
            </span>
          </div>

          {todo.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {todo.description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 self-end sm:self-start">
          <div
            className={`rounded-md border px-3 py-2 text-xs font-medium ${
              todo.dueDate ? getDueDateTone(dueDateState) : 'border-slate-200 bg-white text-slate-400'
            }`}
          >
            <span>{todo.dueDate ? `截止 ${formatDueDate(todo.dueDate)}` : '无截止日期'}</span>
            {dueDateState ? <span className="ml-2">{dueDateState}</span> : null}
          </div>

          <button
            className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => deleteTodo(todo.id)}
            type="button"
          >
            删除
          </button>
        </div>
      </div>
    </article>
  );
}

function AddTodoDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby="add-todo-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
    >
      <button
        aria-label="关闭新增任务"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
        type="button"
      />

      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-950" id="add-todo-dialog-title">
            新增任务
          </h2>
          <button
            aria-label="关闭新增任务"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-xl leading-none text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <AddTodo
          autoFocusTitle
          onCancel={onClose}
          onSuccess={onClose}
          showTitle={false}
          variant="plain"
        />
      </div>
    </div>
  );
}

function App() {
  const allTodos = useTodoStore(selectTodos);
  const filters = useTodoStore(selectFilters);
  const setFilters = useTodoStore((state) => state.setFilters);
  const todos = useMemo(() => getFilteredTodos(allTodos, filters), [allTodos, filters]);
  const stats = useMemo(() => getTodoStats(allTodos), [allTodos]);
  const [isAddTodoDialogOpen, setIsAddTodoDialogOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">我的待办清单</h1>
          <p className="mt-2 text-sm text-slate-500">Todo List · 高效管理每日任务</p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="grid content-start gap-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-950">统计</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">总任务</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">待完成</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.pending}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">已完成</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.completed}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">完成率</p>
                  <p className="mt-1 text-2xl font-semibold">{stats.completionRate}%</p>
                </div>
              </div>
            </section>

            <FilterSection filters={filters} setFilters={setFilters} />
          </aside>

          <section className="grid content-start gap-6">
            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">任务列表</h2>
                  <button
                    aria-label="新增任务"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-2xl leading-none text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    onClick={() => setIsAddTodoDialogOpen(true)}
                    title="新增任务"
                    type="button"
                  >
                    +
                  </button>
                </div>
                <input
                  className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 sm:w-72"
                  onChange={(event) => setFilters({ searchKeyword: event.target.value })}
                  placeholder="搜索标题、描述或分类"
                  type="search"
                  value={filters.searchKeyword}
                />
              </div>

              {todos.length > 0 ? (
                <div className="grid gap-3">
                  {todos.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="font-medium text-slate-700">暂无匹配任务</p>
                  <p className="mt-1 text-sm text-slate-500">添加任务或调整筛选条件后会显示在这里</p>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>

      {isAddTodoDialogOpen ? (
        <AddTodoDialog onClose={() => setIsAddTodoDialogOpen(false)} />
      ) : null}
    </main>
  );
}

export default App;
