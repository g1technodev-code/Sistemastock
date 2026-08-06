import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

type SelectContextValue = {
  value?: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  labels: Record<string, ReactNode>;
  registerLabel: (value: string, label: ReactNode) => void;
  triggerId: string;
  contentId: string;
};

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error(`<${component}> debe usarse dentro de <Select>`);
  return ctx;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, ReactNode>>({});
  const reactId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (v: string) => {
    if (value === undefined) setInternalValue(v);
    onValueChange?.(v);
    setOpen(false);
  };

  const registerLabel = (v: string, label: ReactNode) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  };

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen: (o) => !disabled && setOpen(o),
        disabled,
        labels,
        registerLabel,
        triggerId: `${reactId}-trigger`,
        contentId: `${reactId}-content`,
      }}
    >
      <div ref={wrapperRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, disabled, triggerId, contentId } = useSelectContext("SelectTrigger");
  return (
    <button
      type="button"
      id={triggerId}
      role="combobox"
      aria-expanded={open}
      aria-controls={contentId}
      disabled={disabled}
      onClick={() => setOpen(!open)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm transition-all duration-200",
        "hover:border-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10",
        "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
        "dark:border-neutral-700/50 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-neutral-600 dark:focus:border-primary-500 dark:focus:bg-neutral-900 dark:disabled:bg-neutral-800",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200", open && "rotate-180")} />
    </button>
  );
}

export function SelectValue({ placeholder, className }: { placeholder?: string; className?: string }) {
  const { value, labels } = useSelectContext("SelectValue");
  const label = value !== undefined ? labels[value] : undefined;
  return (
    <span className={cn("truncate text-left", !label && "text-neutral-400 dark:text-neutral-500", className)}>
      {label ?? placeholder ?? ""}
    </span>
  );
}

export function SelectContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, triggerId, contentId } = useSelectContext("SelectContent");
  const ref = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const options = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="option"]:not(:disabled)') ?? []);
    if (options.length === 0) return;
    const currentIndex = options.findIndex((o) => o === document.activeElement);
    let nextIndex = currentIndex;
    if (e.key === "ArrowDown") nextIndex = currentIndex + 1 >= options.length ? 0 : currentIndex + 1;
    if (e.key === "ArrowUp") nextIndex = currentIndex - 1 < 0 ? options.length - 1 : currentIndex - 1;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = options.length - 1;
    options[nextIndex]?.focus();
  }

  return (
    <div
      ref={ref}
      id={contentId}
      role="listbox"
      aria-labelledby={triggerId}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute z-30 mt-1.5 max-h-64 w-full min-w-[8rem] overflow-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900",
        !open && "hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  disabled,
  className,
}: {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { value: selected, onValueChange, registerLabel } = useSelectContext("SelectItem");
  const isSelected = selected === value;

  useEffect(() => {
    registerLabel(value, children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, children]);

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 outline-none transition-colors",
        "hover:bg-neutral-100 focus-visible:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus-visible:bg-neutral-800",
        "disabled:pointer-events-none disabled:opacity-40",
        isSelected && "font-medium text-neutral-900 dark:text-neutral-50",
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />}
    </button>
  );
}

export function SelectGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn("py-1", className)} {...props} />;
}

export function SelectLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-3 py-1.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500", className)} {...props} />;
}

export function SelectSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("my-1 h-px bg-neutral-200 dark:bg-neutral-800", className)} {...props} />;
}
