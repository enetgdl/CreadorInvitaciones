/**
 * LAYER-MANAGER-INTEGRATION-EXAMPLE.JS
 * Ejemplo de integración del Layer Manager con el editor
 * Demuestra cómo usar el sistema en un caso real
 */

// ============================================
// EJEMPLO 1: Integración Básica con Editor
// ============================================

class EditorLayerIntegration {
    constructor(editor, layerManager) {
        this.editor = editor;
        this.layerManager = layerManager;
        this.setupIntegration();
    }

    setupIntegration() {
        // Escuchar cambios en el editor
        this.editor.on('elementAdded', (elementData) => {
            this.handleElementAdded(elementData);
        });

        this.editor.on('elementRemoved', (elementId) => {
            this.handleElementRemoved(elementId);
        });

        this.editor.on('elementUpdated', (elementId, updates) => {
            this.handleElementUpdated(elementId, updates);
        });

        // Escuchar eventos del layer manager
        document.addEventListener('layerManager:layerSelected', (e) => {
            this.handleLayerSelected(e.detail);
        });

        document.addEventListener('layerManager:visibilityChanged', (e) => {
            this.handleVisibilityChanged(e.detail);
        });

        document.addEventListener('layerManager:lockChanged', (e) => {
            this.handleLockChanged(e.detail);
        });

        document.addEventListener('layerManager:layerDeleted', (e) => {
            this.handleLayerDeleted(e.detail);
        });
    }

    // Manejar adición de elemento en el editor
    handleElementAdded(elementData) {
        console.log('✨ Elemento agregado al editor:', elementData);

        // Crear capa automáticamente
        const layer = this.layerManager.createLayer({
            id: elementData.id,
            type: elementData.type,
            name: elementData.name || elementData.text || '',
            visible: true,
            locked: false,
            opacity: elementData.opacity || 100,
            zIndex: elementData.zIndex || this.editor.getNextZIndex(),
            properties: {
                ...elementData
            }
        });

        console.log('📝 Capa creada:', layer);
    }

    // Manejar eliminación de elemento en el editor
    handleElementRemoved(elementId) {
        console.log('🗑️ Elemento eliminado del editor:', elementId);

        // Eliminar capa correspondiente
        this.layerManager.removeElement(elementId);
    }

    // Manejar actualización de elemento en el editor
    handleElementUpdated(elementId, updates) {
        console.log('🔄 Elemento actualizado en editor:', elementId, updates);

        // Actualizar capa
        this.layerManager.updateElement(elementId, updates);
    }

    // Manejar selección de capa
    handleLayerSelected(detail) {
        console.log('🎯 Capa seleccionada:', detail.layerId);

        const layer = this.layerManager.getLayer(detail.layerId);
        if (layer) {
            // Seleccionar elemento correspondiente en el editor
            this.editor.selectElement(layer.elementId);
        }
    }

    // Manejar cambio de visibilidad
    handleVisibilityChanged(detail) {
        console.log('👁️ Visibilidad cambiada:', detail);

        const layer = this.layerManager.getLayer(detail.layerId);
        if (layer) {
            // Actualizar visibilidad en el editor
            this.editor.setElementVisibility(layer.elementId, detail.visible);
        }
    }

    // Manejar cambio de bloqueo
    handleLockChanged(detail) {
        console.log('🔒 Bloqueo cambiado:', detail);

        const layer = this.layerManager.getLayer(detail.layerId);
        if (layer) {
            // Actualizar bloqueo en el editor
            this.editor.setElementLocked(layer.elementId, detail.locked);
        }
    }

    // Manejar eliminación de capa
    handleLayerDeleted(detail) {
        console.log('🗑️ Capa eliminada:', detail);

        // Eliminar elemento correspondiente del editor
        this.editor.removeElement(detail.layerData.elementId);
    }
}

// ============================================
// EJEMPLO 2: Simulación de Editor Simple
// ============================================

class SimpleTextEditor {
    constructor() {
        this.elements = new Map();
        this.nextId = 1;
        this.listeners = new Map();
    }

