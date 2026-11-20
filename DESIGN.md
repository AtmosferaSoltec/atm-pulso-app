# Pulso

Maqueta móvil interna para el personal del gimnasio (roles `admin` y `receptionist`). Sirve para resolver rápido, de pie y con una mano: encontrar a un miembro, ver sus suscripciones, registrarlo, renovar o corregir una suscripción. Funciona contra la **API real** (atm-auth-api + atm-pulso-api) o contra datos **mock** sin servidor, según `EXPO_PUBLIC_API_MODE` (ver «Integración con la API»).

## Alcance y pantallas

| Pantalla | Ruta | Acción principal |
| --- | --- | --- |
| Entrar | `(auth)/index` | DNI + contraseña; si la clave debe cambiarse, pide una nueva en la misma pantalla |
| Miembros (inicio) | `(staff)/index` | Buscar por nombre/DNI/CE, filtrar, abrir ficha. Abajo, al pulgar: **Venta rápida** y **Nuevo miembro** |
| Ficha | `(staff)/members/[id]` | **Renovar** (barra inferior), **Llamar** (`tel:`) y **WhatsApp** (`https://wa.me/51…`). Tocar un periodo vigente lo corrige |
| Renovar / Modificar | `(staff)/members/[id]/subscription` | Renovar, o `mode=edit` para corregir un periodo que no terminó |
| Venta rápida (módulo `sales`) | `(staff)/sale` | Tocar productos suma 1; **Cobrar** (elige método) o **Dejar pendiente** (requiere miembro). Se abre con **Venta rápida**, junto a «Nuevo miembro» |
| Nuevo miembro | `(staff)/members/new` | Datos del miembro + primera suscripción, en una sola pantalla |
| Perfil | `(staff)/profile` | Tema y cerrar sesión (y laboratorio de escenarios en `__DEV__`) |

Una sola lista en toda la app. El atajo «por vencer» es el chip **Por vencer N** de esa lista.

## Principios aplicados

**Lenguaje visual del inicio (lienzo de marca).** El inicio es la cara de la app y se diseña para impresionar sin añadir datos:

- **Lienzo de marca arriba**: bloque con el color del gimnasio en degradado (nativo, `backgroundImage` de RN; sin dependencias), esquinas inferiores de 32 px y anillos concéntricos de «pulso» que se abren una vez al entrar. Sobre él, en blanco: logo o monograma en baldosa blanca, nombre del gimnasio (y sede si hay varias), avatar de perfil, la fecha de hoy como antetítulo y el título «Miembros» (30 px, el único tamaño `display` de la app). El color se oscurece (`deepen`, mismo tono) hasta que el blanco pase AA (4.6:1): un naranja se vuelve terracota, un teal o un negro quedan igual. La barra de estado va en claro solo mientras el inicio está enfocado.
- **Búsqueda flotante**: campo blanco de 56 px que monta sobre el borde del lienzo, con sombra teñida de la marca. Al buscar, los filtros se cambian por «Buscando en todos los miembros».
- **Filtros**: chips de 40 px; «Por vencer» y «Vencidos» llevan su número en una pastilla ámbar/roja (la única cifra de la pantalla).
- **Miembros como tarjetas** de 76 px (radio 20, sombra suave): avatar de 44 con color propio por nombre (el mismo en la ficha y el perfil), nombre en la primera línea entera y, debajo, el estado. Si pide atención, el estado es una pastilla de color con punto y el avatar lleva un anillo del mismo color (por vencer ámbar, vencido rojo, programado azul); si está activo, texto gris tranquilo.
- **Acciones al pulgar**: «Venta rápida» (blanca) y «Nuevo miembro» (color de marca) fijas abajo sobre un velo que desvanece la lista. Al bajar, una barra compacta con el gimnasio y una lupa (vuelve arriba y enfoca la búsqueda) reemplaza al lienzo.
- **Movimiento** en el hilo de UI (Reanimated): las primeras tarjetas entran escalonadas, todo lo tocable se hunde un poco con un resorte (`PressableScale`), háptica al cambiar de filtro y en las dos acciones. Con «reducir movimiento» no hay escalas ni entradas.
- **Sin cifras**: nada de KPIs, totales, ingresos ni resúmenes; los números van en la web.

Resto de la app:

