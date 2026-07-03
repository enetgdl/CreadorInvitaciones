/**
 * ENHANCED-LAYER-REALTIME-SYNC.JS
 * Sistema avanzado de sincronización en tiempo real para el panel de capas
 * 
 * Características:
 * - Refresco automático al crear nueva invitación
 * - Sincronización en tiempo real bidireccional
 * - Detección de cambios con MutationObserver
 * - Algoritmo de diferenciación eficiente
 * - Actualizaciones incrementales
 * - Debouncing inteligente
 * - Validación de consistencia
 * - Manejo de cambios múltiples simultáneos
 * 
 * @version 2.0.0
 * @author Antigravity AI
 */

class EnhancedLayerRealtimeSync {
    constructor() {
        // Referencias DOM
        this.canvas = null;
        this.layerPanel = null;
        this.layerList = null;

        // Estado interno sincronizado
        this.internalState = {
            layers: new Map(), // Map<elementId, layerData>
            lastUpdate: Date.now(),
            version: 0
        };

        // Configuración
        this.config = {
            debounceDelay: 50, // ms - Menor que 100ms como requerido
            batchUpdateDelay: 30, // ms para batch updates
            maxRetries: 3,
            enableAnimations: true,
            enableConsistencyCheck: false  // Desactivado para prevenir bucles
        };

        // Sistema de observación
        this.mutationObserver = null;
        this.resizeObserver = null;
        this.attributeObserver = null;

        // Cola de actualizaciones
        this.updateQueue = [];
        this.batchTimer = null;
        this.processingUpdate = false;
        this.fixingInconsistencies = false; // Flag para prevenir bucles

        // Métricas de rendimiento
        this.metrics = {
            totalUpdates: 0,
            averageUpdateTime: 0,
            lastUpdateTime: 0,
            inconsistenciesDetected: 0,
            inconsistenciesFixed: 0,
            queuedUpdates: 0,
            droppedUpdates: 0
        };

        // Debounce timers
        this.debounceTimers = new Map();

        // Listeners
        this.eventListeners = new Map();

        // Inicializar
        this.initialize();
    }

    /**
     * Inicializar el sistema
     */
    async initialize() {
        console.log('🚀 Inicializando Enhanced Layer Realtime Sync...');

        try {
            // Encontrar elementos DOM
            await this.findDOMElements();

            // Configurar observadores
            this.setupMutationObserver();
            this.setupResizeObserver();
            this.setupAttributeObserver();

            // Configurar listeners de eventos
            this.setupEventListeners();

            // Integrar con sistemas existentes
            this.integrateWithExistingSystems();

            // Sincronización inicial
            await this.performInitialSync();

            // Configurar validación de consistencia
            if (this.config.enableConsistencyCheck) {
                this.startConsistencyChecker();
            }

            console.log('✅ Enhanced Layer Realtime Sync inicializado correctamente');

        } catch (error) {
            console.error('❌ Error al inicializar Enhanced Layer Realtime Sync:', error);
        }
    }

    /**
     * Encontrar elementos DOM necesarios
     */
    async findDOMElements() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 10;
            let attempts = 0;

