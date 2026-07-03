/**
 * REALTIME-STATE-MANAGER.JS
 * Sistema centralizado de gestión de estado en tiempo real
 * Coordina actualizaciones entre todos los componentes del editor
 */

class RealtimeStateManager {
    constructor() {
        // Estado centralizado
        this.state = {
            invitationData: null,
            layers: [],
            selectedLayerId: null,
            isDirty: false,
            isUpdating: false,
            lastUpdate: Date.now(),
            version: 0,
            updateQueue: []
        };

        // Suscriptores por tipo de cambio
        this.subscribers = {
            data: new Set(),      // Cambios en datos de invitación
            layers: new Set(),    // Cambios en capas
            selection: new Set(), // Cambios en selección
            all: new Set()        // Todos los cambios
        };

        // Configuración de debouncing
        this.debounceTimers = new Map();
        this.debounceDelays = {
            preview: 150,      // Vista previa rápida
            storage: 1000,     // Guardado más lento
            layers: 100        // Panel de capas muy rápido
        };

        // Historial para undo/redo
        this.history = {
            past: [],
            future: [],
            maxSize: 50
        };

        // Flags de control
        this.isProcessingBatch = false;
        this.batchQueue = [];

        // Performance monitoring
        this.metrics = {
            updates: 0,
            avgUpdateTime: 0,
            lastUpdateDuration: 0
        };

        console.log('🚀 Realtime State Manager inicializado');
    }

    /**
     * Obtener estado actual (copia profunda)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Obtener solo datos de invitación
     */
    getInvitationData() {
        return this.state.invitationData ?
            JSON.parse(JSON.stringify(this.state.invitationData)) : null;
    }

    /**
     * Suscribirse a cambios
     * @param {string} type - Tipo de cambio ('data', 'layers', 'selection', 'all')
     * @param {Function} callback - Función a ejecutar
     * @returns {Function} Función para desuscribirse
     */
    subscribe(type, callback) {
        if (!this.subscribers[type]) {
            console.warn(`Tipo de suscripción desconocido: ${type}`);
            type = 'all';
        }

        this.subscribers[type].add(callback);

        // Retornar función de desuscripción
        return () => {
            this.subscribers[type].delete(callback);
        };
    }

    /**
     * Actualizar datos de invitación
     * @param {Object|Function} updates - Objeto con cambios o función que recibe estado actual
     * @param {Object} options - Opciones de actualización
     */
    updateInvitationData(updates, options = {}) {
        const {
            debounce = true,
            debounceKey = 'preview',
            skipHistory = false,
            silent = false
        } = options;

        const performUpdate = () => {
            const startTime = performance.now();

            try {
                // Guardar estado anterior para historial
                if (!skipHistory && this.state.invitationData) {
                    this._addToHistory();
                }

                // Aplicar actualizaciones
                const newData = typeof updates === 'function'
                    ? updates(this.state.invitationData)
                    : { ...this.state.invitationData, ...updates };

                // Actualizar estado
                this.state.invitationData = newData;
                this.state.isDirty = true;
                this.state.lastUpdate = Date.now();
                this.state.version++;

                // Métricas de rendimiento
                const duration = performance.now() - startTime;
                this._updateMetrics(duration);

                // Notificar suscriptores
                if (!silent) {
                    this._notify('data', {
                        type: 'DATA_UPDATE',
                        data: newData,
                        duration
                    });
                }

                return newData;

            } catch (error) {
                console.error('❌ Error actualizando datos:', error);
                this._notifyError('data', error);
                throw error;
            }
        };

        // Aplicar debouncing si está habilitado
        if (debounce) {
            return this._debounce(debounceKey, performUpdate);
        } else {
            return performUpdate();
        }
    }

    /**
     * Actualizar campo específico de invitación
     */
    updateField(field, value, options = {}) {
        return this.updateInvitationData({ [field]: value }, options);
    }

    /**
     * Actualizar múltiples campos
     */
    updateFields(fields, options = {}) {
        return this.updateInvitationData(fields, options);
    }

    /**
     * Actualizar capas
     */
    updateLayers(layersOrUpdater, options = {}) {
        const { silent = false } = options;

        try {
            const newLayers = typeof layersOrUpdater === 'function'
                ? layersOrUpdater(this.state.layers)
                : layersOrUpdater;

            this.state.layers = newLayers;
            this.state.lastUpdate = Date.now();
            this.state.version++;

            if (!silent) {
                this._notify('layers', {
                    type: 'LAYERS_UPDATE',
                    layers: newLayers
                });
            }

            return newLayers;

        } catch (error) {
            console.error('❌ Error actualizando capas:', error);
            this._notifyError('layers', error);
            throw error;
        }
    }

