'use client';

import type { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  description?: string;
  error?: string;
};

export default function FormField({ label, htmlFor, children, description, error }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </label>
        {description ? <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-red-500 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
