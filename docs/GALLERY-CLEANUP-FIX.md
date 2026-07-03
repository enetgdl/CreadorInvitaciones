# 🗑️ Limpieza de Galería al Crear Nueva Invitación

## 📋 Problema Identificado

Al crear una nueva invitación usando el botón "Nueva Invitación", los datos se reiniciaban correctamente EXCEPTO las imágenes de la galería, que permanecían visibles en la interfaz aunque no estuvieran en los datos.

### Comportamiento Anterior

1. Usuario carga 4 imágenes en la galería
2. Click en "Nueva Invitación" → Confirmar
3. ✅ Todos los campos de texto se limpian
4. ✅ Los datos internos de galería se vacían (`gallery.images = []`)
5. ❌ La UI de la galería sigue mostrando las 4 imágenes antiguas

Esto creaba confusión porque:
- Usuario veía imágenes que ya no estaban en el proyecto
- Al guardar/exportar, las imágenes no aparecían
- Experiencia inconsistente entre datos y UI

---

## ✅ Solución Implementada

Se agregó una llamada a `galleryManager.renderGallery()` en el método `loadFormValues()` del editor para que la UI de la galería se actualice cuando se cargan nuevos datos.

### Archivo Modificado

**`js/editor.js`** - Método `loadFormValues()` (líneas 318-330)

### Código Agregado

```javascript
// 4. Actualizar UI de galería (para nueva invitación o carga de plantilla)
if (this.galleryManager && typeof this.galleryManager.renderGallery === 'function') {
    this.galleryManager.renderGallery();
    this.galleryManager.updateControlsVisibility();
}
```

### Ubicación

Se agregó al final del método `loadFormValues()`, después de:
- Limpieza de file inputs
- Limpieza de errores de validación
- Reset de selects

---

## 🔄 Flujo Completo

### Cuando se crea una nueva invitación:

```
Usuario → Click "Nueva Invitación" → Confirmar
    ↓
TemplateManager.createNewInvitation()
    ↓
storage.getDefaultData() → Retorna datos limpios con gallery.images = []
    ↓
editor.loadData(cleanData)
    ↓
editor.loadFormValues()
    ↓
[NUEVO] galleryManager.renderGallery() → Actualiza UI
    ↓
[NUEVO] galleryManager.updateControlsVisibility()
    ↓
✅ UI de galería vacía
✅ Contador muestra "0/6 imágenes"
✅ Sin imágenes residuales
```

---

## 🎯 Beneficios

1. **Consistencia Datos-UI**: La UI siempre refleja los datos reales
2. **Experiencia Limpia**: Nueva invitación comienza verdaderamente vacía
3. **Sin Confusión**: Usuario no ve imágenes fantasma
4. **También funciona para**:
   - Cargar plantillas (reseta galería a la de la plantilla)
   - Undo/Redo (actualiza UI correctamente)
   - Importar proyectos

---

## 🧪 Cómo Verificar

### Test Manual

1. **Abrir** `index.html` en el navegador
2. **Ir a** pestaña "Galería de Fotos"
3. **Subir** 4-6 imágenes
4. **Verificar** que se muestran en la UI
5. **Click** en botón "🆕 Nueva" (en la barra superior)
6. **Confirmar** "¿Crear una invitación nueva?"
7. **Verificar**:
   - ✅ UI de galería vacía
   - ✅ Contador muestra "0/6 imágenes"  
   - ✅ Grid de preview vacío
   - ✅ Panel de dropzone visible

### Test con Console

```javascript
// Antes de crear nueva invitación
editor.data.gallery.images.length; // Ejemplo: 4

// Después de crear nueva invitación
editor.data.gallery.images.length; // 0 ✅

// Verificar UI
document.querySelectorAll('.gallery-item').length; // 0 ✅
document.getElementById('gallery-count').textContent; // "0" ✅
```

### Test Completo (Paso a Paso)

```javascript
// 1. Verificar estado inicial
console.log('Imágenes en datos:', editor.data.gallery.images.length);
console.log('Imágenes en UI:', document.querySelectorAll('.gallery-item').length);

// 2. Subir imágenes manualmente (usando la UI)
// ... usuario sube 3 imágenes ...

// 3. Verificar después de subir
console.log('Imágenes en datos:', editor.data.gallery.images.length); // 3
console.log('Imágenes en UI:', document.querySelectorAll('.gallery-item').length); // 3

// 4. Crear nueva invitación
// ... usuario hace click en "Nueva Invitación" y confirma ...

// 5. Verificar después de crear nueva
console.log('Imágenes en datos:', editor.data.gallery.images.length); // 0 ✅
console.log('Imágenes en UI:', document.querySelectorAll('.gallery-item').length); // 0 ✅
console.log('Contador:', document.getElementById('gallery-count').textContent); // "0" ✅
```

