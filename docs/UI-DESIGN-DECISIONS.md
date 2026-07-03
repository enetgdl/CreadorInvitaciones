﻿﻿# Decisiones de Diseño — Adaptación “Pro Design” a Web

## Principios adoptados
- **Separación de responsabilidades**: App Bar (menús), Toolbar (acciones rápidas), Canvas (trabajo), Paneles (propiedades/capas).
- **Optimización por mouse**: targets táctiles ≥ 40px, jerarquía clara, navegación rápida.
- **Accesibilidad real**: foco visible, roles ARIA, navegación por teclado en menús y acordeón.

## Adaptaciones al contexto web
- Menús tipo desktop con popovers (sin barras nativas del SO).
- Iconografía SVG con `currentColor` para coherencia de estados.
- Pan/zoom implementado con controles simples (slider y Ctrl+rueda), y gestos táctiles básicos.

## Compatibilidad y mantenibilidad
- Reutilización de IDs existentes para no romper la lógica del editor (exportación, historial, preview).
- Implementación modular:
  - `app-menu.js`: menús accesibles.
  - `accordion-menu.js`: acordeón de panel izquierdo.
  - `canvas-controls.js`: pan/zoom del canvas.
  - `visual-editor.js`: sincronización de propiedades y capas.

## Límites asumidos
- El zoom actual escala el contenedor de la vista previa; los gestos se enfocan en UX fluido sin reescalar el layout interno del iframe.

