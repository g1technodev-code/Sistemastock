import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Card, CardBody } from "../components/ui/Card";
import { Input } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { extractErrorMessage } from "../api/client";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) {
    if (user.role === "SUPERADMIN") {
      return <Navigate to="/superadmin" replace />;
    }
    const from = (location.state as { from?: Location })?.from?.pathname;
    const defaultRoute = user.role === "ADMIN" ? "/dashboard" : "/ventas";
    return <Navigate to={from || defaultRoute} replace />;
  }


  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setServerError(extractErrorMessage(error, "No se pudo iniciar sesión"));
    }
  };

  return (
    <AuthLayout>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="admin@stockflow.com" error={errors.email?.message} {...register("email")} />
            <Input label="Contraseña" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />

            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{serverError}</p>
            )}

            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              <LogIn className="h-4 w-4" /> Iniciar sesión
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="mb-1 font-medium text-neutral-700 dark:text-neutral-300">Credenciales de prueba</p>
        <p>admin@stockflow.com · manager@stockflow.com · empleado@stockflow.com</p>
        <p>Contraseña: Stockflow2026!</p>
      </div>
    </AuthLayout>
  );
}
