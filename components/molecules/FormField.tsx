'use client';

import { cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';


type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  description?: string;
  error?: string;
};

export default function FormField({ label, htmlFor, children, description, error }: FormFieldProps) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const childWithA11y = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>,
        {
          id: (children.props as any).id ?? htmlFor,
          'aria-describedby': [
            (children.props as any)['aria-describedby'],
            describedBy,
          ]
            .filter(Boolean)
            .join(' ') || undefined,
          'aria-invalid': error ? true : (children.props as any)['aria-invalid'],
        }
      )
    : children;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </label>
        {description ? (
          <span id={descriptionId} className="text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        ) : null}
      </div>
      {childWithA11y}
      {error ? (
        <p id={errorId} className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}