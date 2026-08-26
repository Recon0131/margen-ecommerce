# MARGEN — Especificación de diseño técnico

**Fecha:** 26 de agosto de 2026  
**Estado:** diseño aprobado para revisión escrita  
**Ámbito:** e-commerce de accesorios tecnológicos para Perú, con precios en soles peruanos (PEN)

## 1. Resumen

MARGEN es una tienda de accesorios tecnológicos con una experiencia editorial, sobria y utilitaria. El proyecto debe demostrar en un portafolio la integración entre catálogo, carrito, inventario, órdenes, pagos y comprobantes, manteniendo límites claros para que pueda evolucionar hacia una operación real.

La aplicación será un monolito modular TypeScript: Next.js para la tienda y NestJS sobre Fastify para la API de dominio. PostgreSQL será la fuente de verdad de catálogo comercial, precios, impuestos, órdenes e inventario. Redis y una cola se usarán solo para reservas temporales, webhooks y tareas que no deban bloquear una petición.

La API pública DummyJSON se consumirá como fuente de demostración para poblar o sincronizar el catálogo inicial. Nunca será la fuente de verdad de precios, stock, pagos o pedidos.

## 2. Objetivos y límites

### Objetivos

- Mostrar un catálogo de accesorios tecnológicos con búsqueda, categorías, filtros y paginación.
- Permitir compra como invitado y cuenta opcional para consultar órdenes y documentos.
- Recalcular en servidor precio, descuentos, impuestos, moneda y stock.
- Reservar inventario atómicamente durante el checkout.
- Integrar Mercado Pago Checkout Pro en modo de pruebas para Perú.
- Generar un PDF de comprobante desde una orden pagada y dejar un adaptador preparado para un PSE/SUNAT.
- Ofrecer un panel administrativo para productos, stock, órdenes, pagos y documentos.
- Convertir los controles del documento de seguridad adjunto en requisitos verificables.

### No objetivos del primer ciclo

- Marketplace, multi-tenant, múltiples almacenes o suscripciones.
- Envío calculado por transportista externo.
- Almacenamiento o procesamiento de números de tarjeta, CVV o bandas magnéticas.
- Afirmar que un PDF local es un comprobante fiscal válido sin una integración autorizada.
- Microservicios independientes antes de que exista una necesidad operativa demostrable.

## 3. Identidad y experiencia

### Marca

**MARGEN** representa tecnología que ordena el espacio de trabajo sin llamar la atención sobre sí misma. La voz es directa: descripciones concretas, medidas, compatibilidad, garantía y disponibilidad. No se usarán frases de marketing genéricas ni contenido de relleno.

### Dirección visual

- Escena de referencia: una persona compara accesorios en un escritorio ordenado, con luz natural lateral y busca decidir rápido sin ruido visual.
- Fondo neutro casi blanco de croma mínima; tinta grafito; un único azul grisáceo desaturado para acciones y estados informativos.
- Geist Sans para interfaz, datos y botones; Newsreader solo para titulares editoriales de marca.
- Índice de productos asimétrico: un producto destacado, filas compactas y espacios de lectura; no una matriz uniforme de tarjetas.
- Bordes de 1 px, radios de 8–12 px, sombras imperceptibles y sin degradados.
- Espaciado amplio entre secciones, contenido limitado a aproximadamente 65–75 caracteres por línea en textos de lectura.
- Movimiento de 150–250 ms para estados y feedback; soporte obligatorio para `prefers-reduced-motion`.
- Cada control tendrá estados por defecto, hover, foco visible, activo, deshabilitado, carga y error.

### Rutas de la tienda

- `/` — entrada editorial, selección de productos y categorías.
- `/catalogo` — búsqueda, filtros, ordenamiento y paginación.
- `/producto/[slug]` — detalle, especificaciones, compatibilidad, stock y garantía.
- `/carrito` — líneas, cantidades, reserva informativa y resumen recalculable.
- `/checkout` — datos de entrega y selección de comprobante; pago en Mercado Pago.
- `/pedido/[id]` — estado de la orden y acceso controlado al documento.
- `/cuenta` — órdenes, direcciones y documentos del propietario.
- `/admin` — operaciones protegidas por RBAC y MFA.

## 4. Arquitectura y límites de módulos

El repositorio será un monorepo con aplicaciones y paquetes separados, pero se desplegará inicialmente como una unidad coordinada.

