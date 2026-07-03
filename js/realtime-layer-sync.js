/**
 * REALTIME-LAYER-SYNC.JS
 * Sistema de sincronización bidireccional del panel de capas
 * Mantiene consistencia entre panel UI y estado de la invitación
 */

class RealtimeLayerSync {
    constructor(stateManager) {
        this.stateManager = stateManager;

        // Referencias DOM
        this.layerPanel = null;
        this.layerList = null;

        // Estado de sincronización
        this.isSyncing = false;
        this.syncQueue = [];

        // Configuración
        this.config = {
            animationDuration: 200,
            enableAnimations: true,
            autoSync: true
        };

        // Métricas
        this.metrics = {
            syncs: 0,
            errors: 0,
            avgSyncTime: 0
        };

        // Suscripciones
        this.unsubscribers = [];

        this.initialize();
    }

    /**
     * Inicializar sistema de sincronización
     */
    initialize() {
        console.log('🔄 Realtime Layer Sync inicializando...');

        // Encontrar panel de capas
        this.findLayerPanel();

        // Suscribirse a cambios
        this.setupSubscriptions();

        // Configurar event listeners del panel
        this.setupPanelListeners();

        console.log('✅ Realtime Layer Sync listo');
    }

    /**
     * Encontrar panel de capas en el DOM
     */
    findLayerPanel() {
        this.layerPanel = document.querySelector('.layers-panel, #layersPanel, [data-panel="layers"]');

        if (this.layerPanel) {
            this.layerList = this.layerPanel.querySelector('.layers-list, .layer-items, ul');
        }

        if (!this.layerPanel || !this.layerList) {
            console.warn('⚠️ Panel de capas no encontrado, sincronización deshabilitada');
        }
    }

    /**
     * Configurar suscripciones al state manager
     */
    setupSubscriptions() {
        // Suscribirse a cambios en capas
        const unsubLayers = this.stateManager.subscribe('layers', (notification) => {
            this.handleLayersChange(notification);
        });

        // Suscribirse a cambios en selección
        const unsubSelection = this.stateManager.subscribe('selection', (notification) => {
            this.handleSelectionChange(notification);
        });

        // Suscribirse a cambios en datos (para actualizar contenido de capas)
        const unsubData = this.stateManager.subscribe('data', (notification) => {
            this.handleDataChange(notification);
        });

        this.unsubscribers.push(unsubLayers, unsubSelection, unsubData);
    }

    /**
     * Configurar listeners del panel
     */
    setupPanelListeners() {
        if (!this.layerPanel) return;

        // Delegación de eventos para botones de acción
        this.layerPanel.addEventListener('click', (e) => {
            const target = e.target.closest('[data-layer-action]');
            if (!target) return;

            const action = target.dataset.layerAction;
            const layerId = target.closest('[data-layer-id]')?.dataset.layerId;

            this.handleLayerAction(action, layerId, target);
        });

        // Drag and drop para reordenar
        this.setupDragAndDrop();

        // Edición de nombres
        this.setupNameEditing();
    }

    /**
     * Manejar cambios en capas
     */
    handleLayersChange(notification) {
        const { type, layers } = notification;

        if (type === 'ERROR') {
            this.showSyncError(notification.error);
            return;
        }

        // Sincronizar UI con nuevo estado de capas
        this.syncLayersToUI(layers);
    }

    /**
     * Manejar cambios en selección
     */
    handleSelectionChange(notification) {
        const { layerId } = notification;
        this.updateSelectedLayer(layerId);
    }

    /**
     * Manejar cambios en datos
     */
    handleDataChange(notification) {
        // Actualizar contenido visible de capas si es necesario
        // Por ejemplo, actualizar thumbnails, nombres, etc.
        this.updateLayerContents();
    }

