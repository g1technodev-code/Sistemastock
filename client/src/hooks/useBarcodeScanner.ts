import { useEffect, useRef } from "react";

export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef("");
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // Si pasan más de 50ms entre teclas, consideramos que es tipeo humano y reiniciamos el buffer
      // Los lectores láser suelen emitir cada caracter en menos de 20ms
      if (currentTime - lastKeyTime.current > 50) {
        buffer.current = "";
      }
      
      if (e.key === "Enter" && buffer.current.length > 2) {
        onScan(buffer.current);
        buffer.current = "";
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
      
      lastKeyTime.current = currentTime;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onScan]);
}
