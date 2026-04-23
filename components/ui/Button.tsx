'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const base =
  'inline-flex items-center justify-center rounded-token px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-brand-primary/30';

const styles: Record<Variant, string> = {
  primary: 'bg-brand-primary text-white hover:opacity-90',
  secondary:
    'bg-brand-bgSurface text-brand-textPrimary border border-brand-hairline hover:opacity-80',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${styles[variant]} ${className ?? ''}`}
      {...rest}
    />
  );
});
