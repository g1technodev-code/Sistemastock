# StockFlow

Sistema de gestión de stock e inventario para pequeñas y medianas empresas. Backend en
Node.js + Express + TypeScript (arquitectura MVC) con PostgreSQL/Prisma, frontend en
React + Vite + TypeScript con Tailwind CSS.

## Funcionalidades

- Login con JWT (access token + refresh token con rotación y revocación de sesiones)
- Dashboard con KPIs, gráficas de movimientos, valor por categoría y actividad reciente
- CRUD de productos, categorías y proveedores
- Registro de entradas, salidas y ajustes de stock (protegido contra condiciones de carrera)
- Alertas de stock bajo (dashboard + campana en el topbar + filtro en productos)
- Historial de movimientos con filtros
- Reportes de valoración de inventario, top productos y exportación a CSV
- Búsqueda rápida global (Ctrl/Cmd + K)
- Usuarios y permisos por rol (ADMIN, MANAGER, EMPLOYEE) con reseteo de contraseña
- Configuración del negocio

## Requisitos

- Node.js 18+
- Docker (para levantar PostgreSQL localmente)

## Puesta en marcha

```bash
# 1. Instalar dependencias de ambos proyectos
npm run install:all

# 2. Levantar PostgreSQL (puerto 5433 en el host para no chocar con otro Postgres local)
npm run db:up

# 3. Migrar y sembrar datos de ejemplo
npm run db:migrate
npm run db:seed

# 4. Arrancar backend (puerto 4000) y frontend (puerto 5173) juntos
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### Credenciales de prueba (creadas por el seed)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@stockflow.com | Stockflow2026! |
| Gestor | manager@stockflow.com | Stockflow2026! |
| Empleado | empleado@stockflow.com | Stockflow2026! |

## Estructura

```
server/   API Express + Prisma (routes -> controllers -> services -> Prisma)
client/   SPA React + Vite + Tailwind
```

Variables de entorno del backend en `server/.env` (copiar desde `server/.env.example`).

## Notas de alcance

- Un producto tiene un único proveedor principal (no relación N:M con costos por proveedor).
- No hay importación masiva de productos por CSV (sí exportación en Reportes).
- No hay recuperación de contraseña por email; el administrador resetea contraseñas desde
  el módulo de Usuarios.
- Sin subida real de imágenes de producto (solo campo de URL opcional).
