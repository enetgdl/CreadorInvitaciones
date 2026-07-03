/**
 * DYNAMIC-ELEMENTS-MANAGER.JS
 * Sistema de gestión de elementos dinámicos con persistencia completa
 */

class DynamicElementsManager {
    constructor(editor) {
        this.editor = editor;
        this.elements = [];
        this.eventLog = [];
        this.autoSaveTimer = null;
        this.autoSaveDelay = 500; // 500ms debounce
    }

    /**
     * Inicializar el gestor
     */
    init() {
        this.loadElements();
        this.setupAutoSave();
        console.log('✅ DynamicElementsManager initialized');
    }

    /**
     * Cargar elementos desde storage
     */
    loadElements() {
        try {
            const data = this.editor?.storage?.getData?.() || this.editor?.data;
            if (data && Array.isArray(data.dynamicElements)) {
                this.elements = data.dynamicElements;
                console.log(`📦 Loaded ${this.elements.length} dynamic elements from storage`);
                return this.elements;
            }
        } catch (error) {
            console.error('Error loading dynamic elements:', error);
        }
        this.elements = [];
        return this.elements;
    }

    /**
     * Guardar elementos en storage
     */
    saveElements() {
        try {
            if (!this.editor?.data) {
                console.warn('⚠️ Editor data not available for saving');
                return false;
            }

            // Actualizar el array de elementos dinámicos
            this.editor.data.dynamicElements = this.elements;

            // Guardar en localStorage
            if (this.editor.storage && typeof this.editor.storage.saveData === 'function') {
                this.editor.storage.saveData(this.editor.data);
            } else {
                // Fallback directo a localStorage
                localStorage.setItem('invitation_data', JSON.stringify(this.editor.data));
            }

            console.log(`💾 Saved ${this.elements.length} dynamic elements`);
            return true;
        } catch (error) {
            console.error('Error saving dynamic elements:', error);
            return false;
        }
    }

    /**
     * Auto-save con debounce
     */
    setupAutoSave() {
        // No action needed here, autoSave is triggered by scheduleAutoSave()
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        this.autoSaveTimer = setTimeout(() => {
            this.saveElements();
        }, this.autoSaveDelay);
    }

