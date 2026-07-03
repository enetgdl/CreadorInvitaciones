# CONTEXT.md - Contexto Maestro del Proyecto

> **Archivo generado automáticamente** - Última actualización: 2026-06-29
> **Objetivo:** Eliminar escaneos recursivos innecesarios en futuras sesiones

---

## 1. STACK TECNOLÓGICO REAL

| Tecnología | Versión/Detalle | Uso |
|------------|-----------------|-----|
| **HTML5** | Vanilla HTML5 | Estructura principal (index.html) |
| **CSS3** | Vanilla CSS3 + CSS Variables | Estilos (10 archivos en /css) |
| **JavaScript** | Vanilla ES6+ (Clases, Módulos) | Toda la lógica (~80 archivos en /js) |
| **PHP** | ❌ NO SE USA | - |
| **SQLite** | ❌ NO SE USA | - |
| **localStorage** | Web API nativa | Persistencia de datos |
| **Web Crypto API** | AES-256-GCM + PBKDF2 | Encriptación (SecureVault) |
| **Google Fonts** | CDN externo | Fuentes tipográficas |
| **Servidor Local** | XAMPP (Apache) | Desarrollo local |

**Filosofía del proyecto:** Vanilla puro. Sin frameworks (React, Vue, Angular). Sin dependencias npm. Sin build tools. Todo el código es JavaScript vanilla con clases ES6.

---

## 2. ARQUITECTURA Y JERARQUÍA

```
CreadorInvitaciones/
│
├── index.html                    # PUNTO DE ENTRADA - Editor principal
│
├── css/                          # ESTILOS
│   ├── editor.css               # Estilos base del editor (~3088 líneas)
│   ├── design-advanced.css      # Efectos de diseño avanzados
│   ├── design-sections.css      # Secciones del diseñador
│   ├── gallery-editor.css       # Editor de galería
│   ├── enhanced-layer-panel.css # Panel de capas mejorado
│   ├── history-panel.css        # Panel de historial
│   ├── invitation.css           # Estilos de invitación generada
│   ├── scrollbars.css           # Scrollbars personalizados
│   ├── settings.css             # Estilos de configuración
│   └── animations.css           # Animaciones CSS
│
├── js/                           # LÓGICA (80+ archivos)
│   ├── editor.js                # CLASE PRINCIPAL - InvitationEditor
│   ├── storage.js               # Persistencia localStorage
│   ├── preview.js               # Vista previa en iframe
│   ├── export.js                # Exportación HTML/ZIP
│   │
│   ├── [Gestores de Capas]
│   │   ├── layer-manager.js     # Gestión del panel de capas
│   │   ├── layer-store.js       # Store Flux para capas
│   │   ├── layer-sync.js        # Sincronización de capas
│   │   ├── enhanced-layer-realtime-sync.js
│   │   └── layer-manager-integration-example.js
│   │
│   ├── [Gestores de Multimedia]
│   │   ├── gallery-manager.js   # Gestor de galería de fotos
│   │   ├── gallery-manager-enhanced.js
│   │   ├── media-processor.js   # Procesamiento de medios
│   │   ├── media-persistence-manager.js
│   │   ├── media-upload-ui.js   # Interfaz de subida
│   │   └── image-optimizer.js   # Optimización de imágenes
│   │
│   ├── [Sistema de Historial]
│   │   ├── history-manager.js   # Undo/Redo
│   │   ├── history-panel.js     # Panel visual de historial
│   │   ├── history-dropdown.js  # Dropdown de historial
│   │   └── history-deduplication-cleanup.js
│   │
│   ├── [Sistema de Tiempo Real]
│   │   ├── realtime-state-manager.js
│   │   ├── realtime-preview-updater.js
│   │   ├── realtime-layer-sync.js
│   │   └── realtime-integration.js
│   │
│   ├── [Diseño y Efectos]
│   │   ├── visual-editor.js     # Editor visual
│   │   ├── design-advanced-integrator.js
│   │   ├── gradient-editor.js   # Editor de degradados
│   │   ├── advanced-effects.js  # Efectos avanzados
│   │   ├── advanced-fill-modal.js
│   │   ├── texture-manager.js   # Gestor de texturas
│   │   └── style-manager.js     # Gestor de estilos
│   │
│   ├── [Funcionalidad]
│   │   ├── fonts.js             # Gestión de fuentes
│   │   ├── countdown.js         # Cuenta regresiva
│   │   ├── qr-generator.js      # Generador QR
│   │   ├── map-search.js        # Búsqueda de mapas
│   │   ├── dynamic-elements-manager.js
│   │   └── template-manager.js  # Gestor de plantillas
│   │
│   ├── [Config Manager (ES Modules)]
│   │   ├── config-manager.js    # Orquestador principal
│   │   ├── security.js          # Encriptación AES-256-GCM
│   │   ├── schema-validator.js  # Validación de esquemas
│   │   ├── storage-adapter.js   # Adaptador de almacenamiento
│   │   └── audit-logger.js      # Registro de auditoría
│   │
│   ├── [Interfaz]
│   │   ├── accordion-menu.js    # Menú acordeón
│   │   ├── app-menu.js          # Menú de aplicación
│   │   ├── top-menu.js          # Barra superior
│   │   ├── canvas-controls.js   # Controles del canvas
│   │   ├── device-centering.js  # Centrado por dispositivo
│   │   ├── responsive-centering-manager.js
│   │   ├── responsive-viewport-manager.js
│   │   └── ui-enhancements.js   # Mejoras de UI
│   │
│   └── [Tests]
│       └── tests/               # Pruebas unitarias (20+ archivos)
│
├── tests/                        # Tests de integración
│   └── intelligent-collage.test.js
│
├── resources/                     # Recursos estáticos
│   └── bubble.png
│
├── docs/                          # Documentación (70+ archivos .md)
│
├── backup/                        # Respaldos (.rar)
│
├── .agents/skills/               # Skills de IA
│
└── .gemini/docs/                  # Documentación Gemini
```