### Aplicaciones

- `apps/storefront`: Next.js, renderizado de catálogo, formularios, accesibilidad y consumo de la API propia.
- `apps/api`: NestJS/Fastify, autenticación, autorización, validación, casos de uso y webhooks.
- `apps/worker`: consumidor de BullMQ para expiración de reservas, webhooks, emisión de documentos y tareas de sincronización.

### Paquetes

- `packages/domain`: tipos, estados, reglas de dinero y transiciones.
- `packages/contracts`: esquemas versionados de entrada/salida y eventos.
- `packages/ui`: componentes visuales y tokens de MARGEN.
- `packages/config`: configuración validada por ambiente sin secretos en código.

### Módulos de dominio

- **Catalog:** productos, categorías, variantes, imágenes, SKU y publicación.
- **Pricing:** precios enteros en céntimos de PEN, descuentos e impuestos configurables.
- **Cart:** carrito anónimo o autenticado, cantidades y expiración.
- **Orders:** creación, transiciones, snapshot comercial y cancelaciones.
- **Inventory:** existencias, reservas TTL, movimientos y límites de compra.
- **Payments:** adaptador Mercado Pago, idempotencia, estados y reembolsos.
- **Billing:** documentos, numeración, PDF, notas de crédito y adaptador fiscal.
- **Identity:** clientes, sesiones, roles, MFA y recuperación.
- **Admin/Audit:** operaciones permitidas, historial y auditoría protegida.

Cada módulo expone casos de uso y contratos; ningún controlador modifica directamente tablas de otro módulo.

## 5. Modelo de datos mínimo

- `Product`: `id` ULID, slug, nombre, descripción de texto, categoría, SKU, imágenes permitidas, precio en céntimos, moneda, garantía, estado de publicación y timestamps.
- `ProductVariant`: producto, atributos permitidos, SKU único, precio y stock independiente cuando exista una variante.
- `Category`: slug, nombre visible y estado.
- `Cart` / `CartLine`: propietario anónimo o cliente, SKU, cantidad, expiración y timestamps.
- `InventoryItem`: SKU, `onHand`, `reserved`, `available` derivado y versión para concurrencia.
- `InventoryMovement`: actor/servicio, motivo, cantidad anterior/nueva, orden, correlation ID y timestamp UTC.
- `StockReservation`: SKU, cantidad, carrito/orden, TTL, estado y clave única.
- `Order` / `OrderLine`: identificador público ULID, snapshot de producto/precio/impuesto, moneda, totales exactos, comprador, dirección fiscal y estado.
- `PaymentAttempt`: proveedor, referencia externa, importe, moneda, estado, clave de idempotencia y timestamps.
- `WebhookEvent`: proveedor, ID externo único, firma verificada, payload mínimo necesario, resultado y timestamps.
- `Invoice`: serie, número, tipo (`BOLETA` o `FACTURA`), estado fiscal, snapshot, storage key privada y hash de contenido.
- `CreditNote`: documento original, motivo, importe y referencia de devolución.
- `User`, `Session`, `Role`, `AuditEvent`: identidad y control de acceso.

Restricciones: cantidades positivas y acotadas, dinero exacto, SKU único, relaciones obligatorias, estados válidos y no reutilización de numeración.

## 6. Flujos críticos

### Catálogo

1. Un job o comando de sincronización consulta solo `https://dummyjson.com` mediante un adaptador permitido.
2. Se valida el esquema, se normaliza Unicode y se descartan campos desconocidos.
3. Se mapean categorías y se asignan SKU/precios PEN internos.
4. La tienda lee PostgreSQL; si el upstream falla, sirve el último catálogo válido.

Las operaciones de escritura de DummyJSON se tratan como simulaciones y no se usan para administrar inventario.

### Checkout e inventario

1. El cliente envía SKU y cantidad, nunca precio ni impuesto.
2. La API valida límites y vuelve a consultar el catálogo interno.
3. Una transacción bloquea las filas necesarias, comprueba disponibilidad y crea una reserva TTL de 10–15 minutos.
4. Se crea la orden en `pending_payment` con snapshot inmutable.
5. Un reintento con la misma clave devuelve el mismo resultado.
6. Pago confirmado consume la reserva; fallo, cancelación o expiración la libera.

### Máquina de estados de orden

