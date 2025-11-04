'use client';

import { forwardRef } from 'react';
import type { ForwardedRef, InputHTMLAttributes } from 'react';

const baseStyles =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50 dark:disabled:bg-zinc-800';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

function InputComponent({ className = '', hasError = false, ...props }: InputProps, ref: ForwardedRef<HTMLInputElement>) {
  const errorStyles = hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-600 dark:focus:border-red-500 dark:focus:ring-red-900/50' : '';
  return <input ref={ref} className={`${baseStyles} ${errorStyles} ${className}`.trim()} {...props} />;
}

const Input = forwardRef<HTMLInputElement, InputProps>(InputComponent);
Input.displayName = 'Input';

export default Input;
