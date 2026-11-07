# AppGestion

Plataforma de gestión de gimnasios con un panel de administración web, una app móvil para clientes y entrenadores, y una API REST.

## Estructura

```text
apps/
  web/       Panel de administración: React, Vite y Tailwind CSS
  mobile/    App móvil: Ionic con React
backend/     API REST: Node.js, Express y MySQL (mysql2)
```

## Requisitos

- Node.js 20 o superior y npm
- MySQL 8.0 o posterior (XAMPP incluye MariaDB compatible)

## Instalación

Desde la raíz del proyecto:

```bash
npm install
```

## Desarrollo

Ejecuta cada aplicación en una terminal independiente:

```bash
npm run dev:web
npm run dev:mobile
npm run dev:backend
```

El panel web y la app Ionic se sirven con Vite. El servidor de la API escucha en el puerto `3000` por defecto.

Inicia MySQL desde el panel de XAMPP y carga `backend/schema.sql` en phpMyAdmin o con el cliente MySQL. Después, copia `backend/.env.example` a `backend/.env`, configura los valores `MYSQL_*` y reemplaza `JWT_SECRET` por un secreto aleatorio de al menos 32 caracteres.

El panel funciona por defecto con almacenamiento local. Para usar MySQL mediante la API, copia `apps/web/.env.example` a `apps/web/.env` y configura:

```env
VITE_API_MODE=remote
VITE_API_URL=http://localhost:3000/api
```

La API ofrece autenticación en `/api/auth`, perfiles y gestión de usuarios en `/api/users`, además de recursos para `/api/members`, `/api/finance`, `/api/staff` y `/api/classes`. El primer registro crea al propietario inicial; después, el registro público se cierra y el propietario puede crear cuentas de recepcionista o entrenador desde `POST /api/users`. El propietario tiene acceso total, recepción puede gestionar miembros y finanzas, y los entrenadores pueden consultar personal y clases. El modo local es para desarrollo y guarda la cuenta y los datos en el navegador; configura el modo remoto para autenticar contra la API.

## Compilación

```bash
npm run build
```
