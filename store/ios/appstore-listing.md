# Ficha de App Store — Pulso Atmósfera

Valores para App Store Connect (los límites de Apple entre paréntesis). Las capturas están en `store/ios/screenshots/`.

## Información de la app

| Campo | Valor |
|---|---|
| Nombre (30) | Pulso Atmósfera |
| Subtítulo (30) | Miembros y ventas del gimnasio |
| Bundle ID | com.atmosferast.pulso |
| SKU | pulso |
| Idioma principal | Español |
| Categoría principal | Negocios (Business) |
| Categoría secundaria | Productividad |
| Precio | Gratis |
| Derechos de autor | 2026 Joel Joas Maldonado Fernández |
| URL de soporte | https://atmosferast.com/contact |
| URL de marketing (opcional) | https://atmosferast.com |
| URL de política de privacidad | https://atmosferast.com/privacy |

## Texto promocional (170)

Encuentra a un miembro, renueva su membresía y cobra una venta en segundos. La app de recepción de tu gimnasio, con lo que usas cada día.

## Palabras clave (100, sin espacios tras las comas, sin repetir el nombre)

gimnasio,gym,membresías,miembros,socios,recepción,ventas,cobros,renovar,fitness,suscripciones

## Descripción (4000)

Pulso es la app del personal de tu gimnasio. Está hecha para la recepción: rápida, clara y con solo lo que usas cada día.

• Encuentra a cualquier miembro por nombre, DNI o CE y mira al instante si está vigente, por vencer o vencido.
• Registra un miembro nuevo con su primera membresía en una sola pantalla. Con el DNI, el nombre se completa solo.
• Renueva una membresía en segundos: la duración, el precio y la fecha de inicio ya vienen sugeridos.
• Vende productos del gimnasio (batidos, agua, suplementos, accesorios) con búsqueda y categorías, y cobra en efectivo, Yape/Plin, tarjeta o transferencia.
• Adjunta una foto del comprobante cuando el pago es por Yape/Plin, tarjeta o transferencia.
• Llama o escribe por WhatsApp a un miembro desde su ficha.
• Los colores y el logo de tu gimnasio en toda la app.

Los reportes, pagos y la configuración del gimnasio se manejan desde la web de Pulso.

Pulso requiere una cuenta del personal creada por el administrador de tu gimnasio.

## Novedades de esta versión

Primera versión de Pulso para iPhone.

## Capturas (iPhone con Dynamic Island, pantalla mediana, 1206 × 2622)

4 JPEG sin canal alfa, con marco de iPhone: `1-miembros.jpg`, `2-ficha.jpg`, `3-renovar.jpg`, `4-venta.jpg`. Apple acepta de 1 a 10 por tamaño; los demás tamaños de iPhone se escalan desde estas. No hace falta iPad: la app es solo para iPhone.

## Componentes creativos (opcional, pestaña "Encabezado y resultados de la búsqueda")

- **Encabezado:** `store/ios/header-3840x1646.png` (21:9, PNG sin alfa). Zona segura de Apple: 1646 × 661 en x 1097, y 493; el logo y el nombre están dentro.
- **Resultados de la búsqueda:** `store/ios/search-results-3840x2560.png` (3:2, PNG sin alfa). Zona segura: 2168 × 1030 en x 836, y 765; el logo y el nombre están dentro.
- Esta pestaña no tiene campos de texto: solo se suben las imágenes. Estos componentes se aplican a iOS 27 o superior.
- Plantilla para regenerarlos: `store/source/creative.html` y `render-creative.mjs`.

## Información para la revisión de Apple

- **Se requiere inicio de sesión:** sí.
- **Usuario y contraseña:** los de la cuenta de revisión de AtmosFit (admin). No se guardan en el repo: pégalos directo en el formulario de Apple.
- **Notas (en inglés):**
```
Pulso is an app for gym staff. Sign in with the document number and password provided above (fields "Documento" and "Contraseña"), then tap "Entrar". No two-factor step is needed. The account is an administrator of a demo gym with sample members and products. Try: tap a member and "Renovar" to renew; "Nuevo miembro" to register one; "Venta rápida" to sell products. The app is in Spanish. Accounts are created by the gym administrator from the web console, so the app has no sign-up screen and therefore no in-app account deletion; deletion is requested by email at https://atmosferast.com/data-deletion.
```
- **Contacto de revisión:** tu nombre, teléfono y soporte@atmosferast.com.

## Clasificación por edad

Responde "Ninguno" a todo. Resultado esperado: **4+**.

## Privacidad de la app (App Privacy)

La app recoge datos y no rastrea al usuario (sin publicidad ni analítica). Para cada tipo: **vinculado a la identidad: sí**; **usado para rastrear: no**; finalidad: **Funcionalidad de la app**.

- **Información de contacto:** Nombre, Número de teléfono.
- **Identificadores:** ID de usuario (el número de documento).
- **Compras:** Historial de compras (membresías y ventas).
- **Contenido del usuario → Fotos o vídeos:** foto del comprobante de pago (opcional).

No marcar: ubicación, salud, contactos, mensajes, datos de uso, diagnósticos ni identificadores de publicidad.

## Otros

- **Cifrado de exportación:** `ITSAppUsesNonExemptEncryption = false` ya está en `app.json`.
- **Eliminación de cuenta (guía 5.1.1(v)):** no aplica, la app no permite crear cuentas; se explica en las notas.
- **Disponibilidad:** todos los países o solo Perú, a tu elección.
