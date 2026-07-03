/**
 * LAYER-MANAGER.JS
 * Sistema de gestión automática del panel de capas
 * Sincronización en tiempo real entre elementos y capas
 * Flux Architecture (Store -> UI)
 */

class LayerManager {
    constructor(layersPanelId = 'layersList') {
        this.layersPanel = document.getElementById(layersPanelId);
        this.store = window.layerStore;

        // Cache visual para diffing
        this.renderedLayers = new Map();

        this.observer = null;
        this.updateQueue = [];
        this.isProcessing = false;
        this.performanceMonitor = {
            lastUpdate: Date.now(),
            updateCount: 0,
            avgUpdateTime: 0
        };

        if (!this.layersPanel) {
            console.error(`Layer panel with id "${layersPanelId}" not found`);
            return;
        }

        if (!this.store) {
            console.error('LayerStore not found! Make sure layer-store.js is loaded.');
            return;
        }

        this.initialize();
    }

    initialize() {
        console.log('🎨 Inicializando Layer Manager (Flux Architecture)...');

        // Suscribirse a cambios del store
        this.store.subscribe((state) => {
            this.renderFromState(state);
        });

        // Configurar monitoreo del DOM (Source of Truth)
        this.setupMonitoring();

        console.log('✅ Layer Manager Conectado al Store');
    }

    /**
     * Render principal desde estado
     */
    renderFromState(state) {
        const startTime = performance.now();

        if (state.layers) {
            this.syncDomWithState(state.layers);
        }

        const endTime = performance.now();
        this.updatePerformanceMetrics(endTime - startTime);
    }

    /**
     * Sincronización eficiente DOM vs Estado
     */
    syncDomWithState(layers) {
        const currentIds = Array.from(this.renderedLayers.keys());
        const newIds = layers.map(l => l.id);

        // 1. Eliminar capas obsoletas
        currentIds.forEach(id => {
            if (!newIds.includes(id)) {
                const el = document.getElementById(id);
                if (el) el.remove();
                this.renderedLayers.delete(id);
            }
        });

        // 2. Crear / Actualizar capas
        const useFragment = this.layersPanel.children.length === 0;
        const container = useFragment ? document.createDocumentFragment() : this.layersPanel;

        layers.forEach((layerData, index) => {
            let el = document.getElementById(layerData.id);

            if (!el) {
                // Nuevo elemento
                el = this.createLayerElement(layerData);
                this.renderedLayers.set(layerData.id, { ...layerData });
                container.appendChild(el);
            } else {
                // Actualizar existente
                this.updateLayerElement(el, layerData);
            }

            // Orden visual via Flexbox 'order' property
            // Invertimos el índice porque en diseño grafico la capa superior (mayor z) va arriba en la lista
            el.style.order = -layerData.zIndex;
        });

        if (useFragment) {
            this.layersPanel.appendChild(container);
        }
    }

    createLayerElement(layerData) {
        const el = document.createElement('div');
        el.className = 'layer-item';
        el.id = layerData.id;
        el.setAttribute('data-element-id', layerData.elementId);

        // Renderizar contenido
        this.renderLayerContent(el, layerData);

        // Listeners
        this.attachLayerEventListeners(el, layerData);

        // Estado activo
        if (layerData.id === this.store.state.selectedLayerId) {
            el.classList.add('active');
        }

        return el;
    }

    updateLayerElement(el, layerData) {
        const prevData = this.renderedLayers.get(layerData.id);

        // Diffing simple
        if (prevData && JSON.stringify(prevData) === JSON.stringify(layerData)) {
            // Chequear seleccion externa
            const isActive = this.store.state.selectedLayerId === layerData.id;
            const hasClass = el.classList.contains('active');
            if (isActive !== hasClass) {
                el.classList.toggle('active', isActive);
            }
            return;
        }

        this.renderedLayers.set(layerData.id, { ...layerData });
        this.renderLayerContent(el, layerData);

        el.classList.toggle('active', this.store.state.selectedLayerId === layerData.id);
    }

    renderLayerContent(el, layerData) {
        const icon = this.getLayerIcon(layerData.type);
        const visibilityIcon = layerData.visible ? '👁️' : '👁️‍🗨️';
        const lockIcon = layerData.locked ? '🔒' : '';
        const opacityDisplay = layerData.opacity < 100 ? `<span style="font-size:0.7em; opacity:0.7">${Math.round(layerData.opacity)}%</span>` : '';

        el.innerHTML = `
            <div class="layer-info">
                <span class="layer-thumb" style="font-size: 1rem;">${icon}</span>
                <div class="layer-details">
                    <div class="layer-name">${layerData.name}</div>
                    <div class="layer-meta">${layerData.type} • z:${layerData.zIndex} ${opacityDisplay}</div>
                </div>
            </div>
            <div class="layer-actions">
                <button class="layer-action-btn" data-action="visibility" title="Visibilidad">${visibilityIcon}</button>
                <button class="layer-action-btn" data-action="lock" title="Bloqueo">${lockIcon || '🔓'}</button>
                <button class="layer-action-btn" data-action="delete" title="Eliminar">🗑️</button>
            </div>
        `;
    }