    /**
     * Sincronizar capas al UI
     */
    async syncLayersToUI(layers) {
        if (this.isSyncing || !this.layerList) return;

        this.isSyncing = true;
        const startTime = performance.now();

        try {
            // Obtener capas actuales del DOM
            const currentLayerElements = Array.from(
                this.layerList.querySelectorAll('[data-layer-id]')
            );

            // Crear mapa de elementos existentes
            const elementMap = new Map();
            currentLayerElements.forEach(el => {
                elementMap.set(el.dataset.layerId, el);
            });

            // Crear fragment para batch DOM updates
            const fragment = document.createDocumentFragment();

            // Procesar cada capa
            layers.forEach((layer, index) => {
                let layerElement = elementMap.get(layer.id);

                if (layerElement) {
                    // Actualizar elemento existente
                    this.updateLayerElement(layerElement, layer, index);
                    elementMap.delete(layer.id);
                } else {
                    // Crear nuevo elemento
                    layerElement = this.createLayerElement(layer, index);
                }

                fragment.appendChild(layerElement);
            });

            // Eliminar capas que ya no existen
            elementMap.forEach(el => {
                this.removeLayerElement(el);
            });

            // Actualizar DOM de una vez
            this.layerList.innerHTML = '';
            this.layerList.appendChild(fragment);

            // Actualizar contador
            this.updateLayerCount(layers.length);

            // Métricas
            const duration = performance.now() - startTime;
            this.updateMetrics(duration);
            this.metrics.syncs++;

        } catch (error) {
            console.error('❌ Error sincronizando capas:', error);
            this.metrics.errors++;
            this.showSyncError(error.message);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Crear elemento de capa
     */
    createLayerElement(layer, index) {
        const div = document.createElement('div');
        div.className = 'layer-item';
        div.dataset.layerId = layer.id;
        div.dataset.layerIndex = index;
        div.draggable = true;

        const visibility = layer.visible !== false ? 'visible' : 'hidden';
        const locked = layer.locked ? 'locked' : '';
        const icon = this.getLayerIcon(layer.type);

        div.innerHTML = `
            <div class="layer-drag-handle" title="Arrastrar para reordenar">
                <svg width="12" height="12" viewBox="0 0 12 12">
                    <circle cx="3" cy="3" r="1.5"/>
                    <circle cx="9" cy="3" r="1.5"/>
                    <circle cx="3" cy="9" r="1.5"/>
                    <circle cx="9" cy="9" r="1.5"/>
                </svg>
            </div>
            
            <div class="layer-icon">${icon}</div>
            
            <div class="layer-name" data-editable="true">
                ${this.escapeHtml(layer.name || layer.id)}
            </div>
            
            <div class="layer-actions">
                <button 
                    class="layer-action-btn" 
                    data-layer-action="toggle-visibility"
                    title="${visibility === 'visible' ? 'Ocultar' : 'Mostrar'}"
                >
                    ${visibility === 'visible' ? '👁️' : '👁️‍🗨️'}
                </button>
                
                <button 
                    class="layer-action-btn ${locked}" 
                    data-layer-action="toggle-lock"
                    title="${locked ? 'Desbloquear' : 'Bloquear'}"
                >
                    ${locked ? '🔒' : '🔓'}
                </button>
                
                <button 
                    class="layer-action-btn" 
                    data-layer-action="duplicate"
                    title="Duplicar capa"
                >
                    📋
                </button>
                
                <button 
                    class="layer-action-btn layer-delete-btn" 
                    data-layer-action="delete"
                    title="Eliminar capa"
                >
                    🗑️
                </button>
            </div>
        `;

        // Agregar clase de animación si está habilitada
        if (this.config.enableAnimations) {
            div.classList.add('layer-item-enter');
            setTimeout(() => div.classList.remove('layer-item-enter'), this.config.animationDuration);
        }

        return div;
    }

    /**
     * Actualizar elemento de capa existente
     */
    updateLayerElement(element, layer, index) {
        element.dataset.layerIndex = index;

        // Actualizar nombre si cambió
        const nameEl = element.querySelector('.layer-name');
        if (nameEl && nameEl.textContent !== layer.name) {
            nameEl.textContent = this.escapeHtml(layer.name || layer.id);
        }

        // Actualizar visibilidad
        const visBtn = element.querySelector('[data-layer-action="toggle-visibility"]');
        if (visBtn) {
            const isVisible = layer.visible !== false;
            visBtn.textContent = isVisible ? '👁️' : '👁️‍🗨️';
            visBtn.title = isVisible ? 'Ocultar' : 'Mostrar';
        }

        // Actualizar lock
        const lockBtn = element.querySelector('[data-layer-action="toggle-lock"]');
        if (lockBtn) {
            const isLocked = layer.locked === true;
            lockBtn.textContent = isLocked ? '🔒' : '🔓';
            lockBtn.title = isLocked ? 'Desbloquear' : 'Bloquear';
            lockBtn.classList.toggle('locked', isLocked);
        }

        return element;
    }

    /**
     * Remover elemento de capa con animación
     */
    removeLayerElement(element) {
        if (this.config.enableAnimations) {
            element.classList.add('layer-item-exit');
            setTimeout(() => element.remove(), this.config.animationDuration);
        } else {
            element.remove();
        }
    }

    /**
     * Actualizar capa seleccionada
     */
    updateSelectedLayer(layerId) {
        if (!this.layerList) return;

        // Remover selección anterior
        this.layerList.querySelectorAll('.layer-item.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Agregar nueva selección
        if (layerId) {
            const element = this.layerList.querySelector(`[data-layer-id="${layerId}"]`);
            if (element) {
                element.classList.add('selected');
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    /**
     * Actualizar contenido de capas
     */
    updateLayerContents() {
        // Implementar si necesitamos actualizar thumbnails u otro contenido
        // basado en cambios en los datos de la invitación
    }

    /**
     * Manejar acción de capa
     */
    handleLayerAction(action, layerId, button) {
        if (!layerId) return;

        switch (action) {
            case 'toggle-visibility':
                this.toggleLayerVisibility(layerId);
                break;

            case 'toggle-lock':
                this.toggleLayerLock(layerId);
                break;

            case 'duplicate':
                this.duplicateLayer(layerId);
                break;

            case 'delete':
                this.deleteLayer(layerId);
                break;

            default:
                console.warn(`Acción desconocida: ${action}`);
        }
    }

    /**
     * Alternar visibilidad de capa
     */
    toggleLayerVisibility(layerId) {
        const layers = this.stateManager.state.layers;
        const layer = layers.find(l => l.id === layerId);

        if (!layer) return;

        const newVisibility = layer.visible === false;

        this.stateManager.updateLayer(layerId, {
            visible: newVisibility
        });

        // Feedback visual inmediato
        this.showActionFeedback('visibility', newVisibility);
    }

    /**
     * Alternar bloqueo de capa
     */
    toggleLayerLock(layerId) {
        const layers = this.stateManager.state.layers;
        const layer = layers.find(l => l.id === layerId);

        if (!layer) return;

        const newLockState = !layer.locked;

        this.stateManager.updateLayer(layerId, {
            locked: newLockState
        });

        this.showActionFeedback('lock', newLockState);
    }

    /**
     * Duplicar capa
     */
    duplicateLayer(layerId) {
        const layers = this.stateManager.state.layers;
        const layer = layers.find(l => l.id === layerId);

        if (!layer) return;

        // Crear copia
        const newLayer = {
            ...layer,
            id: `${layer.id}_copy_${Date.now()}`,
            name: `${layer.name} (copia)`
        };

        // Agregar después de la capa original
        const index = layers.indexOf(layer);
        const newLayers = [
            ...layers.slice(0, index + 1),
            newLayer,
            ...layers.slice(index + 1)
        ];

        this.stateManager.updateLayers(newLayers);
        this.showActionFeedback('duplicate');
    }

    /**
     * Eliminar capa
     */
    deleteLayer(layerId) {
        // Confirmar eliminación
        if (!confirm('¿Eliminar esta capa?')) return;

        const layers = this.stateManager.state.layers;
        const newLayers = layers.filter(l => l.id !== layerId);

        this.stateManager.updateLayers(newLayers);
        this.showActionFeedback('delete');
    }

    /**
     * Configurar drag and drop
     */
    setupDragAndDrop() {
        if (!this.layerList) return;

        let draggedElement = null;
        let placeholder = null;

        this.layerList.addEventListener('dragstart', (e) => {
            const layerItem = e.target.closest('.layer-item');
            if (!layerItem) return;

            draggedElement = layerItem;
            layerItem.classList.add('dragging');

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', layerItem.innerHTML);
        });

        this.layerList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = this.getDragAfterElement(e.clientY);

            if (afterElement == null) {
                this.layerList.appendChild(draggedElement);
            } else {
                this.layerList.insertBefore(draggedElement, afterElement);
            }
        });

        this.layerList.addEventListener('dragend', (e) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');

                // Actualizar orden en el state
                this.updateLayerOrder();

                draggedElement = null;
            }
        });
    }

    /**
     * Obtener elemento después del cual insertar
     */
    getDragAfterElement(y) {
        const draggableElements = [
            ...this.layerList.querySelectorAll('.layer-item:not(.dragging)')
        ];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Actualizar orden de capas
     */
    updateLayerOrder() {
        const layerElements = Array.from(
            this.layerList.querySelectorAll('[data-layer-id]')
        );

        const newOrder = layerElements.map(el => el.dataset.layerId);
        const currentLayers = this.stateManager.state.layers;

        // Reordenar array de capas
        const reorderedLayers = newOrder.map(id =>
            currentLayers.find(l => l.id === id)
        ).filter(Boolean);

        this.stateManager.updateLayers(reorderedLayers);
        this.showActionFeedback('reorder');
    }

    /**
     * Configurar edición de nombres
     */
    setupNameEditing() {
        if (!this.layerList) return;

        this.layerList.addEventListener('dblclick', (e) => {
            const nameEl = e.target.closest('.layer-name');
            if (!nameEl || !nameEl.dataset.editable) return;

            this.startNameEdit(nameEl);
        });
    }

    /**
     * Iniciar edición de nombre
     */
    startNameEdit(nameEl) {
        const layerItem = nameEl.closest('.layer-item');
        const layerId = layerItem.dataset.layerId;
        const currentName = nameEl.textContent;

        // Crear input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'layer-name-input';

        // Reemplazar
        nameEl.replaceWith(input);
        input.focus();
        input.select();

        // Guardar al perder foco o presionar Enter
        const save = () => {
            const newName = input.value.trim() || currentName;

            nameEl.textContent = newName;
            input.replaceWith(nameEl);

            // Actualizar en state
            this.stateManager.updateLayer(layerId, { name: newName });
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
                nameEl.textContent = currentName;
                input.replaceWith(nameEl);
            }
        });
    }

    /**
     * Actualizar contador de capas
     */
    updateLayerCount(count) {
        const counter = this.layerPanel?.querySelector('.layer-count, .layers-count');
        if (counter) {
            counter.textContent = `${count} capa${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Obtener icono de capa según tipo
     */
    getLayerIcon(type) {
        const icons = {
            text: '📝',
            image: '🖼️',
            shape: '⬛',
            group: '📁',
            background: '🎨',
            default: '📄'
        };

        return icons[type] || icons.default;
    }

    /**
     * Mostrar feedback de acción
     */
    showActionFeedback(action, value) {
        const messages = {
            visibility: value ? 'Capa visible' : 'Capa oculta',
            lock: value ? 'Capa bloqueada' : 'Capa desbloqueada',
            duplicate: 'Capa duplicada',
            delete: 'Capa eliminada',
            reorder: 'Orden actualizado'
        };

        const message = messages[action];
        if (message && window.invitationStorage) {
            window.invitationStorage.showNotification(message, 'success');
        }
    }

    /**
     * Mostrar error de sincronización
     */
    showSyncError(message) {
        console.error('❌ Error de sincronización:', message);

        if (window.invitationStorage) {
            window.invitationStorage.showNotification(
                `Error sincronizando capas: ${message}`,
                'error'
            );
        }
    }

    /**
     * Escape HTML (delega a Utils/Sanitize)
     */
    escapeHtml(text) {
        return Utils.escapeHtml(text);
    }

    /**
     * Actualizar métricas
     */
    updateMetrics(duration) {
        const alpha = 0.3;
        this.metrics.avgSyncTime =
            (alpha * duration) + ((1 - alpha) * this.metrics.avgSyncTime);
    }

    /**
     * Obtener métricas
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Destruir sync
     */
    destroy() {
        // Desuscribirse
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];

        console.log('🛑 Realtime Layer Sync destruido');
    }
}

// Estilos para el panel de capas
const style = document.createElement('style');
style.textContent = `
    .layer-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-bottom: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .layer-item:hover {
        background: #f9fafb;
        border-color: #d1d5db;
    }

    .layer-item.selected {
        background: #ede9fe;
        border-color: #8b5cf6;
    }

    .layer-item.dragging {
        opacity: 0.5;
    }

    .layer-item-enter {
        animation: layerEnter 0.2s ease;
    }

    .layer-item-exit {
        animation: layerExit 0.2s ease forwards;
    }

    @keyframes layerEnter {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes layerExit {
        to {
            opacity: 0;
            transform: translateX(10px);
        }
    }

    .layer-drag-handle {
        cursor: grab;
        color: #9ca3af;
        display: flex;
        align-items: center;
    }

    .layer-drag-handle:active {
        cursor: grabbing;
    }

    .layer-icon {
        font-size: 16px;
    }

    .layer-name {
        flex: 1;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .layer-name-input {
        flex: 1;
        padding: 2px 4px;
        border: 1px solid #8b5cf6;
        border-radius: 3px;
        font-size: 0.875rem;
        outline: none;
    }

    .layer-actions {
        display: flex;
        gap: 4px;
    }

    .layer-action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
    }

    .layer-action-btn:hover {
        background: #e5e7eb;
    }

    .layer-action-btn.locked {
        color: #ef4444;
    }

    .layer-delete-btn:hover {
        background: #fee2e2;
    }
`;
document.head.appendChild(style);

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeLayerSync;
}