1. **Densidad cómoda.** Fuera del inicio, filas de 60 px; la frase es el estado y solo lleva color cuando pide atención.
2. **Encabezados pequeños.** Las pantallas internas usan el encabezado nativo con un título corto (`title`, 20 px). `display` solo existe en el inicio.
3. **Una acción principal por pantalla**, siempre al alcance del pulgar: las dos del inicio, «Renovar» fijo abajo en la ficha y el botón del formulario al final.
4. **Formularios cortos y ya rellenados.**
   - Duración en chips (1, 3, 6 y 12 meses, y «Otro» para 1–24).
   - El **monto se rellena con el precio del gimnasio** para esa duración (`Gym.membership_prices`) y se puede editar.
   - El inicio es un chip: «Al vencer (fecha)» (por defecto si sigue vigente), «Hoy» (por defecto si venció o es un alta) u «Otra fecha» (DD/MM/AAAA con máscara y teclado numérico).
   - El fin no se escribe: es una línea de vista previa («Del … al …»).
   - El pago es un chip, con Yape/Plin por defecto. El documento es DNI/CE junto al número.
   - Cada campo usa el teclado correcto (numérico, teléfono, decimal) y se valida al enviar, con mensajes de una línea.
5. **Decoración con propósito.** Solo el lienzo del inicio lleva degradado y anillos; el resto es superficie blanca, sombra suave teñida y radios de 12 (botones, campos), 16 y 20 (tarjetas). Sin ilustraciones ni frases de marketing.
6. **Táctil sin inflar.** Botones de 48 px (56 en el inicio), chips de 40 px con área extendida a 48, filas de 60 px y perfil con área de 48.
7. **Identidad por gimnasio.** El color de marca tiñe fondo, superficies, sombras, botones y chips seleccionados, y llena el lienzo del inicio. Cada estado lleva etiqueta, no solo color. Probado con teal `#176b80`, naranja `#e5602b` y casi negro `#1a1a1a`.
8. **Movimiento con medida.** Transiciones nativas del Stack, el pulso del esqueleto de carga y los detalles del inicio; todo se desactiva o se reduce con «reducir movimiento».

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
- **Estados**: ícono de 88 px girado. Shimmer con gradiente: ahora son esqueletos con la forma real de la lista (tarjetas en el inicio) y un ícono de 26 px en un disco suave de la marca.
- **Código y archivos sin uso**: `Card`, `ListItem`, `Row`, `SectionHeader`, `LoadingState`, `MethodPicker`, `Identity`, `MemberDirectory`, `SubscriptionEditor`, `useMutation`, `formatTime`, `DOC_LABEL`, variantes de texto `display`/`mono`, tamaño de botón `lg`, imágenes de plantilla (logos de React/Expo, `tabIcons`, `tutorial-web`, `logo-glow`) y las dependencias `expo-linear-gradient`, `expo-image`, `expo-device` y `expo-web-browser`. `expo-glass-effect`, `expo-symbols` y `@expo/ui` se mantienen porque `expo-router` los usa o los declara como pares.

## Estructura

- `src/app/`: solo rutas y layouts (grupos `(auth)` y `(staff)`; el índice raíz redirige).
- `src/components/`: `GymHeader` (identidad sobre el lienzo + selector condicional + acceso a perfil), `MemberRow` (tarjeta), `SearchField` (búsqueda del inicio y de la venta), `SubscriptionForm` (alta, renovación y modificación) y `ui/` (Avatar, BottomSheet, Button, Chips, Icon, Input, PressableScale, Screen, States, Text).
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

### Módulos opcionales (`sales`)

**Regla: si el gimnasio no tiene el módulo (`user.gym.features`, vía `useSession().hasFeature`), la app no muestra nada de él** (ni botón, ni bloque, ni llamadas). Con `FEATURE_DISABLED` el API responde 403, así que tampoco se consulta «por si acaso».