    // Agregar texto
    addText(text, options = {}) {
        const id = `text-${this.nextId++}`;

        const element = {
            id: id,
            type: 'text',
            text: text,
            fontSize: options.fontSize || 16,
            color: options.color || '#000000',
            x: options.x || 0,
            y: options.y || 0,
            zIndex: options.zIndex || this.elements.size,
            opacity: options.opacity || 100
        };

        this.elements.set(id, element);

        // Emitir evento
        this.emit('elementAdded', element);

        return element;
    }

    // Agregar imagen
    addImage(src, options = {}) {
        const id = `image-${this.nextId++}`;

        const element = {
            id: id,
            type: 'image',
            src: src,
            width: options.width || 200,
            height: options.height || 200,
            x: options.x || 0,
            y: options.y || 0,
            zIndex: options.zIndex || this.elements.size,
            opacity: options.opacity || 100
        };

        this.elements.set(id, element);

        // Emitir evento
        this.emit('elementAdded', element);

        return element;
    }

    // Agregar forma
    addShape(shapeType, options = {}) {
        const id = `shape-${this.nextId++}`;

        const element = {
            id: id,
            type: 'shape',
            shapeType: shapeType,
            fill: options.fill || '#3498db',
            stroke: options.stroke || '#2980b9',
            width: options.width || 100,
            height: options.height || 100,
            x: options.x || 0,
            y: options.y || 0,
            zIndex: options.zIndex || this.elements.size,
            opacity: options.opacity || 100
        };

        this.elements.set(id, element);

        // Emitir evento
        this.emit('elementAdded', element);

        return element;
    }

    // Remover elemento
    removeElement(id) {
        if (this.elements.has(id)) {
            this.elements.delete(id);
            this.emit('elementRemoved', id);
            return true;
        }
        return false;
    }

    // Actualizar elemento
    updateElement(id, updates) {
        const element = this.elements.get(id);
        if (element) {
            Object.assign(element, updates);
            this.emit('elementUpdated', id, updates);
            return true;
        }
        return false;
    }

    // Seleccionar elemento
    selectElement(id) {
        console.log('Editor: Elemento seleccionado:', id);
    }

    // Establecer visibilidad
    setElementVisibility(id, visible) {
        const element = this.elements.get(id);
        if (element) {
            element.visible = visible;
            console.log(`Editor: Visibilidad de ${id} = ${visible}`);
        }
    }

    // Establecer bloqueo
    setElementLocked(id, locked) {
        const element = this.elements.get(id);
        if (element) {
            element.locked = locked;
            console.log(`Editor: Bloqueo de ${id} = ${locked}`);
        }
    }

    // Obtener siguiente z-index
    getNextZIndex() {
        let maxZ = 0;
        this.elements.forEach(el => {
            if (el.zIndex > maxZ) maxZ = el.zIndex;
        });
        return maxZ + 1;
    }

    // Sistema de eventos simple
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(...args));
        }
    }
}

// ============================================
// EJEMPLO 3: Demo Interactiva
// ============================================

