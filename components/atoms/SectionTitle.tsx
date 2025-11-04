import type { ReactNode } from 'react';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">{title}</h2>
        {subtitle ? <p className="text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
