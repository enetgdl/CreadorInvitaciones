# Diagnóstico y correcciones (UI)

## Bounding-box desfasado
**Causa raíz**
- El overlay de selección estaba posicionado con `position: absolute` dentro del `body` del iframe, que puede hacer scroll. En esa configuración, el recuadro puede desfasarse por diferencias entre coordenadas de viewport y documento durante scroll/repaint.

**Corrección**
- El overlay `.editor-selection-overlay` pasa a `position: fixed` para que el sistema de coordenadas coincida con `getBoundingClientRect()` (viewport), evitando offsets y desfases.
- El cálculo de `top/left` del recuadro usa directamente `rect.top/left` del elemento.

Archivos:
- [preview.js](file:///c:/xampp/htdocs/Invitacion/js/preview.js)
- [iframe-editor-runtime.js](file:///c:/xampp/htdocs/Invitacion/js/iframe-editor-runtime.js)

## Tipografía “Great Vibes” no se aplica
**Causa raíz**
- Los controles de tipografía/estilo (`#titleFont`, etc.) se movieron al panel derecho (`#globalStylePanel`) pero los listeners del editor solo se adjuntaban a `#design-panel`. Al quedar fuera, el cambio de fuente no disparaba `handleFieldChange` y el preview no se re-renderizaba.

**Corrección**
- Se registran listeners también para `#globalStylePanel` tras el montaje del panel derecho.
- Se añade una protección para no duplicar listeners cuando el montaje corre más de una vez.

Archivos:
- [visual-editor.js](file:///c:/xampp/htdocs/Invitacion/js/visual-editor.js)
- [editor.js](file:///c:/xampp/htdocs/Invitacion/js/editor.js)

## Pruebas
- Verificación de cambio de tipografía: [TYPOGRAPHY-GREAT-VIBES-AUTOTESTS.html](file:///c:/xampp/htdocs/Invitacion/TYPOGRAPHY-GREAT-VIBES-AUTOTESTS.html)
- Recuadro de selección tras cambios: [SELECTION-BOX-AUTOTESTS.html](file:///c:/xampp/htdocs/Invitacion/SELECTION-BOX-AUTOTESTS.html)