function runLayerManagerDemo() {
    console.group('🎬 DEMO: Layer Manager Integration');

    // 1. Crear instancias
    const editor = new SimpleTextEditor();
    const integration = new EditorLayerIntegration(editor, window.layerManager);

    console.log('✅ Editor e integración creados');

    // 2. Limpiar panel
    window.layerManager.clearPanel();
    console.log('🧹 Panel limpiado');

    // 3. Agregar elementos
    console.log('\n📝 Agregando elementos...');

    editor.addText('Título Principal', {
        fontSize: 32,
        color: '#2c3e50',
        zIndex: 3
    });

    editor.addText('Subtítulo', {
        fontSize: 24,
        color: '#7f8c8d',
        zIndex: 2
    });

    editor.addImage('https://via.placeholder.com/300', {
        width: 300,
        height: 200,
        zIndex: 1
    });

    editor.addShape('rectangle', {
        fill: '#3498db',
        zIndex: 0
    });

    editor.addShape('circle', {
        fill: '#e74c3c',
        zIndex: 4
    });

    // 4. Mostrar estadísticas
    console.log('\n📊 Estadísticas:');
    const stats = window.layerManager.getStats();
    console.table(stats);

    // 5. Mostrar capas
    console.log('\n📋 Capas actuales:');
    const layers = window.layerManager.getAllLayers();
    console.table(layers.map(l => ({
        Nombre: l.name,
        Tipo: l.type,
        'Z-Index': l.zIndex,
        Visible: l.visible,
        Bloqueada: l.locked
    })));

    // 6. Simular interacciones
    console.log('\n🎮 Simulando interacciones...');

    setTimeout(() => {
        console.log('👁️ Ocultando imagen...');
        const imageLayers = layers.filter(l => l.type === 'image');
        if (imageLayers.length > 0) {
            window.layerManager.toggleVisibility(imageLayers[0].id);
        }
    }, 1000);

    setTimeout(() => {
        console.log('🔒 Bloqueando título...');
        const textLayers = layers.filter(l => l.type === 'text');
        if (textLayers.length > 0) {
            window.layerManager.toggleLock(textLayers[0].id);
        }
    }, 2000);

    setTimeout(() => {
        console.log('🔄 Actualizando z-index del círculo...');
        const shapeLayers = layers.filter(l => l.type === 'shape');
        if (shapeLayers.length > 0) {
            editor.updateElement(shapeLayers[0].elementId, { zIndex: 10 });
        }
    }, 3000);

    setTimeout(() => {
        console.log('🗑️ Eliminando subtítulo...');
        const textLayers = layers.filter(l => l.type === 'text' && l.name.includes('Subtítulo'));
        if (textLayers.length > 0) {
            editor.removeElement(textLayers[0].elementId);
        }
    }, 4000);

    setTimeout(() => {
        console.log('\n📊 Estadísticas finales:');
        const finalStats = window.layerManager.getStats();
        console.table(finalStats);

        console.log('\n📋 Capas finales:');
        const finalLayers = window.layerManager.getAllLayers();
        console.table(finalLayers.map(l => ({
            Nombre: l.name,
            Tipo: l.type,
            'Z-Index': l.zIndex,
            Visible: l.visible,
            Bloqueada: l.locked
        })));

        console.groupEnd();

        if (window.invitationStorage) {
            window.invitationStorage.showNotification('Demo completada', 'success');
        }
    }, 5000);
}

// ============================================
// EJEMPLO 4: Uso Directo con Preview
// ============================================

function integrateWithPreview() {
    // Escuchar actualizaciones del preview
    if (window.invitationPreview) {
        const originalRender = window.invitationPreview.render;

        window.invitationPreview.render = function () {
            // Llamar render original
            const result = originalRender.call(this);

            // Después del render, actualizar capas
            setTimeout(() => {
                syncLayersWithPreview();
            }, 100);

            return result;
        };

        console.log('✅ Layer Manager integrado con Preview');
    }
}

function syncLayersWithPreview() {
    if (!window.layerManager) return;

    // Limpiar panel
    window.layerManager.clearPanel();

    // Obtener elementos del preview (ejemplo)
    const previewFrame = document.querySelector('#previewFrame');
    if (!previewFrame) return;

    const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
    if (!iframeDoc) return;

    // Buscar elementos con data-layer-type
    const layeredElements = iframeDoc.querySelectorAll('[data-layer-type]');

    layeredElements.forEach(element => {
        const elementData = window.layerManager.extractElementData(element);
        if (elementData) {
            window.layerManager.createLayer(elementData);
        }
    });

    console.log(`🔄 ${layeredElements.length} capas sincronizadas con preview`);
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.LayerManagerExamples = {
    SimpleTextEditor,
    EditorLayerIntegration,
    runLayerManagerDemo,
    integrateWithPreview,
    syncLayersWithPreview
};

console.log('✅ Ejemplos de Layer Manager cargados');
console.log('📝 Ejecute window.LayerManagerExamples.runLayerManagerDemo() para ver la demo');
