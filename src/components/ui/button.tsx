import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "../../lib/utils";
import { buttonHoverProps } from "../../lib/animations";
import { buttonVariants } from "./buttonVariants";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "ref">;
type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export type ButtonProps = VariantProps<typeof buttonVariants> &
  (
    | ({ asChild?: false } & MotionButtonProps)
    | ({ asChild: true } & NativeButtonProps)
  );

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      const slotProps = props as NativeButtonProps;
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...slotProps}
        />
      );
    }
    const rest = props as MotionButtonProps;
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...rest}
        {...buttonHoverProps}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
