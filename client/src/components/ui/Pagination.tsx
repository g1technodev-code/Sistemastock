import { type ButtonHTMLAttributes, type ComponentProps } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

function PaginationRoot({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li {...props} />;
}

type PaginationLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  wide?: boolean;
};

function PaginationLink({ className, isActive, wide, ...props }: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
        "disabled:pointer-events-none disabled:opacity-40",
        wide ? "px-3" : "w-9",
        isActive
          ? "border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/50 dark:bg-primary-950/50 dark:text-primary-400"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Ir a la página anterior" wide className={cn("pl-2.5", className)} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:block">Anterior</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink aria-label="Ir a la página siguiente" wide className={cn("pr-2.5", className)} {...props}>
      <span className="hidden sm:block">Siguiente</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center text-neutral-400", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Más páginas</span>
    </span>
  );
}

const DOTS = "…";

function getPaginationRange(page: number, totalPages: number, siblingCount = 1): (number | typeof DOTS)[] {
  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2*siblings + 2*dots
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1);
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => totalPages - (3 + siblingCount * 2) + i + 1);
    return [1, DOTS, ...rightRange];
  }

  const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
  return [1, DOTS, ...middleRange, DOTS, totalPages];
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const range = getPaginationRange(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3 sm:flex-row dark:border-neutral-800">
      <span className="text-xs text-neutral-500 dark:text-neutral-400">
        Página {page} de {totalPages} · {total} resultados
      </span>

      <PaginationRoot>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
          </PaginationItem>

          {range.map((item, index) =>
            item === DOTS ? (
              <PaginationItem key={`dots-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink isActive={item === page} onClick={() => onPageChange(item as number)}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </PaginationRoot>
    </div>
  );
}

export { PaginationRoot, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis };
