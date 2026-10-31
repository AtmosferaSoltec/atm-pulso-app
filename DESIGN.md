# Pulso · Cada miembro, más cerca

Maqueta móvil interna para administradores y recepcionistas. Solo miembros y suscripciones. No hay backend, autenticación real, persistencia ni envío de mensajes. Los formularios terminan en confirmaciones de **vista previa**, nunca simulan un guardado real. Sin commits ni proyectos nativos generados.

## Pantallas y acción principal

| Pantalla | Acción principal |
| --- | --- |
| Bienvenida `(auth)/login` | Explorar la maqueta |
| Buscar `(staff)/(tabs)/index` | Encontrar por nombre, DNI o CE |
| Miembros `(staff)/(tabs)/members` | Filtrar y abrir una ficha |
| Ficha `members/[id]` | Renovar, con días restantes protagonistas |
| Alta `members/new` | Datos del miembro → primera suscripción |
| Suscripción `members/[id]/renew` | Revisar renovación, nueva suscripción o modificación |
| Perfil | Consultar identidad, tema y cerrar sesión |

Se retiraron resumen, KPIs, pagos/boletas, acceso y teclado numérico, pases del día y su capa mock. Solo existen roles `admin` y `receptionist`. Los únicos grupos de rutas son `(auth)` y `(staff)`; el índice raíz redirige.

## Diseño

Manrope en tres pesos, títulos con carácter y cifras grandes; Ionicons como único set. Identidad del gimnasio mediante logo opcional o monograma inclinado. Paleta derivada de `brand_color`: fondo, bordes, superficies, acentos y gradientes; estados semánticos diferenciados y dos bases explícitas de claro/oscuro. No depende solo del color: cada estado tiene una etiqueta.

Inicio sin métricas: buscador amplio, tarjetas horizontales por vencer y alta fija junto al pulgar. Directorio virtualizado con FlatList y filas abiertas, sin tarjetas grises repetidas. Ficha con anillo de estado, días restantes, progreso temporal y línea de tiempo expandible con duración, fechas, monto, método y sede cuando corresponde. Acciones Llamar y WhatsApp son únicamente demostrativas.

Transiciones de Router, entradas escalonadas y expansión con Reanimated; shimmer con movimiento reducido; háptica discreta en botones. Hojas inferiores con arrastre desde el tirador, cierre accesible y adaptación al teclado. Áreas interactivas de 44 px o más. Pull to refresh, estados vacíos, error recuperable y confirmación de salida.

## Visibilidad y escenarios

`src/state/session.tsx` deriva una sola política `visibility`:

- `hasMultipleGyms`: más de un gimnasio autorizado; habilita cambiar marca.
- `hasMultipleBranches`: más de una sede en el gimnasio; permite mostrar datos de sede en ficha/formularios.
- `canSelectBranch`: más de una sede **asignada al usuario**; habilita selector de sede activa.

Con un gym y una sede no hay etiquetas ni selector de sede o gym, solo identidad de marca. El Grupo nunca se presenta. Los selectores únicamente ofrecen opciones autorizadas. Cambiar gimnasio actualiza identidad, paleta, sede y miembros; las consultas no mantienen datos del contexto anterior mientras cargan.

Ejecutar `npx expo start`, entrar con **Explorar maqueta**, abrir **Perfil → Laboratorio de diseño** (solo `__DEV__`):

1. **Un gimnasio, una sede** (predeterminado): Atlas Fitness, administrador.
2. **Un gimnasio, varias sedes**: administrador con Miraflores y San Isidro; selector en el encabezado.
3. **Varias marcas**: recepcionista con Atlas Fitness y Titan Studio; cada gimnasio tiene dos sedes, solo una asignada. No aparece selector de sede; sí datos de sede y cambio de marca. Cada marca tiene miembros distintos.

El laboratorio también permite previsualizar directorio vacío y error. Reintentar restablece datos; actualizar muestra carga con shimmer.

## Estructura

- `src/app/`: exclusivamente rutas y layouts.
- `src/components/`: identidad, directorio, editor de suscripción y componentes UI.
- `src/hooks/queries.ts`: acceso a contratos de datos; `use-async.ts` cancela resultados obsoletos.
- `src/services/types.ts`: interfaces por dominio (sesión, miembros) y modelos de presentación.
- `src/services/index.ts`: único punto de composición.
- `src/services/mock/`: único adaptador mock, datos y latencia. Nunca importado por pantallas.
- `src/types/`: contratos de dominio alineados con OpenAPI.
- `src/state/`: sesión demostrativa y política de visibilidad.
- `src/theme/`: paletas, colores, escala y preferencia de tema.
- `src/lib/format.ts`: formatos y suma de meses para vista previa.

## Reglas de formulario

DNI: 8 dígitos; CE: 9–12; teléfono: 9 dígitos empezando por 9; sin correo. Duración: entero 1–24 meses. Monto positivo con hasta dos decimales; dinero contractual como string. Fechas ISO `YYYY-MM-DD`, con inicio futuro permitido y fin de solo lectura (meses calendario, ajustado al último día). Renovación propone el fin vigente o hoy; nueva suscripción propone hoy; edición precarga la seleccionada. Los estados y días son valores del adaptador, no se recalculan en pantallas. Solo el progreso visual representa el tiempo transcurrido.

## Conectar lo real después

Implementar las interfaces en un adaptador HTTP y sustituirlo en `services/index.ts`. Integrar sesión y empresas autorizadas desde el proveedor de identidad, sin deducir permisos del catálogo global. Aplicar límites por gimnasio y sedes también en servidor; el mock no constituye control de acceso de producción. Los IDs de maqueta son legibles, no UUID de producción.

El contrato leído en `../atm-pulso-api/docs/openapi.yaml` ofrece `MembershipView` sin método ni sede de cobro. `Subscription` es un enriquecimiento **de presentación** separado: un adaptador real deberá obtener esos datos de los recibos o de una ampliación acordada del contrato. No se modificó la API. El contrato actual tampoco ofrece modificación de suscripción: el editor solo diseña el flujo; se debe acordar ese endpoint antes de conectar escrituras. No se inventaron endpoints ni se añadieron llamadas de red.

Las confirmaciones actuales no invocan mutaciones. Al integrar altas/renovaciones/edición, convertir los valores validados al contrato (`amount` con dos decimales), implementar errores de dominio, idempotencia y actualización de consultas mediante hooks. El servidor conserva autoridad sobre estados, fechas finales y días restantes.

## Referencias consultadas

Expo SDK 58: https://docs.expo.dev/versions/v58.0.0/ y https://docs.expo.dev/llms.txt. Documentación versionada de Font, Haptics, LinearGradient y Reanimated; Router Stack; documentación oficial de Reanimated y React Native PanResponder. Dependencias agregadas exclusivamente con `npx expo install`.

## Verificación de esta entrega

- `npx expo lint`: sin errores ni advertencias.
- `npx tsc --noEmit`: sin errores.
- `npx expo export --platform web --output-dir /tmp/pulso-design-export`: compilación correcta.
- Chromium con viewport móvil (390 × 844 y 320 × 740): búsqueda por DNI, ficha, renovación, alta, confirmaciones, cambio de sede, aislamiento de marcas, recepcionista restringido, tema oscuro, vacío, error y reintento. Sin errores JavaScript en esos recorridos.
- Vista previa de meses: `2027-01-31` + 1 mes → `2027-02-28` comprobada en el formulario.
- Sin prueba en dispositivo físico iOS/Android: pendientes tacto/háptica, teclado nativo, arrastre y comportamiento de áreas seguras reales. La comprobación web no sustituye esa revisión.
