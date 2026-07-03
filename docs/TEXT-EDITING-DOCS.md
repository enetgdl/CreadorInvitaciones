# 📝 DOCUMENTACIÓN - EDICIÓN DE TEXTO EN LÍNEA

## 🎯 Descripción General

Sistema de edición de texto en línea mediante doble clic que permite a los usuarios modificar el contenido de elementos de texto directamente en el canvas del editor visual.

---

## ✨ Características Implementadas

### 1. **Activación de Edición**
- ✅ **Doble clic**: Al hacer doble clic sobre cualquier elemento de texto, este se convierte automáticamente en editable
- ✅ **Sin botones adicionales**: La activación es completamente automática e intuitiva
- ✅ **Detección inteligente**: Solo elementos de texto (div, p, span, h1-h6) son editables

### 2. **Modo Edición Automático para Nuevos Elementos**
- ✅ **Edición inmediata**: Al insertar nuevo texto mediante el botón "Insertar texto", el elemento inicia automáticamente en modo edición
- ✅ **Texto seleccionado**: El texto predeterminado "Nuevo Texto" aparece completamente seleccionado
- ✅ **Reemplazo directo**: El usuario puede empezar a escribir inmediatamente para reemplazar el texto

### 3. **Preservación de Contenido**
- ✅ **Contenido original**: Los elementos existentes mantienen su texto durante la edición
- ✅ **Sin pérdida de datos**: Si se cancela la edición (Escape), el texto original se preserva
- ✅ **Validación**: Si el campo queda vacío, se establece "Texto" como fallback

### 4. **Interfaz de Edición**
- ✅ **Textarea temporal**: Se crea un `<textarea>` que reemplaza visualmente el elemento durante la edición
- ✅ **Preservación de estilos**: El campo mantiene:
  - Tamaño de fuente
  - Familia de fuente
  - Color del texto
  - Peso y estilo de fuente
  - Alineación de texto
  - Posición absoluta
- ✅ **Indicador visual**: Borde morado (`#8B5CF6`) con sombra para indicar modo edición
- ✅ **Responsive**: El textarea se ajusta al tamaño del elemento original (mínimo 100px de ancho)

### 5. **Finalización de Edición**

#### Confirmar Cambios
- ✅ **Enter**: Presionar Enter (sin Shift) confirma y guarda los cambios
- ✅ **Blur**: Hacer clic fuera del elemento confirma automáticamente
- ✅ **Notificación**: Se envía mensaje `textEdited` al editor principal
- ✅ **Historial**: Los cambios se guardan automáticamente en el historial de deshacer/rehacer

#### Cancelar Edición
- ✅ **Escape**: Presionar Escape cancela la edición sin guardar cambios
- ✅ **Restauración**: El elemento vuelve a su estado original

#### Multi-línea
- ✅ **Shift+Enter**: Permite insertar saltos de línea en el texto

### 6. **Gestión de Estados**
- ✅ **Un elemento a la vez**: Solo un elemento puede estar en modo edición simultáneamente
- ✅ **Cierre automático**: Al iniciar edición de otro elemento, el anterior se confirma automáticamente
- ✅ **Transiciones suaves**: El elemento original se oculta (`visibility: hidden`) durante la edición
- ✅ **Cleanup completo**: Al finalizar, se eliminan todos los listeners y elementos temporales

### 7. **Compatibilidad y Rendimiento**
- ✅ **Navegadores modernos**: Compatible con Chrome, Firefox, Safari, Edge
- ✅ **Eventos nativos**: Usa `dblclick`, `keydown`, `blur` nativos del navegador
- ✅ **Sin conflictos**: No interfiere con el sistema de drag & drop existente
- ✅ **Performante**: Operaciones optimizadas con timeouts y cleanup adecuado

---

## 🏗️ Arquitectura

### Archivos Modificados

