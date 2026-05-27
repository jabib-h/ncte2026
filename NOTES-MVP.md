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
- Generación de certificados.
- Pagos para el pase presencial.

## Roadmap a versión oficial (priorizado)

### 1. UI responsive — mobile y pantallas pequeñas
El layout actual se desacomoda en breakpoints menores. Hay que revisar y arreglar:
- Hero (`.nhero__grid` colapsa el globo y el copy en sm).
- Schedule (`.nsched__days` lado a lado → vertical stack).
- Activity grid (`.nact-grid` — 3 columnas → 1).
- Modal de auth (`.nmodal__row` ya tiene media query a 1 col, validar).
- Header CTAs (Register button + avatar pueden chocar con el menú hamburguesa).
- Footer (4 columnas → 2 → 1).
- `registro-presencial` planner (grid lateral derecho → debajo en mobile).
- `webinars` form (ya tiene `@media (max-width: 940px)` pero hay que revisar inputs).

**Acceptance**: probar en 320, 375, 414, 768 y 1024 px sin scroll horizontal y sin overlaps.

### 2. Consistencia de tipografía y línea gráfica
Importante: **el brand book CCCN debe aplicarse en TODAS las secciones**, incluidas las páginas internas que hoy traen sus propios estilos inline (`registro-presencial.html`, `webinars.html`).
- Tipografías: Raleway (sans, body/UI) + Fraunces (serif display, titulares y phrases positivas).
- Paleta exacta: Red `#ee304e`, Blue `#2d479d` / `#041a71`, Burgundy `#5b0038`, etc. (ver `styles.css:8-30`).
- Botones, chips, eyebrows, cards: respetar tokens existentes.
- Auditar `registro-presencial.html` líneas 14-500 y `webinars.html` líneas 14-300 — mover estilos inline a `ncte.css` o un `pages.css` compartido y eliminar duplicación.

### 3. Contenido pendiente
- **Privacy Policy** — actualmente los links apuntan a `#`. Redactar y publicar como `/privacy`.
- **Terms** — idem, publicar como `/terms`.
- **Code of Conduct** — idem, publicar como `/code-of-conduct`.
- **Fotos reales de speakers** — hoy se usan iniciales como avatar (`MB`, `JA`, etc.). Subir fotos al folder `assets/speakers/` y referenciar.
- **Logos de sponsors / partners** — sección `#sponsors` está vacía o con placeholders. Coordinar con editoriales (Cambridge, Macmillan, etc.) y diseño.

### 4. Lógica del sistema de reserva (producción, requiere backend Supabase)
La versión oficial necesita resolver bien estos casos — **definir reglas antes de implementar**:

**Cupos en tiempo real**
- Cada vez que alguien reserva un cupo, el contador global debe descontar.
- Cada vez que alguien libera un cupo (cambio o cancelación), el contador debe aumentar.
- Si dos personas intentan reservar el último cupo a la vez, una gana y la otra recibe "sold out" — manejar con transacción atómica en Supabase.
- Si una sesión llega a 0 cupos, el card debe mostrarse como "Full" y deshabilitar el botón en tiempo real (Supabase Realtime para que otros usuarios vean el cambio sin recargar).

**Cambio de sesión concurrente**
- Flujo: usuario tenía Room A 11:00 → quiere cambiar a Room C 11:00.
- ¿Qué emails se envían?
  - Email 1: "Tu reserva en Room A fue cancelada."
  - Email 2: "Tu nueva reserva en Room C está confirmada."
  - O un solo email: "Cambiaste de Room A a Room C — aquí tu nuevo itinerario."
- **Decidir**: ¿se permite cambiar libremente hasta el día del evento? ¿Hay deadline (ej. 24h antes)? ¿Hay máximo de cambios por persona?

**Cancelación**
- Si el usuario cancela sin elegir reemplazo, ¿se le envía email de confirmación de cancelación? ¿Se libera el cupo inmediatamente?
- ¿Puede cancelar todo y dejar de asistir? ¿Eso elimina su cuenta o solo su reserva del Día 1?

**Sobreventa controlada**
- ¿Se permite waitlist cuando una sesión se llena? Si sí, cuando alguien cancela el primero en waitlist se promueve automáticamente y recibe email.

### 5. Emails transaccionales
- Setup de proveedor de email transaccional. Opciones:
  - **Resend** (recomendada, integra bien con Supabase Edge Functions y Vercel).
  - **SendGrid** o **Postmark** como alternativas establecidas.
  - Supabase Auth trae emails básicos (welcome, reset password) pero los **transaccionales custom** (confirmación de cupo, cambios, recordatorios) requieren proveedor externo.
- Configurar el dominio del CCCN (ej. `ncte@centrocultural.cr`) con SPF/DKIM/DMARC para que no caigan en spam.
- Plantillas a diseñar:
  - Welcome / cuenta creada (con link de verificación si se activa).
  - Confirmación de cupo Día 1 (cuando se reserva una sesión).
  - Cancelación + nuevo cupo (cuando se cambia de sesión).
  - Cancelación simple.
  - Recordatorio 24h antes del evento (con Zoom links del Día 2).
  - Mensaje post-evento con certificado / encuesta.

### 6. UX — "Mi itinerario" desde el avatar
Hoy, click en el avatar del header pregunta "Sign out?". Cambiar a:
- Click en el avatar → redirige a `/itinerario` (página nueva).
- La página `/itinerario` debe mostrar:
  - Datos del usuario (nombre, email, institución, rol).
  - **Itinerario Día 1**: cupos reservados con día/hora/sala/ponente. Botón "Cambiar" o "Cancelar" por cada uno.
  - **Itinerario Día 2 virtual**: links de Zoom de los 6 webinars (visibles solo una vez emitidos).
  - Botón "Editar mi perfil" (cambiar teléfono, institución, etc.).
  - Botón secundario "Cerrar sesión".
- En mobile, el avatar debe abrir un dropdown con "Mi itinerario" / "Editar perfil" / "Salir" antes de redirigir, o ir directo si se prefiere flujo más simple.

## Archivos clave

- `auth.js` — único punto de auth, swap a Supabase aquí.
- `ncte.js` — modal de registro/login + shell global.
- `ncte.css` — estilos del modal.
- `registro-presencial.html` — página gateada; el script al final del archivo maneja el planner.
- `webinars.html` — registro inline; usa `auth.js`.
- `vercel.json` — headers de seguridad para el deploy.
