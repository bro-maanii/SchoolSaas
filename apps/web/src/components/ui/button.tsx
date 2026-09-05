import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:text-gray-400",
  ghost: "text-gray-600 hover:bg-gray-100 disabled:text-gray-300",
  destructive:
    "bg-white text-danger-600 border border-danger-300 hover:bg-danger-50 disabled:text-danger-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
