'use client';

import type { HTMLAttributes } from 'react';

const baseStyles =
  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'success' | 'warning' | 'neutral' | 'info';
};

const toneStyles: Record<NonNullable<BadgeProps['tone']>, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
};

export default function Badge({ className = '', tone = 'neutral', ...props }: BadgeProps) {
  return <span className={`${baseStyles} ${toneStyles[tone]} ${className}`.trim()} {...props} />;
}