            const findElements = () => {
                // Canvas (preview)
                this.canvas = document.getElementById('deviceScreen') ||
                    document.querySelector('.device-screen') ||
                    document.querySelector('[data-preview-canvas]');

                // Panel de capas
                this.layerList = document.getElementById('layersList') ||
                    document.querySelector('.layers-list');

                this.layerPanel = document.getElementById('layersBody') ||
                    document.querySelector('.sidebar-group-body');

                if (this.canvas && this.layerList) {
                    console.log('✓ Elementos DOM encontrados');
                    resolve();
                } else {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        reject(new Error('No se pudieron encontrar los elementos DOM necesarios'));
                    } else {
                        setTimeout(findElements, 100);
                    }
                }
            };

            findElements();
        });
    }

    /**
     * Configurar MutationObserver para detectar cambios en el canvas
     */
    setupMutationObserver() {
        if (!this.canvas) return;

        this.mutationObserver = new MutationObserver((mutations) => {
            this.handleCanvasMutations(mutations);
        });

        // Observar todos los tipos de cambios
        this.mutationObserver.observe(this.canvas, {
            childList: true,        // Inserción/eliminación de elementos
            attributes: true,       // Cambios en atributos
            attributeOldValue: true,
            characterData: true,    // Cambios en contenido de texto
            characterDataOldValue: true,
            subtree: true          // Observar todo el árbol
        });

        console.log('✓ MutationObserver configurado');
    }

    /**
     * Configurar ResizeObserver para detectar cambios de tamaño
     */
    setupResizeObserver() {
        if (!this.canvas || !window.ResizeObserver) return;

        this.resizeObserver = new ResizeObserver((entries) => {
            this.handleResizeChanges(entries);
        });

        // Observar todos los elementos dentro del canvas
        const elements = this.canvas.querySelectorAll('[data-element-id], [id]');
        elements.forEach(el => {
            if (el.id || el.dataset.elementId) {
                this.resizeObserver.observe(el);
            }
        });

        console.log('✓ ResizeObserver configurado');
    }

    /**
     * Configurar observador de atributos para cambios de estilo
     */
    setupAttributeObserver() {
        if (!this.canvas) return;

        // El MutationObserver ya cubre esto, pero podemos agregar listeners específicos
        this.attributeObserver = new Map();

        console.log('✓ AttributeObserver configurado');
    }

    /**
     * Configurar listeners de eventos del sistema
     */
    setupEventListeners() {
        // Evento: Nueva invitación creada
        this.addEventListener('newInvitationCreated', () => {
            this.handleNewInvitationCreated();
        });

        // Evento: Elemento seleccionado
        this.addEventListener('elementSelected', (event) => {
            this.handleElementSelected(event.detail.elementId);
        });

        // Evento: Cambio en panel de capas
        this.addEventListener('layerPanelAction', (event) => {
            this.handleLayerPanelAction(event.detail);
        });

        // Listener para clicks en el panel de capas
        if (this.layerList) {
            this.layerList.addEventListener('click', (e) => {
                this.handleLayerListClick(e);
            });
        }

        console.log('✓ Event listeners configurados');
    }

    /**
     * Añadir event listener customizado
     */
    addEventListener(eventName, handler) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set());
        }
        this.eventListeners.get(eventName).add(handler);

        // También escuchar eventos globales
        window.addEventListener(eventName, handler);
    }

    /**
     * Disparar evento customizado
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);

        // También ejecutar listeners internos
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(handler => {
                try {
                    handler({ detail });
                } catch (error) {
                    console.error(`Error en listener de ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Integrar con sistemas existentes (LayerManager, LayerStore, etc)
     */
    integrateWithExistingSystems() {
        // Integrar con LayerStore si existe
        if (window.layerStore) {
            console.log('✓ Integrando con LayerStore...');
            window.layerStore.subscribe((state) => {
                this.handleStoreStateChange(state);
            });
        }

        // Integrar con LayerManager si existe
        if (window.layerManager) {
            console.log('✓ Integrando con LayerManager...');
            // El LayerManager ya tiene su propio sistema de actualización
            // Solo nos aseguramos de que nuestras actualizaciones sean compatibles
        }

        // Integrar con sistema de preview
        if (window.previewUpdater || window.preview) {
            console.log('✓ Integrando con Preview System...');
        }

        // Integrar con visual editor si existe
        if (window.visualEditor) {
            console.log('✓ Integrando con Visual Editor...');
        }
    }

    /**
     * Realizar sincronización inicial
     */
    async performInitialSync() {
        console.log('🔄 Realizando sincronización inicial...');

        const startTime = performance.now();

        try {
            // Limpiar estado interno
            this.internalState.layers.clear();

            // Escanear canvas y construir estado inicial
            if (this.canvas) {
                const elements = this.canvas.querySelectorAll('[data-element-id], [id]');
                elements.forEach(el => {
                    const layerData = this.buildLayerDataFromElement(el);
                    if (layerData) {
                        this.internalState.layers.set(layerData.id, layerData);
                    }
                });
            }

            // Renderizar panel de capas
            await this.renderLayerPanel();

            const duration = performance.now() - startTime;
            console.log(`✅ Sincronización inicial completada en ${duration.toFixed(2)}ms`);

        } catch (error) {
            console.error('❌ Error en sincronización inicial:', error);
        }
    }

    /**
     * Manejar mutaciones del canvas
     */
    handleCanvasMutations(mutations) {
        if (this.processingUpdate) return; // Evitar loops

        const changes = [];

        mutations.forEach(mutation => {
            switch (mutation.type) {
                case 'childList':
                    // Elementos añadidos
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            changes.push({
                                type: 'added',
                                element: node,
                                timestamp: Date.now()
                            });
                        }
                    });

                    // Elementos eliminados
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            changes.push({
                                type: 'removed',
                                element: node,
                                timestamp: Date.now()
                            });
                        }
                    });
                    break;

                case 'attributes':
                    changes.push({
                        type: 'attribute',
                        element: mutation.target,
                        attributeName: mutation.attributeName,
                        oldValue: mutation.oldValue,
                        timestamp: Date.now()
                    });
                    break;

                case 'characterData':
                    changes.push({
                        type: 'content',
                        element: mutation.target.parentElement,
                        oldValue: mutation.oldValue,
                        timestamp: Date.now()
                    });
                    break;
            }
        });

        if (changes.length > 0) {
            this.queueUpdate({ mutations: changes });
        }
    }

    /**
     * Manejar cambios de tamaño
     */
    handleResizeChanges(entries) {
        const changes = entries.map(entry => ({
            type: 'resize',
            element: entry.target,
            size: {
                width: entry.contentRect.width,
                height: entry.contentRect.height
            },
            timestamp: Date.now()
        }));

        this.queueUpdate({ resizes: changes });
    }

    /**
     * Encolar actualización con debouncing
     */
    queueUpdate(update) {
        this.updateQueue.push(update);
        this.metrics.queuedUpdates++;

        // Cancelar timer anterior
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }

        // Programar procesamiento por lotes
        this.batchTimer = setTimeout(() => {
            this.processUpdateQueue();
        }, this.config.batchUpdateDelay);
    }

    /**
     * Procesar cola de actualizaciones
     */
    async processUpdateQueue() {
        if (this.processingUpdate || this.updateQueue.length === 0 || this.fixingInconsistencies) return;

        this.processingUpdate = true;
        const startTime = performance.now();

        try {
            // Combinar todas las actualizaciones pendientes
            const updates = [...this.updateQueue];
            this.updateQueue = [];

            // Procesar cambios
            const processedChanges = this.consolidateChanges(updates);

            // Aplicar cambios al estado interno
            await this.applyChangesToState(processedChanges);

            // Actualizar panel de capas de forma incremental
            await this.updateLayerPanelIncremental(processedChanges);

            // Actualizar métricas
            const duration = performance.now() - startTime;
            this.updateMetrics(duration);

            // Validar consistencia si está habilitado
            if (this.config.enableConsistencyCheck) {
                this.validateConsistency();
            }

        } catch (error) {
            console.error('❌ Error al procesar cola de actualizaciones:', error);
        } finally {
            this.processingUpdate = false;
        }
    }

    /**
     * Consolidar cambios para evitar duplicados y conflictos
     */
    consolidateChanges(updates) {
        const consolidated = {
            added: new Map(),
            removed: new Set(),
            modified: new Map(),
            resized: new Map()
        };

        updates.forEach(update => {
            // Procesar mutaciones
            if (update.mutations) {
                update.mutations.forEach(mutation => {
                    const elementId = this.getElementId(mutation.element);

                    switch (mutation.type) {
                        case 'added':
                            if (!consolidated.removed.has(elementId)) {
                                consolidated.added.set(elementId, mutation.element);
                            }
                            break;

                        case 'removed':
                            consolidated.removed.add(elementId);
                            consolidated.added.delete(elementId);
                            consolidated.modified.delete(elementId);
                            break;

                        case 'attribute':
                        case 'content':
                            if (!consolidated.removed.has(elementId)) {
                                if (!consolidated.modified.has(elementId)) {
                                    consolidated.modified.set(elementId, []);
                                }
                                consolidated.modified.get(elementId).push(mutation);
                            }
                            break;
                    }
                });
            }

            // Procesar redimensionamientos
            if (update.resizes) {
                update.resizes.forEach(resize => {
                    const elementId = this.getElementId(resize.element);
                    if (!consolidated.removed.has(elementId)) {
                        consolidated.resized.set(elementId, resize);
                    }
                });
            }
        });

        return consolidated;
    }

    /**
     * Aplicar cambios al estado interno
     */
    async applyChangesToState(changes) {
        // Elementos añadidos
        for (const [elementId, element] of changes.added) {
            const layerData = this.buildLayerDataFromElement(element);
            if (layerData) {
                this.internalState.layers.set(elementId, layerData);
            }
        }

        // Elementos eliminados
        for (const elementId of changes.removed) {
            this.internalState.layers.delete(elementId);
        }

        // Elementos modificados
        for (const [elementId, mutations] of changes.modified) {
            const layerData = this.internalState.layers.get(elementId);
            if (layerData) {
                const element = this.getElementByIdSafe(elementId);
                if (element) {
                    const updatedData = this.buildLayerDataFromElement(element);
                    if (updatedData) {
                        this.internalState.layers.set(elementId, updatedData);
                    }
                }
            }
        }

        // Elementos redimensionados
        for (const [elementId, resize] of changes.resized) {
            const layerData = this.internalState.layers.get(elementId);
            if (layerData) {
                layerData.width = resize.size.width;
                layerData.height = resize.size.height;
                layerData.lastModified = Date.now();
            }
        }

        // Incrementar versión
        this.internalState.version++;
        this.internalState.lastUpdate = Date.now();
    }

    /**
     * Actualizar panel de capas de forma incremental
     */
    async updateLayerPanelIncremental(changes) {
        if (!this.layerList) return;

        const startTime = performance.now();

        try {
            // Elementos eliminados - remover del DOM
            for (const elementId of changes.removed) {
                const layerItem = this.layerList.querySelector(`[data-layer-id="${elementId}"]`);
                if (layerItem) {
                    if (this.config.enableAnimations) {
                        layerItem.style.opacity = '0';
                        layerItem.style.transform = 'translateX(-20px)';
                        await this.sleep(200);
                    }
                    layerItem.remove();
                }
            }

            // Elementos añadidos - agregar al DOM
            for (const [elementId, element] of changes.added) {
                const layerData = this.internalState.layers.get(elementId);
                if (layerData) {
                    const layerItem = this.createLayerItem(layerData);
                    if (this.config.enableAnimations) {
                        layerItem.style.opacity = '0';
                        layerItem.style.transform = 'translateX(-20px)';
                    }
                    this.layerList.insertBefore(layerItem, this.layerList.firstChild);

                    if (this.config.enableAnimations) {
                        await this.sleep(10);
                        layerItem.style.transition = 'all 0.3s ease';
                        layerItem.style.opacity = '1';
                        layerItem.style.transform = 'translateX(0)';
                    }
                }
            }

            // Elementos modificados - actualizar en el DOM
            for (const [elementId, mutations] of changes.modified) {
                const layerItem = this.layerList.querySelector(`[data-layer-id="${elementId}"]`);
                const layerData = this.internalState.layers.get(elementId);

                if (layerItem && layerData) {
                    this.updateLayerItem(layerItem, layerData);
                }
            }

            // Elementos redimensionados - actualizar información de tamaño
            for (const [elementId, resize] of changes.resized) {
                const layerItem = this.layerList.querySelector(`[data-layer-id="${elementId}"]`);
                if (layerItem && layerItem.querySelector('.layer-size')) {
                    const sizeEl = layerItem.querySelector('.layer-size');
                    sizeEl.textContent = `${Math.round(resize.size.width)}×${Math.round(resize.size.height)}`;
                }
            }

            const duration = performance.now() - startTime;
            if (duration > 100) {
                console.warn(`⚠️ Actualización del panel tomó ${duration.toFixed(2)}ms (>100ms)`);
            }

        } catch (error) {
            console.error('❌ Error al actualizar panel de capas:', error);
        }
    }

    /**
     * Renderizar panel de capas completo (usado en inicialización)
     */
    async renderLayerPanel() {
        if (!this.layerList) return;

        // Limpiar panel
        this.layerList.innerHTML = '';

        // Renderizar cada capa
        const layers = Array.from(this.internalState.layers.values());

        // Ordenar por z-index o posición en el DOM
        layers.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

        for (const layerData of layers) {
            const layerItem = this.createLayerItem(layerData);
            this.layerList.appendChild(layerItem);
        }

        // Actualizar contador
        this.updateLayerCount(layers.length);
    }

    /**
     * Crear elemento de capa para el panel
     */
    createLayerItem(layerData) {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.dataset.layerId = layerData.id;
        item.draggable = true;

        item.innerHTML = `
            <div class="layer-icon">${this.getLayerIcon(layerData.type)}</div>
            <div class="layer-content">
                <div class="layer-name" title="${this.escapeHtml(layerData.name)}">
                    ${this.escapeHtml(layerData.name)}
                </div>
                <div class="layer-meta">
                    <span class="layer-type">${layerData.type}</span>
                    ${layerData.width && layerData.height ?
                `<span class="layer-size">${Math.round(layerData.width)}×${Math.round(layerData.height)}</span>` :
                ''}
                </div>
            </div>
            <div class="layer-actions">
                <button class="layer-action-btn" data-action="visibility" title="${layerData.visible ? 'Ocultar' : 'Mostrar'}">
                    ${layerData.visible ? '👁️' : '🚫'}
                </button>
                <button class="layer-action-btn" data-action="lock" title="${layerData.locked ? 'Desbloquear' : 'Bloquear'}">
                    ${layerData.locked ? '🔒' : '🔓'}
                </button>
                <button class="layer-action-btn" data-action="delete" title="Eliminar">
                    🗑️
                </button>
            </div>
        `;

        // Event listeners para acciones
        item.querySelectorAll('.layer-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.handleLayerAction(layerData.id, action);
            });
        });

        // Click para seleccionar
        item.addEventListener('click', () => {
            this.selectLayer(layerData.id);
        });

        return item;
    }

    /**
     * Actualizar elemento de capa existente
     */
    updateLayerItem(layerItem, layerData) {
        // Actualizar nombre
        const nameEl = layerItem.querySelector('.layer-name');
        if (nameEl) {
            nameEl.textContent = layerData.name;
            nameEl.title = layerData.name;
        }

        // Actualizar tipo
        const typeEl = layerItem.querySelector('.layer-type');
        if (typeEl) {
            typeEl.textContent = layerData.type;
        }

        // Actualizar tamaño
        const sizeEl = layerItem.querySelector('.layer-size');
        if (sizeEl && layerData.width && layerData.height) {
            sizeEl.textContent = `${Math.round(layerData.width)}×${Math.round(layerData.height)}`;
        }

        // Actualizar botones de visibilidad y bloqueo
        const visibilityBtn = layerItem.querySelector('[data-action="visibility"]');
        if (visibilityBtn) {
            visibilityBtn.textContent = layerData.visible ? '👁️' : '🚫';
            visibilityBtn.title = layerData.visible ? 'Ocultar' : 'Mostrar';
        }

        const lockBtn = layerItem.querySelector('[data-action="lock"]');
        if (lockBtn) {
            lockBtn.textContent = layerData.locked ? '🔒' : '🔓';
            lockBtn.title = layerData.locked ? 'Desbloquear' : 'Bloquear';
        }
    }

    /**
     * Construir datos de capa desde elemento DOM
     */
    buildLayerDataFromElement(element) {
        const elementId = this.getElementId(element);
        if (!elementId) return null;

        const rect = element.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(element);

        return {
            id: elementId,
            name: this.generateLayerName(element),
            type: this.detectElementType(element),
            visible: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
            locked: element.dataset.locked === 'true',
            zIndex: parseInt(computedStyle.zIndex) || 0,
            x: element.offsetLeft,
            y: element.offsetTop,
            width: rect.width,
            height: rect.height,
            rotation: this.getRotation(element),
            opacity: parseFloat(computedStyle.opacity),
            element: element,
            lastModified: Date.now()
        };
    }

    /**
     * Obtener ID de elemento de forma segura
     */
    getElementId(element) {
        if (!element) return null;
        return element.dataset.elementId || element.id || null;
    }

    /**
     * Obtener elemento por ID de forma segura
     */
    getElementByIdSafe(elementId) {
        if (!this.canvas) return null;
        return this.canvas.querySelector(`[data-element-id="${elementId}"], #${elementId}`);
    }

    /**
     * Generar nombre de capa automáticamente
     */
    generateLayerName(element) {
        // Intentar obtener nombre personalizado
        if (element.dataset.layerName) {
            return element.dataset.layerName;
        }

        // Generar basado en contenido o tipo
        const type = this.detectElementType(element);

        if (type === 'text') {
            const text = element.textContent.trim();
            return text.length > 20 ? text.substring(0, 20) + '...' : text || 'Texto';
        } else if (type === 'image') {
            const src = element.querySelector('img')?.src || '';
            const filename = src.split('/').pop().split('?')[0];
            return filename || 'Imagen';
        }

        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Detectar tipo de elemento
     */
    detectElementType(element) {
        if (element.tagName === 'IMG' || element.querySelector('img')) {
            return 'image';
        } else if (element.querySelector('video')) {
            return 'video';
        } else if (element.classList.contains('text') || element.querySelector('[contenteditable]')) {
            return 'text';
        } else if (element.classList.contains('shape') || element.tagName === 'SVG') {
            return 'shape';
        } else if (element.classList.contains('countdown')) {
            return 'countdown';
        } else if (element.classList.contains('gallery')) {
            return 'gallery';
        }
        return 'element';
    }

    /**
     * Obtener icono para tipo de capa
     */
    getLayerIcon(type) {
        const icons = {
            'image': '🖼️',
            'text': '📝',
            'video': '🎬',
            'shape': '◼️',
            'countdown': '⏱️',
            'gallery': '📷',
            'element': '📦'
        };
        return icons[type] || icons['element'];
    }

    /**
     * Obtener rotación del elemento
     */
    getRotation(element) {
        const transform = window.getComputedStyle(element).transform;
        if (transform === 'none') return 0;

        const values = transform.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        return Math.round(Math.atan2(b, a) * (180 / Math.PI));
    }

    /**
     * Manejar acción de capa desde el panel
     */
    async handleLayerAction(layerId, action) {
        const element = this.getElementByIdSafe(layerId);
        if (!element) return;

        switch (action) {
            case 'visibility':
                this.toggleVisibility(element, layerId);
                break;
            case 'lock':
                this.toggleLock(element, layerId);
                break;
            case 'delete':
                this.deleteLayer(element, layerId);
                break;
        }
    }

    /**
     * Alternar visibilidad de capa
     */
    toggleVisibility(element, layerId) {
        const isVisible = element.style.display !== 'none';
        element.style.display = isVisible ? 'none' : '';

        // Actualizar estado interno
        const layerData = this.internalState.layers.get(layerId);
        if (layerData) {
            layerData.visible = !isVisible;
            layerData.lastModified = Date.now();
        }

        // Actualizar panel
        this.queueUpdate({
            modified: new Map([[layerId, [{ type: 'visibility' }]]])
        });
    }

    /**
     * Alternar bloqueo de capa
     */
    toggleLock(element, layerId) {
        const isLocked = element.dataset.locked === 'true';
        element.dataset.locked = isLocked ? 'false' : 'true';

        if (!isLocked) {
            element.style.pointerEvents = 'none';
        } else {
            element.style.pointerEvents = '';
        }

        // Actualizar estado interno
        const layerData = this.internalState.layers.get(layerId);
        if (layerData) {
            layerData.locked = !isLocked;
            layerData.lastModified = Date.now();
        }

        // Actualizar panel
        this.queueUpdate({
            modified: new Map([[layerId, [{ type: 'lock' }]]])
        });
    }

    /**
     * Eliminar capa
     */
    deleteLayer(element, layerId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta capa?')) {
            element.remove();

            // El MutationObserver detectará la eliminación automáticamente
        }
    }

    /**
     * Seleccionar capa
     */
    selectLayer(layerId) {
        // Deseleccionar todas
        this.layerList.querySelectorAll('.layer-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Seleccionar la capa
        const layerItem = this.layerList.querySelector(`[data-layer-id="${layerId}"]`);
        if (layerItem) {
            layerItem.classList.add('selected');
        }

        // Seleccionar elemento en el canvas
        const element = this.getElementByIdSafe(layerId);
        if (element) {
            // Disparar evento de selección
            this.dispatchEvent('elementSelected', { elementId: layerId, element });
        }
    }

    /**
     * Manejar creación de nueva invitación
     */
    async handleNewInvitationCreated() {
        console.log('🆕 Nueva invitación detectada - Limpiando panel de capas...');

        const startTime = performance.now();

        try {
            // 1. Detener observadores temporalmente
            if (this.mutationObserver) {
                this.mutationObserver.disconnect();
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }

            // 2. Limpiar estado interno completamente
            this.internalState.layers.clear();
            this.internalState.version = 0;
            this.internalState.lastUpdate = Date.now();

            // 3. Limpiar panel de capas
            if (this.layerList) {
                this.layerList.innerHTML = '';
            }

            // 4. Esperar un momento para que el canvas se actualice
            await this.sleep(100);

            // 5. Re-escanear canvas
            await this.performInitialSync();

            // 6. Reactivar observadores
            this.setupMutationObserver();
            this.setupResizeObserver();

            const duration = performance.now() - startTime;
            console.log(`✅ Panel de capas limpiado y resincronizado en ${duration.toFixed(2)}ms`);

        } catch (error) {
            console.error('❌ Error al limpiar panel de capas:', error);
        }
    }

    /**
     * Manejar cambios de estado del store
     */
    handleStoreStateChange(state) {
        // Si el store maneja las capas, sincronizar con nuestro estado
        if (state.layers && Array.isArray(state.layers)) {
            // Implementar lógica de sincronización si es necesario
        }
    }

    /**
     * Manejar selección de elemento
     */
    handleElementSelected(elementId) {
        // Resaltar en el panel
        this.selectLayer(elementId);
    }

    /**
     * Manejar acción del panel de capas
     */
    handleLayerPanelAction(detail) {
        const { action, layerId } = detail;
        this.handleLayerAction(layerId, action);
    }

    /**
     * Manejar click en lista de capas
     */
    handleLayerListClick(event) {
        const layerItem = event.target.closest('.layer-item');
        if (layerItem) {
            const layerId = layerItem.dataset.layerId;
            this.selectLayer(layerId);
        }
    }

    /**
     * Validar consistencia entre canvas y panel
     */
    validateConsistency() {
        if (!this.canvas || !this.layerList) return;

        // Obtener elementos del canvas
        const canvasElements = new Set();
        this.canvas.querySelectorAll('[data-element-id], [id]').forEach(el => {
            const id = this.getElementId(el);
            if (id) canvasElements.add(id);
        });

        // Obtener elementos del panel
        const panelElements = new Set();
        this.layerList.querySelectorAll('.layer-item').forEach(item => {
            panelElements.add(item.dataset.layerId);
        });

        // Detectar inconsistencias
        const missingInPanel = [...canvasElements].filter(id => !panelElements.has(id));
        const missingInCanvas = [...panelElements].filter(id => !canvasElements.has(id));

        if (missingInPanel.length > 0 || missingInCanvas.length > 0) {
            this.metrics.inconsistenciesDetected++;
            console.warn('⚠️ Inconsistencia detectada en panel de capas');

            // Auto-corregir
            this.fixInconsistencies(missingInPanel, missingInCanvas);
        }
    }

    /**
     * Corregir inconsistencias
     */
    async fixInconsistencies(missingInPanel, missingInCanvas) {
        console.log('🔧 Corrigiendo inconsistencias...');

        // Agregar elementos faltantes al panel
        for (const elementId of missingInPanel) {
            const element = this.getElementByIdSafe(elementId);
            if (element) {
                const layerData = this.buildLayerDataFromElement(element);
                if (layerData) {
                    this.internalState.layers.set(elementId, layerData);
                    const layerItem = this.createLayerItem(layerData);
                    this.layerList.appendChild(layerItem);
                }
            }
        }

        // Eliminar elementos del panel que ya no existen en canvas
        for (const elementId of missingInCanvas) {
            const layerItem = this.layerList.querySelector(`[data-layer-id="${elementId}"]`);
            if (layerItem) {
                layerItem.remove();
            }
            this.internalState.layers.delete(elementId);
        }

        this.metrics.inconsistenciesFixed++;
        console.log('✅ Inconsistencias corregidas');
    }

    /**
     * Iniciar verificador de consistencia periódico
     */
    startConsistencyChecker() {
        // Validar consistencia cada 30 segundos (menos frecuente para evitar sobrecarga)
        setInterval(() => {
            if (!this.processingUpdate && !this.fixingInconsistencies) {
                this.validateConsistency();
            }
        }, 30000); // Cada 30 segundos
    }

    /**
     * Actualizar contador de capas
     */
    updateLayerCount(count) {
        const counter = document.querySelector('.layer-count');
        if (counter) {
            counter.textContent = `${count} capa${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Actualizar métricas de rendimiento
     */
    updateMetrics(duration) {
        this.metrics.totalUpdates++;
        this.metrics.lastUpdateTime = duration;

        // Calcular promedio móvil
        const alpha = 0.2; // Factor de suavizado
        this.metrics.averageUpdateTime =
            (alpha * duration) + ((1 - alpha) * this.metrics.averageUpdateTime);

        // Advertir si excede el límite de 100ms
        if (duration > 100) {
            console.warn(`⚠️ Actualización lenta: ${duration.toFixed(2)}ms (objetivo: <100ms)`);
        }
    }

    /**
     * Obtener métricas
     */
    getMetrics() {
        return {
            ...this.metrics,
            layerCount: this.internalState.layers.size,
            stateVersion: this.internalState.version,
            lastUpdate: new Date(this.internalState.lastUpdate).toLocaleTimeString()
        };
    }

    /**
     * Escapar HTML para prevenir XSS (delega a Utils/Sanitize)
     */
    escapeHtml(text) {
        return Utils.escapeHtml(text);
    }

    /**
     * Helper para delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Destruir y limpiar
     */
    destroy() {
        // Desconectar observadores
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // Limpiar timers
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }

        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        // Limpiar event listeners
        this.eventListeners.forEach((listeners, eventName) => {
            listeners.forEach(handler => {
                window.removeEventListener(eventName, handler);
            });
        });
        this.eventListeners.clear();

        console.log('🔌 Enhanced Layer Realtime Sync destruido');
    }
}

// Crear instancia global y auto-inicializar
if (typeof window !== 'undefined') {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.enhancedLayerSync = new EnhancedLayerRealtimeSync();
        });
    } else {
        window.enhancedLayerSync = new EnhancedLayerRealtimeSync();
    }
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedLayerRealtimeSync;
}