- **Venta rápida** (`sales`): botón «Venta rápida» en el inicio (junto a «Nuevo miembro») → lista compacta de productos activos (`GET /products`) con precio, tocar suma 1 y «−» resta (1–99). Total fijo abajo. Miembro opcional (hoja de búsqueda por nombre o documento). «Cobrar» abre una hoja con el método (efectivo, Yape/Plin, tarjeta, transferencia; recuerda el último en memoria, `state/last-method.ts`); «Dejar pendiente» solo aparece cuando hay un miembro elegido. Nunca se envía precio. Idempotente: un UUID por intento (se renueva si cambia el carrito, el miembro o el método; un reintento igual no duplica). Sede: la activa; solo se pregunta si hay más de una. Tras vender, aviso verde breve, carrito vacío y sin miembro (la siguiente venta suele ser de otra persona).
- **Pendiente de cobro** (`sales`): en la ficha, bloque con el saldo y el detalle (productos × cantidad, día) solo si el miembro debe algo (`GET /members/{id}/pending-sales`). «Cobrar» abre una hoja con las ventas marcadas (se pueden desmarcar; se cobran enteras, todo o nada) y el método. `SALE_NOT_PENDING`/`NOTHING_TO_COLLECT` refrescan el bloque. La palabra «fiado» no se usa. No hay lista de compras recientes en la app.
- **Peso** (`body_tracking`): no está en la app (solo lo diario: buscar, vender, renovar, registrar). Se registra y consulta en la web.
- Mock: Atlas Fitness tiene ambos módulos; Titan Studio ninguno (para comprobar que no se ve nada).

### Puntos de extensión (sin conectar)

- El historial de correcciones (`GET …/amendments`, admin) existe en el API y no se usa en la app.

### Probar en el teléfono (Android, build de desarrollo) con `adb reverse`

1. Levantar el stack local: `atm-pulso-api/scripts/dev-all.sh start` (auth :3130, pulso-api :3001).
2. `.env` con `EXPO_PUBLIC_API_MODE=real` y las URLs `localhost` de arriba.
3. Teléfono con depuración USB (`adb devices`) y túneles:
   `adb reverse tcp:3001 tcp:3001 && adb reverse tcp:3130 tcp:3130 && adb reverse tcp:8081 tcp:8081`
   (se pierden si el USB se reconecta: hay que volver a crearlos).
4. Primera vez o tras agregar un módulo nativo: `ANDROID_HOME=~/Development/android-sdk npx expo run:android` (compila e instala `com.atmosferast.pulso`). Después basta `npx expo start` y abrir la app.
5. Empresa de pruebas local **Atmósfera Demo** (RUC 20611111117, activa en todos los sistemas): DNI `70000001` (admin) y `70000002` (recepcionista), clave `Demo-Atmosfera-2026`. Solo existe en local; en producción se crea a mano.

Sin teléfono: `npx expo start --web` y Chromium a 412 × 869. pulso-api y auth-api solo aceptan los orígenes web de desarrollo (CORS); para probar desde otro origen hay que interceptar las respuestas y añadir las cabeceras, o ampliar `ORIGINS` del script de desarrollo.

## Publicar

Las URLs de producción viven en las variables de entorno de EAS (entornos `production` y `preview`), no en `eas.json` ni en `.env`: así el build y `eas update` usan las mismas.

**Versiones** (`version` en `app.json`, MAYOR.MENOR.PARCHE). La versión que corre se ve en Perfil («Pulso · versión 1.0.3»).

| Qué se publica | Cómo sube la versión | Ejemplo |
|---|---|---|
| Actualización OTA (`eas update`) | PARCHE | 1.1.2 → 1.1.3 |
| Build a la tienda | MENOR, PARCHE a 0 | 1.1.2 → 1.2.0 |

El runtime lo calcula `app.config.ts` como MAYOR.MENOR.0: una OTA llega a todos los builds de su versión menor y nunca a uno con otro código nativo.

**Actualización OTA** (solo JS, estilos, textos, imágenes; llega al abrir la app, sin revisión de la tienda):

1. Subir PARCHE en `app.json`.
2. `npx eas-cli@latest update --channel production --environment production --message "…"`

Para probar antes, publicar en `--channel preview --environment preview` y abrir el APK de preview.

**Build a la tienda** (obligatorio si cambia algo nativo: un paquete con código nativo, `app.json` nativo — permisos, ícono, splash, plugins — o la versión del SDK):

1. Subir MENOR en `app.json` y poner PARCHE en 0. Olvidarlo puede mandar JS nuevo a un nativo viejo y romper la app de quien la tenga instalada.
2. Subir `android.versionCode` e `ios.buildNumber` (Play y App Store no aceptan repetidos).
3. `npx eas-cli@latest build --platform android --profile production --auto-submit` → track interno de Play con la llave guardada en EAS.

**R8 / ProGuard (desde 1.1.0):** `expo-build-properties` activa `enableMinifyInReleaseBuilds` y `enableShrinkResourcesInReleaseBuilds`. El `.aab` ya lleva el mapping (`BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map`) y los símbolos nativos, así que Play Console desofusca los fallos sin subir nada a mano. Si una librería nueva falla solo en release, se agrega su regla en `extraProguardRules` del mismo plugin.

