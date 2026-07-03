# Sistema de Actualización en Tiempo Real

## 📋 Descripción General

Sistema completo de gestión de estado y actualización en tiempo real para el editor de invitaciones. Proporciona sincronización automática entre todos los componentes del editor sin retraso perceptible.

## 🏗️ Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                  Realtime Integration                        │
│                  (Coordinador Central)                       │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
    ┌────────▼────────┐            ┌─────────▼──────────┐
    │  State Manager  │            │  Preview Updater   │
    │  (Estado único) │            │  (Vista previa)    │
    └────────┬────────┘            └────────────────────┘
             │
    ┌────────▼────────┐
    │   Layer Sync    │
    │ (Panel capas)   │
    └─────────────────┘
```

### 1. **RealtimeStateManager** (`realtime-state-manager.js`)

**Responsabilidad:** Gestión centralizada del estado de la aplicación.

**Características:**
- ✅ Estado único de verdad (Single Source of Truth)
- ✅ Suscripciones por tipo de cambio (data, layers, selection, all)
- ✅ Debouncing configurable por tipo de actualización
- ✅ Historial undo/redo (hasta 50 acciones)
- ✅ Actualizaciones por lotes (batch updates)
- ✅ Métricas de rendimiento en tiempo real
- ✅ Manejo robusto de errores

**API Principal:**
```javascript
// Obtener instancia
const stateManager = window.realtimeStateManager;

// Actualizar datos
stateManager.updateField('eventName', 'Mi Evento');
stateManager.updateFields({ 
    eventName: 'Mi Evento',
    eventDate: '2024-12-25'
});

// Suscribirse a cambios
const unsubscribe = stateManager.subscribe('data', (notification) => {
    console.log('Datos actualizados:', notification.data);
});

// Deshacer/Rehacer
stateManager.undo();
stateManager.redo();

// Actualizaciones por lotes
stateManager.batch(() => {
    stateManager.updateField('primaryColor', '#ff0000');
    stateManager.updateField('secondaryColor', '#00ff00');
    // Solo se emite una notificación al final
});
```

### 2. **RealtimePreviewUpdater** (`realtime-preview-updater.js`)

**Responsabilidad:** Actualización automática de la vista previa.

**Características:**
- ✅ Detección instantánea de cambios
- ✅ Debouncing inteligente adaptativo
- ✅ Cola de actualizaciones optimizada
- ✅ Feedback visual durante actualizaciones
- ✅ Métricas de rendimiento (FPS, tiempo promedio)
- ✅ Observadores de DOM para cambios directos
- ✅ Actualización máxima de ~60fps

**Configuración:**
```javascript
const updater = new RealtimePreviewUpdater(preview, stateManager);

// Configuración personalizada
updater.config = {
    minUpdateInterval: 16,    // ~60fps
    maxUpdateInterval: 300,   // Máximo 300ms
    batchSize: 5,             // Agrupar hasta 5 cambios
    enableSmartDebounce: true // Debouncing adaptativo
};

// Forzar actualización inmediata
updater.forceUpdate();

// Obtener métricas
const metrics = updater.getMetrics();
console.log('Updates totales:', metrics.totalUpdates);
console.log('Tiempo promedio:', metrics.avgUpdateTime);
```

### 3. **RealtimeLayerSync** (`realtime-layer-sync.js`)

**Responsabilidad:** Sincronización bidireccional del panel de capas.

**Características:**
- ✅ Sincronización automática UI ↔ Estado
- ✅ Drag & Drop para reordenar capas
- ✅ Edición inline de nombres (doble clic)
- ✅ Acciones atómicas (mostrar/ocultar, bloquear, duplicar, eliminar)
- ✅ Animaciones suaves de entrada/salida
- ✅ Feedback visual inmediato
- ✅ Scroll automático a capa seleccionada

**Acciones Disponibles:**
- **Mostrar/Ocultar:** Click en 👁️
- **Bloquear/Desbloquear:** Click en 🔒
- **Duplicar:** Click en 📋
- **Eliminar:** Click en 🗑️ (con confirmación)
- **Renombrar:** Doble clic en nombre
- **Reordenar:** Arrastrar y soltar

**Uso Programático:**
```javascript
const layerSync = window.realtimeIntegration.layerSync;

