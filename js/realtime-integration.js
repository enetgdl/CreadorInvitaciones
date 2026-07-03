/**
 * REALTIME-INTEGRATION.JS
 * Módulo de integración que conecta todos los sistemas de tiempo real
 * Inicializa y coordina State Manager, Preview Updater y Layer Sync
 */

class RealtimeIntegration {
    constructor() {
        this.stateManager = null;
        this.previewUpdater = null;
        this.layerSync = null;

        this.isInitialized = false;
        this.initPromise = null;

        // Referencias a componentes del editor
        this.editor = null;
        this.preview = null;
        this.storage = null;
    }

    /**
     * Inicializar sistema completo de tiempo real
     */
    async initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('⚠️ Sistema ya inicializado');
            return this.initPromise;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._performInitialization(options);
        return this.initPromise;
    }

    /**
     * Realizar inicialización
     */
    async _performInitialization(options) {
        console.log('🚀 Inicializando sistema de tiempo real...');

        try {
            // 1. Esperar a que el DOM esté listo
            await this.waitForDOM();

            // 2. Obtener referencias a componentes
            this.getComponentReferences();

            // 3. Inicializar State Manager
            this.initializeStateManager();

            // 4. Cargar datos iniciales
            await this.loadInitialData();

            // 5. Inicializar Preview Updater
            this.initializePreviewUpdater();

            // 6. Inicializar Layer Sync
            this.initializeLayerSync();

            // 7. Conectar con el editor existente
            this.connectToEditor();

            // 8. Configurar auto-guardado
            this.setupAutoSave();

            // 9. Configurar atajos de teclado
            this.setupKeyboardShortcuts();

            this.isInitialized = true;
            console.log('✅ Sistema de tiempo real inicializado correctamente');

            // Emitir evento de inicialización
            window.dispatchEvent(new CustomEvent('realtime-initialized', {
                detail: { integration: this }
            }));

            return true;

        } catch (error) {
            console.error('❌ Error inicializando sistema de tiempo real:', error);
            throw error;
        }
    }

    /**
     * Esperar a que el DOM esté listo
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Obtener referencias a componentes
     */
    getComponentReferences() {
        // Editor
        this.editor = window.invitationEditor || window.editor;

        // Preview
        this.preview = window.invitationPreview ||
            this.editor?.preview ||
            null;

        // Storage
        this.storage = window.invitationStorage ||
            this.editor?.storage ||
            null;

        if (!this.storage) {
            throw new Error('InvitationStorage no encontrado');
        }

        console.log('📦 Referencias obtenidas:', {
            editor: !!this.editor,
            preview: !!this.preview,
            storage: !!this.storage
        });
    }

    /**
     * Inicializar State Manager
     */
    initializeStateManager() {
        if (window.realtimeStateManager) {
            this.stateManager = window.realtimeStateManager;
        } else {
            this.stateManager = new RealtimeStateManager();
            window.realtimeStateManager = this.stateManager;
        }

        console.log('✅ State Manager inicializado');
    }

    /**
     * Cargar datos iniciales
     */
    async loadInitialData() {
        const data = this.storage.getData();

        if (data) {
            this.stateManager.state.invitationData = data;
            console.log('📄 Datos iniciales cargados');
        } else {
            console.log('📄 No hay datos previos, usando defaults');
        }
    }

    /**
     * Inicializar Preview Updater
     */
    initializePreviewUpdater() {
        if (!this.preview) {
            console.warn('⚠️ Preview no disponible, updater deshabilitado');
            return;
        }

        this.previewUpdater = new RealtimePreviewUpdater(
            this.preview,
            this.stateManager
        );

        console.log('✅ Preview Updater inicializado');
    }

    /**
     * Inicializar Layer Sync
     */
    initializeLayerSync() {
        this.layerSync = new RealtimeLayerSync(this.stateManager);
        console.log('✅ Layer Sync inicializado');
    }

    /**
     * Conectar con el editor existente
     */
    connectToEditor() {
        if (!this.editor) {
            console.warn('⚠️ Editor no disponible');
            return;
        }

        // Interceptar handleFieldChange del editor
        this.interceptEditorMethods();

        // Suscribirse a cambios del state manager para actualizar storage
        this.stateManager.subscribe('data', (notification) => {
            if (notification.type === 'DATA_UPDATE') {
                this.syncToStorage(notification.data);
            }
        });

        console.log('✅ Conectado al editor');
    }

    /**
     * Interceptar métodos del editor
     */
    interceptEditorMethods() {
        if (!this.editor) return;

        // Guardar método original
        const originalHandleFieldChange = this.editor.handleFieldChange;

        // Reemplazar con versión que usa state manager
        this.editor.handleFieldChange = (field, value) => {
            // Actualizar state manager
            this.stateManager.updateField(field, value, {
                debounce: true,
                debounceKey: 'preview'
            });

            // Llamar método original si existe
            if (originalHandleFieldChange) {
                originalHandleFieldChange.call(this.editor, field, value);
            }
        };

        console.log('🔌 Métodos del editor interceptados');
    }

    /**
     * Sincronizar con storage
     */
    syncToStorage(data) {
        if (!this.storage) return;

        try {
            this.storage.saveData(data);
        } catch (error) {
            console.error('❌ Error guardando en storage:', error);
        }
    }

    /**
     * Configurar auto-guardado
     */
    setupAutoSave() {
        // Suscribirse a cambios y guardar automáticamente
        this.stateManager.subscribe('data', (notification) => {
            if (notification.type === 'DATA_UPDATE') {
                // Usar debouncing del storage para no guardar demasiado
                this.stateManager._debounce('storage', () => {
                    this.syncToStorage(notification.data);
                });
            }
        });

        console.log('💾 Auto-guardado configurado');
    }

    /**
     * Configurar atajos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z: Deshacer
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }

            // Ctrl/Cmd + Shift + Z o Ctrl/Cmd + Y: Rehacer
            if ((e.ctrlKey || e.metaKey) && (
                (e.key === 'z' && e.shiftKey) || e.key === 'y'
            )) {
                e.preventDefault();
                this.redo();
            }

            // Ctrl/Cmd + S: Guardar
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.save();
            }
        });

        console.log('⌨️ Atajos de teclado configurados');
    }

    /**
     * Deshacer
     */
    undo() {
        const success = this.stateManager.undo();

        if (success) {
            // Actualizar editor y preview
            this.updateEditorFromState();

            if (this.storage) {
                this.storage.showNotification('Cambio deshecho', 'info');
            }
        }
    }

    /**
     * Rehacer
     */
    redo() {
        const success = this.stateManager.redo();

        if (success) {
            // Actualizar editor y preview
            this.updateEditorFromState();

            if (this.storage) {
                this.storage.showNotification('Cambio rehecho', 'info');
            }
        }
    }

    /**
     * Guardar
     */
    save() {
        const data = this.stateManager.getInvitationData();

        if (data && this.storage) {
            this.storage.saveData(data);
            this.storage.showNotification('Guardado exitoso', 'success');
        }
    }

    /**
     * Actualizar editor desde estado
     */
    updateEditorFromState() {
        const data = this.stateManager.getInvitationData();

        if (this.editor && typeof this.editor.loadData === 'function') {
            this.editor.loadData(data);
        }

        if (this.previewUpdater) {
            this.previewUpdater.forceUpdate();
        }
    }

    /**
     * Obtener métricas del sistema
     */
    getMetrics() {
        return {
            stateManager: this.stateManager?.getMetrics(),
            previewUpdater: this.previewUpdater?.getMetrics(),
            layerSync: this.layerSync?.getMetrics()
        };
    }

    /**
     * Mostrar panel de métricas (debug)
     */
    showMetricsPanel() {
        const metrics = this.getMetrics();

        console.group('📊 Métricas del Sistema');
        console.log('State Manager:', metrics.stateManager);
        console.log('Preview Updater:', metrics.previewUpdater);
        console.log('Layer Sync:', metrics.layerSync);
        console.groupEnd();

        // Crear panel visual
        const panel = document.createElement('div');
        panel.id = 'realtime-metrics-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: white;
                border: 2px solid #8b5cf6;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: monospace;
                font-size: 12px;
                max-width: 300px;
            ">
                <div style="font-weight: bold; margin-bottom: 8px; color: #8b5cf6;">
                    📊 Métricas en Tiempo Real
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>State:</strong> v${metrics.stateManager?.version || 0}
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>Preview:</strong> ${metrics.previewUpdater?.totalUpdates || 0} updates
                    (${(metrics.previewUpdater?.avgUpdateTime || 0).toFixed(1)}ms avg)
                </div>
                <div style="margin-bottom: 4px;">
                    <strong>Layers:</strong> ${metrics.layerSync?.syncs || 0} syncs
                </div>
                <button onclick="this.parentElement.remove()" style="
                    margin-top: 8px;
                    padding: 4px 8px;
                    background: #8b5cf6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Cerrar</button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    /**
     * Destruir sistema
     */
    destroy() {
        if (this.previewUpdater) {
            this.previewUpdater.destroy();
        }

        if (this.layerSync) {
            this.layerSync.destroy();
        }

        this.isInitialized = false;
        console.log('🛑 Sistema de tiempo real destruido');
    }
}

// Auto-inicializar cuando el DOM esté listo
(function () {
    const integration = new RealtimeIntegration();
    window.realtimeIntegration = integration;

    // Inicializar automáticamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            integration.initialize().catch(error => {
                console.error('Error en auto-inicialización:', error);
            });
        });
    } else {
        integration.initialize().catch(error => {
            console.error('Error en auto-inicialización:', error);
        });
    }

    // Exponer función global para mostrar métricas
    window.showRealtimeMetrics = () => {
        integration.showMetricsPanel();
    };

    console.log('🎯 Realtime Integration cargado. Usa showRealtimeMetrics() para ver métricas.');
})();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeIntegration;
}