**Versiones mínimas:** Android 10 (API 29, `expo-build-properties` → `android.minSdkVersion`) e iOS 18 (`ios.deploymentTarget`).

**Hardware opcional:** `plugins/with-optional-hardware.js` marca cámara y pantalla vertical como `required="false"`; si no, Play esconde la app en tablets, Chromebooks y equipos sin cámara.

**Permisos Android:** solo `CAMERA` (foto del comprobante). La galería usa el selector de fotos del sistema, sin permisos; `READ_MEDIA_*`, `READ/WRITE_EXTERNAL_STORAGE` y `RECORD_AUDIO` están en `android.blockedPermissions` para que Play no pida la declaración de fotos y videos.

**Probar un release en un celular sin tocar producción:** `EXPO_PUBLIC_PULSO_API_URL=http://localhost:3011/api/v1 npx expo prebuild -p android --clean`, agregar `android:usesCleartextTraffic="true"` al `<application>` del manifest generado (solo para esta prueba local), `cd android && ./gradlew :app:assembleRelease`, `adb reverse tcp:3011 tcp:3011 && adb reverse tcp:3130 tcp:3130` e instalar `app/build/outputs/apk/release/app-release.apk` (antes desinstalar la versión de Play: la firma es otra). Borrar `android/` al terminar.

**Tema:** uno solo, claro, teñido con el color del gimnasio. No hay modo oscuro a propósito.

## Referencias

Expo SDK 58: https://docs.expo.dev/versions/v58.0.0/ (Router: Stack, opciones de pantalla, `Stack.Protected`) y https://docs.expo.dev/llms.txt.

## Verificación de esta entrega

- `npx expo lint` y `npx tsc --noEmit`: sin errores.
- **Galaxy S10+ (Expo Go, adb reverse 3001/3130/8090, modo real)**: entrar como admin, sesión restaurada al reabrir la app (secure store), lista, ficha con periodos, «Llamar» (abre el marcador con el número; no se llamó), renovar (vigente, plan con y sin precios), alta con selector de plan (Baile, S/ 90 prellenado) y cierre de sesión.
- **Chromium 412 × 869 contra el stack real**: recepcionista (10000002), clave incorrecta, búsqueda con y sin resultados, filtro «Vencidos», documento repetido (409), error de red + «Reintentar», un `401` con refresh y reintento único, refresh rechazado (vuelve a la entrada con «Tu sesión expiró»), cambio de clave obligatorio (usuario de prueba creado desde el admin, con validación de clave débil), cierre de sesión, `409 MEMBERSHIP_OVERLAP` con «Empezar el …» y corrección de un periodo (`PATCH`).
- **Mock (web)**: escenarios «2 gyms» (selector de gimnasio, cambio de marca y de planes: Titan tiene dos planes) y «1 gym · 2 sedes».
- **No probado**: usuario real con varias empresas o varias sedes (requiere superadmin/consola; sin credenciales), WhatsApp (`wa.me`) en el teléfono, teclado y áreas seguras de iOS, build de producción (EAS). El Galaxy S10+ se probó con Expo Go, no con un build propio.
- Datos de prueba creados en la base local de desarrollo: el miembro «Prueba App Adriel» (DNI 45678912), renovaciones de «Lucía Prueba Kiosco» (72460666) y el usuario «Recepcion Cambio Clave» (DNI 10000077).

### Módulos: verificación (venta, pendiente, peso, modificar/renovar)

- Chromium 412 × 869 (Metro web :8090, `--disable-web-security` por CORS) contra el stack real, gimnasio Fuerza Uno: venta cobrada en efectivo (admin), venta pendiente a «Carlos Demo Medidas», cobro desde la ficha, peso 72.5 kg y lectura al tocar; con módulos apagados (`features={kiosk}`, recepcionista 10000002) no aparece «Vender» ni los bloques; `409 MEMBERSHIP_OVERLAP` con «Empezar el …» y modificar un periodo (1→6 meses) correctos con el contrato vigente.
- El Galaxy S10+ estaba bloqueado (pantalla de bloqueo): **no se probó en teléfono** en esta entrega.
- Datos creados en la base local: ventas demo (efectivo y pendiente cobrada), un peso de 72.5 kg y el periodo de Carlos Demo Medidas pasó a 6 meses.