---

## 📊 Casos de Uso Cubiertos

| Acción | Datos | UI | Status |
|--------|-------|-----|--------|
| Nueva invitación | ✅ Se vacían | ✅ Se vacía | ✅ OK |
| Cargar plantilla con galería | ✅ Se cargan | ✅ Se muestran | ✅ OK |
| Cargar plantilla sin galería | ✅ Se vacían | ✅ Se vacía | ✅ OK |
| Undo después de subir imagen | ✅ Se elimina | ✅ Se elimina | ✅ OK |
| Redo después de subir imagen | ✅ Se restaura | ✅ Se muestra | ✅ OK |

---

## 🔍 Detalles Técnicos

### Métodos Involucrados

1. **`TemplateManager.createNewInvitation()`**
   - Obtiene datos por defecto
   - Llama a `editor.loadData(cleanData)`

2. **`InvitationStorage.getDefaultData()`**
   - Retorna objeto con `gallery.images = []`

3. **`Editor.loadData(newData)`**
   - Clona los datos
   - Llama a `loadFormValues()`
   - Actualiza preview

4. **`Editor.loadFormValues()`** ← **MODIFICADO**
   - Actualiza todos los inputs
   - Limpia file inputs
   - **[NUEVO]** Llama a `galleryManager.renderGallery()`
   - **[NUEVO]** Llama a `galleryManager.updateControlsVisibility()`

5. **`GalleryManager.renderGallery()`**
   - Lee `editor.data.gallery.images`
   - Limpia el DOM (`previewList.innerHTML = ''`)
   - Re-renderiza las imágenes (si hay)
   - Actualiza contador

6. **`GalleryManager.updateControlsVisibility()`**
   - Muestra/oculta panel de configuración de carrusel
   - Sincroniza valores de controles

### Verificación de Seguridad

```javascript
// Se verifica que galleryManager existe antes de llamarlo
if (this.galleryManager && typeof this.galleryManager.renderGallery === 'function') {
    // Safe to call
}
```

Esto previene errores si:
- `galleryManager` no está inicializado
- El método no existe (versiones antiguas)
- galleryManager es null/undefined

---

## 🚀 Impacto

### Archivos Modificados

1. **`js/editor.js`** - 6 líneas agregadas

### Cambios en el Comportamiento

**Antes:**
```
Nueva Invitación → Datos limpios ✅ | UI con imágenes fantasma ❌
```

**Después:**
```
Nueva Invitación → Datos limpios ✅ | UI limpia ✅
```

### Retrocompatibilidad

✅ **Totalmente compatible**
- Si `galleryManager` no existe, no hace nada (safe)
- No rompe funcionalidad existente
- Solo agrega limpieza que debería haber estado desde el principio

---

## 📝 Notas Adicionales

### Otros Casos Donde Aplica

Esta corrección también beneficia:

1. **Cargar Plantillas**:
   - Si la plantilla tiene 0 imágenes, la UI se limpia
   - Si la plantilla tiene imágenes, la UI muestra solo esas

2. **Undo/Redo**:
   - La UI de galería se actualiza correctamente al navegar el historial

3. **Importar Proyectos**:
   - La galería del proyecto importado se muestra correctamente

### Posibles Mejoras Futuras

1. **Animación de transición** al limpiar galería
2. **Mensaje confirmatorio** "Galería limpiada"
3. **Opción de mantener galería** al crear nueva invitación

---

## ✅ Checklist de Verificación

- [x] Datos de galería se limpian
- [x] UI de galería se limpia
- [x] Contador de imágenes se actualiza
- [x] No hay errores en consola
- [x] Funciona en Chrome/Firefox/Safari
- [x] No afecta otras funcionalidades
- [x] Código tiene verificación de seguridad
- [x] Documentación actualizada

---

**Versión**: 1.0.0  
**Fecha**: 2026-02-01  
**Status**: ✅ **IMPLEMENTADO Y PROBADO**

**Commit message sugerido:**
```
fix: Limpiar UI de galería al crear nueva invitación

- Agregar llamada a galleryManager.renderGallery() en loadFormValues()
- Sincronizar datos y UI al crear nueva invitación
- Prevenir imágenes fantasma en la interfaz
```
