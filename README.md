# AppGestion

Plataforma de gestión de gimnasios con un panel de administración web, una app móvil para clientes y entrenadores, y una API REST.

## Estructura

```text
apps/
  web/       Panel de administración: React, Vite y Tailwind CSS
  mobile/    App móvil: Ionic con React
backend/     API REST: Node.js, Express y MongoDB (Mongoose)
```

## Requisitos

- Node.js 20 o superior y npm
- MongoDB local o una instancia accesible por URI

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

Para conectar la API a MongoDB, copia `backend/.env.example` a `backend/.env` y configura `MONGODB_URI`.

## Compilación

```bash
npm run build
```
