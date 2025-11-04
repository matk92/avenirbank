import type { ReactNode } from 'react';

type StatProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

export default function Stat({ label, value, icon, trend, trendValue }: StatProps) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-zinc-500',
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-linear-to-br from-white to-zinc-50/50 p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              {icon}
            </div>
          ) : null}
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          {trend && trendValue ? (
            <span className={`text-sm font-semibold ${trendColors[trend]}`}>{trendValue}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
