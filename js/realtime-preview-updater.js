/**
 * REALTIME-PREVIEW-UPDATER.JS
 * Sistema de actualización automática de vista previa en tiempo real
 * Detecta cambios y actualiza la vista previa sin retraso perceptible
 */

class RealtimePreviewUpdater {
    constructor(previewInstance, stateManager) {
        this.preview = previewInstance;
        this.stateManager = stateManager;

        // Estado interno
        this.isUpdating = false;
        this.updateQueue = [];
        this.lastUpdateTime = 0;

        // Configuración de rendimiento
        this.config = {
            minUpdateInterval: 16,  // ~60fps
            maxUpdateInterval: 300, // Máximo 300ms de espera
            batchSize: 5,           // Agrupar hasta 5 cambios
            enableSmartDebounce: true
        };

        // Métricas
        this.metrics = {
            totalUpdates: 0,
            skippedUpdates: 0,
            avgUpdateTime: 0,
            lastUpdateDuration: 0
        };

        // Observadores
        this.observers = new Map();
        this.mutationObserver = null;

        // Suscripción al state manager
        this.unsubscribe = null;

        this.initialize();
    }

    /**
     * Inicializar sistema de actualización
     */
    initialize() {
        console.log('🎬 Realtime Preview Updater inicializando...');

        // Suscribirse a cambios de datos
        this.unsubscribe = this.stateManager.subscribe('data', (notification) => {
            this.handleStateChange(notification);
        });

        // Configurar observadores de DOM
        this.setupDOMObservers();

        // Configurar listeners de formularios
        this.setupFormListeners();

        console.log('✅ Realtime Preview Updater listo');
    }

    /**
     * Manejar cambio de estado
     */
    handleStateChange(notification) {
        const { type, data, duration } = notification;

        if (type === 'ERROR') {
            this.showUpdateError(notification.error);
            return;
        }

        // Actualizar vista previa
        this.scheduleUpdate(data, {
            priority: this.getPriority(notification),
            source: 'state'
        });
    }

    /**
     * Programar actualización de vista previa
     */
    scheduleUpdate(data, options = {}) {
        const {
            priority = 'normal',
            source = 'unknown',
            immediate = false
        } = options;

        const updateTask = {
            data,
            priority,
            source,
            timestamp: Date.now(),
            id: `update_${Date.now()}_${Math.random()}`
        };

        // Actualización inmediata (sin debounce)
        if (immediate) {
            this.performUpdate(updateTask);
            return;
        }

        // Agregar a cola
        this.updateQueue.push(updateTask);

        // Procesar cola con debouncing inteligente
        this.processQueue();
    }

    /**
     * Procesar cola de actualizaciones
     */
    processQueue() {
        if (this.isUpdating || this.updateQueue.length === 0) {
            return;
        }

        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;

        // Debouncing inteligente basado en frecuencia de cambios
        if (this.config.enableSmartDebounce) {
            const delay = this.calculateSmartDelay(timeSinceLastUpdate);

            clearTimeout(this.queueTimer);
            this.queueTimer = setTimeout(() => {
                this.flushQueue();
            }, delay);
        } else {
            // Debouncing simple
            if (timeSinceLastUpdate < this.config.minUpdateInterval) {
                setTimeout(() => this.processQueue(), this.config.minUpdateInterval);
                return;
            }
            this.flushQueue();
        }
    }

    /**
     * Vaciar cola y ejecutar actualización
     */
    flushQueue() {
        if (this.updateQueue.length === 0) return;

        // Obtener última actualización (más reciente)
        const latestUpdate = this.updateQueue[this.updateQueue.length - 1];

        // Registrar actualizaciones omitidas
        this.metrics.skippedUpdates += this.updateQueue.length - 1;

        // Limpiar cola
        this.updateQueue = [];

        // Ejecutar actualización
        this.performUpdate(latestUpdate);
    }

    /**
     * Ejecutar actualización de vista previa
     */
    async performUpdate(updateTask) {
        if (this.isUpdating) {
            console.warn('⚠️ Actualización en progreso, encolando...');
            this.updateQueue.push(updateTask);
            return;
        }

        this.isUpdating = true;
        const startTime = performance.now();

        try {
            // Mostrar indicador de actualización
            this.showUpdateIndicator();

            // Actualizar datos en preview
            if (this.preview && this.preview.currentData) {
                this.preview.currentData = updateTask.data;
            }

            // Renderizar
            if (this.preview && typeof this.preview.render === 'function') {
                await this.preview.render();
            }

            // Métricas
            const duration = performance.now() - startTime;
            this.updateMetrics(duration);

            // Ocultar indicador
            this.hideUpdateIndicator();

            this.lastUpdateTime = Date.now();
            this.metrics.totalUpdates++;

            // Log de rendimiento
            if (duration > 100) {
                console.warn(`⚠️ Actualización lenta: ${duration.toFixed(2)}ms`);
            }

        } catch (error) {
            console.error('❌ Error actualizando vista previa:', error);
            this.showUpdateError(error.message);
        } finally {
            this.isUpdating = false;

            // Procesar siguiente actualización si hay en cola
            if (this.updateQueue.length > 0) {
                setTimeout(() => this.processQueue(), 10);
            }
        }
    }

