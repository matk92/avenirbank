'use client';

import { forwardRef } from 'react';
import type { ForwardedRef, SelectHTMLAttributes } from 'react';

const baseStyles =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50 dark:disabled:bg-zinc-800';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

function SelectComponent(
  { className = '', hasError = false, ...props }: SelectProps,
  ref: ForwardedRef<HTMLSelectElement>,
) {
  const errorStyles = hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : '';
  return <select ref={ref} className={`${baseStyles} ${errorStyles} ${className}`.trim()} {...props} />;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(SelectComponent);
Select.displayName = 'Select';

export default Select;
