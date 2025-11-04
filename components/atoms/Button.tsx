'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ForwardedRef } from 'react';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]';

const variantStyles: Record<string, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50',
  secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-none',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-red-200/50',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3 py-2 text-sm h-9',
  md: 'px-4 py-2.5 text-sm h-10',
  lg: 'px-6 py-3 text-base h-11',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
};

function ButtonComponent(
  { className = '', variant = 'primary', size = 'md', ...props }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();
  return <button ref={ref} className={styles} {...props} />;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(ButtonComponent);
Button.displayName = 'Button';

export default Button;
