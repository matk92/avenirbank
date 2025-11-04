import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm ${hover ? 'transition-all hover:shadow-md hover:border-emerald-200' : ''} dark:border-zinc-700 dark:bg-zinc-800 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
