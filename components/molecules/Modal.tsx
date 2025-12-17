'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center px-4 py-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title ?? 'Modal'}
          className="w-full"
        >
          {children}
        </div>
      </div>
    </div>
  );
}


