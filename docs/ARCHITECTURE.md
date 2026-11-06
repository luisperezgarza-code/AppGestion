# Arquitectura de AppGestion

AppGestion está organizado como un monorepo npm con tres aplicaciones independientes: un panel web de administración, una aplicación móvil y una API REST.

## Estructura

```text
apps/
  web/       Panel de administración web
  mobile/    Aplicación móvil para clientes y entrenadores
backend/     API REST y conexión a MongoDB
docs/        Documentación del proyecto
package.json Configuración de workspaces y comandos compartidos
```

## Panel web: React, Vite y Tailwind CSS

El panel de administración está en `apps/web`. React se utiliza para construir la interfaz, Vite para el servidor de desarrollo y la compilación, y Tailwind CSS para los estilos. Esta aplicación está destinada a las tareas de gestión del gimnasio, como miembros, entrenadores, clases y pagos.

Comandos principales desde la raíz:

- `npm run dev:web`: inicia el servidor de desarrollo.
- `npm run build`: incluye la compilación de esta aplicación.

## Aplicación móvil: Ionic con React

La app móvil está en `apps/mobile` y utiliza Ionic con React. Ionic proporciona componentes y estilos adaptados a experiencias móviles; React permite implementar las vistas y flujos para clientes y entrenadores.

Comando principal desde la raíz:

- `npm run dev:mobile`: inicia Vite para desarrollo y acepta conexiones en la red local.

## Backend: Node.js, Express y MongoDB

La API está en `backend`. Node.js ejecuta el servidor y Express define la API REST. Mongoose gestiona la conexión con MongoDB.

- `src/server.ts` carga la configuración, conecta con MongoDB e inicia el servidor.
- `src/app.ts` configura Express y registra las rutas.
- `src/config/database.ts` centraliza la conexión a la base de datos.
- `src/routes/health.ts` expone `GET /api/health`, que devuelve el estado del servicio y de la conexión a MongoDB.
- `.env.example` documenta las variables de entorno necesarias. Copia este archivo a `.env` y configura `MONGODB_URI` antes de iniciar la API.

Comando principal desde la raíz:

- `npm run dev:backend`: inicia la API en modo de desarrollo. El puerto predeterminado es `3000`.

## Workspaces y desarrollo

El `package.json` raíz declara `apps/web`, `apps/mobile` y `backend` como workspaces npm. Instala las dependencias desde la raíz con `npm install`. Cada aplicación tiene sus propias dependencias y scripts, mientras que los comandos raíz ofrecen accesos directos para desarrollo y compilación.