---

## 3. MAPA DE FUNCIONES IMPLEMENTADAS

### 3.1 Núcleo del Editor

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **InvitationEditor** | `editor.js` | Clase principal. Coordina todos los módulos, maneja eventos del usuario, auto-guardado |
| **InvitationStorage** | `storage.js` | Persistencia en localStorage. CRUD de datos de invitación |
| **InvitationPreview** | `preview.js` | Renderizado en iframe con debounce. Genera HTML/CSS de la invitación |
| **InvitationExporter** | `export.js` | Exportación como HTML standalone o ZIP. Genera paquete descargable |

### 3.2 Sistema de Capas (Flux Architecture)

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **LayerManager** | `layer-manager.js` | Panel de capas UI. Rendering diferencial (diffing) |
| **LayerStore** | `layer-store.js` | Store centralizado con suscriptores (patrón Flux) |
| **LayerSync** | `layer-sync.js` | Sincronización bidireccional DOM ↔ Store |
| **EnhancedLayerRealtimeSync** | `enhanced-layer-realtime-sync.js` | Sincronización en tiempo real mejorada |

### 3.3 Multimedia y Galería

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **GalleryManager** | `gallery-manager.js` | Gestión de galería de fotos (collage/carrusel) |
| **GalleryManagerEnhanced** | `gallery-manager-enhanced.js` | Galería mejorada con más opciones |
| **MediaProcessor** | `media-processor.js` | Procesamiento y compresión de imágenes |
| **MediaPersistenceManager** | `media-persistence-manager.js` | Persistencia de medios en localStorage |
| **ImageOptimizer** | `image-optimizer.js` | Optimización de tamaño de imágenes |
| **IntelligentCollageGenerator** | `intelligent-collage-generator.js` | Generación inteligente de collages |
| **MasonryCollageGenerator** | `masonry-collage-generator.js` | Collages estilo masonry |

