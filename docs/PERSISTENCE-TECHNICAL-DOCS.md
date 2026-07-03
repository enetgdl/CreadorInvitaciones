# 💾 PERSISTENCIA SEGURA Y ALMACENAMIENTO DE ELEMENTOS

**Fecha:** 31 de Enero, 2026  
**Versión:** 1.0  
**Estado:** ✅ Implementado

---

## 🎯 Objetivo

Garantizar que todos los elementos insertados por el usuario se conserven de forma segura, estructurada y persistente, sobreviviendo a recargas de página y sesiones de navegador, con protección contra vulnerabilidades de inyección (XSS).

---

## 🏗️ Arquitectura de Datos

### Estructura de Almacenamiento
Los elementos se serializan en un array JSON dentro de `localStorage` bajo la clave `invitation_data`.

```json
{
  "dynamicElements": [
    {
      "id": "el_1706756291234_567",
      "type": "text",
      "content": "Bienvenidos a mi Boda",
      "position": { "x": 150, "y": 300 },
      "size": { "width": 400, "height": 50 },
      "styles": {
        "fontSize": "32px",
        "fontFamily": "Great Vibes, cursive",
        "color": "#1e293b",
        "zIndex": 10
      },
      "metadata": {
        "createdAt": 1706756291234,
        "updatedAt": 1706756350000,
        "name": "Título Principal"
      }
    }
  ]
}
```

### Tipos de Elementos Soportados
1. **Texto (`text`)**: Contenido sanitizado, tipografía, color.
2. **Imagen (`image`)**: Fuente (DataURL o URL), dimensiones, relación de aspecto.

---

## 🔒 Seguridad y Sanitización

### Prevención de XSS (Cross-Site Scripting)
Para prevenir la ejecución de scripts maliciosos al restaurar contenido:

1. **Uso de `textContent`**:
   Al restaurar elementos de texto, utilizamos explícitamente `el.textContent = data.content` en lugar de `innerHTML`. Esto asegura que cualquier etiqueta HTML o script incrustado en el contenido se renderice como texto plano inofensivo.

2. **Validación de Tipos**:
   El sistema verifica estrictamente `data.type` antes de crear elementos, ignorando tipos desconocidos.

3. **CSS Escape**:
   Los IDs de elementos se escapan usando `CSS.escape()` o fallback seguro antes de ser usados en selectores del DOM.

---

## 🔄 Ciclo de Vida de Persistencia

### 1. Detección y Registro
- **Inserción**: Al crear un elemento, `VisualEditorHost` genera los metadatos y lo registra inmediatamente en `DynamicElementsManager`.
- **Modificación**: Cada cambio (mover, redimensionar, editar texto) dispara un evento que actualiza el registro en memoria.

### 2. Almacenamiento (Auto-Save)
- **Debounce**: Los cambios no escriben a disco inmediatamente. Un timer de 500ms agrupa cambios rápidos para optimizar rendimiento.
- **Serialización**: El estado completo se convierte a JSON y se guarda en `localStorage`.

### 3. Restauración (Page Load)
- **Inicialización**: Al cargar, `DynamicElementsManager` lee `localStorage`.
- **Sync**: Cuando el iframe reporta `ready`, el editor envía un mensaje `restoreElements` con el array completo.
- **Rehidratación**: El script del iframe itera sobre los datos y reconstruye el DOM con precisión de píxel.

---

## ⚠️ Manejo de Errores y Límites

### Integridad de Datos
- Si un registro está corrupto (falta ID o tipo), es ignorado silenciosamente durante la restauración para no romper la aplicación.
- Logs detallados en consola (`♻️ Restoring...`) ayudan en la depuración.

### Límites de Almacenamiento
- `localStorage` tiene un límite típico de ~5MB.
- **Imágenes**: Se recomienda usar imágenes optimizadas. Las imágenes grandes en Base64 pueden llenar rápidamente el almacenamiento.
- **Validación**: El sistema captura excepciones `QuotaExceededError` y notifica error en consola (pendiente: notificación UI).

---

## 🧪 Estrategia de Pruebas

### Pruebas de Persistencia (Hard Refresh)
1. Insertar elementos.
2. Moverlos y editar texto.
3. Ejecutar `location.reload(true)`.
4. Verificar que elementos reaparecen en posiciones exactas.

### Pruebas de Integridad
1. Manipular manualmente `localStorage` para corromper un JSON.
2. Recargar.
3. Verificar que la app carga sin crashear (ignorando datos corruptos).

---

## 📋 API Pública (Internal)

### `DynamicElementsManager`

- `addElement(data)`: Registra nuevo elemento.
- `updateElement(id, updates)`: Modifica propiedades.
- `deleteElement(id)`: Elimina y limpia.
- `saveElements()`: Fuerza guardado a disco.
- `getAllElements()`: Retorna copia del estado actual.

---

**Desarrollado por:** Antigravity AI  
**Módulo:** Core Persistence System