`created → pending_payment → paid → fulfilled → shipped → delivered`

Estados laterales explícitos: `expired`, `cancelled`, `payment_failed`, `partially_refunded`, `refunded` y `chargeback`. Toda transición se valida en el dominio; una URL de retorno no puede marcar una orden como pagada.

### Pago

1. La API crea una preferencia/orden de Mercado Pago a partir de la orden persistida.
2. Envía solo referencia, ítems y metadatos mínimos; nunca datos de tarjeta.
3. El navegador es redirigido a Checkout Pro.
4. El webhook verifica cuerpo crudo, firma, timestamp, ID único y replay antes de encolar trabajo.
5. El worker consulta o valida el pago en Mercado Pago y confirma importe, moneda, orden y estado.

### Comprobante

1. Solo una orden `paid` puede generar documento.
2. Se congela el snapshot de productos, precios, impuestos, comprador y dirección fiscal.
3. Se asigna serie/número dentro de una transacción sin reutilización.
4. El PDF se genera con una plantilla controlada por servidor, se escapa por contexto y se guarda en storage privado con nombre aleatorio.
5. En modo demo el documento se etiqueta como vista previa no fiscal; en producción el adaptador PSE/SUNAT debe devolver aceptación o rechazo antes de mostrarlo como emitido.

## 7. Contratos API iniciales

Públicos:

- `GET /v1/catalog/products`
- `GET /v1/catalog/products/:slug`
- `GET /v1/catalog/categories`
- `POST /v1/carts` y `PATCH /v1/carts/:id/lines`
- `POST /v1/orders/quote`
- `POST /v1/orders`
- `GET /v1/orders/:id`
- `POST /v1/payments/:orderId/checkout`
- `GET /v1/invoices/:id/download`

Administrativos:

- `POST/PATCH /v1/admin/products`
- `POST /v1/admin/inventory/adjustments`
- `GET /v1/admin/orders`
- `POST /v1/admin/orders/:id/refunds`
- `GET /v1/admin/invoices`
- `POST /v1/webhooks/mercadopago`

Todos los cuerpos tienen esquema versionado, límite de tamaño (100 KB como máximo para JSON público y límites menores por endpoint), tipos estrictos, listas permitidas y rechazo de propiedades desconocidas en comandos sensibles. Se rechazan parámetros repetidos ambiguos y prototipos controlados por el usuario. Respuestas de error no exponen stack traces, queries, rutas internas ni secretos.

## 8. Seguridad obligatoria

- Node.js LTS, TypeScript estricto cuando sea compatible y dependencias fijadas mediante lockfile.
- Validación sintáctica, semántica y de canonicalización en servidor; no listas negras de cadenas.
- Consultas parametrizadas/ORM; prohibidos `eval`, `new Function`, ejecución de comandos con input y plantillas no controladas.
- CSP restrictiva, `nosniff`, Referrer-Policy, Permissions-Policy, protección contra framing, TLS y CORS explícito.
- Sesiones opacas con cookies `Secure`, `HttpOnly`, `SameSite` apropiado, rotación tras login y expiración; CSRF y comprobación de `Origin`/`Referer` en mutaciones.
- Argon2id con parámetros iniciales alineados con OWASP; MFA obligatorio para administración, pagos, facturación y reembolsos.
- Respuestas indistinguibles para login/registro/recuperación; rate limits por IP, cuenta, dispositivo y ruta.
- RBAC/ABAC con denegación por defecto y autorización por objeto.
- Precios, impuestos, stock, permisos y estados recalculados en servidor.
- Reservas atómicas, idempotencia y pruebas de concurrencia para inventario, pagos y reembolsos.
- URLs de backend restringidas a destinos permitidos, con bloqueo de rangos privados, redirecciones controladas y límites de timeout para evitar SSRF.
- No se aceptan uploads en el primer ciclo; si se habilitan después, se exigirán extensión/MIME detectado, tamaño, nombre aleatorio, storage privado e inspección.
- Secretos en gestor dedicado; ambientes y credenciales separados; ningún secreto en Git, frontend, imágenes o logs.
- PDFs privados, URLs firmadas de corta duración, `Content-Disposition: attachment` y `X-Content-Type-Options: nosniff`.
- Logs con actor, acción, recurso, resultado, severidad, timestamp UTC y correlation ID, pero sin contraseñas, tokens, cookies, headers de autorización, tarjetas ni payloads con PII innecesaria.
- CI con lint, typecheck, pruebas, SAST/DAST de staging, SCA, secret scanning y pruebas específicas de webhooks/autorización.

