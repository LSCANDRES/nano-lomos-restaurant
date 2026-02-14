# Feature Specification: Sistema de Gestión de Restaurante

**Feature Branch**: `001-restaurant-system`  
**Created**: 2026-02-08  
**Last Updated**: 2026-02-09 (Analysis corrections applied)  
**Status**: Ready for Implementation  
**Input**: Sistema interno para gestión de pedidos, cocina, recaudación y control de inventario para negocio de comida

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Gestión de Cola de Pedidos (Priority: P1)

Como tomador de pedidos, necesito registrar nuevos pedidos de clientes seleccionando items del menú, para que los pedidos entren en la cola de cocina y pueda cobrar correctamente a cada cliente.

**Why this priority**: Es la funcionalidad core del sistema. Sin la capacidad de registrar pedidos, el restaurante no puede operar. Esta historia entrega valor inmediato permitiendo digitalizar el proceso de toma de pedidos.

**Independent Test**: Se puede probar completamente creando un pedido con items del menú, verificando que aparece en la cola con estado pendiente y mostrando el monto total correcto para cobrar.

**Acceptance Scenarios**:

1. **Given** el empleado tiene acceso al menú de items, **When** selecciona varios items y crea un pedido, **Then** el sistema calcula el total automáticamente y agrega el pedido a la cola con estado "Pendiente"
2. **Given** existen múltiples pedidos en el sistema, **When** el tomador de pedidos consulta la lista, **Then** puede ver todos los pedidos con sus estados y montos respectivos
3. **Given** un cliente solicita su cuenta, **When** el tomador busca el pedido, **Then** puede ver el detalle completo de items y el monto total a cobrar

---

### User Story 2 - Gestión de Cocina y Asignación de Pedidos (Priority: P1)

Como cocinero, necesito ver qué pedido tengo asignado actualmente, poder marcarlo como completado cuando termino, y recibir automáticamente el siguiente pedido, para trabajar de manera organizada y eficiente.

**Why this priority**: Es crítico para el flujo operativo. Sin esta funcionalidad, no hay forma organizada de distribuir el trabajo entre cocineros, lo que genera caos y retrasos.

**Independent Test**: Se puede probar asignando un pedido a un cocinero, permitiéndole ver el detalle, marcar como en proceso y finalmente como completado, verificando que recibe el siguiente pedido automáticamente.

**Acceptance Scenarios**:

1. **Given** hay pedidos pendientes en la cola, **When** un cocinero inicia sesión o marca un pedido como completado, **Then** el sistema le asigna automáticamente el siguiente pedido disponible
2. **Given** un cocinero tiene un pedido asignado, **When** marca el pedido como completado, **Then** el sistema registra el tiempo de preparación y actualiza el estado del pedido a "Completado"
3. **Given** un cocinero está trabajando, **When** consulta su panel, **Then** ve cuántos pedidos ha completado en su turno actual

---

### User Story 3 - Dashboard de Supervisión Gerencial (Priority: P2)

Como gerente, necesito ver un dashboard con estadísticas en tiempo real de pedidos, asignaciones de cocineros, tiempos de demora y recaudación acumulada, para supervisar las operaciones y tomar decisiones informadas.

**Why this priority**: Importante para supervisión y optimización, pero el sistema puede operar sin esta visualización inicialmente. Los cocineros y tomadores de pedidos pueden trabajar sin el dashboard.

**Independent Test**: Se puede probar procesando varios pedidos en el sistema y verificando que el dashboard muestre correctamente todas las métricas: cantidad de pedidos por estado, asignaciones actuales, tiempos promedio y recaudación total.

**Acceptance Scenarios**:

1. **Given** hay pedidos en diferentes estados (pendientes, en proceso, completados), **When** el gerente accede al dashboard, **Then** ve la cantidad total de pedidos agrupados por estado
2. **Given** varios cocineros tienen pedidos asignados, **When** el gerente consulta asignaciones, **Then** ve qué cocinero tiene cada pedido y cuánto tiempo lleva en proceso
3. **Given** hay pedidos completados durante el día, **When** el gerente revisa la sección de recaudación, **Then** ve el total acumulado actualizado en tiempo real
4. **Given** existen pedidos con diferentes tiempos de preparación, **When** el gerente revisa métricas de tiempo, **Then** puede ver tiempo promedio de preparación y pedidos con mayor demora

