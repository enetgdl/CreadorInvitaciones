/**
 * CANVAS-LAYER-INTEGRATION.JS - Integración CanvasRenderer con Sistema de Capas Existente
 * Conecta el CanvasRenderer con LayerStore y LayerManager
 */

class CanvasLayerIntegration {
    constructor(canvasContainerId, options = {}) {
        this.canvasRenderer = null;
        this.store = window.layerStore;
        this.manager = null;
        this.containerId = canvasContainerId;
        this.options = options;

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.createCanvasRenderer();
            this.connectToStore();
            this.setupEventBridge();
            this.syncFromExistingLayers();
        });
    }

    createCanvasRenderer() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn(`Canvas container "${this.containerId}" not found`);
            return;
        }

        this.canvasRenderer = new CanvasRenderer(this.containerId, {
            width: this.options.width || 400,
            height: this.options.height || 700,
            backgroundColor: this.options.backgroundColor || '#ffffff',
            gridSnap: this.options.gridSnap || 10,
            showGrid: this.options.showGrid || false
        });

        window.canvasRenderer = this.canvasRenderer;
    }

    connectToStore() {
        if (!this.store) {
            console.warn('LayerStore not available');
            return;
        }

        // Subscribe to store changes
        this.store.subscribe((state) => {
            this.syncFromStore(state);
        });
    }

    setupEventBridge() {
        if (!this.canvasRenderer) return;

        // Canvas events -> Store
        this.canvasRenderer.on('addLayer', ({ layer }) => {
            if (this.store && !this._syncingFromStore) {
                this.store.addLayer(this.canvasLayerToStoreLayer(layer));
            }
        });

        this.canvasRenderer.on('removeLayer', ({ layer }) => {
            if (this.store && !this._syncingFromStore) {
                this.store.removeLayer(layer.id);
            }
        });

        this.canvasRenderer.on('updateLayer', ({ layer }) => {
            if (this.store && !this._syncingFromStore) {
                this.store.updateLayer(layer.id, this.canvasLayerToStoreLayer(layer));
            }
        });

        this.canvasRenderer.on('move', ({ layer }) => {
            if (this.store && !this._syncingFromStore) {
                this.store.updateLayer(layer.id, {
                    x: layer.x,
                    y: layer.y
                });
            }
        });

        this.canvasRenderer.on('select', ({ layer }) => {
            if (this.store) {
                this.store.selectLayer(layer.id);
            }
        });

        this.canvasRenderer.on('deselect', () => {
            if (this.store) {
                this.store.selectLayer(null);
            }
        });

        // Store events -> Canvas
        if (this.store) {
            const originalAddLayer = this.store.addLayer.bind(this.store);
            this.store.addLayer = (layerData) => {
                const result = originalAddLayer(layerData);
                if (result && this.canvasRenderer && !this._syncingFromCanvas) {
                    this.canvasRenderer.addLayer(this.storeLayerToCanvasLayer(layerData));
                }
                return result;
            };

            const originalRemoveLayer = this.store.removeLayer.bind(this.store);
            this.store.removeLayer = (id) => {
                const result = originalRemoveLayer(id);
                if (this.canvasRenderer && !this._syncingFromCanvas) {
                    this.canvasRenderer.removeLayer(id);
                }
                return result;
            };

            const originalUpdateLayer = this.store.updateLayer.bind(this.store);
            this.store.updateLayer = (id, updates) => {
                const result = originalUpdateLayer(id, updates);
                if (this.canvasRenderer && !this._syncingFromCanvas) {
                    this.canvasRenderer.updateLayer(id, this.storeLayerToCanvasLayer(updates));
                }
                return result;
            };
        }
    }

    syncFromStore(state) {
        if (!this.canvasRenderer || !state?.layers) return;

        this._syncingFromStore = true;

        const canvasLayers = this.canvasRenderer.layers.map(l => l.id);
        const storeLayers = state.layers.map(l => l.id);

        // Remove layers not in store
        canvasLayers.forEach(id => {
            if (!storeLayers.includes(id)) {
                this.canvasRenderer.removeLayer(id);
            }
        });

        // Add/update layers from store
        state.layers.forEach(storeLayer => {
            const canvasLayer = this.canvasRenderer.getLayer(storeLayer.id);
            if (canvasLayer) {
                // Update existing
                Object.assign(canvasLayer, this.storeLayerToCanvasLayer(storeLayer));
            } else {
                // Add new
                this.canvasRenderer.addLayer(this.storeLayerToCanvasLayer(storeLayer));
            }
        });

        this.canvasRenderer.sortLayers();
        this.canvasRenderer.render();

        this._syncingFromStore = false;
    }

    syncFromExistingLayers() {
        if (!this.store || !this.canvasRenderer) return;

        const state = this.store.getState();
        if (state?.layers) {
            state.layers.forEach(layer => {
                this.canvasRenderer.addLayer(this.storeLayerToCanvasLayer(layer));
            });
            this.canvasRenderer.sortLayers();
            this.canvasRenderer.render();
        }
    }

    // Layer format conversion
    canvasLayerToStoreLayer(canvasLayer) {
        return {
            id: canvasLayer.id,
            type: canvasLayer.type,
            name: canvasLayer.name,
            x: canvasLayer.x,
            y: canvasLayer.y,
            width: canvasLayer.width,
            height: canvasLayer.height,
            zIndex: canvasLayer.zIndex,
            locked: canvasLayer.locked,
            hidden: canvasLayer.hidden,
            opacity: canvasLayer.opacity,
            rotation: canvasLayer.rotation,
            fill: canvasLayer.fill,
            stroke: canvasLayer.stroke,
            strokeWidth: canvasLayer.strokeWidth,
            data: canvasLayer.data
        };
    }

    storeLayerToCanvasLayer(storeLayer) {
        return {
            id: storeLayer.id,
            type: storeLayer.type || 'rect',
            name: storeLayer.name || storeLayer.id,
            x: storeLayer.x || 0,
            y: storeLayer.y || 0,
            width: storeLayer.width || 100,
            height: storeLayer.height || 100,
            zIndex: storeLayer.zIndex || 0,
            locked: storeLayer.locked || false,
            hidden: storeLayer.hidden || false,
            opacity: storeLayer.opacity || 1,
            rotation: storeLayer.rotation || 0,
            fill: storeLayer.fill || storeLayer.backgroundColor || '#5327a0',
            stroke: storeLayer.stroke || storeLayer.borderColor || 'transparent',
            strokeWidth: storeLayer.strokeWidth || storeLayer.borderWidth || 0,
            data: storeLayer.data || {}
        };
    }

    // Public API
    getCanvasRenderer() {
        return this.canvasRenderer;
    }

    getStore() {
        return this.store;
    }

    // Export methods
    exportHTML(filename = 'invitacion.html') {
        if (this.canvasRenderer) {
            this.canvasRenderer.downloadHTML(filename);
        }
    }

    exportImage(filename = 'invitacion.png') {
        if (this.canvasRenderer) {
            this.canvasRenderer.downloadImage(filename);
        }
    }

    destroy() {
        if (this.canvasRenderer) {
            this.canvasRenderer.destroy();
        }
    }
}

// Initialize globally
window.CanvasLayerIntegration = CanvasLayerIntegration;
