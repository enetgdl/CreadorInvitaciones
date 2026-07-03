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
            const stateClone = JSON.parse(JSON.stringify(data));
            const priority = this.getActionPriority(actionName);
            const timestamp = Date.now();

            // 1. Verificar si hay una transacción pendiente en la ventana de deduplicación
            if (this.pendingTransaction) {
                const timeDiff = timestamp - this.pendingTransaction.meta.timestamp;

                if (timeDiff < this.deduplicationWindow) {
                    // Dentro de la ventana de deduplicación
                    const pendingPriority = this.getActionPriority(this.pendingTransaction.meta.name);

                    // Comparar estados para ver si es el mismo cambio
                    const sameState = JSON.stringify(this.pendingTransaction.state) === JSON.stringify(stateClone);

                    if (sameState) {
                        // Mismo estado: Mantener el de mayor prioridad
                        if (priority > pendingPriority) {
                            console.log(`[HistoryManager] Reemplazando "${this.pendingTransaction.meta.name}" con "${actionName}" (mayor prioridad)`);
                            this.pendingTransaction = {
                                state: stateClone,
                                meta: { name: actionName, timestamp, priority }
                            };
                        } else {
                            console.log(`[HistoryManager] Ignorando "${actionName}" - ya existe "${this.pendingTransaction.meta.name}" con mayor/igual prioridad`);
                        }
                        // Reiniciar timeout
                        this.resetTransactionTimeout();
                        return;
                    } else {
                        // Estado diferente: Commitear la transacción pendiente y crear nueva
                        this.commitPendingTransaction();
                    }
                } else {
                    // Fuera de ventana: Commitear pendiente
                    this.commitPendingTransaction();
                }
            }

            // 2. Evitar duplicados consecutivos exactos en el stack
            if (this.undoStack.length > 0) {
                const lastEntry = this.undoStack[this.undoStack.length - 1];
                const lastData = lastEntry.meta ? lastEntry.state : lastEntry;

                if (JSON.stringify(lastData) === JSON.stringify(stateClone)) {
                    console.log(`[HistoryManager] Ignorando duplicado exacto: "${actionName}"`);
                    return;
                }
            }

            // 3. Crear nueva transacción pendiente
            this.pendingTransaction = {
                state: stateClone,
                meta: { name: actionName, timestamp, priority }
            };

            // 4. Configurar auto-commit después de la ventana de deduplicación
            this.resetTransactionTimeout();

            const elapsed = performance.now() - startTime;
            if (elapsed > 100) {
                console.warn(`[HistoryManager] saveState tardó ${elapsed.toFixed(2)}ms - excede límite de 100ms`);
            }

        } catch (e) {
            console.error('HistoryManager: Error saving state', e);
        }
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
            // Guardar estado actual en Redo
            const currentState = JSON.parse(JSON.stringify(this.editor.data));

            const entry = this.undoStack.pop();
            const dataToLoad = entry.meta ? entry.state : entry;
            const meta = entry.meta || { name: 'Acción anterior', timestamp: Date.now() };

            this.redoStack.push({
                state: currentState,
                meta: meta
            });

            this.editor.loadData(dataToLoad);
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
            const currentState = JSON.parse(JSON.stringify(this.editor.data));

            const entry = this.redoStack.pop();
            const dataToLoad = entry.meta ? entry.state : entry;
            const meta = entry.meta || { name: 'Acción rehecha', timestamp: Date.now() };

            this.undoStack.push({
                state: currentState,
                meta: meta
            });

            this.editor.loadData(dataToLoad);
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

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKeyUndo, JSON.stringify(this.undoStack));
            localStorage.setItem(this.storageKeyRedo, JSON.stringify(this.redoStack));
        } catch (e) {
            console.warn('HistoryManager: Storage quota exceeded or error', e);
        }
    }

    loadFromStorage() {
        try {
            const u = localStorage.getItem(this.storageKeyUndo);
            const r = localStorage.getItem(this.storageKeyRedo);
            if (u) {
                const parsed = JSON.parse(u);
                if (Array.isArray(parsed)) this.undoStack = parsed;
            }
            if (r) {
                const parsed = JSON.parse(r);
                if (Array.isArray(parsed)) this.redoStack = parsed;
            }
        } catch (e) {
            console.error('HistoryManager: Error loading storage', e);
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

        // Limpiar localStorage
        try {
            localStorage.removeItem(this.storageKeyUndo);
            localStorage.removeItem(this.storageKeyRedo);
        } catch (e) {
            console.warn('HistoryManager: Error clearing storage', e);
        }

        // Actualizar UI
        this.updateUI();

        console.log('HistoryManager: Historia limpiada');
    }
}

window.HistoryManager = HistoryManager;