    attachLayerEventListeners(layerElement, layerData) {
        layerElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('layer-action-btn')) {
                this.store.dispatch({ type: 'SELECT_LAYER', payload: layerData.id });
                // Disparar evento legacy para compatibilidad con otros sistemas
                const event = new CustomEvent('layerManager:layerSelected', {
                    detail: { layerId: layerData.id },
                    bubbles: true
                });
                document.dispatchEvent(event);
            }
        });

        const actionButtons = layerElement.querySelectorAll('.layer-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                this.handleLayerAction(layerData.id, action);
            });
        });
    }

    handleLayerAction(layerId, action) {
        const layer = this.store.getState().layers.find(l => l.id === layerId);
        if (!layer) return;

        switch (action) {
            case 'visibility':
                this.store.dispatch({ type: 'UPDATE_LAYER', payload: { id: layerId, updates: { visible: !layer.visible } } });
                this.toggleElementVisibility(layer.elementId, !layer.visible);
                break;
            case 'lock':
                this.store.dispatch({ type: 'UPDATE_LAYER', payload: { id: layerId, updates: { locked: !layer.locked } } });
                break;
            case 'delete':
                if (confirm('¿Eliminar capa?')) {
                    this.store.dispatch({ type: 'REMOVE_LAYER', payload: layerId });
                    this.removeElementFromDom(layer.elementId);
                }
                break;
        }
    }

    // --- Helpers de Manipulación DOM Real (Efectos colaterales) ---
    toggleElementVisibility(elementId, visible) {
        const el = document.getElementById(elementId);
        // También intentar buscar en iframe
        const frame = document.getElementById('previewFrame');
        const doc = frame ? frame.contentDocument : document;
        const target = el || doc.getElementById(elementId);

        if (target) {
            target.style.display = visible ? '' : 'none';
        }
    }

    removeElementFromDom(elementId) {
        const el = document.getElementById(elementId);
        const frame = document.getElementById('previewFrame');
        const doc = frame ? frame.contentDocument : document;
        const target = el || doc.getElementById(elementId);

        if (target) {
            target.remove();
        }
    }

    // --- Monitoreo (Source of Truth) ---
    setupMonitoring() {
        const canvasContainers = [
            document.querySelector('.preview-area'),
            document.getElementById('previewFrame')?.contentDocument?.body
        ];

        canvasContainers.forEach(container => {
            if (!container) return;

            this.observer = new MutationObserver((mutations) => {
                this.handleCanvasChanges(mutations);
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'data-z-index', 'id']
            });
        });
    }

    handleCanvasChanges(mutations) {
        const changes = [];

        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.id && !node.classList.contains('layer-item')) {
                        changes.push({ type: 'ADD', node: node });
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.id) {
                        changes.push({ type: 'REMOVE', id: node.id });
                    }
                });
            } else if (mutation.type === 'attributes') {
                if (mutation.target.nodeType === Node.ELEMENT_NODE && mutation.target.id) {
                    changes.push({ type: 'UPDATE', node: mutation.target });
                }
            }
        });

        // Batch processing
        if (changes.length > 0) {
            this.processCanvasChanges(changes);
        }
    }

    processCanvasChanges(changes) {
        // Evitar bucles infinitos si nosotros causamos el cambio
        // En una app real usaríamos marcas de tiempo o flags globales

        changes.forEach(change => {
            if (change.type === 'ADD') {
                const layerData = this.buildLayerData(change.node);
                this.store.dispatch({ type: 'ADD_LAYER', payload: layerData });
            } else if (change.type === 'REMOVE') {
                const layerId = `layer-${change.id}`;
                this.store.dispatch({ type: 'REMOVE_LAYER', payload: layerId });
            } else if (change.type === 'UPDATE') {
                const layerId = `layer-${change.node.id}`;
                const updates = this.extractUpdates(change.node);
                if (Object.keys(updates).length > 0) {
                    this.store.dispatch({ type: 'UPDATE_LAYER', payload: { id: layerId, updates } });
                }
            }
        });
    }

    // --- Utils ---

    buildLayerData(element) {
        return {
            id: `layer-${element.id}`,
            elementId: element.id,
            type: this.detectElementType(element),
            name: element.getAttribute('aria-label') || this.generateLayerName(this.detectElementType(element)),
            visible: element.style.display !== 'none',
            locked: element.hasAttribute('data-locked'),
            opacity: element.style.opacity ? parseFloat(element.style.opacity) * 100 : 100,
            zIndex: parseInt(getComputedStyle(element).zIndex) || 0,
            createdAt: Date.now()
        };
    }

    extractUpdates(element) {
        // Solo retornar lo que cambió realmente relevante para las capas
        return {
            visible: element.style.display !== 'none',
            zIndex: parseInt(getComputedStyle(element).zIndex) || 0,
            opacity: element.style.opacity ? parseFloat(element.style.opacity) * 100 : 100
        };
    }

    detectElementType(element) {
        const tag = element.tagName.toLowerCase();
        if (tag === 'img') return 'image';
        if (tag === 'video') return 'video';
        if (tag === 'audio') return 'audio';
        if (['p', 'h1', 'h2', 'h3', 'span', 'div'].includes(tag) && element.textContent.trim().length > 0) return 'text';
        return 'unknown';
    }

    generateLayerName(type) {
        const types = { 'image': 'Imagen', 'video': 'Video', 'text': 'Texto', 'unknown': 'Elemento' };
        const base = types[type] || 'Elemento';
        const count = this.store.getState().layers.filter(l => l.type === type).length + 1;
        return `${base} ${count}`;
    }

    getLayerIcon(type) {
        const icons = { 'image': '🖼️', 'video': '🎬', 'text': '📝', 'unknown': '❓' };
        return icons[type] || icons.unknown;
    }

    updatePerformanceMetrics(time) {
        this.performanceMonitor.lastUpdate = Date.now();
        this.performanceMonitor.updateCount++;
        this.performanceMonitor.avgUpdateTime = (this.performanceMonitor.avgUpdateTime + time) / 2;
        // console.log(`Layer Render Time: ${time.toFixed(2)}ms`); // Debug
    }
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('layersList')) {
        window.layerManager = new LayerManager('layersList');
    }
});
