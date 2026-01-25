import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-green/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-apex-green text-apex-black hover:bg-apex-green/90",
        secondary: "bg-apex-white/10 text-apex-white hover:bg-apex-white/20",
        ghost: "bg-transparent text-apex-white/70 hover:text-apex-white",
        outline: "border border-apex-white/20 text-apex-white hover:bg-apex-white/10",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-6",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);
