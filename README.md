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

Inicia MySQL desde el panel de XAMPP y carga `backend/schema.sql` en phpMyAdmin o con el cliente MySQL. Si la base ya existía, ejecuta en orden `backend/migrations/20261106_auth_security.sql` y `backend/migrations/20261106_authenticator_only.sql`. La segunda migración elimina las columnas heredadas del factor anterior y desactiva esas configuraciones para que las cuentas puedan iniciar sesión y volver a configurar Authenticator. Después, copia `backend/.env.example` a `backend/.env`, configura las credenciales de base de datos y reemplaza `JWT_SECRET` por un secreto aleatorio de al menos 32 caracteres.

La autenticación en dos pasos usa únicamente TOTP con códigos QR compatibles con Google Authenticator y Microsoft Authenticator; no requiere servicios externos ni cuotas. La recuperación de contraseña envía un enlace por SMTP cuando `SMTP_HOST`, `SMTP_USER` y `SMTP_PASSWORD` están configurados; en desarrollo, el enlace se imprime en la consola del backend.

El panel funciona por defecto con almacenamiento local. Para usar MySQL mediante la API, copia `apps/web/.env.example` a `apps/web/.env` y configura:

```env
VITE_API_MODE=remote
VITE_API_URL=http://localhost:3000/api
```

La API ofrece autenticación y recuperación en `/api/auth`, incluidos `/forgot-password`, `/reset-password` y `/2fa/*`; perfiles y gestión de usuarios en `/api/users`; además de recursos para `/api/members`, `/api/finance`, `/api/staff` y `/api/classes`. El primer registro crea al propietario inicial; después, el registro público se cierra y el propietario puede crear cuentas de recepcionista o entrenador desde `POST /api/users`. El propietario tiene acceso total, recepción puede gestionar miembros y finanzas, y los entrenadores pueden consultar personal y clases. El modo local es para desarrollo y guarda la cuenta y los datos en el navegador; configura el modo remoto para autenticar contra la API.

## Compilación

```bash
npm run build
```
