'use client';

import { forwardRef, isValidElement, cloneElement } from 'react';
import type { ButtonHTMLAttributes, ForwardedRef, ReactElement } from 'react';

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-[0.98]';

const variantStyles: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-[#6c5cff] via-[#835bff] to-[#4f46e5] text-white shadow-[0_15px_35px_rgba(86,76,255,0.35)] hover:brightness-110',
  secondary:
    'bg-white/10 text-white border border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.4)] hover:bg-white/15',
  ghost: 'bg-transparent text-white/80 hover:text-white hover:bg-white/5 shadow-none border border-transparent',
  destructive: 'bg-gradient-to-r from-[#ff4f70] to-[#ff784e] text-white hover:brightness-110',
};

const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3 py-2 text-sm h-9',
  md: 'px-5 py-2.5 text-sm h-11',
  lg: 'px-7 py-3 text-base h-12',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  asChild?: boolean;
};

function ButtonComponent(
  { className = '', variant = 'primary', size = 'md', asChild = false, children, ...props }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();
  if (asChild && isValidElement(children)) {
    const element = children as ReactElement<{ className?: string }>;
    return cloneElement(element, {
      className: `${styles} ${element.props.className ?? ''}`.trim(),
    });
  }

  return (
    <button ref={ref} className={styles} {...props}>
      {children}
    </button>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(ButtonComponent);
Button.displayName = 'Button';

export default Button;