### 3.4 Sistema de Historial

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **HistoryManager** | `history-manager.js` | Undo/Redo con deduplicación y prioridades |
| **HistoryPanel** | `history-panel.js` | Panel visual del historial |
| **HistoryDropdown** | `history-dropdown.js` | Dropdown de historial |
| **HistoryDeduplicationCleanup** | `history-deduplication-cleanup.js` | Limpieza de entradas duplicadas |

### 3.5 Diseño y Efectos

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **VisualEditor** | `visual-editor.js` | Editor visual de elementos |
| **GradientEditor** | `gradient-editor.js` | Editor de degradados (lineal/radial) |
| **AdvancedEffects** | `advanced-effects.js` | Efectos visuales avanzados |
| **AdvancedFillModal** | `advanced-fill-modal.js` | Modal de relleno avanzado |
| **TextureManager** | `texture-manager.js` | Gestión de texturas |
| **StyleManager** | `style-manager.js` | Gestión de estilos |
| **DesignAdvancedIntegrator** | `design-advanced-integrator.js` | Integrador de diseño avanzado |

### 3.6 Funcionalidad Específica

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **Countdown** | `countdown.js` | Cuenta regresiva para el evento |
| **QRGenerator** | `qr-generator.js` | Generación de códigos QR |
| **MapSearch** | `map-search.js` | Búsqueda de ubicaciones (Google Maps) |
| **DynamicElementsManager** | `dynamic-elements-manager.js` | Elementos dinámicos de la invitación |
| **TemplateManager** | `template-manager.js` | Gestión de plantillas |
| **Fonts** | `fonts.js` | Gestión de fuentes tipográficas |

### 3.7 Config Manager (Sistema de Seguridad)

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **ConfigManager** | `config-manager.js` | Orquestador principal del sistema de configuración |
| **SecurityManager** | `security.js` | Encriptación AES-256-GCM con PBKDF2 |
| **SchemaValidator** | `schema-validator.js` | Validación de esquemas de configuración |
| **StorageAdapter** | `storage-adapter.js` | Adaptador de almacenamiento |
| **AuditLogger** | `audit-logger.js` | Registro de auditoría |

### 3.8 Interfaz de Usuario

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **AccordionMenu** | `accordion-menu.js` | Menú acordeón lateral |
| **AppMenu** | `app-menu.js` | Menú de aplicación |
| **TopMenu** | `top-menu.js` | Barra de menú superior |
| **CanvasControls** | `canvas-controls.js` | Controles del canvas |
| **DeviceCentering** | `device-centering.js` | Centrado por tipo de dispositivo |
| **ResponsiveCenteringManager** | `responsive-centering-manager.js` | Centrado responsive |
| **ResponsiveViewportManager** | `responsive-viewport-manager.js` | Gestión de viewport responsive |
| **UIEnhancements** | `ui-enhancements.js` | Mejoras de interfaz |
| **SettingsManager** | `settings-manager.js` | Gestor de configuración del sistema |
| **RSVPHelpModal** | `rsvp-help-modal.js` | Modal de ayuda RSVP |

---

## 4. DIRECTIVAS DE SEGURIDAD Y DISEÑO

### 4.1 Sistema de Encriptación (SecureVault)

```javascript
// Ubicación: js/config-manager/security.js
// Algoritmo: AES-256-GCM
// Derivación: PBKDF2 con 100,000 iteraciones (NIST/OWASP)
// Salt: 16 bytes aleatorios
// IV: 12 bytes aleatorios
```

**Reglas:**
- TODOS los datos sensibles se encriptan antes de localStorage
- Nunca almacenar contraseñas en texto plano
- Usar Web Crypto API (nativa del navegador)
- Salt e IV siempre aleatorios por cada operación

### 4.2 Validación de Datos

```javascript
// Ubicación: js/config-manager/schema-validator.js
// Todas las entradas se validan contra esquemas definidos
```

**Reglas:**
- Validar TODOS los campos del formulario antes de guardar
- Sanitizar entradas de texto (prevenir XSS)
- Usar tipos de datos estrictos
- Rechazar datos que no cumplan el esquema

### 4.3 Persistencia Segura

