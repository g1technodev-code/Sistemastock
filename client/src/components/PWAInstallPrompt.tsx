import { useState, useEffect } from "react";
import { Download, Share, PlusSquare } from "lucide-react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone (installed)
    const inStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    setIsStandalone(!!inStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstallClick}
        className="w-full justify-start gap-2 border-primary-500/40 text-primary-400 hover:bg-primary-500/10 text-xs py-2 font-semibold"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Instalar App Kipo</span>
      </Button>

      <Modal open={showIOSModal} onClose={() => setShowIOSModal(false)} title="Instalar Kipo en tu iPhone / iPad" size="sm">
        <div className="space-y-4 text-neutral-300 text-sm">
          <p>Para instalar Kipo en tu pantalla de inicio en iOS:</p>
          <ol className="space-y-3 list-decimal list-inside text-xs leading-relaxed text-neutral-400">
            <li className="flex items-center gap-2">
              <span>Toca el botón</span>
              <Share className="h-4 w-4 text-primary-400 inline" />
              <span className="font-semibold text-white">Compartir</span> en la barra inferior de Safari.
            </li>
            <li className="flex items-center gap-2">
              <span>Desliza hacia abajo y presiona</span>
              <PlusSquare className="h-4 w-4 text-primary-400 inline" />
              <span className="font-semibold text-white">"Agregar a inicio"</span>.
            </li>
            <li>Toca <strong>Agregar</strong> en la esquina superior derecha.</li>
          </ol>
          <div className="pt-2 flex justify-end">
            <Button onClick={() => setShowIOSModal(false)} size="sm">
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
