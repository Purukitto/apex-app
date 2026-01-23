import { motion, type Variants, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { fastItemVariants, itemVariants, getCardHoverProps } from '../../lib/animations';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'variants'> {
  /**
   * Padding size - 'none' (no padding), 'sm' (p-4), 'md' (p-6), or 'lg' (p-8)
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Whether the card is clickable/interactive
   * @default false
   */
  clickable?: boolean;
  /**
   * Animation variants - 'none', 'item', or 'fastItem'
   * @default 'fastItem'
   */
  animate?: 'none' | 'item' | 'fastItem';
  /**
   * Custom animation variants (overrides animate prop)
   */
  variants?: Variants;
  /**
   * Whether to apply hover border effect
   * @default true
   */
  hover?: boolean;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Children
   */
  children: React.ReactNode;
}

/**
 * Standard Apex Card Component
 * 
 * Follows the mandatory card styling from UX polish rules:
 * - Background: bg-gradient-to-br from-white/5 to-transparent
 * - Border: border border-apex-white/20
 * - Rounded: rounded-md
 * - Hover: Uses theme highlight color via getCardHoverProps()
 * 
 * @example
 * ```tsx
 * <Card padding="sm" clickable onClick={handleClick}>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      padding = 'md',
      clickable = false,
      animate = 'fastItem',
      variants,
      hover = true,
      className = '',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Determine padding class
    const paddingClass =
      padding === 'none' ? '' : padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6';

    // Determine animation variants
    const animationVariants =
      variants ||
      (animate === 'item'
        ? itemVariants
        : animate === 'fastItem'
          ? fastItemVariants
          : undefined);

    // Base card classes
    const baseClasses =
      'bg-gradient-to-br from-white/5 to-transparent border border-apex-white/20 rounded-md transition-colors';

    // Clickable classes
    const clickableClasses = clickable || onClick
      ? 'cursor-pointer group'
      : '';

    // Combine classes
    const cardClasses = `${baseClasses} ${paddingClass} ${clickableClasses} ${className}`.trim();

    return (
      <motion.div
        ref={ref}
        className={cardClasses}
        variants={animationVariants}
        initial={animationVariants ? 'hidden' : undefined}
        animate={animationVariants ? 'visible' : undefined}
        onClick={onClick}
        {...(hover ? getCardHoverProps() : {})}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
