# 🚀 Guía de Integración Rápida - Sistema de Tiempo Real

## ⚡ Inicio Rápido (5 minutos)

### Paso 1: Incluir Scripts

Agregar en `index.html` **antes** de `</body>`:

```html
<!-- Sistema de Tiempo Real - AGREGAR ANTES DE LOS SCRIPTS EXISTENTES -->
<script src="js/realtime-state-manager.js"></script>
<script src="js/realtime-preview-updater.js"></script>
<script src="js/realtime-layer-sync.js"></script>
<script src="js/realtime-integration.js"></script>

<!-- Scripts existentes del editor -->
<script src="js/storage.js"></script>
<script src="js/preview.js"></script>
<script src="js/editor.js"></script>
<!-- ... resto de scripts ... -->
```

### Paso 2: Verificar Instalación

Abrir consola del navegador (F12) y ejecutar:

```javascript
// Debe mostrar: true
console.log(window.realtimeIntegration.isInitialized);

// Mostrar panel de métricas
showRealtimeMetrics();
```

### Paso 3: ¡Listo!

El sistema está funcionando. Prueba:
- ✅ Escribir en cualquier campo → Vista previa se actualiza automáticamente
- ✅ `Ctrl+Z` → Deshacer cambios
- ✅ `Ctrl+Y` → Rehacer cambios
- ✅ `Ctrl+S` → Guardar

---

## 🎯 Funcionalidades Principales

### 1. Actualización Automática de Vista Previa

**Sin hacer nada adicional:**
- Cualquier cambio en formularios actualiza la vista previa
- Debouncing inteligente (no lag)
- Feedback visual durante actualizaciones

### 2. Undo/Redo

**Atajos de teclado:**
- `Ctrl+Z` o `Cmd+Z`: Deshacer
- `Ctrl+Shift+Z` o `Ctrl+Y` o `Cmd+Y`: Rehacer

**Programático:**
```javascript
window.realtimeStateManager.undo();
window.realtimeStateManager.redo();
```

### 3. Panel de Capas Sincronizado

**Acciones disponibles:**
- 👁️ Mostrar/Ocultar
- 🔒 Bloquear/Desbloquear
- 📋 Duplicar
- 🗑️ Eliminar
- Arrastrar para reordenar
- Doble clic para renombrar

### 4. Auto-Guardado

El sistema guarda automáticamente cada cambio (con debouncing de 1 segundo).

---

## 🔧 Personalización

### Ajustar Velocidad de Actualización

```javascript
// Más rápido (100ms)
window.realtimeStateManager.debounceDelays.preview = 100;

// Más lento (300ms)
window.realtimeStateManager.debounceDelays.preview = 300;
```

### Deshabilitar Animaciones

```javascript
const layerSync = window.realtimeIntegration.layerSync;
layerSync.config.enableAnimations = false;
```

### Cambiar Tamaño del Historial

```javascript
// 100 acciones en lugar de 50
window.realtimeStateManager.history.maxSize = 100;
```

---

## 📊 Debugging

### Ver Métricas en Tiempo Real

```javascript
// Panel visual
showRealtimeMetrics();

// En consola
const metrics = window.realtimeIntegration.getMetrics();
console.table(metrics);
```

### Ver Estado Actual

```javascript
// Estado completo
console.log(window.realtimeStateManager.getState());

// Solo datos de invitación
console.log(window.realtimeStateManager.getInvitationData());
```

### Activar Logs Detallados

```javascript
localStorage.setItem('DEBUG_REALTIME', 'true');
location.reload();
```

---

## 🎨 Demo Interactiva

Abrir en navegador: `demo-realtime.html`

Incluye:
- Formulario de ejemplo
- Vista previa en tiempo real
- Métricas en vivo
- Botones de Undo/Redo

---

## 🐛 Solución de Problemas

### El sistema no se inicializa

**Verificar:**
1. Scripts cargados en orden correcto
2. No hay errores en consola
3. `window.realtimeIntegration` existe

**Solución:**
```javascript
// Forzar inicialización
window.realtimeIntegration.initialize();
```

### Vista previa no se actualiza

**Verificar:**
1. `window.invitationPreview` existe
2. No hay errores de renderizado

**Solución:**
```javascript
// Forzar actualización
window.realtimeIntegration.previewUpdater.forceUpdate();
```

### Undo/Redo no funciona

**Verificar:**
```javascript
// Ver historial
console.log(window.realtimeStateManager.history);
```

**Solución:**
```javascript
// Limpiar y empezar de nuevo
window.realtimeStateManager.clearHistory();
```

---

## 📚 Documentación Completa

Ver `docs/REALTIME_SYSTEM.md` para:
- Arquitectura detallada
- API completa
- Ejemplos avanzados
- Mejores prácticas

---

## ✅ Checklist de Integración

- [ ] Scripts incluidos en `index.html`
- [ ] Página cargada sin errores
- [ ] `window.realtimeIntegration.isInitialized === true`
- [ ] Vista previa se actualiza al escribir
- [ ] `Ctrl+Z` deshace cambios
- [ ] `showRealtimeMetrics()` funciona
- [ ] Demo (`demo-realtime.html`) funciona

---

## 🎓 Ejemplos de Uso

### Actualizar Campo Programáticamente

```javascript
const stateManager = window.realtimeStateManager;

// Un campo
stateManager.updateField('eventName', 'Mi Evento');

// Múltiples campos
stateManager.updateFields({
    eventName: 'Mi Evento',
    eventDate: '2024-12-25',
    primaryColor: '#ff0000'
});
```

### Suscribirse a Cambios

```javascript
// Suscribirse a cambios de datos
const unsubscribe = stateManager.subscribe('data', (notification) => {
    console.log('Datos actualizados:', notification.data);
});

// Desuscribirse cuando ya no sea necesario
unsubscribe();
```

### Batch Updates (Múltiples Cambios)

```javascript
// Agrupa múltiples cambios en una sola actualización
stateManager.batch(() => {
    stateManager.updateField('field1', 'value1');
    stateManager.updateField('field2', 'value2');
    stateManager.updateField('field3', 'value3');
    // Solo 1 renderizado al final
});
```

---

## 🚀 Próximos Pasos

1. **Probar el sistema** con `demo-realtime.html`
2. **Integrar en tu proyecto** siguiendo Paso 1
3. **Verificar funcionamiento** con checklist
4. **Personalizar** según necesidades
5. **Leer documentación completa** si necesitas features avanzadas

---

## 💡 Tips

- El sistema es **retrocompatible**: funciona con código existente sin cambios
- Usa `showRealtimeMetrics()` para monitorear rendimiento
- El debouncing evita actualizaciones excesivas automáticamente
- Todas las acciones son reversibles con Undo/Redo
- El auto-guardado funciona automáticamente

---

## 📞 Ayuda

Si tienes problemas:
1. Revisa la consola del navegador
2. Ejecuta `showRealtimeMetrics()`
3. Verifica el checklist de integración
4. Consulta `docs/REALTIME_SYSTEM.md`

---

**¡Listo para usar!** 🎉

El sistema está diseñado para funcionar "out of the box" sin configuración adicional.
