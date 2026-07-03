﻿﻿# Prototipo UI (Alta Fidelidad) — Editor de Invitaciones

## Objetivo
Replantear la interfaz con una arquitectura tipo software profesional de diseño (Photoshop/Photopea/Affinity), manteniendo el contexto web y la accesibilidad.

## Vistas Responsivas

### Escritorio (≥ 1200px)
**Estructura (de izquierda a derecha)**
- **App Bar (52px, fijo)**: marca + menús (Archivo/Edición/Ayuda) + configuración.
- **Toolbar (48px, fijo)**: acciones rápidas con iconos y tooltips (Nuevo/Abrir/Guardar/Exportar, Undo/Redo, Vista previa/Actualizar/Pantalla completa).
- **Panel Izquierdo (Inspector de proyecto)**: acordeón de secciones (General, Contenido, Interactivo, Multimedia, Efectos). Colapsable.
- **Canvas Central (dominante)**: dispositivo simulado centrado + área de trabajo con pan/zoom.
- **Panel Derecho (Inspector de objeto + Capas)**: estilo global, estilo del elemento seleccionado y lista de capas.

**Wireframe (texto)**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ App Bar: [≡] Invitaciones  Archivo  Edición  Ayuda                 [⚙]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Toolbar: [N] [O] [S] [⇩] | [↶] [↷] | [👁] [⟲] [⛶]                           │
├───────────────┬───────────────────────────────────────────┬──────────────────┤
│ Panel Izq     │ Canvas (área de trabajo)                   │ Panel Derecho    │
│ (Acordeón)    │  ┌──────────── Device Preview ──────────┐ │ Estilo + Capas   │
│ General ▾      │  │                                       │ │                 │
│ …             │  └───────────────────────────────────────┘ │ Capas           │
│ Contenido ▸    │  Zoom: [-] [====|====] [+]  100%           │ [capa]          │
│ …             │                                           │ …               │
└───────────────┴───────────────────────────────────────────┴──────────────────┘
```

### Tablet (900px–1199px)
- Menú superior mantiene App Bar y Toolbar.
- Panel izquierdo se puede colapsar automáticamente si el ancho es reducido.
- Panel derecho permanece visible, pero con padding y tipografía compacta.

### Móvil grande / Móvil pequeño (≤ 900px)
- Menús de texto se colapsan (se prioriza toolbar y acciones clave).
- Panel izquierdo se oculta por defecto y se invoca con el botón “≡”.
- Controles de canvas (zoom) permanecen visibles en la parte inferior del área central.

## Componentes Clave
- **Menú superior**: navegación con teclado, roles ARIA de menú, foco controlado.
- **Toolbar**: botones de 40×40px con tooltips y estados (hover/active/focus/disabled).
- **Capas**: lista ordenada por z-index, selección rápida, feedback visual del elemento activo.
- **Canvas**: zoom (slider, botones y Ctrl+rueda), pan con Space+arrastre o gesto táctil.

