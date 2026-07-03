# ⚡ Guía Rápida - Edición de Texto en Línea

## 🎯 ¿Qué se implementó?

Se agregó un sistema completo de **edición de texto en línea** que permite modificar elementos de texto directamente en el canvas mediante doble clic.

---

## 🚀 Cómo Usar

### Opción 1: Editar Texto Existente
1. Haz **doble clic** en cualquier elemento de texto en el canvas
2. El texto se volverá editable automáticamente
3. Modifica el texto como desees
4. Presiona **Enter** o haz clic fuera para guardar
5. Presiona **Escape** para cancelar sin guardar

### Opción 2: Insertar Nuevo Texto
1. Haz clic en el botón **"Insertar texto"** en la barra de herramientas (icono de "T")
2. Aparecerá un nuevo elemento con el texto **"Nuevo Texto"** ya seleccionado
3. Simplemente empieza a escribir para reemplazarlo
4. Presiona **Enter** para confirmar

### Opción 3: Insertar Nueva Imagen
1. Haz clic en el botón **"Insertar imagen"** en la barra de herramientas (icono de imagen)
2. Selecciona una imagen de tu computadora (JPG, PNG, GIF, SVG)
3. La imagen aparecerá centrada en el canvas
4. Arrástrala y redimensiónala como cualquier otro elemento

---

## ⌨️ Atajos de Teclado (Durante Edición)

| Atajo | Acción |
|-------|--------|
| **Enter** | Confirmar y guardar cambios |
| **Escape** | Cancelar sin guardar |
| **Shift + Enter** | Insertar salto de línea (multi-línea) |

---

## 🧪 Probar la Funcionalidad

### Test Manual Rápido
1. Abre la aplicación en tu navegador
2. Haz clic en "Insertar texto"
3. Verifica que aparezca el texto "Nuevo Texto" seleccionado
4. Escribe algo diferente
5. Presiona Enter
6. Haz doble clic en el texto
7. Modifica el texto
8. Haz clic fuera del elemento
9. Verifica que el cambio se guardó

### Test Automatizado
Abre la consola del navegador (F12) y ejecuta:

```javascript
await runToolbarTests();
```

Deberías ver algo como:
```
🧪 Starting Toolbar Buttons Test Suite...
✅ PASS: Insert Image button exists
✅ PASS: Insert Text button exists
✅ PASS: Iframe accessible for text editing tests
...
🎉 All toolbar button tests passed!
```

---

## 📁 Archivos Modificados

- ✅ `index.html` - Agregados botones e iconos SVG
- ✅ `js/visual-editor.js` - Lógica de botones y mensaje textEdited
- ✅ `js/iframe-editor-runtime.js` - Sistema de edición en línea
- ✅ `js/tests/toolbar-buttons-test.js` - Suite de pruebas

---

## 📖 Documentación Completa

Para detalles técnicos completos, consulta:
- **[TEXT-EDITING-DOCS.md](TEXT-EDITING-DOCS.md)** - Documentación técnica completa

---

## ✨ Características Destacadas

### 🎯 Activación Intuitiva
- **Doble clic** para editar texto existente
- **Auto-edición** para nuevos elementos de texto

### 💾 Integración con Historial
- Todos los cambios se guardan en el historial
- Puedes deshacer/rehacer cambios de texto con **Ctrl+Z** / **Ctrl+Y**

### 🎨 Preservación de Estilos
- El editor mantiene fuente, tamaño, color, etc.
- Interfaz visual consistente

### ⚡ Rendimiento
- Sin lag ni demoras
- Solo un elemento editable a la vez
- Cleanup automático de recursos

---

## 🐛 Solución de Problemas

### ❓ El doble clic no funciona
- Asegúrate de hacer doble clic en un elemento de **texto**
- Imágenes u otros elementos no son editables por doble clic

### ❓ El texto no se guarda
- Verifica que presionaste **Enter** o hiciste clic fuera
- Presionar **Escape** cancela la edición

### ❓ No veo los botones nuevos
- Recarga la página (**Ctrl+R** o **F5**)
- Verifica que los cambios se guardaron correctamente

---

## 🎉 ¡Listo!

El sistema de edición de texto en línea está completamente funcional y listo para usar.

**Próximos pasos:**
1. Prueba insertar texto
2. Prueba editar texto con doble clic
3. Experimenta con Enter/Escape
4. Verifica el historial de deshacer/rehacer

**¿Preguntas?** Consulta **TEXT-EDITING-DOCS.md** para más detalles técnicos.