// Las acciones se ejecutan automáticamente desde la UI
// También se pueden ejecutar programáticamente:
layerSync.toggleLayerVisibility('layer-id-123');
layerSync.duplicateLayer('layer-id-123');
layerSync.deleteLayer('layer-id-123');
```

### 4. **RealtimeIntegration** (`realtime-integration.js`)

**Responsabilidad:** Coordinación e integración de todos los sistemas.

**Características:**
- ✅ Auto-inicialización al cargar la página
- ✅ Conexión automática con editor existente
- ✅ Auto-guardado inteligente
- ✅ Atajos de teclado (Ctrl+Z, Ctrl+Y, Ctrl+S)
- ✅ Panel de métricas en tiempo real
- ✅ Manejo centralizado de errores

**Atajos de Teclado:**
- `Ctrl/Cmd + Z`: Deshacer
- `Ctrl/Cmd + Shift + Z` o `Ctrl/Cmd + Y`: Rehacer
- `Ctrl/Cmd + S`: Guardar

**Funciones Globales:**
```javascript
// Mostrar panel de métricas
showRealtimeMetrics();

// Acceder a la integración
const integration = window.realtimeIntegration;

// Obtener métricas
const metrics = integration.getMetrics();

// Forzar guardado
integration.save();
```

## 🚀 Instalación

### 1. Incluir Scripts en HTML

Agregar en `index.html` **antes** de los scripts del editor:

```html
<!-- Sistema de Tiempo Real -->
<script src="js/realtime-state-manager.js"></script>
<script src="js/realtime-preview-updater.js"></script>
<script src="js/realtime-layer-sync.js"></script>
<script src="js/realtime-integration.js"></script>

<!-- Scripts existentes del editor -->
<script src="js/storage.js"></script>
<script src="js/preview.js"></script>
<script src="js/editor.js"></script>
<!-- ... otros scripts ... -->
```

### 2. Verificar Inicialización

Abrir consola del navegador y verificar:

```javascript
// Debe mostrar: true
console.log(window.realtimeIntegration.isInitialized);

// Mostrar métricas
showRealtimeMetrics();
```

## 📊 Flujo de Datos

### Actualización de Campo

```
Usuario escribe en input
        ↓
Editor.handleFieldChange()
        ↓
StateManager.updateField()
        ↓
    ┌───┴───┐
    ↓       ↓
Preview  Storage
Update   Save
```

### Sincronización de Capas

```
Usuario hace clic en botón
        ↓
LayerSync.handleLayerAction()
        ↓
StateManager.updateLayer()
        ↓
    ┌───┴───┐
    ↓       ↓
  UI       Preview
Update     Update
```

## ⚡ Optimizaciones de Rendimiento

### Debouncing Inteligente

El sistema ajusta automáticamente los delays según la frecuencia de cambios:

- **Escritura rápida:** 200ms delay (evita actualizaciones excesivas)
- **Pausa detectada:** 50ms delay (respuesta casi inmediata)
- **Normal:** 150ms delay (balance óptimo)

### Batch Updates

Agrupa múltiples cambios en una sola actualización:

```javascript
stateManager.batch(() => {
    stateManager.updateField('field1', 'value1');
    stateManager.updateField('field2', 'value2');
    stateManager.updateField('field3', 'value3');
    // Solo 1 renderizado al final
});
```

### Métricas de Rendimiento

El sistema monitorea constantemente:
- Tiempo promedio de actualización
- Número de actualizaciones omitidas
- FPS efectivo de renderizado
- Tamaño de cola de actualizaciones

## 🐛 Debugging

### Activar Logs Detallados

```javascript
// En consola del navegador
localStorage.setItem('DEBUG_REALTIME', 'true');
location.reload();
```

### Ver Estado Actual

```javascript
// Estado completo
console.log(window.realtimeStateManager.getState());

