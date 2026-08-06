import { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Zap, Volume2, AlertCircle } from "lucide-react";
import { createPortal } from "react-dom";

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function CameraScannerModal({ open, onClose, onScan, title = "Escaneo con Cámara" }: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torch, setTorch] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Reproduce un sonido Beep sintético web audio sin archivos de audio externos
  function playBeepSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Ignorar si el audio no está permitido por la política del navegador
    }
  }

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let active = true;
    setCameraError(null);
    setScanning(true);

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("El navegador no soporta el acceso a la cámara");
        }

        stopCamera();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Comprobar soporte de Linterna (Flash)
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
        if (capabilities?.torch) {
          setHasTorch(true);
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Error al iniciar la cámara";
        setCameraError(msg.includes("Permission") || msg.includes("NotAllowedError")
          ? "Permiso de cámara denegado. Por favor permítelo en los ajustes del navegador."
          : msg);
        setScanning(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [open, facingMode]);

  // Bucle de detección de códigos de barra
  useEffect(() => {
    if (!open || !scanning) return;
    let animationFrameId: number;
    let barcodeDetector: any = null;

    // Detectar si el navegador soporta BarcodeDetector nativo
    if ("BarcodeDetector" in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
        });
      } catch {
        barcodeDetector = null;
      }
    }

    async function detectFrame() {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code) {
                playBeepSound();
                if (navigator.vibrate) navigator.vibrate([100]);
                onScan(code);
                onClose();
                return;
              }
            }
          } catch {
            // Continuar en el siguiente frame si falla un frame
          }
        }
      }
      animationFrameId = requestAnimationFrame(detectFrame);
    }

    animationFrameId = requestAnimationFrame(detectFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [open, scanning, onScan, onClose]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function toggleTorch() {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const nextTorch = !torch;
      track.applyConstraints({
        advanced: [{ torch: nextTorch } as any],
      }).then(() => setTorch(nextTorch)).catch(() => {});
    }
  }

  function toggleFacingMode() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-white shadow-float animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-2 font-bold text-neutral-100">
            <Camera className="h-5 w-5 text-primary-400" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {/* Overlays / Target reticle */}
          {scanning && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative h-48 w-72 rounded-2xl border-2 border-primary-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-danger-500 shadow-sm animate-pulse" />
              </div>
              <p className="mt-4 rounded-full bg-neutral-900/80 px-4 py-1 text-xs font-semibold text-neutral-200 backdrop-blur-sm">
                Apunta el código de barras al recuadro
              </p>
            </div>
          )}

          {/* Error Message */}
          {cameraError && (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-danger-500" />
              <p className="text-sm font-semibold text-neutral-300">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Controls footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-900/90 px-6 py-4">
          <button
            onClick={toggleFacingMode}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-800/60 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{facingMode === "environment" ? "Cámara Frontal" : "Cámara Trasera"}</span>
          </button>

          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors ${
                torch
                  ? "border-warning-500/50 bg-warning-500/20 text-warning-400"
                  : "border-neutral-800 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>{torch ? "Apagar Linterna" : "Encender Linterna"}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Volume2 className="h-4 w-4 text-primary-400" />
            <span>Beep Activo</span>
          </div>
        </div>

      </div>
    </div>,
    document.body,
  );
}
