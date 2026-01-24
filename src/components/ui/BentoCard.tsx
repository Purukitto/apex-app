import { forwardRef } from 'react';
import { Card, type CardProps } from './Card';

export type BentoCardProps = CardProps;

/**
 * BentoCard
 * Glassy surface card for dashboard bento layouts.
 */
export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className = '', ...props }, ref) => (
    <Card
      ref={ref}
      className={[
        'bg-apex-glass',
        'backdrop-blur-xl',
        'border border-apex-white/5',
        'shadow-[inset_0_1px_0_0_rgba(var(--color-apex-white-rgb),0.12)]',
        'rounded-3xl',
        className,
      ].join(' ')}
      {...props}
    />
  )
);

BentoCard.displayName = 'BentoCard';
