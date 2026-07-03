/**
 * HISTORY-MANAGER.JS
 * Sistema de control de historial (Deshacer/Rehacer) con soporte para metadatos
 */

class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStates = 20;
        this.isNavigating = false;
        this.editor = null;
        this.undoBtn = null;
        this.redoBtn = null;

        // Sistema de deduplicación
        this.pendingTransaction = null;
        this.transactionTimeout = null;
        this.deduplicationWindow = 100; // ms - ventana de deduplicación
        this.actionPriority = {
            // Acciones específicas tienen mayor prioridad que genéricas
            'Modificación': 0,
            'Editar': 1,
            'Cambio': 2,
            'Ajuste': 2,
            'Aplicar': 3,
            'Crear': 3,
            'Eliminar': 3
        };
    }

    init(editor) {
        this.editor = editor;
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');

        this.storageKeyUndo = 'invitacion_history_undo';
        this.storageKeyRedo = 'invitacion_history_redo';

        this.loadFromStorage();

        // Configuración de botones principales (Click simple = Acción inmediata)
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.undo();
            });
        }
        if (this.redoBtn) {
            this.redoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.redo();
            });
        }

        // Inicializar Dropdowns (Agrega flecha lateral)
        if (window.HistoryDropdown) {
            new HistoryDropdown(this, 'undo').init();
            new HistoryDropdown(this, 'redo').init();
        }

        this.setupGlobalShortcuts();
        this.updateUI();
        console.log('HistoryManager: Inicializado');
    }

    setupLegacyUI() {
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.undo();
            });
        }
        if (this.redoBtn) {
            this.redoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.redo();
            });
        }
    }

    setupGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
            if (isInput) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });
    }

    /**
     * Calcula prioridad de una acción basada en su nombre
     * @param {string} actionName 
     * @returns {number}
     */
    getActionPriority(actionName) {
        for (const [key, priority] of Object.entries(this.actionPriority)) {
            if (actionName.includes(key)) {
                return priority;
            }
        }
        return 2; // Prioridad media por defecto
    }

    /**
     * Punto único de entrada para registro de cambios con deduplicación
     * @param {Object} data - Estado a guardar
     * @param {string} actionName - Nombre descriptivo de la acción
     */
    saveState(data, actionName = 'Modificación') {
        if (this.isNavigating) return;

        const startTime = performance.now();

        try {
            // Guardar estado LIGERO (sin imágenes base64 para no saturar localStorage)
            const lightState = this._stripMedia(data);
            const priority = this.getActionPriority(actionName);
            const timestamp = Date.now();

            // 1. Verificar si hay una transacción pendiente en la ventana de deduplicación
            if (this.pendingTransaction) {
                const timeDiff = timestamp - this.pendingTransaction.meta.timestamp;

                if (timeDiff < this.deduplicationWindow) {
                    const pendingPriority = this.getActionPriority(this.pendingTransaction.meta.name);
                    const sameState = JSON.stringify(this.pendingTransaction.state) === JSON.stringify(lightState);

                    if (sameState) {
                        if (priority > pendingPriority) {
                            this.pendingTransaction = {
                                state: lightState,
                                meta: { name: actionName, timestamp, priority }
                            };
                        }
                        this.resetTransactionTimeout();
                        return;
                    } else {
                        this.commitPendingTransaction();
                    }
                } else {
                    this.commitPendingTransaction();
                }
            }

            // 2. Evitar duplicados consecutivos exactos
            if (this.undoStack.length > 0) {
                const lastEntry = this.undoStack[this.undoStack.length - 1];
                const lastData = lastEntry.meta ? lastEntry.state : lastEntry;
                if (JSON.stringify(lastData) === JSON.stringify(lightState)) return;
            }

            // 3. Nueva transacción pendiente con estado ligero
            this.pendingTransaction = {
                state: lightState,
                meta: { name: actionName, timestamp, priority }
            };
            this.resetTransactionTimeout();

            const elapsed = performance.now() - startTime;
            if (elapsed > 50) console.warn(`[HistoryManager] saveState tardió ${elapsed.toFixed(2)}ms`);

        } catch (e) {
            console.error('HistoryManager: Error saving state', e);
        }
    }

    /**
     * Elimina las imágenes base64 del estado antes de guardarlo en el historial.
     * Reduce cada entrada de ~800 KB a ~4 KB.
     * Los medios se preservan en el estado 'actual' del editor y se reinyectan en undo/redo.
     */
    _stripMedia(data) {
        const PLACEHOLDER = '__MEDIA_PRESERVED__';
        const clone = JSON.parse(JSON.stringify(data));

        // Foto del festejado
        if (typeof clone.honoredPhoto === 'string' && clone.honoredPhoto.length > 500) {
            clone.honoredPhoto = PLACEHOLDER;
        }
        // Imagen de fondo
        if (typeof clone.backgroundImage === 'string' && clone.backgroundImage.length > 500) {
            clone.backgroundImage = PLACEHOLDER;
        }
        // Video de fondo
        if (typeof clone.backgroundVideo === 'string' && clone.backgroundVideo.length > 500) {
            clone.backgroundVideo = PLACEHOLDER;
        }
        // Nota de audio
        if (typeof clone.audioNote === 'string' && clone.audioNote.length > 500) {
            clone.audioNote = PLACEHOLDER;
        }
        // Galería de imágenes
        if (Array.isArray(clone.gallery?.images)) {
            clone.gallery.images = clone.gallery.images.map(img => ({
                ...img,
                data: typeof img.data === 'string' && img.data.length > 500 ? PLACEHOLDER : img.data
            }));
        }

        return clone;
    }

    /**
     * Reinyecta los medios del estado actual en un estado ligero restaurado por undo/redo.
     * Garantiza que las imágenes nunca se pierdan al navegar el historial.
     */
    _restoreMedia(lightState, currentData) {
        const PLACEHOLDER = '__MEDIA_PRESERVED__';
        if (!currentData) return lightState;

        if (lightState.honoredPhoto === PLACEHOLDER) lightState.honoredPhoto = currentData.honoredPhoto;
        if (lightState.backgroundImage === PLACEHOLDER) lightState.backgroundImage = currentData.backgroundImage;
        if (lightState.backgroundVideo === PLACEHOLDER) lightState.backgroundVideo = currentData.backgroundVideo;
        if (lightState.audioNote === PLACEHOLDER) lightState.audioNote = currentData.audioNote;

        if (Array.isArray(lightState.gallery?.images) && Array.isArray(currentData.gallery?.images)) {
            const currentImgMap = new Map(currentData.gallery.images.map(i => [i.id, i]));
            lightState.gallery.images = lightState.gallery.images.map(img => {
                if (img.data === PLACEHOLDER && currentImgMap.has(img.id)) {
                    return { ...img, data: currentImgMap.get(img.id).data };
                }
                return img;
            });
        }

        return lightState;
    }

    /**
     * Reinicia el timeout de la transacción pendiente
     */
    resetTransactionTimeout() {
        if (this.transactionTimeout) {
            clearTimeout(this.transactionTimeout);
        }

        this.transactionTimeout = setTimeout(() => {
            this.commitPendingTransaction();
        }, this.deduplicationWindow);
    }

    /**
     * Commitea la transacción pendiente al stack de undo
     */
    commitPendingTransaction() {
        if (!this.pendingTransaction) return;

        const entry = {
            state: this.pendingTransaction.state,
            meta: {
                name: this.pendingTransaction.meta.name,
                timestamp: this.pendingTransaction.meta.timestamp
            }
        };

        this.undoStack.push(entry);

        if (this.undoStack.length > this.maxStates) {
            this.undoStack.shift();
        }

        this.redoStack = [];
        this.saveToStorage();
        this.updateUI();

        console.log(`[HistoryManager] ✓ Registrado: "${entry.meta.name}" (prioridad: ${this.pendingTransaction.meta.priority})`);

        this.pendingTransaction = null;

        if (this.transactionTimeout) {
            clearTimeout(this.transactionTimeout);
            this.transactionTimeout = null;
        }
    }

    undo() {
        if (this.undoStack.length === 0 || this.isNavigating) return;

        this.isNavigating = true;

        try {
            // Guardar estado actual (ligero) en Redo
            const currentLight = this._stripMedia(this.editor.data);

            const entry = this.undoStack.pop();
            const lightState = entry.meta ? entry.state : entry;
            const meta = entry.meta || { name: 'Acción anterior', timestamp: Date.now() };

            this.redoStack.push({ state: currentLight, meta });

            // Restaurar medios desde el estado actual antes de cargar
            const fullState = this._restoreMedia(lightState, this.editor.data);

            this.editor.loadData(fullState);
            this.showNotification(`Deshacer: ${meta.name}`);

        } catch (e) {
            console.error('HistoryManager: Error during undo', e);
        } finally {
            this.isNavigating = false;
            this.updateUI();
            this.saveToStorage();
        }
    }

    redo() {
        if (this.redoStack.length === 0 || this.isNavigating) return;

        this.isNavigating = true;

        try {
            const currentLight = this._stripMedia(this.editor.data);

            const entry = this.redoStack.pop();
            const lightState = entry.meta ? entry.state : entry;
            const meta = entry.meta || { name: 'Acción rehecha', timestamp: Date.now() };

            this.undoStack.push({ state: currentLight, meta });

            // Restaurar medios desde el estado actual antes de cargar
            const fullState = this._restoreMedia(lightState, this.editor.data);

            this.editor.loadData(fullState);
            this.showNotification(`Rehacer: ${meta.name}`);

        } catch (e) {
            console.error('HistoryManager: Error during redo', e);
        } finally {
            this.isNavigating = false;
            this.updateUI();
            this.saveToStorage();
        }
    }

    updateUI() {
        if (this.undoBtn) {
            this.undoBtn.disabled = this.undoStack.length === 0;
            this.undoBtn.style.opacity = this.undoStack.length === 0 ? '0.5' : '1';
        }

        if (this.redoBtn) {
            this.redoBtn.disabled = this.redoStack.length === 0;
            this.redoBtn.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
        }
    }

    showNotification(msg) {
        if (this.editor && this.editor.storage && this.editor.storage.showNotification) {
            this.editor.storage.showNotification(msg, 'info');
        }
    }

    /**
     * Persiste el historial ligero en IndexedDB (async, no bloqueante)
     */
    saveToStorage() {
        if (!window.indexedDBManager) return;
        // Fire-and-forget — el historial es ligero, los errores no son críticos
        Promise.all([
            window.indexedDBManager.put(this.storageKeyUndo, this.undoStack),
            window.indexedDBManager.put(this.storageKeyRedo, this.redoStack)
        ]).catch(e => console.warn('[HistoryManager] No se pudo persistir historial:', e));
    }

    /**
     * Carga el historial desde IndexedDB (llamar una vez al inicializar)
     */
    async loadFromStorage() {
        if (!window.indexedDBManager) return;
        try {
            const [u, r] = await Promise.all([
                window.indexedDBManager.get(this.storageKeyUndo),
                window.indexedDBManager.get(this.storageKeyRedo)
            ]);
            if (Array.isArray(u)) this.undoStack = u;
            if (Array.isArray(r)) this.redoStack = r;
            this.updateUI();
        } catch (e) {
            console.error('[HistoryManager] Error cargando historial:', e);
            this.undoStack = [];
            this.redoStack = [];
        }
    }

    /**
     * Limpia completamente el historial (undo/redo)
     * Útil al crear nueva invitación o abrir plantilla
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];

        // Limpiar de IndexedDB
        if (window.indexedDBManager) {
            Promise.all([
                window.indexedDBManager.delete(this.storageKeyUndo),
                window.indexedDBManager.delete(this.storageKeyRedo)
            ]).catch(e => console.warn('[HistoryManager] Error al limpiar historial:', e));
        }

        this.updateUI();
        console.log('[HistoryManager] Historia limpiada.');
    }
}

window.HistoryManager = HistoryManager;