    /**
     * Actualizar capa específica
     */
    updateLayer(layerId, updates, options = {}) {
        return this.updateLayers(layers => {
            return layers.map(layer =>
                layer.id === layerId
                    ? { ...layer, ...updates }
                    : layer
            );
        }, options);
    }

    /**
     * Seleccionar capa
     */
    selectLayer(layerId, options = {}) {
        const { silent = false } = options;

        this.state.selectedLayerId = layerId;

        if (!silent) {
            this._notify('selection', {
                type: 'LAYER_SELECTED',
                layerId
            });
        }

        return layerId;
    }

    /**
     * Procesamiento por lotes (batch updates)
     * Agrupa múltiples actualizaciones en una sola notificación
     */
    batch(callback) {
        this.isProcessingBatch = true;
        this.batchQueue = [];

        try {
            callback();

            // Procesar todas las actualizaciones en lote
            if (this.batchQueue.length > 0) {
                this._notify('all', {
                    type: 'BATCH_UPDATE',
                    updates: this.batchQueue
                });
            }

        } finally {
            this.isProcessingBatch = false;
            this.batchQueue = [];
        }
    }

    /**
     * Deshacer última acción
     */
    undo() {
        if (this.history.past.length === 0) {
            console.warn('⚠️ No hay acciones para deshacer');
            return false;
        }

        const current = this.state.invitationData;
        const previous = this.history.past.pop();

        this.history.future.push(current);
        this.state.invitationData = previous;
        this.state.version++;

        this._notify('data', {
            type: 'UNDO',
            data: previous
        });

        return true;
    }

    /**
     * Rehacer acción
     */
    redo() {
        if (this.history.future.length === 0) {
            console.warn('⚠️ No hay acciones para rehacer');
            return false;
        }

        const current = this.state.invitationData;
        const next = this.history.future.pop();

        this.history.past.push(current);
        this.state.invitationData = next;
        this.state.version++;

        this._notify('data', {
            type: 'REDO',
            data: next
        });

        return true;
    }

    /**
     * Limpiar historial
     */
    clearHistory() {
        this.history.past = [];
        this.history.future = [];
    }

    /**
     * Resetear estado completo
     */
    reset(initialData = null) {
        this.state = {
            invitationData: initialData,
            layers: [],
            selectedLayerId: null,
            isDirty: false,
            isUpdating: false,
            lastUpdate: Date.now(),
            version: 0,
            updateQueue: []
        };

        this.clearHistory();
        this._notify('all', { type: 'RESET' });
    }

    /**
     * Obtener métricas de rendimiento
     */
    getMetrics() {
        return { ...this.metrics };
    }

    // ==================== MÉTODOS PRIVADOS ====================

    /**
     * Notificar a suscriptores
     */
    _notify(type, payload) {
        if (this.isProcessingBatch) {
            this.batchQueue.push({ type, payload });
            return;
        }

        const state = this.getState();
        const notification = { ...payload, state };

        // Notificar suscriptores específicos
        this.subscribers[type]?.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error(`❌ Error en suscriptor ${type}:`, error);
            }
        });

        // Notificar suscriptores globales
        this.subscribers.all.forEach(callback => {
            try {
                callback(notification);
            } catch (error) {
                console.error('❌ Error en suscriptor global:', error);
            }
        });
    }

    /**
     * Notificar error
     */
    _notifyError(type, error) {
        this._notify(type, {
            type: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }

    /**
     * Implementar debouncing
     */
    _debounce(key, callback) {
        // Cancelar timer anterior
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        // Crear nuevo timer
        const delay = this.debounceDelays[key] || 300;
        const timer = setTimeout(() => {
            callback();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    /**
     * Agregar al historial
     */
    _addToHistory() {
        const current = JSON.parse(JSON.stringify(this.state.invitationData));

        this.history.past.push(current);

        // Limpiar futuro al hacer nueva acción
        this.history.future = [];

        // Limitar tamaño del historial
        if (this.history.past.length > this.history.maxSize) {
            this.history.past.shift();
        }
    }

    /**
     * Actualizar métricas de rendimiento
     */
    _updateMetrics(duration) {
        this.metrics.updates++;
        this.metrics.lastUpdateDuration = duration;

        // Calcular promedio móvil
        const alpha = 0.2; // Factor de suavizado
        this.metrics.avgUpdateTime =
            (alpha * duration) + ((1 - alpha) * this.metrics.avgUpdateTime);
    }
}

// Crear instancia global
window.realtimeStateManager = new RealtimeStateManager();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeStateManager;
}
