import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

const fieldBase =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 hover:border-neutral-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:bg-neutral-50 disabled:text-neutral-400 dark:border-neutral-700/50 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-neutral-600 dark:focus:border-primary-500 dark:focus:bg-neutral-900 dark:disabled:bg-neutral-800 shadow-sm";

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

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, className, id, required, type, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  if (!isPassword) {
    return (
      <FieldWrapper label={label} htmlFor={id} error={error} hint={hint} required={required}>
        <input ref={ref} id={id} type={type} className={cn(fieldBase, className)} {...props} />
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={showPassword ? "text" : "password"}
          className={cn(fieldBase, "pr-10", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </FieldWrapper>
  );
});
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
