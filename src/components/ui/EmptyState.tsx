import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 px-6 py-14 text-center">
      <div className="mb-3 text-neutral-400 dark:text-neutral-600">{icon}</div>
      <p className="text-base font-medium text-neutral-700 dark:text-neutral-200">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
