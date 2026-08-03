import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const fieldBase =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-neutral-50 disabled:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:disabled:bg-neutral-800";

export function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, id, required, ...props }, ref) => (
  <FieldWrapper label={label} htmlFor={id} error={error} hint={hint} required={required}>
    <input ref={ref} id={id} className={cn(fieldBase, className)} {...props} />
  </FieldWrapper>
));
Input.displayName = "Input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, hint, className, id, required, ...props }, ref) => (
  <FieldWrapper label={label} htmlFor={id} error={error} hint={hint} required={required}>
    <textarea ref={ref} id={id} className={cn(fieldBase, "min-h-[80px] resize-y", className)} {...props} />
  </FieldWrapper>
));
Textarea.displayName = "Textarea";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; hint?: string };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, hint, className, id, required, children, ...props }, ref) => (
  <FieldWrapper label={label} htmlFor={id} error={error} hint={hint} required={required}>
    <select ref={ref} id={id} className={cn(fieldBase, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  </FieldWrapper>
));
Select.displayName = "Select";
