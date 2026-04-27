import { type ChangeEvent, type FormEvent, useState } from 'react';
import type { Category, CreateTodoInput, Priority } from '../types/todo';
import { CATEGORIES, PRIORITIES } from '../types/todo';
import { useTodoStore } from '../store/todoStore';

const MAX_TITLE_LENGTH = 80;

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const categoryLabels: Record<Category, string> = {
  work: '工作',
  study: '学习',
  life: '生活',
  project: '项目',
  other: '其他',
};

interface AddTodoFormState {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: Category;
}

interface AddTodoFormErrors {
  title?: string;
  dueDate?: string;
}

const initialFormState: AddTodoFormState = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  category: 'work',
};

const validateForm = (formState: AddTodoFormState): AddTodoFormErrors => {
  const errors: AddTodoFormErrors = {};
  const title = formState.title.trim();

  if (!title) {
    errors.title = '请输入任务标题';
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `标题不能超过 ${MAX_TITLE_LENGTH} 个字符`;
  }

  if (formState.dueDate && Number.isNaN(Date.parse(formState.dueDate))) {
    errors.dueDate = '请选择有效的截止日期';
  }

  return errors;
};

const hasErrors = (errors: AddTodoFormErrors): boolean => Object.keys(errors).length > 0;

const isErrorField = (fieldName: keyof AddTodoFormState): fieldName is keyof AddTodoFormErrors =>
  fieldName === 'title' || fieldName === 'dueDate';

const toCreateTodoInput = (formState: AddTodoFormState): CreateTodoInput => ({
  title: formState.title,
  description: formState.description || undefined,
  dueDate: formState.dueDate || undefined,
  priority: formState.priority,
  category: formState.category,
});

export function AddTodo() {
  const addTodo = useTodoStore((state) => state.addTodo);
  const [formState, setFormState] = useState<AddTodoFormState>(initialFormState);
  const [errors, setErrors] = useState<AddTodoFormErrors>({});

  const updateField =
    <FieldName extends keyof AddTodoFormState>(fieldName: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value as AddTodoFormState[FieldName];

      setFormState((currentFormState) => ({
        ...currentFormState,
        [fieldName]: value,
      }));

      if (isErrorField(fieldName) && errors[fieldName]) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          [fieldName]: undefined,
        }));
      }
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(formState);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    addTodo(toCreateTodoInput(formState));
    setFormState({
      ...initialFormState,
      priority: formState.priority,
      category: formState.category,
    });
  };

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">新增任务</h2>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="todo-title">
          标题
          <input
            aria-describedby={errors.title ? 'todo-title-error' : undefined}
            aria-invalid={Boolean(errors.title)}
            className="h-11 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            id="todo-title"
            maxLength={MAX_TITLE_LENGTH}
            onChange={updateField('title')}
            placeholder="输入任务标题"
            type="text"
            value={formState.title}
          />
          {errors.title ? (
            <span className="text-xs font-normal text-red-600" id="todo-title-error">
              {errors.title}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="todo-description">
          描述
          <textarea
            className="min-h-24 resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            id="todo-description"
            onChange={updateField('description')}
            placeholder="补充任务背景或细节"
            value={formState.description}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="todo-due-date">
            截止日期
            <input
              aria-describedby={errors.dueDate ? 'todo-due-date-error' : undefined}
              aria-invalid={Boolean(errors.dueDate)}
              className="h-11 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              id="todo-due-date"
              onChange={updateField('dueDate')}
              type="date"
              value={formState.dueDate}
            />
            {errors.dueDate ? (
              <span className="text-xs font-normal text-red-600" id="todo-due-date-error">
                {errors.dueDate}
              </span>
            ) : null}
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="todo-priority">
            优先级
            <select
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              id="todo-priority"
              onChange={updateField('priority')}
              value={formState.priority}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="todo-category">
            分类
            <select
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              id="todo-category"
              onChange={updateField('category')}
              value={formState.category}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          className="h-11 rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          type="submit"
        >
          添加任务
        </button>
      </div>
    </form>
  );
}

export default AddTodo;