// Solo datos de invitación
console.log(window.realtimeStateManager.getInvitationData());

// Historial
console.log(window.realtimeStateManager.history);
```

### Métricas en Tiempo Real

```javascript
// Panel visual
showRealtimeMetrics();

// Objeto de métricas
const metrics = window.realtimeIntegration.getMetrics();
console.table(metrics);
```

## 🔧 Configuración Avanzada

### Ajustar Delays de Debouncing

```javascript
const stateManager = window.realtimeStateManager;

stateManager.debounceDelays = {
    preview: 100,   // Más rápido
    storage: 2000,  // Más lento
    layers: 50      // Muy rápido
};
```

### Deshabilitar Animaciones

```javascript
const layerSync = window.realtimeIntegration.layerSync;

layerSync.config.enableAnimations = false;
```

### Cambiar Tamaño del Historial

```javascript
const stateManager = window.realtimeStateManager;

stateManager.history.maxSize = 100; // 100 acciones
```

## 🚨 Manejo de Errores

### Errores Automáticos

El sistema maneja automáticamente:
- Errores de renderizado (muestra notificación)
- Errores de sincronización (reintenta)
- Errores de guardado (notifica al usuario)

### Suscribirse a Errores

```javascript
stateManager.subscribe('all', (notification) => {
    if (notification.type === 'ERROR') {
        console.error('Error detectado:', notification.error);
        // Manejar error personalizado
    }
});
```

## 📈 Casos de Uso

### 1. Actualización Masiva de Datos

```javascript
const stateManager = window.realtimeStateManager;

stateManager.batch(() => {
    stateManager.updateFields({
        eventName: 'Boda de María y Juan',
        eventDate: '2024-06-15',
        eventTime: '18:00',
        primaryColor: '#ff69b4',
        secondaryColor: '#ffd700'
    });
});
```

### 2. Implementar Función Custom

```javascript
// Suscribirse a cambios específicos
stateManager.subscribe('data', (notification) => {
    if (notification.data.eventType === 'boda') {
        // Aplicar configuración especial para bodas
        applyWeddingTheme();
    }
});
```

### 3. Validación en Tiempo Real

```javascript
stateManager.subscribe('data', (notification) => {
    const data = notification.data;
    
    // Validar fecha
    if (data.eventDate) {
        const date = new Date(data.eventDate);
        if (date < new Date()) {
            showWarning('La fecha del evento ya pasó');
        }
    }
});
```

## 🎯 Mejores Prácticas

1. **Usar batch() para múltiples cambios:** Evita renderizados innecesarios
2. **No modificar state directamente:** Siempre usar métodos del StateManager
3. **Desuscribirse cuando no sea necesario:** Evita memory leaks
4. **Usar debouncing apropiado:** Preview rápido, Storage lento
5. **Monitorear métricas:** Detectar problemas de rendimiento temprano

## 🔄 Migración desde Sistema Anterior

Si ya tienes código que usa el editor directamente:

**Antes:**
```javascript
invitationEditor.handleFieldChange('eventName', 'Mi Evento');
```

**Ahora:**
```javascript
// Funciona igual, pero ahora usa el sistema de tiempo real
invitationEditor.handleFieldChange('eventName', 'Mi Evento');
```

El sistema es **retrocompatible** y se integra automáticamente.

## 📞 Soporte

Para reportar bugs o solicitar features:
1. Verificar métricas con `showRealtimeMetrics()`
2. Revisar consola del navegador
3. Incluir información de versión y navegador

## 🎓 Recursos Adicionales

- **Patrón Observer:** https://refactoring.guru/design-patterns/observer
- **Debouncing:** https://css-tricks.com/debouncing-throttling-explained-examples/
- **State Management:** https://kentcdodds.com/blog/application-state-management-with-react

---

**Versión:** 1.0.0  
**Última actualización:** 2026-02-02  
**Compatibilidad:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
