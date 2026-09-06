# Pizarra

Pizarra es un dashboard personal de objetivos pensado para una sola cosa: ayudarte a avanzar hacia tu meta principal sin convertirte en otro gestor gigante de tareas.

La primera versión viene lista para usar con:

- misión principal destacada
- objetivos con hitos y progreso automático
- metas medibles por tiempo o por acciones
- reportes con progreso, histórico y objetivos vencidos
- sección ligera de "Esta semana" derivada de los hitos pendientes
- calendario de Google embebido por URL pública
- persistencia por usuario con Supabase
- inicio de sesión con Google
- exportación e importación de datos JSON
- restablecimiento total con confirmación

## Stack

- React
- Vite
- TypeScript
- CSS puro

La app está pensada para desplegarse fácilmente en Vercel como sitio estático.

## Objetivo principal inicial

La primera vez que se abre, Pizarra crea esta misión:

- `Conseguir mi primera venta por cuenta propia`
- fecha límite: `14/12/2026`

También genera los hitos iniciales para ese objetivo.

## Scripts

Instalar dependencias:

```bash
npm install
```

Desarrollo local:

```bash
npm run dev
```

Chequeo de TypeScript:

```bash
npm run check
```

Build de producción:

```bash
npm run build
```

Vista previa del build:

```bash
npm run preview
```

## Arquitectura

La aplicación usa una capa pequeña de dominio y un repositorio de Supabase para separar la persistencia de la UI.

Piezas clave:

- `src/data/types.ts`: tipos de datos
- `src/data/defaults.ts`: datos iniciales y borradores
- `src/data/domain.ts`: cálculos de progreso, fechas y utilidades
- `src/data/supabaseRepository.ts`: adaptador de persistencia por usuario
- `src/data/supabase.ts`: cliente de Supabase
- `src/data/importExport.ts`: normalización de importaciones JSON

Los datos se guardan en Supabase como JSON versionado por usuario. El SQL inicial está en `supabase/schema.sql`.

## Qué guarda

- nombre de la app
- URL de Google Calendar
- objetivo principal
- objetivos secundarios
- hitos por objetivo
- estado de completado de cada hito
- fechas de creación y actualización

## Importar y exportar

En la sección de configuración puedes:

- exportar los datos actuales a JSON
- importar un JSON compatible
- restablecer la información local

Si importas un JSON inválido, la app lo rechaza sin romperse.

## Google Calendar

No hay OAuth ni API por ahora.

Solo necesitas pegar una URL pública o de embed de Google Calendar. Si no hay URL configurada, la app muestra un placeholder bonito.

## Configurar Supabase

1. Ejecuta `supabase/schema.sql` en el SQL Editor del proyecto.
2. Activa Google en `Authentication > Providers > Google`.
3. Configura `http://localhost:5173` como URL local y añade la URL de Vercel cuando publiques.
4. Copia `.env.example` como `.env.local` y completa las variables públicas del proyecto.

## Despliegue en Vercel

La app se despliega como sitio estático.

- build command: `npm run build`
- output directory: `dist`

No hay secretos ni credenciales hardcodeadas.

## Base de datos futura

Vercel se encargará del frontend y del build, pero no es la base de datos. Para guardar los datos entre dispositivos, la opción recomendada es Supabase:

1. Crear un proyecto Supabase con PostgreSQL.
2. Añadir autenticación por email o magic link para que los datos sean privados.
3. Crear tablas para `goals` y `milestones`, relacionadas por `goal_id`.
4. Activar Row Level Security para que cada usuario solo pueda leer y modificar sus propios datos.
5. Implementar un `supabaseRepository` junto al `localStorageRepository` actual.
6. Configurar en Vercel las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

La UI no tendría que reescribirse: solo cambiaría la implementación del repositorio. La clave `anon` puede estar en el frontend si las políticas RLS están correctamente configuradas; nunca se debe exponer una service key.

Para esta primera versión se mantiene `localStorage`, porque permite validar el flujo sin añadir autenticación ni infraestructura. Cuando quieras sincronización entre dispositivos, el siguiente paso será migrar el repositorio a Supabase y añadir login.

## Desarrollo

La UI es:

- oscura
- sobria
- mobile-first
- responsive real
- con bordes sutiles y acento azul tipo VS Code

El foco visual siempre cae sobre la misión principal y sobre las acciones concretas que te acercan a ella.
