# Ventana "Relleno Avanzado" — Documentación Técnica

## Objetivo
Proveer una ventana flotante, arrastrable y persistente para aplicar rellenos (color, degradado, texturas) al elemento seleccionado en tiempo real, sin botón “Aplicar”.

## UI/UX
- Trigger: botón **Relleno avanzado** en la barra superior (toolbar).
- Modal flotante con:
  - Arrastre por barra de título.
  - Tabs: Colores / Degradados Avanzados / Degradados Metalicos Premium / Texturas.
  - Controles: fijar (pin), adosar (dock) y cerrar.

## Persistencia
Se guarda en `localStorage`:
- key: `advancedFillModalState`
- campos principales: `open`, `pinned`, `docked`, `left`, `top`, `tab`, `solid`, `gradient`, `texture`

## Binding en tiempo real
El modal aplica cambios sobre el elemento seleccionado mediante:
- `window.visualEditorHost.updateDesignElement(id, patch, { sendToIframe: true, historyKey })`

### Reglas de aplicación
- Si el elemento es “texto” (heurística `visualEditorHost.isProbablyText(id)`):
  - Color: `textColor`, `opacity`
  - Degradado: `textGradient`
- Para otros elementos:
  - Color: `fillType: 'solid'`, `fillColor`, `opacity`
  - Degradado: `fillType: 'gradient'`, `fillGradient`
  - Textura: `fillType: 'texture'`, `textureDataUrl`, `textureScale`, `textureRepeat`

## Degradados avanzados (lineal / radial / conic)
- Tipos soportados:
  - `linear-gradient(…)`
  - `radial-gradient(…)`
  - `conic-gradient(from …deg at center, …)`
- Editor visual:
  - Barra de stops con arrastre (drag) para reposicionar.
  - Click en la barra agrega una nueva parada (máx 6).
- Presets personalizados:
  - Guardar/cargar desde la UI.
  - Persistencia en `localStorage` (key `advancedFillGradientPresets`).

## Tabs compactas (sin scroll horizontal)
- Disposición: grid 2x2 (todas visibles, sin scroll horizontal) en modo flotante y adosado.
- Tamaño:
  - `padding`: 6px 8px
  - `font-size`: 0.78rem (0.75rem en modo ultra-compacto)
- Tooltips:
  - Cada pestaña usa `title` con el texto completo para compensar el truncado por `text-overflow: ellipsis`.

## Centrado automático del dispositivo simulado (cuando el panel está adosado)
- Regla:
  - Si `#advancedFillModal` está visible y tiene clase `is-docked`, el dispositivo (`#deviceScreen`) se centra en el espacio horizontal entre:
    - borde derecho del panel izquierdo (`#leftPanel`)
    - borde izquierdo del modal adosado
- Configuración:
  - Expuesto como `window.deviceAutoCentering.setOptions({ margin, animate, transitionMs })`

### Undo/Redo
El modal captura estado (undo) una vez por interacción usando:
- `editor.historyManager.saveState(editor.data)`
antes de disparar ráfagas de cambios (sliders/stops).

## Reposicionamiento y no-obstrucción
- Modo normal (no fijado y no adosado):
  - Recalcula posición en apertura, resize y scroll.
  - Evita superposición con el dispositivo simulado (`#deviceScreen`) y respeta el panel derecho.
- Modo fijado:
  - No se auto-reposiciona.
- Modo adosado:
  - Se acopla a la izquierda de `.right-sidebar`, ocupando alto completo del workspace disponible.

## Archivos
- UI: [index.html](file:///c:/xampp/htdocs/Invitacion/index.html)
- Estilos: [editor.css](file:///c:/xampp/htdocs/Invitacion/css/editor.css)
- Lógica modal: [advanced-fill-modal.js](file:///c:/xampp/htdocs/Invitacion/js/advanced-fill-modal.js)

