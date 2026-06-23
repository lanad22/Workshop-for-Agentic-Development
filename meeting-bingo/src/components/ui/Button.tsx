// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm',
        variant === 'primary' && 'bg-accent-blue text-white hover:bg-blue-600',
        variant === 'secondary' && 'border border-gray-300 bg-white text-text-primary hover:bg-square-hover',
        variant === 'ghost' && 'bg-transparent text-text-secondary hover:text-text-primary',
        className,
      )}
      {...props}
    />
  );
}