```javascript
// Claves de localStorage:
// - 'invitation_data'     → Datos principales de la invitación
// - 'editorSettings'      → Configuración del editor
// - 'app_config_vault'    → Configuración encriptada
// - 'invitacion_history_undo' → Pila de deshacer
// - 'invitacion_history_redo' → Pila de rehacer
```

**Reglas:**
- Nunca guardar datos sensibles sin encriptar
- Implementar auto-guardado con intervalo configurable
- Mantener respaldo de datos críticos
- Valid integridad de datos al cargar

### 4.4 Restricciones de Arquitectura

- **NO** se usan frameworks externos (React, Vue, Angular)
- **NO** se usan dependencias npm/package.json
- **NO** se usa PHP ni bases de datos SQL
- **NO** se hacen llamadas a APIs externas excepto Google Fonts y Google Maps
- **TODO** es vanilla JavaScript con clases ES6
- **TODO** se almacena en localStorage del navegador

---

## 5. GUÍA DE ESTILO Y CONVENCIONES

### 5.1 Nomenclatura de Archivos

```
js/
├── nombre-modulo.js              # snake_case para archivos
├── nombre-modulo-enhanced.js     # Sufijos para versiones mejoradas
├── config-manager/               # camelCase para directorios
│   ├── config-manager.js
│   └── security.js
└── tests/                        # Tests en subdirectorio
    └── nombre-test.js
```

### 5.2 Nomenclatura de Código

```javascript
// Clases: PascalCase
class InvitationEditor { }
class LayerManager { }
class HistoryManager { }

// Métodos: camelCase
initialize() { }
loadFormValues() { }
setupEventListeners() { }

// Variables: camelCase
const storageKey = 'invitation_data';
let autoSaveTimer = null;

// Constantes: UPPER_SNAKE_CASE (solo para valores globales)
const MAX_STATES = 20;
const DEBOUNCE_DELAY = 300;

// IDs de elementos HTML: camelCase
const previewFrame = document.getElementById('previewFrame');
const eventType = document.getElementById('eventType');
```

### 5.3 Estructura de Archivos JavaScript

```javascript
/**
 * NOMBRE-ARCHIVO.JS - Descripción del Módulo
 * Responsabilidad principal del módulo
 */

class NombreClase {
    constructor() {
        // Inicialización de propiedades
    }

    /**
     * Descripción del método
     * @param {type} param - Descripción
     * @returns {type} Descripción
     */
    metodoPrincipal() {
        // Lógica del método
    }

    // Métodos privados con guion bajo
    _metodoPrivado() { }

    // Getters/Setters
    get propiedad() { }
    set propiedad(value) { }
}

// Inicialización global
const instancia = new NombreClase();
```

### 5.4 Estilos CSS

```css
/* Variables CSS en :root */
:root {
    --primary-color: #5327a0;
    --spacing-md: 1rem;
    --radius-md: 0.5rem;
}

/* Clases con snake_case o BEM */
.control-group { }
.control-label { }
.control-input { }
.btn-primary { }
.menu-bar-btn { }

/* Estados */
.active { }
.disabled { }
.hidden { }
```

### 5.5 Eventos y Comunicación

```javascript
// Eventos personalizados
window.dispatchEvent(new CustomEvent('settingsChanged', { detail: data }));

// Escuchar eventos
window.addEventListener('settingsChanged', (e) => {
    const settings = e.detail;
});

// Patrón de suscripción (Flux)
store.subscribe((state) => {
    this.renderFromState(state);
});
```

---

## 6. EXCLUSIONES (IGNORE LIST)

### 6.1 Carpetas a IGNORAR

| Carpeta | Razón |
|---------|-------|
| `backup/` | Respaldos .rar - No releven para desarrollo |
| `.agents/skills/` | Skills de IA - No parte del código del proyecto |
| `.gemini/docs/` | Documentación Gemini - No relevante |
| `node_modules/` | Si existe - Dependencias npm (no debería existir) |

### 6.2 Archivos a IGNORAR

