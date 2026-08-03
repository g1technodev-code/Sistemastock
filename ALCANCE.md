# StockFlow — Alcance actual del proyecto

Sistema de gestión de stock e inventario para PyMEs. Monorepo con backend API + frontend SPA.

## Stack técnico

**Backend** (`server/`): Node.js + Express + TypeScript, Prisma ORM sobre PostgreSQL, arquitectura en capas (routes → controllers → services → Prisma).

**Frontend** (`client/`): React + Vite + TypeScript, Tailwind CSS v4, React Query, React Router, react-hook-form + zod, Recharts.

**Auth**: JWT access token (en memoria en el cliente) + refresh token rotativo respaldado en DB, en cookie httpOnly con scope `/api/auth`. Permite revocar sesiones de un usuario desactivado o con cambio de rol.

**Infraestructura**: PostgreSQL vía Docker Compose (puerto host `5433`).

**Moneda**: única moneda del sistema, ARS (peso argentino) — sin selector de moneda.

## Roles y permisos

Tres roles fijos, sin permisos dinámicos:

| Rol | Alcance |
|---|---|
| **ADMIN** | Acceso total: usuarios, retiros de caja, configuración del negocio |
| **MANAGER** | CRUD de catálogo (productos, categorías, proveedores), reportes, movimientos de caja (lectura) |
| **EMPLOYEE** | Operación diaria: ventas, movimientos de stock, caja (apertura/cierre de turno) |

## Módulos funcionales

### Autenticación
Login, refresh de sesión, logout, `/me`.

### Dashboard
KPIs generales: valor de inventario, ventas del día, saldo de caja, alertas de stock bajo.

### Productos
CRUD completo (SKU, código de barras, nombre, unidad, costo, precio de venta, stock actual/mínimo, imagen, categoría, proveedor). Un proveedor por producto (sin multi-proveedor en v1).

### Categorías
CRUD simple (nombre, descripción, color, activo/inactivo).

### Proveedores
CRUD simple (contacto, email, teléfono, dirección, tax ID, notas).

### Stock (movimientos)
Registro de entradas, salidas y ajustes de inventario, con snapshot de cantidad antes/después, costo unitario, motivo y referencia. Historial completo por producto. Usa patrón de update atómico + re-lectura post-escritura para evitar condiciones de carrera.

### Ventas
Registro de ventas con múltiples ítems, métodos de pago (efectivo, transferencia, tarjeta), número de comprobante, anulación (void) de ventas. Requiere que el usuario tenga un turno de caja abierto para vender, sin importar el método de pago.

### Caja
Registro único de caja (`CashRegister`) con saldo corriente que **nunca se resetea** entre turnos. Los turnos (`CashShift`) son solo checkpoints de arqueo (comparan efectivo contado vs. esperado y guardan la diferencia) sin afectar el saldo. El saldo solo baja por retiros explícitos (solo ADMIN) y solo sube por ventas en efectivo.

### Reportes
Valuación de stock, movimientos, top productos, breakdown por categoría. Acceso restringido a ADMIN/MANAGER.

### Búsqueda
Búsqueda global (`/search`).

### Usuarios
Gestión de usuarios del sistema: alta, edición, reseteo de contraseña. Solo ADMIN.

### Configuración del negocio
Datos generales de la empresa (nombre, RUC/ID fiscal, dirección, teléfono, email, logo). Solo ADMIN puede editar.

## Cortes explícitos de alcance (v1)

- Un solo proveedor por producto (no multi-proveedor)
- Sin importación CSV
- Sin recuperación de contraseña por email
- Sin carga de imágenes (solo URL)
- Sin permisos dinámicos/configurables (solo los 3 roles fijos)
- Sin multi-moneda (ARS únicamente)

## Cómo levantar el entorno

```
npm run db:up      # levanta Postgres (docker compose)
npm run dev         # backend :4000 + frontend :5173
```

Credenciales demo (seed): `admin@stockflow.com`, `manager@stockflow.com`, `empleado@stockflow.com` — password `Stockflow2026!` para las tres.
