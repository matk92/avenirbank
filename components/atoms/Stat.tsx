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
    up: 'text-success',
    down: 'text-[#ff4f70]',
    neutral: 'text-white/60',
  } as const;

  return (
    <div className="glass-panel rounded-3xl border border-white/10 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">{label}</p>
          {icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
              {icon}
            </div>
          ) : null}
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-semibold text-white">{value}</p>
          {trend && trendValue ? (
            <span className={`text-sm font-semibold ${trendColors[trend]}`}>{trendValue}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
