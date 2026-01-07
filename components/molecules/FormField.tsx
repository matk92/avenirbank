'use client';

import { cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

type A11yChildProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

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

  const childWithA11y = (() => {
    if (!isValidElement(children)) {
      return children;
    }

    const element = children as ReactElement<A11yChildProps>;
    const existingDescribedBy = element.props['aria-describedby'];

    return cloneElement(element, {
      id: element.props.id ?? htmlFor,
      'aria-describedby': [existingDescribedBy, describedBy].filter(Boolean).join(' ') || undefined,
      'aria-invalid': error ? true : element.props['aria-invalid'],
    });
  })();

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