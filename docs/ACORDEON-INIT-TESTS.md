﻿﻿# Pruebas — Acordeón colapsado al inicio

## Objetivo
Confirmar que el panel izquierdo (acordeón) **carga totalmente colapsado**: todas las secciones cerradas, sin contenido visible, y que al interactuar abre/cierra con animación suave y accesible.

## Pruebas manuales (recomendadas)

### 1) Escritorio (Chrome/Edge/Firefox)
1. Abrir `index.html`.
2. Verificar que **no se ve contenido** de ninguna sección del panel izquierdo al cargar.
3. Verificar en DevTools (Elements) que:
   - Todos los botones `.accordion-trigger` tienen `aria-expanded="false"`.
   - Todos los paneles `.accordion-panel` tienen `hidden` y `aria-hidden="true"`.
4. Hacer click en “General”:
   - Se abre con transición.
   - `aria-expanded="true"`, panel sin `hidden`, `aria-hidden="false"`.
5. Click en “Contenido”:
   - “General” se cierra inmediatamente y “Contenido” se abre.

### 2) Teclado (WCAG)
1. Con Tab, enfocar un encabezado del acordeón.
2. Presionar `Enter`:
   - Abre/cierra la sección.
3. Presionar `ArrowDown/ArrowUp`:
   - El foco se mueve entre encabezados.
4. Verificar que `:focus-visible` se vea claramente en encabezados.

### 3) Móvil / Tablet (Safari iOS / Chrome Android o emulador)
1. Abrir la página.
2. Verificar que el acordeón inicia colapsado.
3. Tocar un encabezado:
   - Abre sin saltos de layout ni superposición.

## Criterios de aceptación
- En carga inicial: **todas las secciones cerradas**.
- No hay contenido visible de paneles cerrados.
- Transición de apertura/cierre suave (max-height + opacity).
- ARIA consistente (`aria-expanded`, `aria-hidden`, `role="region"`).

