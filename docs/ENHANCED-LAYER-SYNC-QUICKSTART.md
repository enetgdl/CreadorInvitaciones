# 🚀 Guía Rápida - Enhanced Layer Realtime Sync

## ⏱️ Inicio en 2 Minutos

### 1. Verificar Instalación

Abre la consola del navegador (F12) y ejecuta:

```javascript
console.log(window.enhancedLayerSync ? '✅ Sistema instalado' : '❌ No instalado');
```

### 2. Ver Estado Actual

```javascript
const sync = window.enhancedLayerSync;
const metrics = sync.getMetrics();
console.table(metrics);
```

### 3. Ejecutar Tests

```javascript
await EnhancedLayerSyncTests.runAll();
```

---

## 🎯 Acciones Comunes

### Crear Nueva Invitación

```javascript
// Opción 1: Disparar evento
window.dispatchEvent(new CustomEvent('newInvitationCreated'));

// Opción 2: Método directo
await enhancedLayerSync.handleNewInvitationCreated();
```

### Seleccionar Capa

```javascript
enhancedLayerSync.selectLayer('mi-elemento-id');
```

### Ver Métricas de Rendimiento

```javascript
const metrics = enhancedLayerSync.getMetrics();
console.log(`⏱️ Tiempo promedio: ${metrics.averageUpdateTime.toFixed(2)}ms`);
console.log(`📊 Total actualizaciones: ${metrics.totalUpdates}`);
console.log(`🎯 Capas actuales: ${metrics.layerCount}`);
```

### Validar Consistencia

```javascript
enhancedLayerSync.validateConsistency();
```

---

## 🧪 Tests Rápidos

### Test Básico

```javascript
// Crear elemento
const test = document.createElement('div');
test.id = 'test-' + Date.now();
test.textContent = 'Test Layer';
document.getElementById('deviceScreen').appendChild(test);

// Esperar 100ms
await new Promise(r => setTimeout(r, 100));

// Verificar que se sincronizó
const metrics = enhancedLayerSync.getMetrics();
console.log('✓ Capas:', metrics.layerCount);

// Limpiar
test.remove();
```

### Test de Estrés

```javascript
await EnhancedLayerSyncTests.runStress();
```

---

## ⚙️ Configuración

### Ajustar Delays

```javascript
const sync = enhancedLayerSync;

// Más rápido (más CPU)
sync.config.batchUpdateDelay = 20;

// Más lento (menos CPU)
sync.config.batchUpdateDelay = 50;
```

### Desactivar Animaciones

```javascript
enhancedLayerSync.config.enableAnimations = false;
```

### Desactivar Validación Automática

```javascript
enhancedLayerSync.config.enableConsistencyCheck = false;
```

---

## 🐛 Debugging

### Ver Estado Interno

```javascript
const sync = enhancedLayerSync;
console.log('Estado:', sync.internalState);
console.log('Capas:', Array.from(sync.internalState.layers.entries()));
```

### Activar Logs Detallados

```javascript
localStorage.setItem('DEBUG_LAYER_SYNC', 'true');
location.reload();
```

### Health Check

```javascript
function healthCheck() {
    const s = enhancedLayerSync;
    return {
        inicializado: !!s,
        canvas: !!s.canvas,
        panel: !!s.layerList,
        observadores: !!s.mutationObserver,
        capas: s.internalState.layers.size,
        tiempoPromedio: s.getMetrics().averageUpdateTime + 'ms'
    };
}

console.table(healthCheck());
```

---

## 📱 Demo Interactiva

### 1. Crear 10 Capas

```javascript
const canvas = document.getElementById('deviceScreen');
for (let i = 0; i < 10; i++) {
    const el = document.createElement('div');
    el.id = `demo-${i}-${Date.now()}`;
    el.textContent = `Demo ${i}`;
    el.style.cssText = `position:absolute;left:${i*20}px;top:${i*20}px;width:100px;height:50px;background:hsl(${i*36},70%,50%);`;
    canvas.appendChild(el);
    await new Promise(r => setTimeout(r, 100));
}
```

