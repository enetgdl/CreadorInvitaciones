﻿﻿# Especificaciones de Interacción — UI

## App Bar / Menús
**Apertura**
- Click en “Archivo/Edición/Ayuda”: abre/cierra su menú.
- Teclado:
  - `Enter`/`Espacio`/`ArrowDown`: abre y enfoca el primer item.
  - `Escape`: cierra y devuelve foco al botón del menú.
  - `ArrowLeft`/`ArrowRight`: navega entre menús.

**Dentro del menú**
- `ArrowUp`/`ArrowDown`: recorre items.
- `Home`/`End`: primer/último item.
- Click en item: ejecuta la acción y cierra el menú.

## Toolbar
- Botones con tooltip (atributo `title`) y `aria-label`.
- Estados:
  - `disabled` usado para undo/redo cuando no hay historial.
- Atajos:
  - Undo/redo: gestionados por HistoryManager (Ctrl+Z, Ctrl+Y/Ctrl+Shift+Z).

## Panel Izquierdo (Acordeón)
- Selección única: al abrir uno, cierra el anterior.
- Teclado:
  - `Enter`/`Espacio`: abrir/cerrar.
  - `ArrowUp`/`ArrowDown`: mover foco entre encabezados.
  - `Home`/`End`: primero/último.
  - `ArrowRight`: abrir, `ArrowLeft`: cerrar.

## Canvas (Área Central)
**Zoom**
- Slider 25%–200% (step 5).
- Botones ± (step 10%).
- Ctrl + rueda: zoom incremental.

**Pan**
- Mantener `Space` y arrastrar en el fondo (fuera del dispositivo) para desplazar.
- Touch: gesto de pinza (2 dedos) para zoom.

## Capas
- Orden: z-index descendente (arriba = mayor z).
- Click en capa: selecciona el objeto en el canvas y sincroniza el panel de propiedades.

