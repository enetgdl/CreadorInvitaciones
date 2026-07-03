﻿﻿# Guía de Estilo — UI Editor de Invitaciones

## Paleta (contraste y coherencia)
- **Fondo App/Paneles**: tonos oscuros (base) + superficies con alpha (glass) para profundidad.
- **Texto principal**: blanco con opacidad alta.
- **Texto secundario**: blanco con opacidad media.
- **Acento**: morado (acciones/estado activo) y naranja (exportación/acción primaria).
- **Superficies claras**: menús (blanco) para legibilidad y contraste.

## Tipografía
- Base: Montserrat (ya integrada).
- Jerarquía recomendada:
  - Títulos: 0.95–1.05rem, peso 700–800.
  - Etiquetas: 0.85–0.9rem.
  - Texto de ayuda: 0.75–0.82rem.
  - Menús: 0.9–0.95rem.

## Escala de espaciado (8px)
- 4px: micro separación (iconos, chips, toggles).
- 8px: separación estándar entre controles.
- 12px: padding de contenedores compactos.
- 16px: separación de secciones/paneles.
- 24px+: solo para áreas amplias (canvas, marcos).

## Iconografía SVG
- Estilo: line icons, stroke 2px, terminaciones redondeadas.
- Tamaños:
  - App/Toolbar icons: 18×18.
  - Área clicable mínima: 40×40.
- Color: `currentColor` para heredar estados.

## Estados de Interacción (A11y)
- Normal: superficie neutral.
- Hover: realce sutil (solo en dispositivos con cursor).
- Active/Pressed: pequeño “nudge” (translateY) para feedback.
- Focus visible: outline 2px con color de acento y offset.
- Disabled: opacidad ~0.45 y cursor not-allowed.

## Componentes Reutilizables
- **Botón de toolbar**: `tool-btn`, `tool-btn-accent`
- **Menú desplegable**: `menu-popover`, `menu-item`, `menu-divider`
- **Lista de capas**: `layers-list`, `layer-item`, `layer-item.active`
- **Status bar**: `status-bar`, `status-btn`, `status-range`, `status-text`

