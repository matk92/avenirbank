import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`glass-panel rounded-3xl p-6 ${
        hover ? 'transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-white/25 hover:shadow-[0_25px_50px_rgba(5,1,13,0.7)]' : ''
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