| Archivo | Razón |
|---------|-------|
| `*.rar` | Archivos comprimidos de respaldo |
| `*.zip` | Archivos comprimidos |
| `*.log` | Archivos de registro |
| `*.tmp` | Archivos temporales |
| `*.bak` | Archivos de respaldo |
| `Thumbs.db` | Archivos de sistema Windows |
| `.DS_Store` | Archivos de sistema macOS |

### 6.3 Patrones de Archivos Temporales

```
**/*.tmp
**/*.bak
**/*.log
**/Thumbs.db
**/.DS_Store
**/*.rar
**/*.zip
```

### 6.4 Contenido a NO ESCANEAR

- Archivos de documentación (*.md) - Solo si se necesita contexto específico
- Archivos de test (*.test.js) - Solo si se van a modificar tests
- Archivos de demo (demo-*.html) - No son parte del código principal
- Archivos de funciones y mejoras (*.txt) - Notas históricas

---

## 7. ESTADO ACTUAL

### Tarea en Curso
> **Implementación de mejoras de seguridad y refactorización** - Fase 1 completada, Fase 2 en progreso

### Última Sesión
- **Fecha:** 2026-06-30
- **Acción:** Implementación de Fase 1 (Seguridad Crítica) y inicio de Fase 2 (Refactorización)

### Fase 1: Seguridad Crítica - COMPLETADA ✅
- ✅ Creado `js/sanitize.js` con funciones de sanitización (escapeHtml, escapeAttr, sanitizeUrl, sanitizeCoords, etc.)
- ✅ Incluido `sanitize.js` en `index.html` antes de otros scripts
- ✅ Aplicada sanitización en `preview.js` para todos los campos de texto (11 puntos críticos)
- ✅ Aplicada sanitización en `export.js` (meta tags y CSS variables)
- ✅ Validación de URLs en RSVP y QR con `sanitizeUrl()` y `sanitizeLinkUrl()`
- ✅ Validación de coordenadas del mapa con `sanitizeCoords()`
- ✅ Agregado CSP meta tag en `index.html`
- ✅ Agregada validación de URLs en formularios (`setupUrlValidation()`)

### Fase 2: Refactorización Arquitectónica - COMPLETADA ✅
- ✅ Creado `js/utils.js` con funciones compartidas (escapeHtml, formatBytes, debounce, throttle, etc.)
- ✅ Eliminada duplicación de `escapeHtml` en 3 archivos (realtime-layer-sync.js, enhanced-layer-realtime-sync.js, canvas-renderer.js)
- ✅ Centralizado patrón de notificaciones en `Utils.notify()`
- ✅ Actualizado `storage.js` para delegar notificaciones a `Utils.notify()`
- ⚠️ Separación de God Objects (preview.js, editor.js) - Requiere análisis posterior

### Fase 3: Mejoras de Rendimiento - COMPLETADA ✅
- ✅ Implementado método `compressImage()` en `storage.js` para comprimir imágenes antes de guardar
- ✅ Implementado método `compressGalleryImages()` para comprimir todas las imágenes de galería
- ✅ Agregado lazy loading a imágenes de galería (collage y carrusel)
- ✅ Optimizado renderizado de carrusel usando `img` tags en lugar de `background-image`

### Fase 4: Mejoras de UX - COMPLETADA ✅
- ✅ Implementados indicadores de error mejorados en formularios (CSS + JavaScript)
- ✅ Agregado modal de confirmación personalizado para acciones destructivas
- ✅ Mejorado feedback de guardado automático con indicador visual
- ✅ Implementado sistema de atajos de teclado con modal de ayuda (F1)

### Fase 5: Refactorización de God Objects - COMPLETADA ✅
- ✅ Refactorizado `preview.js` en módulos:
  - `preview-core.js` - Clase principal y métodos de inicialización
  - `preview-styles.js` - Generación de CSS y estilos
  - `preview-gallery.js` - Métodos de galería
  - `preview-effects.js` - Efectos de fondo y scripts
