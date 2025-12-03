'use client';

import type { HTMLAttributes } from 'react';

const baseStyles =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'success' | 'warning' | 'neutral' | 'info';
};

const toneStyles: Record<NonNullable<BadgeProps['tone']>, string> = {
  success: 'border-success-soft bg-success-soft text-success',
  warning: 'border-white/20 bg-amber-400/20 text-amber-200',
  neutral: 'border-white/15 bg-white/10 text-white/80',
  info: 'border-white/15 bg-[#5c7cfa]/20 text-[#b2c5ff]',
};

export default function Badge({ className = '', tone = 'neutral', ...props }: BadgeProps) {
  return <span className={`${baseStyles} ${toneStyles[tone]} ${className}`.trim()} {...props} />;
}