1. **`js/iframe-editor-runtime.js`**
   - Estado de edición (`STATE.editingElement`, `STATE.editingInput`)
   - Funciones de edición: `startTextEditing()`, `finishTextEditing()`, `cancelTextEditing()`
   - Handlers de eventos: `onEditingKeyDown()`, `onEditingBlur()`
   - Función auxiliar: `isTextElement()`
   - Listener de doble clic registrado en `init()`

2. **`js/visual-editor.js`**
   - Handler de mensaje `textEdited` para guardar en historial
   - Modificación en creación de texto para iniciar edición automática

3. **`js/tests/toolbar-buttons-test.js`**
   - Pruebas de edición de texto en línea

---

## 🔧 API Interna

### Funciones Principales

#### `startTextEditing(element, selectAll)`
Inicia el modo de edición para un elemento de texto.

**Parámetros:**
- `element` (HTMLElement): Elemento de texto a editar
- `selectAll` (boolean): Si `true`, selecciona todo el texto; si `false`, coloca cursor al final

**Comportamiento:**
1. Cancela cualquier edición activa previa
2. Crea textarea temporal con estilos copiados
3. Oculta elemento original
4. Añade event listeners
5. Enfoca y selecciona/posiciona cursor

#### `finishTextEditing()`
Finaliza la edición y guarda los cambios.

**Comportamiento:**
1. Obtiene texto del textarea
2. Actualiza elemento original
3. Limpia estado de edición
4. Notifica al editor principal
5. Restaura selection box

#### `cancelTextEditing()`
Cancela la edición sin guardar cambios.

**Comportamiento:**
1. Limpia estado de edición sin modificar elemento
2. Restaura visibilidad del elemento original

#### `isTextElement(el)`
Verifica si un elemento es editable como texto.

**Retorna:** `boolean`

**Elementos soportados:** `div`, `p`, `span`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

---

## 📋 Estados del Sistema

### Estado Normal
- Elemento visible con contenido
- Selectable y draggable
- Responde a doble clic

### Estado Editando
- Elemento original oculto (`visibility: hidden`)
- Textarea temporal visible y enfocado
- Selection box oculto
- Handlers de teclado activos

### Estado Post-Edición
- Elemento restaurado con nuevo contenido
- Textarea eliminado del DOM
- Selection box restaurado
- Historial actualizado

---

## 🎨 Estilos del Editor

```css
/* Applied to inline text editor textarea */
.inline-text-editor {
    position: absolute;
    border: 2px solid #8B5CF6;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.95);
    outline: none;
    resize: vertical;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 4px;
}
```

---

## 🔄 Flujo de Trabajo del Usuario

### Editar Texto Existente
1. Usuario hace **doble clic** en elemento de texto
2. Elemento se convierte en campo editable
3. Usuario modifica el texto
4. Usuario presiona **Enter** o hace clic fuera
5. Cambios se guardan en historial
6. Elemento vuelve a modo normal

### Insertar Nuevo Texto
1. Usuario hace clic en botón **"Insertar texto"**
2. Se crea elemento con texto "Nuevo Texto"
3. Elemento aparece **automáticamente en modo edición**
4. Texto está **seleccionado completamente**
5. Usuario escribe para reemplazarlo
6. Usuario confirma con **Enter** o clic fuera
7. Cambios se guardan

### Cancelar Edición
1. Durante edición, usuario presiona **Escape**
2. Edición se cancela sin guardar
3. Elemento vuelve a estado original

---

## 🧪 Testing

### Pruebas Implementadas

```javascript
// Ejecutar suite de pruebas
await runToolbarTests();
```

**Casos de prueba:**
1. ✅ Existencia de botones de inserción
2. ✅ Lógica de inserción de texto
3. ✅ Placeholder para inserción de imagen
4. ✅ Funcionalidad de edición en línea

---

## 📊 Mensajes del Sistema

### Mensajes del Iframe → Editor Principal

#### `textEdited`
Notifica que un elemento de texto ha sido editado.