---

### User Story 4 - Control de Inventario y Materia Prima (Priority: P3)

Como gerente, necesito ver qué materia prima se consumió basándose en los pedidos procesados y generar una lista de compras para el día siguiente, para optimizar el abastecimiento y evitar faltantes.

**Why this priority**: Es una optimización valiosa pero no crítica para operaciones diarias. Inicialmente se puede gestionar manualmente. Se implementa después de tener el flujo básico funcionando.

**Independent Test**: Se puede probar configurando ingredientes para cada item del menú, procesando varios pedidos, y verificando que el sistema calcule correctamente el consumo total de cada ingrediente y sugiera cantidades de compra.

**Acceptance Scenarios**:

1. **Given** cada item del menú tiene ingredientes asociados con cantidades, **When** se procesan pedidos durante el día, **Then** el sistema calcula automáticamente cuánto de cada ingrediente se consumió
2. **Given** hay un nivel de stock mínimo configurado para cada ingrediente, **When** el gerente consulta el reporte de inventario, **Then** ve qué ingredientes están por debajo del mínimo requerido
3. **Given** se procesaron múltiples pedidos en el día, **When** el gerente genera el reporte de compras, **Then** obtiene una lista con ingredientes y cantidades sugeridas para comprar según el patrón de consumo

### Edge Cases

#### Resueltos en Especificación:

- ✅ **¿Qué sucede cuando hay múltiples cocineros disponibles simultáneamente?** 
  - **Resolución**: Algoritmo FIFO - primer cocinero disponible recibe el siguiente pedido (FR-006)

- ✅ **¿Qué ocurre si un cocinero cierra sesión o se desconecta con un pedido asignado?**
  - **Resolución**: El pedido permanece asignado al cocinero. Los tomadores de pedidos pueden actualizar el estado del pedido o reasignar manualmente a otro cocinero según necesidad (FR-006A, FR-006B). Los cocineros no necesitan estar logueados para trabajar.

- ✅ **¿Cómo se manejan modificaciones especiales en pedidos?**
  - **Resolución**: Campo `notes` en `order_lines` permite especificar modificaciones como "sin cebolla", "extra queso" (ver data-model.md)

#### Edge Cases - Post-MVP (No implementar en versión inicial):

- ⚠️ **¿Cómo maneja el sistema un pedido cancelado después de ser asignado a un cocinero?** - Funcionalidad de cancelación no incluida en MVP

- ⚠️ **¿Necesita un estado "Listo para entregar" si el pedido está completado pero no retirado?** - Estado "Completado" es suficiente para MVP, consideración futura

- ⚠️ **¿Cómo se gestionan pedidos con items que no están disponibles?** - FR-024 previene creación si hay stock insuficiente; deshabilitar items manualmente via `menu_items.active = false`

- ⚠️ **¿Qué pasa si dos tomadores de pedidos crean pedidos para la misma mesa simultáneamente?** - No hay validación de mesa única en MVP; consideración futura con locks optimistas

- ⚠️ **¿Cómo se resuelve cuando un ingrediente se agota a mitad del día con pedidos pendientes?** - Alertas de stock bajo (FR-022); gerente debe deshabilitar items afectados manualmente

- ⚠️ **¿Qué sucede al cambio de turno con estadísticas de cocineros?** - Estadísticas se acumulan por día completo; reset manual no implementado en MVP

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

**Gestión de Pedidos:**
- **FR-001**: El sistema DEBE permitir crear pedidos con múltiples items del menú
- **FR-002**: El sistema DEBE calcular automáticamente el monto total de cada pedido sumando precios de items
- **FR-003**: El sistema DEBE mantener una cola de pedidos con estados: Pendiente, Asignado, En Proceso, Completado
- **FR-004**: El sistema DEBE registrar timestamp de creación para calcular tiempos de espera
- **FR-005**: Los usuarios DEBEN poder buscar y visualizar pedidos específicos por identificador o mesa