- ✅ Refactorizado `editor.js` en módulos:
  - `editor-core.js` - Clase principal e inicialización
  - `editor-forms.js` - Manejo de formularios
  - `editor-events.js` - Event listeners y atajos de teclado
  - `editor-validation.js` - Validación de campos
  - `editor-media.js` - Manejo de multimedia y exportación
- ✅ Actualizado `index.html` para incluir nuevos módulos
- ✅ `preview.js` reducido de 2445 a 16 líneas (solo orquestador)
- ✅ `editor.js` reducido de 1388 a 17 líneas (solo orquestador)

### Pendientes Conocidos
- ⚠️ Implementar sistema de notificaciones mejorado con posición dinámica

### Notas para Próxima Sesión
- Leer este archivo CONTEXT.md al inicio
- No escanear recursivamente el proyecto
- Usar este documento como fuente de verdad
- Verificar que los fixes de seguridad funcionan correctamente
- Las 5 fases están completadas - proyecto listo para uso

---

## 8. COMANDOS ÚTILES

```bash
# Iniciar servidor local (XAMPP)
# Apache debe estar corriendo en puerto 80

# Estructura rápida del proyecto
dir /s /b *.js
dir /s /b *.css
dir /s /b *.html

# Contar líneas de código
find . -name "*.js" | xargs wc -l
find . -name "*.css" | xargs wc -l
```

---

## 9. RESUMEN DE CAMBIOS IMPLEMENTADOS

### Archivos Creados
- `js/sanitize.js` - Funciones de sanitización para prevenir XSS
- `js/utils.js` - Funciones de utilidad compartidas
- `js/preview-core.js` - Núcleo de vista previa
- `js/preview-styles.js` - Estilos CSS de vista previa
- `js/preview-gallery.js` - Métodos de galería
- `js/preview-effects.js` - Efectos de fondo
- `js/editor-core.js` - Núcleo del editor
- `js/editor-forms.js` - Manejo de formularios
- `js/editor-events.js` - Event listeners
- `js/editor-validation.js` - Validación de campos
- `js/editor-media.js` - Manejo de multimedia

### Archivos Modificados
- `index.html` - Agregado CSP meta tag, incluidos todos los nuevos módulos
- `preview.js` - Aplicada sanitización, refactorizado en módulos
- `export.js` - Aplicada sanitización a meta tags y CSS variables
- `storage.js` - Implementada compresión de imágenes, indicador de guardado
- `realtime-layer-sync.js` - Actualizado para usar Utils.escapeHtml()
- `enhanced-layer-realtime-sync.js` - Actualizado para usar Utils.escapeHtml()
- `canvas-renderer.js` - Actualizado para usar Utils.escapeHtml()
- `css/editor.css` - Agregados estilos de validación, modales, atajos de teclado

### Seguridad Implementada
- ✅ Sanitización de HTML en todos los campos de usuario
- ✅ Validación de URLs (RSVP, QR, Mapa)
- ✅ Content Security Policy (CSP)
- ✅ Escape de atributos HTML
- ✅ Logging de eventos de seguridad

### Rendimiento Mejorado
- ✅ Compresión de imágenes antes de guardar
- ✅ Lazy loading en imágenes de galería
- ✅ Optimización de renderizado de carrusel

### UX Mejorada
- ✅ Indicadores de error visuales en formularios
- ✅ Modales de confirmación personalizados
- ✅ Indicador de guardado automático
- ✅ Sistema de atajos de teclado (F1 para ayuda)

### Arquitectura Refactorizada
- ✅ God Objects divididos en módulos más pequeños
- ✅ Código reutilizable centralizado en utils.js
- ✅ Eliminación de duplicación de código
- ✅ Estructura modular más mantenible

---

*Este archivo es la fuente de verdad del proyecto. Actualizar cuando haya cambios significativos en la arquitectura.*
*Última actualización: 2026-06-30 - Implementación de Fase 1 (Seguridad), Fase 2 (Refactorización), Fase 3 (Rendimiento), Fase 4 (UX) y Fase 5 (God Objects)*