```javascript
{
    type: 'textEdited',
    id: string,        // ID del elemento editado
    text: string       // Nuevo contenido de texto
}
```

**Respuesta del editor:**
- Guarda en historial con acción descriptiva

---

## ⚙️ Configuración

### Parámetros Ajustables

```javascript
// Delay para iniciar edición automática en nuevos elementos
setTimeout(() => {
    startTextEditing(newEl, true);
}, 100); // ← Ajustable

// Delay para blur (evitar conflicts con clicks)
setTimeout(() => {
    if (STATE.editingElement) {
        finishTextEditing();
    }
}, 100); // ← Ajustable

// Texto fallback si campo vacío
element.textContent = 'Texto'; // ← Personalizable
```

---

## 🐛 Troubleshooting

### Problema: Doble clic no inicia edición
**Solución:** Verificar que el elemento tenga `data-editor-id` y sea un tipo de elemento soportado.

### Problema: Texto no se guarda al hacer clic fuera
**Solución:** Verificar que no haya elementos bloqueando el evento blur. El delay de 100ms debería permitir que el click se registre primero.

### Problema: Elementos sobrepuestos interfieren con edición
**Solución:** Verificar z-index del textarea (10000) y que el elemento no esté dentro de `.editor-selection-overlay`.

### Problema: Enter inserta salto de línea en vez de confirmar
**Solución:** Usar Enter solo (sin Shift). Shift+Enter es para multi-línea.

---

## 🚀 Mejoras Futuras (Opcional)

### Posibles Extensiones
- [ ] Barra de herramientas de formato (negrita, cursiva)
- [ ] Auto-resize vertical del textarea según contenido
- [ ] Atajos de teclado (Ctrl+B, Ctrl+I)
- [ ] Selector de fuente durante edición
- [ ] Historial de texto (Ctrl+Z dentro del textarea)
- [ ] Paste con formato HTML
- [ ] Emojis y caracteres especiales

---

## ✅ Cumplimiento de Requisitos

| Requisito | Estado | Notas |
|-----------|--------|-------|
| Activación por doble clic | ✅ | Implementado con listener global |
| Modo edición por defecto para nuevos | ✅ | Texto "Nuevo Texto" seleccionado |
| Preservación de contenido | ✅ | Escape cancela, mantiene original |
| Interfaz de edición consistente | ✅ | Textarea con estilos copiados |
| Finalización con Enter/Blur/Escape | ✅ | Todos los métodos implementados |
| Gestión de estados (uno a la vez) | ✅ | Auto-cierre de edición previa |
| Compatibilidad y rendimiento | ✅ | Eventos nativos, optimizado |

---

## 📖 Ejemplo de Uso

```javascript
// El usuario hace doble clic en un elemento de texto en el iframe
// Automáticamente se ejecuta:

// 1. Detectar doble clic
document.addEventListener('dblclick', (e) => {
    const el = e.target.closest('[data-editor-id]');
    if (isTextElement(el)) {
        startTextEditing(el, false);
    }
});

// 2. Usuario edita y presiona Enter
// Automáticamente se ejecuta:
finishTextEditing();
// → Guarda texto
// → Notifica editor principal
// → Actualiza historial

// 3. Editor principal recibe mensaje
if (msg.type === 'textEdited') {
    historyManager.saveState(data, `Editar texto: "${msg.text.substring(0, 20)}..."`);
}
```

---

## 📝 Notas de Implementación

- El sistema usa `visibility: hidden` en vez de `display: none` para preservar layout durante edición
- Se usa `textarea` en vez de `input` para soportar contenido multi-línea
- El cleanup de eventos es crucial para evitar memory leaks
- El delay de 100ms en blur es necesario para evitar race conditions con clicks externos

---

**Versión:** 1.0.0  
**Fecha:** 2026-01-31  
**Estado:** ✅ Implementado y Funcional
