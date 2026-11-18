# AppGestion

Sistema de gestión para gimnasios dividido en panel administrativo web, app móvil para clientes/entrenadores y API REST.

## Stack y estructura

```text
apps/
  web/       Panel de administración (React, Vite, Tailwind CSS)
  mobile/    App móvil para clientes y entrenadores (Ionic, React)
backend/     API REST (Node.js, Express, MySQL con mysql2) 
```
Cómo funciona
Roles: El primer registro crea al propietario y bloquea el registro público. Desde ahí, el propietario da de alta cuentas de recepcionista o entrenador (POST /api/users) y puede restablecer contraseñas del personal. Recepción maneja miembros y finanzas; entrenadores y clientes consultan horarios y clases.

Autenticación: Login con JWT y 2FA opcional por TOTP (código QR compatible con Google Authenticator y Microsoft Authenticator, sin servicios de terceros).

Modo local vs remoto: Por defecto el panel guarda datos en el navegador para pruebas rápidas. Para conectarlo a MySQL vía API se configura el .env del frontend.

Requisitos
Node.js 20+ y npm

MySQL 8.0+ (o MariaDB desde XAMPP)

Instalación y configuración
Instala las dependencias desde la raíz:

Bash
npm install
Levanta MySQL en XAMPP e importa backend/schema.sql. Si ya tenías una base creada, corre las migraciones en orden:

backend/migrations/20261106_auth_security.sql

backend/migrations/20261106_authenticator_only.sql

backend/migrations/20261106_admin_passwords_and_staff_status.sql

Configura las variables de entorno:

Copia backend/.env.example a backend/.env, pon los datos de tu base de datos y genera un JWT_SECRET de mínimo 32 caracteres.

Si vas a usar la API desde el panel web, copia apps/web/.env.example a apps/web/.env y agrega:

Fragmento de código
VITE_API_MODE=remote
VITE_API_URL=http://localhost:3000/api
Ejecución en local
Levanta cada servicio en una terminal distinta (el servidor corre en el puerto 3000 por defecto):

Bash
npm run dev:web
npm run dev:mobile
npm run dev:backend
Endpoints principales
/api/auth — Registro inicial, login y 2FA

/api/users — Perfiles y alta de personal

/api/members — Gestión de socios

/api/finance — Pagos y finanzas

/api/staff — Personal y disponibilidad

/api/classes — Clases y horarios

Build
Bash
npm run build
