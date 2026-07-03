# Panel de Historia - Documentación Completa

## 📋 Descripción General

El **Panel de Historia de Acciones** es una funcionalidad avanzada que registra de manera exhaustiva todas las acciones realizadas en el canvas del editor de invitaciones. Proporciona capacidades completas de hacer/deshacer con navegación visual, filtrado y gestión inteligente del espacio.

## ✨ Características Principales

### 1. Registro Exhaustivo de Acciones
El panel captura y almacena:
- ✅ Modificaciones de elementos
- ✅ Cambios de propiedades
- ✅ Transformaciones (mover, redimensionar, rotar, escalar)
- ✅ Movimientos y posicionamiento
- ✅ Inserciones y eliminaciones
- ✅ Cambios de color, tamaño, posición, rotación
- ✅ Aplicación de rellenos, degradados y texturas
- ✅ Modificaciones de fuentes y estilos de texto
- ✅ Cambios en capas y ordenamiento (z-index)
- ✅ Subida y eliminación de multimedia

### 2. Modos de Visualización

#### Modo Ventana Flotante
- Panel independiente que se puede arrastrar libremente
- Posicionamiento automático para evitar superposición con el canvas
- Opción de fijar (pin) para mantener la posición sin auto-ajuste

#### Modo Adosado (Docked)
- Se integra en el panel lateral derecho
- Comparte espacio con el panel "Relleno Avanzado"
- **Gestión Dinámica de Espacio 50/50**:
  - Cuando ambos paneles están adosados: división 50/50 de la altura disponible
  - Cuando solo uno está adosado: ocupa 100% de la altura
  - Transiciones suaves al cambiar entre modos

### 3. Interfaz de Usuario

#### Filtros de Acciones
- **Todas**: Muestra todas las acciones sin filtrar
- **Elementos**: Crear, eliminar, duplicar elementos
- **Propiedades**: Modificaciones de atributos
- **Transformaciones**: Mover, redimensionar, rotar, escalar
- **Colores**: Cambios de colores, rellenos, degradados, texturas

#### Lista de Historial
La lista muestra dos tipos de acciones:

**Acciones Pasadas** (con opacity 0.85):
- Acciones que ya se han realizado
- Botón "↶" para deshacer hasta ese punto

**Acciones Futuras** (con opacity 0.5, borde discontinuo):
- Acciones que se han deshecho
- Botón "↷" para rehacer hasta ese punto

#### Información de Cada Acción
- 🎨 **Icono**: Representación visual del tipo de acción
- 📝 **Título**: Nombre descriptivo de la acción
- ⏰ **Timestamp**: Hora exacta (HH:mm:ss)
- 📅 **Tiempo Relativo**: "hace X segundos/minutos/horas"
- 🏷️ **Categoría**: Clasificación de la acción

#### Indicador de Estado Actual
Marcador visual especial que separa las acciones pasadas de las futuras:
- Diseño destacado con gradiente
- Texto "📍 Estado Actual"
- Líneas decorativas superiores e inferiores

### 4. Atajos de Teclado

El panel muestra los atajos disponibles:
- **Ctrl+Z**: Deshacer última acción
- **Ctrl+Y** o **Ctrl+Shift+Z**: Rehacer acción

### 5. Gestión de Historial

- **Límite Configurable**: Por defecto 20 acciones (configurable en `HistoryManager`)
- **Limpieza Manual**: Botón 🗑️ para borrar todo el historial
- **Persistencia**: El historial se guarda en localStorage
- **Deduplicación**: Sistema inteligente que evita duplicados consecutivos
- **Actualización Automática**: Se actualiza cada segundo cuando está visible

## 🎨 Tematización

El panel se integra perfectamente con el sistema de temas del editor:
- Usa las variables CSS del tema actual
- Colores dinámicos que siguen `--accent-color`, `--text-primary`, etc.
- Modo oscuro compatible
- Transiciones suaves en todos los estados

## 🔧 Arquitectura Técnica

### Archivos Principales

1. **`js/history-panel.js`** (743 líneas)
   - Clase `HistoryPanel`
   - Gestión de modos flotante/adosado
   - Renderizado de la lista
   - Filtrado de acciones
   - Integración con `HistoryManager`

2. **`css/history-panel.css`** (277 líneas)
   - Estilos del panel
   - Estilos de items de historia
   - Estados past/future
   - Responsive design

3. **Integración en `index.html`**
   - HTML del panel (líneas 1571-1625)
   - Botón en toolbar (línea ~274)
   - Link a CSS (línea 18)
   - Script de carga (línea 1649)

4. **Inicialización en `editor.js`**
   - Creación de instancia (líneas ~49-55)
   - Integración con `HistoryManager`

### Integración con Advanced Fill Modal

El `AdvancedFillModal` fue actualizado para llamar a `updatePanelSpacing()` del `HistoryPanel` en:
- `open()`: Al abrirse
- `close()`: Al cerrarse
- `toggleDocked()`: Al cambiar modo adosado/flotante

Esto asegura que ambos paneles ajusten su altura dinámicamente.

## 📊 Categorías de Acciones e Íconos

