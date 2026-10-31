# Pulso

Maqueta móvil interna para el personal del gimnasio (roles `admin` y `receptionist`). Sirve para resolver rápido, de pie y con una mano: encontrar a un miembro, ver sus suscripciones, registrarlo, renovar o corregir una suscripción. Funciona contra la **API real** (atm-auth-api + atm-pulso-api) o contra datos **mock** sin servidor, según `EXPO_PUBLIC_API_MODE` (ver «Integración con la API»).

## Alcance y pantallas

| Pantalla | Ruta | Acción principal |
| --- | --- | --- |
| Entrar | `(auth)/index` | DNI + contraseña; si la clave debe cambiarse, pide una nueva en la misma pantalla |
| Miembros (inicio) | `(staff)/index` | Buscar por nombre/DNI/CE, filtrar, abrir ficha. Botón flotante **Nuevo** |
| Ficha | `(staff)/members/[id]` | **Renovar** (barra inferior), **Llamar** (`tel:`) y **WhatsApp** (`https://wa.me/51…`). Tocar un periodo vigente lo corrige |
| Renovar / Modificar | `(staff)/members/[id]/subscription` | Renovar, o `mode=edit` para corregir un periodo que no terminó |
| Nuevo miembro | `(staff)/members/new` | Datos del miembro + primera suscripción, en una sola pantalla |
| Perfil | `(staff)/profile` | Tema y cerrar sesión (y laboratorio de escenarios en `__DEV__`) |

Una sola lista en toda la app. El atajo «por vencer» es el chip **Por vencer N** de esa lista.

## Principios aplicados

1. **Densidad cómoda.** Filas de lista de 60 px (avatar 40, nombre, «DNI · vence en N días», estado). Nada de tarjetas grandes.
2. **Encabezados pequeños.** El texto más grande es `title` (20 px). No hay tamaños de display ni cifras gigantes. Las pantallas internas usan el encabezado nativo con un título corto.
3. **Una acción principal por pantalla**, siempre al alcance del pulgar: «Nuevo» flotante abajo a la derecha, «Renovar» fijo abajo en la ficha y el botón del formulario al final.
4. **Formularios cortos y ya rellenados.**
   - Duración en chips (1, 3, 6 y 12 meses, y «Otro» para 1–24).
   - El **monto se rellena con el precio del gimnasio** para esa duración (`Gym.membership_prices`) y se puede editar.
   - El inicio es un chip: «Al vencer (fecha)» (por defecto si sigue vigente), «Hoy» (por defecto si venció o es un alta) u «Otra fecha» (DD/MM/AAAA con máscara y teclado numérico).
   - El fin no se escribe: es una línea de vista previa («Del … al …»).
   - El pago es un chip, con Yape/Plin por defecto. El documento es DNI/CE junto al número.
   - Cada campo usa el teclado correcto (numérico, teléfono, decimal) y se valida al enviar, con mensajes de una línea.
5. **Nada decorativo.** Sin heros, ilustraciones, gradientes, sombras grandes, métricas ni frases de marketing. Los íconos solo están donde informan o son el control.
6. **Táctil sin inflar.** Botones de 48 px, chips de 40 px con área extendida a 48, filas de 60 px y avatar de perfil con `hitSlop`.
7. **Identidad sobria por gimnasio.** El color de marca (`brand_color`) tiñe el fondo y las superficies y se usa en botones y chips seleccionados. Se muestra el logo o, si no hay, un monograma de 32 px junto al nombre del gimnasio. Las paletas de claro y oscuro son explícitas y cada estado lleva etiqueta, no solo color.
8. **Movimiento mínimo.** Transiciones nativas del Stack, el pulso del esqueleto de carga (que se desactiva con «reducir movimiento») y háptica solo en botones primarios.

## Gimnasio y sede: una sola regla

`src/state/session.tsx` deriva `visibility`:

- `showGym`: el usuario tiene **más de un** gimnasio.
- `showBranch`: el usuario tiene **más de una** sede.

