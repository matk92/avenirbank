import type { ReactNode } from 'react';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        {subtitle ? (
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-white/50">{subtitle}</p>
        ) : null}
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      {action ? <div className="flex items-center gap-2 text-sm text-white/80">{action}</div> : null}
    </div>
  );
}