**Gestión de Cocina:**
- **FR-006**: El sistema DEBE asignar pedidos automáticamente a cocineros cuando quedan disponibles usando algoritmo FIFO (First-In-First-Out): el pedido pendiente más antiguo se asigna al primer cocinero disponible
- **FR-006A**: Los tomadores de pedidos DEBEN poder asignar manualmente pedidos a cocineros específicos sin requerir que el cocinero esté logueado, para casos donde los cocineros tienen manos sucias o no usan el sistema directamente
- **FR-006B**: Los tomadores de pedidos DEBEN poder actualizar el estado de pedidos asignados a cocineros (marcar como "En Proceso" o "Completado") actuando en representación del cocinero
- **FR-007**: Los cocineros DEBEN poder ver únicamente su pedido asignado actual con detalle completo de items
- **FR-008**: Los cocineros DEBEN poder marcar pedidos como "En Proceso" y "Completado"
- **FR-009**: El sistema DEBE registrar qué cocinero preparó cada pedido y el tiempo de preparación
- **FR-010**: Los cocineros DEBEN poder ver contador de pedidos completados en su turno

**Control de Gerencia:**
- **FR-011**: El gerente DEBE poder ver todos los pedidos activos agrupados por estado
- **FR-012**: El gerente DEBE poder ver asignaciones actuales: qué cocinero tiene cada pedido
- **FR-013**: El sistema DEBE calcular y mostrar tiempo de demora de cada pedido (tiempo desde creación hasta completado)
- **FR-014**: El sistema DEBE calcular recaudación total del día basada en pedidos completados
- **FR-015**: El gerente DEBE poder ver estadísticas de productividad: pedidos por cocinero, tiempo promedio de preparación

**Gestión de Menú:**
- **FR-016**: El sistema DEBE mantener un catálogo de menú con items, descripciones y precios
- **FR-017**: Cada item del menú DEBE tener asociados ingredientes necesarios con sus cantidades
- **FR-018**: El menú DEBE poder actualizarse (precios, disponibilidad) sin afectar pedidos ya creados

**Control de Inventario:**
- **FR-019**: El sistema DEBE calcular consumo de materia prima basado en pedidos procesados durante el día
- **FR-020**: El sistema DEBE generar reporte de ingredientes consumidos con cantidades totales
- **FR-021**: El sistema DEBE mantener inventario en tiempo real, descontando automáticamente stock de ingredientes cuando se completa un pedido *(Implementado via database trigger - ver migration 010)*
- **FR-022**: El sistema DEBE mostrar alertas cuando ingredientes caen por debajo del stock mínimo configurado
- **FR-023**: El gerente DEBE poder registrar entradas de mercadería (compras) para actualizar stock de ingredientes
- **FR-024**: El sistema DEBE prevenir la creación de pedidos cuando los ingredientes necesarios tienen stock insuficiente, mostrando una alerta detallada al usuario con la lista de ingredientes faltantes y las cantidades requeridas

**Autenticación y Roles:**
- **FR-025**: El sistema DEBE autenticar usuarios mediante nombre de usuario y contraseña
- **FR-026**: El sistema DEBE implementar 3 roles con permisos diferenciados: Gerente (acceso completo), Cocinero (gestión de pedidos asignados), Tomador de Pedidos (creación de pedidos y consulta)
- **FR-027**: El sistema DEBE restringir acceso a funcionalidades según el rol del usuario autenticado
- **FR-028**: El sistema DEBE mantener sesión activa del usuario hasta cierre explícito o timeout de inactividad después de 30 minutos sin actividad
- **FR-029**: El sistema DEBE mantener registro de auditoría con timestamp para acciones críticas: creación/modificación/eliminación de pedidos, cambios de estado de pedidos, creación/modificación de usuarios, cambios de menú/precios, transacciones de inventario, intentos de login exitosos/fallidos
- **FR-039**: Las contraseñas de usuario DEBEN tener mínimo 8 caracteres y ser hasheadas con bcrypt usando 10 rounds de salt