Si es `false`, no se muestra nada. Es el caso por defecto: un gimnasio y una sede, sin selectores ni etiquetas. Si es `true`, el nombre del gimnasio del encabezado lleva un chevron y abre una hoja para cambiar de gimnasio o de sede. Con `showBranch`, la sede también aparece en la ficha y en las suscripciones, y el formulario permite elegir la sede de cobro.

Laboratorio (`__DEV__`, en Perfil): escenarios «1 gym · 1 sede» (por defecto), «1 gym · 2 sedes» y «2 gyms», y estado de datos «Con datos», «Vacío» o «Error».

## Qué se quitó y por qué

- **Pestañas** (Buscar, Miembros y Perfil): Buscar y Miembros eran la misma lista dos veces. Ahora hay una sola lista y el Perfil se abre desde el avatar del encabezado.
- **Bienvenida con hero** (gradiente, ícono girado, eslogan de 42 px): ahora es una marca pequeña, una línea y «Entrar».
- **Inicio**: título «Cada miembro. Más cerca.», saludo y carrusel de tarjetas «por vencer» de 245 px con cifras de 52 px. Se reemplazó por el chip «Por vencer N».
- **Ficha**: monograma del gimnasio repetido, avatar de 80 px con anillo, tarjeta de gradiente con «60» a 72 px y barra de progreso, línea de tiempo expandible y título «Su historia, mes a mes». Ahora hay una cabecera compacta, una línea de estado y una lista de suscripciones.
- **Botones Llamar/WhatsApp**: solo abrían un aviso de «vista de diseño». No están en el alcance.
- **«Nueva suscripción» separada de «Renovar»**: era la misma acción con otra fecha de inicio. Ahora hay un único «Renovar» y el inicio se elige con un chip.
- **Formulario en 2 pasos**, el campo «Meses completos» duplicado con los chips, la fecha ISO escrita a mano, la tarjeta «Vista previa · fecha de fin» y la doble confirmación (revisar → confirmar vista previa).
- **Perfil**: «Tu espacio.» a 36 px, «A tu manera», el pie de marca y el laboratorio en una tarjeta grande con botones de 48 px.
- **Estados**: ícono de 88 px girado. Shimmer con gradiente: ahora son filas esqueleto con la forma real de la lista.
- **Código y archivos sin uso**: `Card`, `ListItem`, `Row`, `SectionHeader`, `LoadingState`, `MethodPicker`, `Identity`, `MemberDirectory`, `SubscriptionEditor`, `useMutation`, `formatTime`, `DOC_LABEL`, variantes de texto `display`/`mono`, tamaño de botón `lg`, imágenes de plantilla (logos de React/Expo, `tabIcons`, `tutorial-web`, `logo-glow`) y las dependencias `expo-linear-gradient`, `expo-image`, `expo-device` y `expo-web-browser`. `expo-glass-effect`, `expo-symbols` y `@expo/ui` se mantienen porque `expo-router` los usa o los declara como pares.

## Estructura

- `src/app/`: solo rutas y layouts (grupos `(auth)` y `(staff)`; el índice raíz redirige).
- `src/components/`: `GymHeader` (identidad + selector condicional + acceso a perfil), `MemberRow`, `SubscriptionForm` (alta, renovación y modificación) y `ui/` (Avatar, BottomSheet, Button, Chips, Icon, Input, Screen, States, StatusChip, Text).
- `src/hooks/queries.ts`: las pantallas leen datos solo con estos hooks.
- `src/services/types.ts`: interfaces. `src/services/index.ts`: único punto de composición. `src/services/real/` (HTTP) y `src/services/mock/` (datos y latencia simulada): adaptadores que nunca importan las pantallas.
- `src/types/`: contratos de dominio alineados con OpenAPI.
- `src/theme/`: paletas claro/oscuro, mezcla con `brand_color` y escala compacta.
- `src/lib/format.ts`: formatos (dinero, fechas, teléfono, máscara DD/MM/AAAA) y suma de meses para la vista previa.

## Reglas de formulario

