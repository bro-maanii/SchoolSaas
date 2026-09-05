import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500",
          error ? "border-danger-500" : "border-gray-300",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-gray-700", className)} {...props} />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-danger-600">{children}</p>;
}
