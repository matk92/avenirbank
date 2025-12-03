'use client';

import { forwardRef } from 'react';
import type { ForwardedRef, InputHTMLAttributes } from 'react';

const baseStyles =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-[0_10px_30px_rgba(5,1,13,0.65)] transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-[#7a5cff]/40 disabled:cursor-not-allowed disabled:bg-white/5';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

function InputComponent({ className = '', hasError = false, ...props }: InputProps, ref: ForwardedRef<HTMLInputElement>) {
  const errorStyles = hasError ? 'border-[#ff4f70] focus:border-[#ff4f70] focus:ring-[#ff4f70]/40' : '';
  return <input ref={ref} className={`${baseStyles} ${errorStyles} ${className}`.trim()} {...props} />;
}

const Input = forwardRef<HTMLInputElement, InputProps>(InputComponent);
Input.displayName = 'Input';

export default Input;