DNI: 8 dígitos. CE: 9–12. Celular: 9 dígitos empezando por 9. Sin correo. Nombre: al menos dos palabras. Duración: entero de 1 a 24. Monto de 0 a 1 000 000 con hasta dos decimales, enviado como string `"100.00"`. Inicio: fecha real, y puede ser futura. Fin: meses calendario, ajustado al último día del mes. Es solo vista previa: el servidor manda. Estados y días restantes vienen del adaptador; las pantallas no los recalculan.

## Integración con la API

### Alternar mock / real

`src/services/index.ts` es el único punto de composición: elige `real/` o `mock/` según `EXPO_PUBLIC_API_MODE` (`real` | `mock`; sin la variable, `mock`). Pantallas y hooks solo conocen las interfaces de `src/services/types.ts` (`AuthService`, `SessionService`, `MembersService`).

Variables públicas (copiar `.env.example` a `.env`, que no se versiona; son build-time, así que hay que reiniciar Metro al cambiarlas):

| Variable | Desarrollo |
| --- | --- |
| `EXPO_PUBLIC_API_MODE` | `real` o `mock` |
| `EXPO_PUBLIC_PULSO_API_URL` | `http://localhost:3001/api/v1` |
| `EXPO_PUBLIC_AUTH_API_URL` | `http://localhost:3130` |

Un valor del entorno gana sobre `.env`: `EXPO_PUBLIC_API_MODE=mock npx expo start` fuerza el mock. El mock acepta cualquier DNI y clave y trae el laboratorio de escenarios (Perfil, solo `__DEV__`); con `real` el laboratorio no aparece.

### Qué hace el adaptador real (`src/services/real/`)

- `tokens.ts`: login `POST /v1/login` (`system: "pulso"`), `password_change_required` (la pantalla de entrada pide clave nueva → `POST /v1/password/change` → entra), `POST /v1/refresh`, `POST /v1/logout`, cambio de gimnasio con `tenant_id` en el refresh y `GET /v1/session/tenants`. El **refresh token vive en `expo-secure-store`** (nunca AsyncStorage); el access token, solo en memoria. En web (solo para pruebas con navegador) no hay secure store y se usa `localStorage`.
- `http.ts`: añade el Bearer; ante `401` renueva **una vez** (renovación compartida: auth-api rota el refresh token) y reintenta **una vez**. Si el refresh es rechazado, borra los tokens, avisa (`onExpired`) y la app vuelve a la entrada con «Tu sesión expiró». Una caída de red no cierra la sesión. Tiempo máximo por llamada: 15 s.
- `errors.ts`: códigos estables → mensajes en español (y códigos de campo de `VALIDATION_FAILED`). Los estados de error muestran el mensaje y «Reintentar».
- `index.ts`: `GET /me` + `GET /membership-plans` (+ tenants) al iniciar sesión; `GET /members` paginado (25 por página, scroll infinito; `meta.counts` alimenta los chips), `GET /members/{id}`, `POST /members`, `POST /members/{id}/renewals`, `PATCH /members/{id}/memberships/{membership_id}`.
- Dinero siempre como string `"100.00"`; fechas `YYYY-MM-DD`; «hoy» = `America/Lima`.
- Altas y renovaciones envían un `id` (UUID de `expo-crypto`) generado al abrir el formulario: reintentar no duplica el cobro.

### Reglas de negocio reflejadas

- **Plan**: si el gimnasio tiene más de un plan activo, el formulario muestra el selector (y envía `plan_id`); con uno solo no se muestra ni se envía. Los precios sugeridos salen del plan elegido y el monto se puede escribir.
- **Renovar** continúa el mismo plan: «Al vencer» usa el fin del último periodo de ese plan. `409 MEMBERSHIP_OVERLAP` ofrece «Empezar el …» con `suggested_starts_on`.
- **Documento repetido** (`409 MEMBER_DOCUMENT_TAKEN`): botón «Abrir su ficha».
- La fecha de fin de cobertura que muestra la ficha se calcula con `days_remaining` (regla de cobertura del servidor); `ends_on` de `MemberView` es el de un solo periodo.
- **Gimnasio**: `/v1/session/tenants` define `visibility.showGym` (más de uno). **Sede**: `user.branches` de `/me` (admin: todas; recepcionista: las asignadas) define `showBranch`. La lista de miembros es del gimnasio completo; la sede solo se usa como sede de cobro.
- **Módulos**: `user.gym.features` (`useSession().hasFeature("products")`) está listo para ocultar lo opcional. La app no tiene todavía pantallas de módulos.

