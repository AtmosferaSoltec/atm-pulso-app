# Ficha de Google Play — Pulso

## Datos de la app

- **Nombre:** Pulso Atmósfera (15 de 30 caracteres). Mismo nombre en App Store, donde «Pulso» solo seguramente ya está tomado. El ícono en el teléfono sigue diciendo «Pulso» (viene de `app.json`).
- **Paquete:** com.atmosferast.pulso
- **Categoría:** Empresa (Business)
- **Tipo:** App, gratis
- **Correo de contacto:** soporte@atmosferast.com (verificar que reciba correo)
- **Política de privacidad:** https://atmosferast.com/privacy

## Descripción breve (máx. 80)

Miembros, membresías y ventas de tu gimnasio, en la palma de tu mano.

## Descripción completa (máx. 4000)

Pulso es la app del personal de tu gimnasio. Está hecha para la recepción: rápida, clara y con solo lo que usas cada día.

• Encuentra a cualquier miembro por nombre o DNI y mira al instante si está vigente, por vencer o vencido.
• Registra un miembro nuevo con su primera membresía en una sola pantalla. Con el DNI, el nombre se completa solo.
• Renueva una membresía en segundos: la duración, el precio y la fecha de inicio ya vienen sugeridos.
• Vende productos del gimnasio (agua, suplementos, accesorios) y cobra en efectivo, Yape/Plin, tarjeta o transferencia.
• Llama o escribe por WhatsApp a un miembro desde su ficha.
• Búsqueda y categorías para vender más rápido, con el total siempre a la vista.
• Los colores y el logo de tu gimnasio en toda la app.

Los reportes, pagos y la configuración del gimnasio se manejan desde la web de Pulso.

Pulso requiere una cuenta del personal creada por el administrador de tu gimnasio.

## Acceso a la app (para la revisión de Google)

La app pide inicio de sesión. Google necesita una cuenta de prueba **en producción**, de un gimnasio de demostración con algunos miembros y productos:

- Documento: (pendiente)
- Contraseña: (pendiente)
- Instrucciones: "Ingresa el documento y la contraseña en la pantalla inicial."

## Seguridad de los datos (Data safety)

- ¿Recopila o comparte datos? **Recopila: sí. Comparte: no.**
- Cifrado en tránsito: **sí** (HTTPS).
- ¿El usuario puede pedir que se borren sus datos? **Sí**, escribiendo al correo de contacto (las cuentas las crea el gimnasio; la app no permite crear cuentas).
- Tipos de datos recopilados (todos "necesarios para la funcionalidad de la app", no opcionales, sin publicidad ni analítica):
  - Información personal → **Nombre**, **Número de teléfono**, **Otra información** (número de documento): gestión de la cuenta y funcionalidad.
  - Información financiera → **Historial de compras**: funcionalidad (membresías y ventas del gimnasio).
  - Salud y actividad física → **Información de salud** (peso, solo si el gimnasio activa el módulo): funcionalidad.
  - Fotos y videos → **Fotos** (desde la 1.1.0): **opcional**, recopilada (no compartida), propósito **funcionalidad de la app**. Es la foto del comprobante de un pago por Yape/Plin, tarjeta o transferencia; el usuario decide tomarla o elegirla.
- Permisos (1.1.0): solo **Cámara** (`CAMERA`). La galería usa el selector de fotos del sistema, así que no se piden permisos de almacenamiento ni de fotos (`READ_MEDIA_*` y `READ/WRITE_EXTERNAL_STORAGE` bloqueados en `app.json`) y **no hace falta** llenar la declaración de «Permisos de fotos y videos» de Play.

## Clasificación de contenido

Cuestionario IARC: app de utilidad/empresa, sin violencia, sexo, lenguaje, drogas, apuestas ni interacción entre usuarios. Resultado esperado: **Todos / PEGI 3**.

## Público objetivo

Mayores de 18 años (personal de gimnasios). No dirigida a niños.

## Recursos gráficos

- Ícono 512 × 512 (PNG, máx. 1 MB): `store/icon-512.png`
- Gráfico de funciones 1024 × 500 (máx. 15 MB): `store/feature-graphic.png`
- Capturas de teléfono (2 a 8; usamos 4 de 1080 × 1920): `store/screenshots/` — 1-miembros, 2-ficha, 3-renovar, 4-venta. Son pantallas reales de la app con titular y marco de teléfono.
- Plantilla para regenerarlas (también sirve para iOS cambiando el tamaño): `store/source/` (`cap2.mjs` captura la app en modo mock, `slide.html` + `render.mjs` componen las piezas).
- **Tablets y plegables: se omiten.** La app es solo para celular en vertical; son opcionales en Play y no bloquean la publicación.