| Categoría | Ejemplos de Acciones | Ícono |
|-----------|---------------------|--------|
| Elementos | Crear, Eliminar, Duplicar | ➕ 🗑️ 📋 |
| Texto | Editar texto, Modificar título | 📝 |
| Color | Cambiar color, Aplicar degradado | 🎨 🌈 |
| Transformación | Mover, Redimensionar, Rotar | ⬌ ⇔ 🔄 |
| Estilo | Fuente, Sombra, Borde | 🔤 🌓 ◻️ |
| Multimedia | Imagen, Música, Video | 🖼️ 🎵 🎬 |
| Capas | Cambiar orden, z-index | 📚 |
| Interactivo | Mapa, QR, Enlaces | 📍 🔗 |

## 🚀 Uso del Panel

### Abrir el Panel
1. Click en el botón 🕐 (ícono de reloj) en la barra de herramientas superior
2. El panel se abre en modo flotante por defecto

### Cambiar a Modo Adosado
1. Click en el botón ⫶ (adosar) en el header del panel
2. El panel se posiciona automáticamente en el lateral derecho
3. Si "Relleno Avanzado" también está adosado, ambos se dividen 50/50

### Navegar en el Historial

**Deshacer acciones:**
- Click en el botón ↶ del item deseado
- Deshace todas las acciones hasta ese punto

**Rehacer acciones:**
- Click en el botón ↷ del item deseado (en la zona de futuro)
- Rehace todas las acciones hasta ese punto

**Usar atajos de teclado:**
- `Ctrl+Z`: Deshacer
- `Ctrl+Y`: Rehacer

### Filtrar Acciones
Click en los botones de filtro en la parte superior del panel:
- **Todas**: Sin filtro
- **Elementos**: Solo inserciones/eliminaciones
- **Propiedades**: Solo modificaciones de atributos
- **Transformaciones**: Solo cambios de posición/tamaño/rotación
- **Colores**: Solo cambios de color/relleno

### Limpiar Historial
1. Click en el botón 🗑️ en el header del panel
2. Confirmar la acción en el diálogo
3. Todo el historial se borra (acción irreversible)

## ⚙️ Configuración

### Límite de Acciones
En `js/history-manager.js`, línea 10:
```javascript
this.maxStates = 20; // Cambiar a 50, 100, etc.
```

### Intervalo de Actualización
En `js/history-panel.js`, línea 565:
```javascript
this.updateInterval = setInterval(() => {
    if (!this.modal.hidden) {
        this.renderHistoryList();
    }
}, 1000); // Cambiar intervalo en ms
```

### Ventana de Deduplicación
En `js/history-manager.js`, línea 19:
```javascript
this.deduplicationWindow = 100; // ms - ventana de deduplicación
```

## 🐛 Depuración

### Verificar Inicialización
```javascript
// En consola del navegador
console.log(window.invitationEditor.historyPanel);
console.log(window.invitationEditor.historyManager);
```

### Ver Stacks de Historia
```javascript
// Undo stack
console.table(window.invitationEditor.historyManager.undoStack);

// Redo stack
console.table(window.invitationEditor.historyManager.redoStack);
```

### Forzar Actualización del Panel
```javascript
window.invitationEditor.historyPanel.renderHistoryList();
```

## 📱 Responsive Design

El panel es completamente responsive:
- **> 480px**: Vista completa con todos los filtros
- **≤ 480px**: 
  - Filtros con tamaño reducido
  - Items más compactos
  - Iconos y texto más pequeños

## ♿ Accesibilidad

- Todos los botones tienen `aria-label` apropiado
- Listado semántico con `role="list"`
- Items con `role="menuitem"`
- Contraste WCAG AA cumplido
- Navegación por teclado soportada

## 🎯 Casos de Uso

### Diseñador Experimentando
1. Hacer múltiples cambios de color
2. Ver historial filtrado por "Colores"
3. Navegar rápidamente a estados anteriores

### Corrección de Errores
1. Realizar una acción incorrecta
2. Usar Ctrl+Z o click en el historial
3. Ver descripción clara de qué se deshizo

### Comparación de Estados
1. Trabajar en dos versiones diferentes
2. Usar historial para saltar entre estados
3. Elegir la versión preferida

### Aprendizaje
1. Ver registro detallado de acciones realizadas
2. Entender qué acciones se registran
3. Repetir secuencias de acciones

## 📈 Rendimiento

El sistema está optimizado para:
- **Almacenamiento Eficiente**: Solo guarda diferencias de estado
- **Renderizado Condicional**: Solo actualiza cuando visible
- **Deduplicación**: Evita entradas duplicadas
- **Límite de Historial**: Previene crecimiento excesivo
- **Actualización Inteligente**: Interval solo cuando panel abierto

## 🔮 Futuras Mejoras Potenciales

- [ ] Exportar historial como JSON
- [ ] Importar sesión de historial
- [ ] Marcadores/favoritos en el historial
- [ ] Búsqueda de acciones por texto
- [ ] Timeline visual con gráfico
- [ ] Comparación lado a lado de estados
- [ ] Agrupar acciones relacionadas
- [ ] Deshacer selectivo (cherry-pick)
- [ ] Historial persistente entre sesiones
- [ ] Colaboración multi-usuario

## 📝 Notas de Mantenimiento

- El sistema depende de `HistoryManager` existente
- Compatibilidad con `moment.js` para timestamps
- Usa sistema de temas CSS variables
- Requiere `localStorage` habilitado
- Compatible con todos los navegadores modernos

---

**Versión**: 1.0.0  
**Fecha de Implementación**: 2026-02-08  
**Autor**: Sistema Antigravity  
**Licencia**: Proyecto Privado
