import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Settings2 } from "lucide-react";
import { Table, THead, TBody, TR, TH, TD } from "./Table";
import { TableSkeleton } from "./Skeleton";
import { Pagination } from "./Pagination";
import { cn } from "../../lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Enables client-side sorting on this column's current page of data. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
  /** Set false to always show this column in the "Columns" picker (e.g. the primary column). */
  hideable?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  keyField,
  isLoading,
  emptyState,
  onRowClick,
  rowActionsHeader,
  rowActions,
  pagination,
  onPageChange,
  className,
}: {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  keyField: (row: T) => string;
  isLoading?: boolean;
  emptyState: ReactNode;
  onRowClick?: (row: T) => void;
  rowActionsHeader?: string;
  rowActions?: (row: T) => ReactNode;
  pagination?: { page: number; totalPages: number; total: number };
  onPageChange?: (page: number) => void;
  className?: string;
}) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!columnsMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) setColumnsMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [columnsMenuOpen]);

  const visibleColumns = columns.filter((c) => !hiddenColumns.has(c.key));
  const hideableColumns = columns.filter((c) => c.hideable !== false);

  const sortedData = useMemo(() => {
    if (!data || !sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return sort.direction === "asc" ? -1 : 1;
      if (va > vb) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sort, columns]);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortValue) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, direction: "asc" };
      if (prev.direction === "asc") return { key: col.key, direction: "desc" };
      return null;
    });
  };

  if (isLoading && !data) {
    return <TableSkeleton columns={columns.length + (rowActions ? 1 : 0)} />;
  }

  if (!data || data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {hideableColumns.length > 1 && (
        <div className="flex items-center justify-end border-b border-neutral-200 px-3 py-1.5 dark:border-neutral-800">
          <div className="relative" ref={columnsMenuRef}>
            <button
              type="button"
              onClick={() => setColumnsMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <Settings2 className="h-3.5 w-3.5" /> Columnas
            </button>
            {columnsMenuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                {hideableColumns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(c.key)}
                      onChange={() =>
                        setHiddenColumns((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.key)) next.delete(c.key);
                          else next.add(c.key);
                          return next;
                        })
                      }
                    />
                    {c.header}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Table>
        <THead>
          <tr>
            {visibleColumns.map((c) => {
              const sorted = sort?.key === c.key;
              return (
                <TH
                  key={c.key}
                  onClick={() => toggleSort(c)}
                  aria-sort={sorted ? (sort!.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    c.sortValue && "cursor-pointer select-none",
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortValue &&
                      (sorted ? (
                        sort!.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      ))}
                  </span>
                </TH>
              );
            })}
            {rowActions && <TH className="text-right">{rowActionsHeader ?? "Acciones"}</TH>}
          </tr>
        </THead>
        <TBody>
          {sortedData!.map((row) => (
            <TR
              key={keyField(row)}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={() => onRowClick?.(row)}
            >
              {visibleColumns.map((c) => (
                <TD key={c.key} className={cn(c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>
                  {c.render(row)}
                </TD>
              ))}
              {rowActions && (
                <TD onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">{rowActions(row)}</div>
                </TD>
              )}
            </TR>
          ))}
        </TBody>
      </Table>

      {pagination && onPageChange && (
        <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={onPageChange} />
      )}
    </div>
  );
}