## 9. Fases de implementación

### Fase 0 — Producto y diseño

Entregables: tokens visuales, rutas, wireframes, contratos iniciales, estados de orden, mapa de roles y catálogo curado.

### Fase 1 — Fundación segura

Entregables: monorepo, aplicaciones, configuración por ambiente, base de datos, migraciones, health check, CI y headers de seguridad.

### Fase 2 — Catálogo

Entregables: adaptador DummyJSON, sincronización validada, caché, catálogo interno, búsqueda, filtros y detalle.

### Fase 3 — Carrito, órdenes e inventario

Entregables: cotización server-side, reserva TTL, transacciones, movimientos, estados y pruebas de sobreventa/idempotencia.

### Fase 4 — Identidad y administración

Entregables: invitado/cuenta, sesiones, Argon2id, MFA admin, RBAC, panel y auditoría.

### Fase 5 — Mercado Pago

Entregables: Checkout Pro de prueba, claves separadas, idempotencia, webhook validado, reembolsos y estados asincrónicos.

### Fase 6 — Facturación

Entregables: snapshot fiscal, boleta/factura, cálculo exacto configurable, PDF privado, notas de crédito y adaptador PSE/SUNAT.

### Fase 7 — Endurecimiento y demo de portafolio

Entregables: DAST, carga, revisión manual, backups/restauración, observabilidad, README, diagrama y recorrido de demo completo.

## 10. Estrategia de pruebas

- Unitarias: dinero, redondeo, descuentos, transiciones y autorización.
- Integración: transacciones de stock, expiración, Prisma, colas y storage.
- Contrato: esquemas de cada endpoint y payloads del proveedor.
- Seguridad: campos desconocidos, tamaños, HPP, CSRF, SSRF, XSS contextual, IDOR, rate limits y secretos.
- Concurrencia: dos compras del último SKU, reintentos de checkout, doble webhook y doble reembolso.
- Pagos: firma inválida, replay, importe/moneda discordantes, pendiente, rechazo, contracargo y reembolso parcial.
- Documentos: sumas de líneas, IGV configurable, numeración, acceso cruzado y corrupción de PDF.
- UI: teclado, lector de pantalla, contraste, responsive y reducción de movimiento.
- Preproducción: SAST, SCA, DAST y prueba de restauración de backup.

## 11. Criterios de aceptación

- Ninguna orden puede usar precio, impuesto, stock o permiso originado únicamente en el cliente.
- No se almacenan datos de tarjeta y el pago solo se confirma por webhook/consulta confiable.
- No existe sobreventa bajo solicitudes concurrentes ni duplicación con reintentos.
- Un cliente no puede acceder a órdenes, direcciones o facturas ajenas cambiando un ID.
- Las facturas y notas son inmutables, privadas, auditables y claramente diferenciadas entre demo y emisión fiscal.
- CI bloquea cambios con errores de tipos, vulnerabilidades críticas conocidas o secretos detectados.
- El recorrido de demo funciona: catálogo → carrito → reserva → checkout de prueba → webhook → orden pagada → comprobante → movimiento visible en admin.

## 12. Decisiones de producción pendientes de validación externa

Antes de una operación real se deben confirmar con un asesor tributario y proveedores: régimen/RUC, tasa y tratamiento del IGV, series, PSE/SUNAT, política de retención de datos, transportista, SLA, RTO/RPO, presupuesto de monitoreo y alcance PCI/SAQ de la integración elegida.

## Referencias

- [DummyJSON Products API](https://dummyjson.com/docs/products)
- [Mercado Pago Checkout Pro para Perú](https://www.mercadopago.com.pe/developers/es/docs/checkout-pro-preferences/overview)
- [Mercado Pago: crear una preferencia](https://www.mercadopago.com.pe/developers/es/docs/checkout-pro/create-payment-preference)
- [SUNAT: tipos de comprobantes electrónicos](https://cpe.sunat.gob.pe/tipos_de_comprobantes/factura)
- [SUNAT: Sistema de Emisión SOL](https://cpe.sunat.gob.pe/sistema_emision/see_sol)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