**Gestión de Ingredientes (Interfaz de Usuario):**
- **FR-030**: El gerente DEBE poder agregar nuevos ingredientes al sistema con nombre, unidad, stock inicial, stock mínimo y costo
- **FR-031**: El gerente DEBE poder editar información de ingredientes existentes (nombre, unidades, stock mínimo, costo)
- **FR-032**: El gerente DEBE poder eliminar ingredientes que no están referenciados en recetas

**Recetas e Instrucciones de Preparación:**
- **FR-033**: Cada receta DEBE poder tener instrucciones detalladas de preparación visibles para el cocinero (texto plano con saltos de línea, máximo 2000 caracteres)
- **FR-034**: Los cocineros DEBEN poder ver las instrucciones de preparación cuando tienen un pedido asignado
- **FR-035**: El gerente DEBE poder editar las instrucciones de preparación de cada plato del menú

**Historial de Clientes:**
- **FR-036**: El sistema DEBE permitir registrar datos de clientes (nombre, apellido, teléfono, email) opcionalmente al crear un pedido
- **FR-037**: El sistema DEBE mantener historial de pedidos por cliente para análisis estadístico futuro
- **FR-038**: El gerente DEBE poder consultar la lista de clientes registrados y ver su historial de compras

### Key Entities

- **Pedido (Order)**: Representa una solicitud de cliente. Atributos esenciales: identificador único, lista de items solicitados, monto total, estado actual (Pendiente/Asignado/En Proceso/Completado), timestamps (creación, asignación, inicio preparación, completado), referencia al cocinero asignado, referencia a mesa o cliente.

- **Item de Menú (MenuItem)**: Representa un plato o producto disponible. Atributos: nombre, descripción, precio unitario, lista de ingredientes asociados con cantidades requeridas, estado de disponibilidad (activo/inactivo).

- **Usuario (User)**: Representa un empleado del restaurante. Atributos: nombre completo, credenciales de acceso, rol asignado (Gerente/Cocinero/Tomador de Pedidos), estado activo/inactivo, información de turno actual.

- **Ingrediente (Ingredient)**: Representa materia prima. Atributos: nombre, unidad de medida (kg, litros, unidades), stock actual disponible (si se gestiona inventario real), punto de reorden (stock mínimo), costo unitario para cálculos.

- **Línea de Pedido (OrderLine)**: Relación entre un Pedido y los Items del Menú solicitados. Atributos: cantidad solicitada, precio unitario al momento del pedido (para mantener histórico), modificaciones especiales (notas: sin cebolla, extra queso, etc.).

- **Receta (Recipe)**: Relación entre un Item del Menú y sus Ingredientes. Atributos: ingrediente requerido, cantidad necesaria por porción del item, unidad de medida, instrucciones de preparación (texto descriptivo de cómo preparar el plato).

- **Cliente (Customer)**: Representa un cliente del restaurante. Atributos: nombre, apellido, teléfono (opcional), email (opcional), fecha de registro, lista de pedidos históricos asociados.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Los tomadores de pedidos pueden crear un nuevo pedido completo (con 3-5 items) en menos de 1 minuto
- **SC-002**: Los cocineros pueden localizar y visualizar su pedido asignado en menos de 5 segundos después de iniciar sesión
- **SC-003**: El sistema asigna automáticamente el siguiente pedido a un cocinero en menos de 2 segundos después de marcar el anterior como completado
- **SC-004**: El dashboard de gerencia muestra información actualizada con menos de 3 segundos de latencia desde eventos reales
- **SC-005**: El sistema maneja al menos 50 pedidos simultáneos en cola sin degradación perceptible de rendimiento (respuesta < 1 segundo)
- **SC-006**: El cálculo de recaudación diaria tiene 100% de precisión comparado con validación manual de pedidos completados
- **SC-007**: El cálculo de materia prima consumida tiene margen de error menor al 5% comparado con medición física real
- **SC-008**: 90% de los empleados (cocineros y tomadores) pueden usar el sistema sin capacitación formal después de una demostración de 10 minutos
- **SC-009**: El tiempo promedio de procesamiento de pedidos (desde creación hasta completado) se reduce en al menos 15% comparado con método actual
- **SC-010**: El sistema mantiene disponibilidad del 99% durante horario operativo del restaurante (desayuno, almuerzo, cena)