### Puntos de extensión (sin conectar)

- **Venta rápida y fiados** (módulo `products`) y **medidas** (módulo `body_tracking`): no están en el API; no se implementaron. Cuando existan, añadir un método al servicio correspondiente en `types.ts`, a `real/` y a `mock/`, y mostrar la entrada solo con `hasFeature(...)`.
- El historial de correcciones (`GET …/amendments`, admin) existe en el API y no se usa en la app.

### Probar en el teléfono (Android, Expo Go) con `adb reverse`

1. Levantar el stack local: `atm-pulso-api/scripts/dev-all.sh start` (auth :3130, pulso-api :3001).
2. `.env` con `EXPO_PUBLIC_API_MODE=real` y las URLs `localhost` de arriba.
3. Con el teléfono desbloqueado y la depuración USB activa (`adb devices`):
   `adb reverse tcp:3001 tcp:3001 && adb reverse tcp:3130 tcp:3130 && adb reverse tcp:8081 tcp:8081`
   (si Metro usa otro puerto, p. ej. `npx expo start --port 8090`, se invierte ese: `adb reverse tcp:8090 tcp:8090`).
4. `npx expo start` y abrir `exp://localhost:<puerto>` en Expo Go (`adb shell am start -a android.intent.action.VIEW -d exp://localhost:8081 host.exp.exponent`).
5. Usuarios demo del gimnasio Fuerza Uno: DNI `10000001` (admin) y `10000002` (recepcionista), clave `Pulso-Demo-2026`.

Sin teléfono: `npx expo start --web` y Chromium a 412 × 869. pulso-api y auth-api solo aceptan los orígenes web de desarrollo (CORS); para probar desde otro origen hay que interceptar las respuestas y añadir las cabeceras, o ampliar `ORIGINS` del script de desarrollo.

## Referencias

Expo SDK 58: https://docs.expo.dev/versions/v58.0.0/ (Router: Stack, opciones de pantalla, `Stack.Protected`) y https://docs.expo.dev/llms.txt.

## Verificación de esta entrega

- `npx expo lint` y `npx tsc --noEmit`: sin errores.
- **Galaxy S10+ (Expo Go, adb reverse 3001/3130/8090, modo real)**: entrar como admin, sesión restaurada al reabrir la app (secure store), lista, ficha con periodos, «Llamar» (abre el marcador con el número; no se llamó), renovar (vigente, plan con y sin precios), alta con selector de plan (Baile, S/ 90 prellenado) y cierre de sesión.
- **Chromium 412 × 869 contra el stack real**: recepcionista (10000002), clave incorrecta, búsqueda con y sin resultados, filtro «Vencidos», documento repetido (409), error de red + «Reintentar», un `401` con refresh y reintento único, refresh rechazado (vuelve a la entrada con «Tu sesión expiró»), cambio de clave obligatorio (usuario de prueba creado desde el admin, con validación de clave débil), cierre de sesión, `409 MEMBERSHIP_OVERLAP` con «Empezar el …» y corrección de un periodo (`PATCH`).
- **Mock (web)**: escenarios «2 gyms» (selector de gimnasio, cambio de marca y de planes: Titan tiene dos planes) y «1 gym · 2 sedes».
- **No probado**: usuario real con varias empresas o varias sedes (requiere superadmin/consola; sin credenciales), WhatsApp (`wa.me`) en el teléfono, teclado y áreas seguras de iOS, build de producción (EAS). El Galaxy S10+ se probó con Expo Go, no con un build propio.
- Datos de prueba creados en la base local de desarrollo: el miembro «Prueba App Adriel» (DNI 45678912), renovaciones de «Lucía Prueba Kiosco» (72460666) y el usuario «Recepcion Cambio Clave» (DNI 10000077).
