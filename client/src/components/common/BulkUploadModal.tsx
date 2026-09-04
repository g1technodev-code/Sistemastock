import { useRef, useState } from "react";
import { Download, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import type { BulkRowResult } from "../../lib/types";

export function BulkUploadModal({
  open,
  onClose,
  title,
  columnsHint,
  onDownloadTemplate,
  onUpload,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  columnsHint: string;
  onDownloadTemplate: () => Promise<void>;
  onUpload: (file: File) => Promise<BulkRowResult[]>;
  onDone: () => void;
}) {
  const { showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<BulkRowResult[] | null>(null);

  const reset = () => {
    setFileName(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    const hadSuccess = results?.some((r) => r.success);
    reset();
    onClose();
    if (hadSuccess) onDone();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    setIsUploading(true);
    try {
      const rowResults = await onUpload(file);
      setResults(rowResults);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo procesar el archivo"));
    } finally {
      setIsUploading(false);
    }
  };

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const errorCount = results ? results.length - successCount : 0;

  return (
    <Modal open={open} onClose={handleClose} title={title} size="md">
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 space-y-2">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Columnas esperadas: <span className="font-mono font-semibold">{columnsHint}</span>
          </p>
          <Button variant="outline" size="sm" onClick={() => onDownloadTemplate().catch(() => showError("No se pudo descargar la plantilla"))}>
            <Download className="h-4 w-4 mr-1.5" /> Descargar plantilla
          </Button>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" isLoading={isUploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1.5" /> {fileName ?? "Elegir archivo Excel (.xlsx)"}
          </Button>
        </div>

        {results && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Badge tone="success">{successCount} cargados</Badge>
              {errorCount > 0 && <Badge tone="danger">{errorCount} con error</Badge>}
            </div>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              {results.map((r) => (
                <div
                  key={r.row}
                  className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800/60 px-3 py-2 text-sm last:border-b-0"
                >
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="font-medium text-neutral-500">Fila {r.row + 2}</span>
                  {!r.success && <span className="text-red-600 dark:text-red-400">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {results ? "Cerrar" : "Cancelar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