    /**
     * Calcular delay inteligente basado en frecuencia
     */
    calculateSmartDelay(timeSinceLastUpdate) {
        // Si el usuario está escribiendo rápido, aumentar delay
        if (timeSinceLastUpdate < 100) {
            return 200; // Esperar más si hay cambios rápidos
        }

        // Si hay pausa, actualizar más rápido
        if (timeSinceLastUpdate > 500) {
            return 50; // Actualización casi inmediata
        }

        // Delay normal
        return 150;
    }

    /**
     * Obtener prioridad de actualización
     */
    getPriority(notification) {
        const { type } = notification;

        // Prioridades altas
        if (type === 'UNDO' || type === 'REDO' || type === 'RESET') {
            return 'high';
        }

        // Prioridad normal
        return 'normal';
    }

    /**
     * Configurar observadores de DOM
     */
    setupDOMObservers() {
        // Observar cambios en formularios del editor
        const editorContainer = document.querySelector('.editor-container');
        if (!editorContainer) return;

        this.mutationObserver = new MutationObserver((mutations) => {
            // Filtrar solo cambios relevantes
            const relevantChanges = mutations.filter(m =>
                m.type === 'attributes' ||
                (m.type === 'childList' && m.addedNodes.length > 0)
            );

            if (relevantChanges.length > 0) {
                // Trigger actualización si es necesario
                // (esto es un respaldo, el flujo principal es via state manager)
            }
        });

        this.mutationObserver.observe(editorContainer, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['value', 'checked', 'selected']
        });
    }

    /**
     * Configurar listeners de formularios
     */
    setupFormListeners() {
        // Escuchar eventos de input en todo el documento
        document.addEventListener('input', (e) => {
            const target = e.target;

            // Solo procesar inputs del editor
            if (!target.closest('.editor-container')) return;

            // El state manager ya maneja esto, pero podemos agregar
            // lógica adicional si es necesario
        }, { passive: true });

        // Escuchar cambios en selects y checkboxes
        document.addEventListener('change', (e) => {
            const target = e.target;

            if (!target.closest('.editor-container')) return;

            // Procesar cambio
        }, { passive: true });
    }

    /**
     * Mostrar indicador de actualización
     */
    showUpdateIndicator() {
        let indicator = document.getElementById('preview-update-indicator');

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'preview-update-indicator';
            indicator.className = 'preview-update-indicator';
            indicator.innerHTML = `
                <div class="spinner"></div>
                <span>Actualizando...</span>
            `;
            document.body.appendChild(indicator);
        }

        indicator.classList.add('active');
    }

    /**
     * Ocultar indicador de actualización
     */
    hideUpdateIndicator() {
        const indicator = document.getElementById('preview-update-indicator');
        if (indicator) {
            indicator.classList.remove('active');
            setTimeout(() => {
                if (!indicator.classList.contains('active')) {
                    indicator.remove();
                }
            }, 300);
        }
    }

    /**
     * Mostrar error de actualización
     */
    showUpdateError(message) {
        console.error('❌ Error de actualización:', message);

        // Mostrar notificación al usuario
        if (window.invitationStorage && window.invitationStorage.showNotification) {
            window.invitationStorage.showNotification(
                `Error actualizando vista previa: ${message}`,
                'error'
            );
        }
    }

    /**
     * Actualizar métricas
     */
    updateMetrics(duration) {
        this.metrics.lastUpdateDuration = duration;

        // Promedio móvil
        const alpha = 0.3;
        this.metrics.avgUpdateTime =
            (alpha * duration) + ((1 - alpha) * this.metrics.avgUpdateTime);
    }

    /**
     * Obtener métricas
     */
    getMetrics() {
        return {
            ...this.metrics,
            queueSize: this.updateQueue.length,
            isUpdating: this.isUpdating
        };
    }

    /**
     * Forzar actualización inmediata
     */
    forceUpdate() {
        const data = this.stateManager.getInvitationData();
        if (data) {
            this.scheduleUpdate(data, { immediate: true });
        }
    }

    /**
     * Destruir updater
     */
    destroy() {
        // Desuscribirse del state manager
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        // Desconectar observadores
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        // Limpiar timers
        clearTimeout(this.queueTimer);

        // Limpiar cola
        this.updateQueue = [];

        console.log('🛑 Realtime Preview Updater destruido');
    }
}

// Estilos para el indicador
const style = document.createElement('style');
style.textContent = `
    .preview-update-indicator {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(83, 39, 160, 0.95);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
        pointer-events: none;
    }

    .preview-update-indicator.active {
        opacity: 1;
        transform: translateX(0);
    }

    .preview-update-indicator .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimePreviewUpdater;
}
