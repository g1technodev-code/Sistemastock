import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">404</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">La página que buscas no existe.</p>
      <Link to="/dashboard">
        <Button>Volver al panel</Button>
      </Link>
    </div>
  );
}