    /**
     * Agregar nuevo elemento
     */
    addElement(elementData) {
        const element = {
            id: elementData.id || `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: elementData.type, // 'text' or 'image'
            content: elementData.content || '',
            src: elementData.src || null,
            position: {
                x: elementData.x || 0,
                y: elementData.y || 0
            },
            size: {
                width: elementData.width || 100,
                height: elementData.height || 20
            },
            styles: {
                fontSize: elementData.fontSize || '24px',
                fontFamily: elementData.fontFamily || 'Inter, sans-serif',
                color: elementData.color || '#1e293b',
                zIndex: elementData.zIndex || 10,
                opacity: elementData.opacity !== undefined ? elementData.opacity : 1,
                transform: elementData.transform || ''
            },
            metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now(),
                name: elementData.name || (elementData.type === 'text' ? 'Texto' : 'Imagen')
            }
        };

        this.elements.push(element);
        this.logEvent('add', element.id, element);
        this.scheduleAutoSave();

        console.log(`➕ Added element: ${element.id} (${element.type})`);
        return element;
    }

    /**
     * Actualizar elemento existente
     */
    updateElement(elementId, updates) {
        const index = this.elements.findIndex(el => el.id === elementId);
        if (index === -1) {
            console.warn(`⚠️ Element not found: ${elementId}`);
            return null;
        }

        const element = this.elements[index];
        const oldData = JSON.parse(JSON.stringify(element)); // Deep clone

        // Merge updates
        if (updates.content !== undefined) element.content = updates.content;
        if (updates.src !== undefined) element.src = updates.src;
        if (updates.position) {
            element.position = { ...element.position, ...updates.position };
        }
        if (updates.size) {
            element.size = { ...element.size, ...updates.size };
        }
        if (updates.styles) {
            element.styles = { ...element.styles, ...updates.styles };
        }

        element.metadata.updatedAt = Date.now();

        this.logEvent('update', elementId, { old: oldData, new: element, updates });
        this.scheduleAutoSave();

        console.log(`✏️ Updated element: ${elementId}`);
        return element;
    }

    /**
     * Eliminar elemento
     */
    deleteElement(elementId) {
        const index = this.elements.findIndex(el => el.id === elementId);
        if (index === -1) {
            console.warn(`⚠️ Element not found: ${elementId}`);
            return false;
        }

        const element = this.elements[index];
        this.elements.splice(index, 1);
        this.logEvent('delete', elementId, element);
        this.scheduleAutoSave();

        console.log(`🗑️ Deleted element: ${elementId}`);
        return true;
    }

    /**
     * Eliminar TODOS los elementos (para nuevo proyecto)
     */
    clearAllElements() {
        const count = this.elements.length;
        if (count === 0) return true;

        this.elements = [];
        this.logEvent('clearAll', 'system', { removedCount: count });

        // Force immediate save to storage
        this.saveElements();

        console.log(`🧹 Cleared all ${count} dynamic elements for new project`);
        return true;
    }

    /**
     * Obtener elemento por ID
     */
    getElement(elementId) {
        return this.elements.find(el => el.id === elementId) || null;
    }

    /**
     * Obtener todos los elementos
     */
    getAllElements() {
        return [...this.elements]; // Return copy
    }

    /**
     * Registrar evento en el log
     */
    logEvent(action, elementId, data) {
        const event = {
            id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now(),
            action, // 'add', 'update', 'delete', 'move'
            elementId,
            data,
            user: 'current_user' // Could be extended for multi-user
        };

        this.eventLog.push(event);

        // Keep only last 100 events to avoid memory issues
        if (this.eventLog.length > 100) {
            this.eventLog = this.eventLog.slice(-100);
        }

        // Save event log to localStorage
        try {
            localStorage.setItem('dynamic_elements_event_log', JSON.stringify(this.eventLog));
        } catch (error) {
            console.warn('Could not save event log:', error);
        }

        return event;
    }

    /**
     * Registrar evento de movimiento/transformación
     */
    logTransformEvent(elementId, oldTransform, newTransform) {
        const event = {
            id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now(),
            action: 'transform',
            elementId,
            data: {
                old: oldTransform,
                new: newTransform
            }
        };

        this.eventLog.push(event);

        if (this.eventLog.length > 100) {
            this.eventLog = this.eventLog.slice(-100);
        }

        try {
            localStorage.setItem('dynamic_elements_event_log', JSON.stringify(this.eventLog));
        } catch (error) {
            console.warn('Could not save event log:', error);
        }

        return event;
    }

    /**
     * Obtener log de eventos
     */
    getEventLog(limit = 50) {
        return this.eventLog.slice(-limit);
    }

    /**
     * Limpiar log de eventos
     */
    clearEventLog() {
        this.eventLog = [];
        try {
            localStorage.removeItem('dynamic_elements_event_log');
        } catch (error) {
            console.warn('Could not clear event log:', error);
        }
    }

    /**
     * Restaurar elementos desde el HTML del iframe (para sincronización)
     */
    syncFromIframe(iframeElements) {
        if (!Array.isArray(iframeElements)) return;

        iframeElements.forEach(iframeEl => {
            const existingIndex = this.elements.findIndex(el => el.id === iframeEl.id);

            if (existingIndex >= 0) {
                // Update existing
                this.updateElement(iframeEl.id, {
                    position: iframeEl.position,
                    size: iframeEl.size,
                    styles: iframeEl.styles,
                    content: iframeEl.content
                });
            } else {
                // Add new (element was created directly in iframe)
                this.addElement(iframeEl);
            }
        });

        // Remove elements that no longer exist in iframe
        const iframeIds = new Set(iframeElements.map(el => el.id));
        this.elements = this.elements.filter(el => {
            if (iframeIds.has(el.id)) {
                return true;
            } else {
                this.logEvent('delete', el.id, el);
                return false;
            }
        });

        this.scheduleAutoSave();
    }

    /**
     * Exportar elementos para recreación en iframe
     */
    exportForIframe() {
        return this.elements.map(el => ({
            id: el.id,
            type: el.type,
            content: el.content,
            src: el.src,
            position: el.position,
            size: el.size,
            styles: el.styles,
            name: el.metadata.name
        }));
    }

    /**
     * Estadísticas
     */
    getStats() {
        return {
            totalElements: this.elements.length,
            textElements: this.elements.filter(el => el.type === 'text').length,
            imageElements: this.elements.filter(el => el.type === 'image').length,
            totalEvents: this.eventLog.length,
            lastSaved: this.editor?.data?.lastModified || 'never'
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.DynamicElementsManager = DynamicElementsManager;
}
