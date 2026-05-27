# NCTE 2026 — Notas del MVP

## Para desplegar a Vercel (temp URL del equipo)

Este sitio es 100% estático (no hay backend), así que el deploy es trivial:

1. Instala Vercel CLI: `npm i -g vercel`
2. En esta carpeta: `vercel` → seguir el prompt (crear proyecto, link a tu cuenta).
3. Para subir cambios y obtener una preview URL: `vercel` otra vez.
4. Para producción: `vercel --prod`.

Alternativa sin CLI: arrastrar la carpeta a https://vercel.com/new — Vercel detecta que es estático y la sirve sin build.

Ya hay un `vercel.json` con headers básicos de seguridad (CSP, HSTS-ready, X-Content-Type-Options, etc).

## Estado del registro en el MVP

- **Una sola cuenta** por persona — campos: nombre, apellido, email, teléfono, rol, institución, país, contraseña.
- La cuenta se guarda en `localStorage` del navegador (clave `ncte_users_v1`).
- La sesión activa se guarda en `localStorage` bajo `ncte_session_v1`.
- Las contraseñas se hashean con **PBKDF2-SHA-256 (150 000 iteraciones + salt único por usuario)** antes de guardarse. Nunca se guarda la contraseña en texto plano.
- El registro queda disponible para:
  - Webinars (Día 2) — automático, todo registro da acceso.
  - Día 1 presencial — la página `registro-presencial.html` está bloqueada hasta que el usuario inicie sesión, y los cupos elegidos se guardan por-usuario (`ncte_day1_plan_v1::<email>`).

### Limitaciones del MVP (importantes para el equipo)

- **No hay verificación de email** — cualquiera puede registrarse con un email arbitrario.
- **El registro vive solo en el navegador del usuario** — si abren la página en otra computadora, no encontrarán su cuenta. Esto **se resuelve al migrar a Supabase**.
- **Los cupos limitados no se descuentan globalmente** — son por-usuario hasta que haya backend.
- **No hay envío real de email de confirmación** — los toasts y mensajes son simulados.
- Estas limitaciones son aceptables para "tempurl para revisión interna del equipo", no para producción.

## Migración a Supabase (producción)

Toda la lógica de auth vive en **un solo archivo**: `auth.js`. Para conectar Supabase:

1. Crear proyecto en https://supabase.com → habilitar Auth con email/password.
2. Crear tabla `profiles` con columnas:
   ```
   id (uuid, FK → auth.users.id, PK)
   first_name (text)  last_name (text)
   phone (text)        institution (text)
   role (text)         country (text)
   created_at (timestamptz, default now())
   ```
3. Trigger en `auth.users` (after insert) que crea la fila en `profiles` con `raw_user_meta_data`.
4. Crear tabla `day1_picks` (user_id, slot, session_id, created_at) con RLS: cada usuario solo lee/escribe sus propios picks.
5. Crear tabla `session_capacity` (session_id, capacity, taken) y un trigger que ajuste `taken` en cada insert/delete de `day1_picks`. Reservar un cupo solo si `taken < capacity`.
6. En `auth.js`, reemplazar los cuerpos de `register`, `login`, `logout`, `currentUser`, `onChange` por llamadas al SDK:
   ```js
   import { createClient } from '@supabase/supabase-js'
   const sb = createClient(URL, ANON_KEY)
   // register:
   await sb.auth.signUp({ email, password, options: { data: { first_name, last_name, phone, institution, role, country }}})
   // login:
   await sb.auth.signInWithPassword({ email, password })
   ```
7. Variables de entorno en Vercel: `SUPABASE_URL` (público), `SUPABASE_ANON_KEY` (público, RLS protege los datos).
8. Reemplazar `localStorage.getItem('ncte_day1_plan_v1::...')` en `registro-presencial.html` por queries a la tabla `day1_picks`.

Diseñé el sitio así para que la migración sea **un cambio de archivo (`auth.js`) + una migración de planner (un script en `registro-presencial.html`)**, sin tocar la UI ni el resto del JS.

## Checklist de seguridad — estado actual

| Riesgo | Estado |
|---|---|
| OAuth fake removido | OK |
| Password en texto plano en storage | OK (PBKDF2 + salt) |
| XSS al renderizar nombre/email de usuario | OK (escapeHtml) |
| Email enumeration por timing | Mitigado (siempre se ejecuta el hash) |
| Brute force | Mitigado parcialmente (150k iteraciones). En producción, Supabase trae rate limiting nativo. |
| CSRF | N/A en MVP (no hay backend) |
| Sesión robada (XSS de terceros) | No mitigado — depende de la CSP que se configure (ver `vercel.json`). |
| Sensibles en URL | OK (todo es POST-style via form, no query params) |

## Lo que NO está en este MVP (pendiente para producción)

- Recuperación de contraseña.
- Login con código mágico (Supabase lo trae gratis).
- 2FA.
- Edición del perfil después de registrarse.
- Vista de admin / dashboard de CCCN para ver inscritos.
- Conteo real de cupos por sala.
- Generación de certificados.
- Pagos para el pase presencial.

## Archivos clave

- `auth.js` — único punto de auth, swap a Supabase aquí.
- `ncte.js` — modal de registro/login + shell global.
- `ncte.css` — estilos del modal.
- `registro-presencial.html` — página gateada; el script al final del archivo maneja el planner.
- `webinars.html` — registro inline; usa `auth.js`.
- `vercel.json` — headers de seguridad para el deploy.