### 2. Ver Panel Actualizado

El panel debería mostrar las 10 capas creadas con sus respectivos colores e íconos.

### 3. Limpiar Todo

```javascript
await enhancedLayerSync.handleNewInvitationCreated();
```

---

## 📊 Monitoreo Continuo

### Auto-Logging Cada Minuto

```javascript
setInterval(() => {
    const m = enhancedLayerSync.getMetrics();
    console.log(`[${new Date().toLocaleTimeString()}] Capas: ${m.layerCount} | Updates: ${m.totalUpdates} | Avg: ${m.averageUpdateTime.toFixed(2)}ms`);
}, 60000);
```

---

## 🎓 Ejemplos Prácticos

### Ejemplo 1: Elemento Personalizado

```javascript
const canvas = document.getElementById('deviceScreen');
const myLayer = document.createElement('div');
myLayer.id = 'my-custom-layer';
myLayer.dataset.elementId = 'custom-1';
myLayer.dataset.layerName = 'Mi Capa Personalizada';
myLayer.className = 'text';
myLayer.textContent = 'Hola Mundo';

canvas.appendChild(myLayer);

// Automáticamente aparece en el panel
```

### Ejemplo 2: Interacción con Panel

```javascript
// Seleccionar capa programáticamente
enhancedLayerSync.selectLayer('my-custom-layer');

// Escuchar cuando se selecciona
window.addEventListener('elementSelected', (e) => {
    console.log('Seleccionado:', e.detail.elementId);
});
```

### Ejemplo 3: Integración con Tu Código

```javascript
// Tu función que crea elementos
function crearElementoPersonalizado(tipo, contenido) {
    const el = document.createElement('div');
    el.id = `elemento-${Date.now()}`;
    el.dataset.elementId = el.id;
    el.className = tipo;
    el.textContent = contenido;
    
    document.getElementById('deviceScreen').appendChild(el);
    
    // El sistema sincroniza automáticamente
    // No necesitas llamar a nada más
}

// Usar
crearElementoPersonalizado('text', '¡Nuevo texto!');
```

---

## ✅ Checklist de Funcionalidad

Usa esto para verificar que todo funciona:

- [ ] `window.enhancedLayerSync` existe
- [ ] Se muestran capas en el panel
- [ ] Al crear elemento nuevo, aparece en panel
- [ ] Al eliminar elemento, desaparece del panel
- [ ] Click en capa selecciona elemento
- [ ] Botones de visibilidad funcionan
- [ ] Botones de bloqueo funcionan
- [ ] Botón de eliminar funciona
- [ ] Nueva invitación limpia el panel
- [ ] Tests pasan exitosamente
- [ ] Tiempo de actualización < 100ms

---

## 🆘 Problemas Comunes

### "Panel no se actualiza"

```javascript
enhancedLayerSync.performInitialSync();
```

### "Elementos fantasma"

```javascript
enhancedLayerSync.validateConsistency();
```

### "Muy lento"

```javascript
const m = enhancedLayerSync.getMetrics();
console.log('Tiempo:', m.averageUpdateTime);
// Si > 100ms:
enhancedLayerSync.config.batchUpdateDelay = 20;
```

---

## 📚 Referencias Rápidas

- [Documentación Completa](./ENHANCED-LAYER-SYNC-README.md)
- [Código Fuente](../js/enhanced-layer-realtime-sync.js)
- [Tests](../js/tests/enhanced-layer-sync-test.js)
- [Estilos](../css/enhanced-layer-panel.css)

---

## 🎯 Siguiente Paso

¡Abre tu editor y prueba el sistema!

```javascript
// Ejecuta esto en la consola:
await EnhancedLayerSyncTests.runAll();
```

Si todos los tests pasan, ¡estás listo! 🎉

---

**Tip:** Mantén la consola abierta para ver logs y métricas en tiempo real.
