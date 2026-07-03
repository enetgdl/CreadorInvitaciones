/**
 * HISTORY-PANEL.JS
 * Panel de acciones/historia con funcionalidad completa de hacer/deshacer
 * Compatible con modo flotante y adosado (docked)
 */

class HistoryPanel {
    constructor() {
        this.storageKey = 'historyPanelState';
        this.state = this.loadState();
        this.drag = null;
        this.historyManager = null;
        this.updateInterval = null;
        this.filterType = 'all'; // 'all', 'element', 'property', 'transform', 'color', etc.
    }

    init(historyManager) {
        this.historyManager = historyManager;

        this.modal = document.getElementById('historyPanel');
        this.header = document.getElementById('historyPanelHeader');
        this.btn = document.getElementById('historyPanelBtn');
        this.btnClose = document.getElementById('historyPanelCloseBtn');
        this.btnPin = document.getElementById('historyPanelPinBtn');
        this.btnDock = document.getElementById('historyPanelDockBtn');
        this.btnClear = document.getElementById('historyPanelClearBtn');

        this.historyList = document.getElementById('historyList');
        this.filterButtons = Array.from(this.modal?.querySelectorAll?.('[data-hp-filter]') || []);
        this.emptyState = document.getElementById('historyEmptyState');
        this.currentStateIndicator = document.getElementById('historyCurrentStateIndicator');

        if (!this.modal || !this.btn) {
            console.error('HistoryPanel: Required elements not found');
            return;
        }

        this.setupEventListeners();
        this.applyStateToUI();

        if (this.state.open) this.open({ focus: false });
        else this.close({ persist: false });

        // Actualizar lista periódicamente
        this.startAutoUpdate();

        console.log('HistoryPanel: Inicializado');
    }

    setupEventListeners() {
        this.btn?.addEventListener('click', () => this.toggle());
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnPin?.addEventListener('click', () => this.togglePinned());
        this.btnDock?.addEventListener('click', () => this.toggleDocked());
        this.btnClear?.addEventListener('click', () => this.clearHistory());

        // Filtros
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterType = btn.dataset.hpFilter;
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderHistoryList();
            });
        });

        // Arrastrar ventana
        this.header?.addEventListener('pointerdown', (e) => this.onDragStart(e));
        window.addEventListener('pointermove', (e) => this.onDragMove(e), { passive: false });
        window.addEventListener('pointerup', (e) => this.onDragEnd(e), { passive: true });
        window.addEventListener('resize', () => this.onViewportChange(), { passive: true });
        window.addEventListener('scroll', () => this.onViewportChange(), { passive: true, capture: true });

        // Escuchar teclas de atajo
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.hidden) {
                this.close();
            }
        });
    }

    loadState() {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                return {
                    open: !!parsed.open,
                    pinned: !!parsed.pinned,
                    docked: !!parsed.docked,
                    left: Number.isFinite(parsed.left) ? parsed.left : 24,
                    top: Number.isFinite(parsed.top) ? parsed.top : 120,
                };
            } catch (_) { }
        }
        return {
            open: false,
            pinned: false,
            docked: false,
            left: 24,
            top: 120,
        };
    }

    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (_) { }
    }

    toggle() {
        if (this.modal.hidden) this.open();
        else this.close();
    }

    open(options = {}) {
        const { focus = true } = options;
        this.modal.hidden = false;
        this.state.open = true;
        this.applyPosition();
        this.updateModeClasses();
        this.ensureNotOverlapping();
        this.renderHistoryList();
        this.updatePanelSpacing(); // Ajustar espaciado con Advanced Fill
        this.notifyDeviceCentering(); // Notificar al centrado del dispositivo
        this.saveState();
        if (focus) this.historyList?.focus?.();
    }

    close(options = {}) {
        const { persist = true } = options;
        if (this.modal) this.modal.hidden = true;
        this.state.open = false;
        this.updateModeClasses();
        this.updatePanelSpacing(); // Ajustar espaciado cuando se cierra
        this.notifyDeviceCentering(); // Notificar al centrado del dispositivo
        if (persist) this.saveState();
    }

    togglePinned() {
        this.state.pinned = !this.state.pinned;
        if (!this.state.pinned) this.ensureNotOverlapping();
        this.updateModeClasses();
        this.saveState();
    }

    toggleDocked() {
        this.state.docked = !this.state.docked;
        if (this.state.docked) this.state.pinned = false;
        this.applyPosition();
        this.updateModeClasses();
        this.updatePanelSpacing(); // Actualizar espaciado 50/50
        this.notifyDeviceCentering(); // Notificar al centrado del dispositivo
        this.saveState();
    }

    updateModeClasses() {
        this.modal.classList.toggle('is-pinned', !!this.state.pinned);
        this.modal.classList.toggle('is-docked', !!this.state.docked);
    }

    // Gestión de espacio dinámico 50/50 con Advanced Fill Modal
    updatePanelSpacing() {
        const advancedFillModal = document.getElementById('advancedFillModal');
        const historyPanel = this.modal;

        const advancedFillDocked = advancedFillModal &&
            !advancedFillModal.hidden &&
            advancedFillModal.classList.contains('is-docked');
        const historyDocked = historyPanel &&
            !historyPanel.hidden &&
            historyPanel.classList.contains('is-docked');

        const sidebar = document.querySelector('.right-sidebar');
        if (!sidebar) return;

        const topOffset = this.getTopOffset();
        const maxHeight = Math.max(240, window.innerHeight - topOffset - 12);

        // Ambos adosados: división 50/50
        if (advancedFillDocked && historyDocked) {
            const halfHeight = Math.floor(maxHeight / 2);
            const gap = 12;

            // Advanced Fill en la parte superior
            advancedFillModal.style.height = `${halfHeight - gap / 2}px`;

            // History Panel en la parte inferior
            historyPanel.style.height = `${halfHeight - gap / 2}px`;
            const sidebarRect = sidebar.getBoundingClientRect();
            historyPanel.style.top = `${topOffset + halfHeight + gap / 2}px`;

        } else if (advancedFillDocked && !historyDocked) {
            // Solo Advanced Fill adosado: 100% de altura
            advancedFillModal.style.height = `${maxHeight}px`;

        } else if (!advancedFillDocked && historyDocked) {
            // Solo History adosado: 100% de altura
            historyPanel.style.height = `${maxHeight}px`;
            historyPanel.style.top = `${topOffset}px`;
        }
    }

    getTopOffset() {
        const bar = document.querySelector('.top-menu-bar');
        if (!bar) return 20;
        const r = bar.getBoundingClientRect();
        return Math.max(20, Math.round(r.bottom + 12));
    }

    applyPosition() {
        if (!this.modal) return;
        if (this.state.docked) {
            this.applyDockedPosition();
            return;
        }
        this.modal.style.height = '';
        this.modal.style.top = `${Math.max(this.getTopOffset(), this.state.top)}px`;
        this.modal.style.left = `${this.state.left}px`;
        this.setPosition(this.state.left, Math.max(this.getTopOffset(), this.state.top), { clamp: true });
    }

    applyDockedPosition() {
        const sidebar = document.querySelector('.right-sidebar');
        if (!sidebar) {
            this.state.docked = false;
            this.updateModeClasses();
            this.applyPosition();
            return;
        }
        const sidebarRect = sidebar.getBoundingClientRect();
        const top = this.getTopOffset();
        const maxHeight = Math.max(240, window.innerHeight - top - 12);
        const device = document.getElementById('deviceScreen');
        const deviceRect = device?.getBoundingClientRect?.();

        let width = 360;
        const available = Math.max(0, Math.round(sidebarRect.left - 20));
        let left = Math.round(sidebarRect.left - width - 12);

        if (deviceRect) {
            const maxWidthNoOverlap = Math.floor(sidebarRect.left - deviceRect.right - 40);
            if (maxWidthNoOverlap > 0) width = Math.max(260, Math.min(width, maxWidthNoOverlap));
            left = Math.round(sidebarRect.left - width - 12);
        }

        if (left < 12 || width < 260 || available < 320) {
            this.state.docked = false;
            this.updateModeClasses();
            this.ensureNotOverlapping();
            this.saveState();
            return;
        }

        this.modal.style.width = `${width}px`;
        this.modal.style.left = `${left}px`;
        this.modal.style.top = `${top}px`;
        this.modal.style.height = `${maxHeight}px`;

        // Aplicar espaciado si Advanced Fill también está adosado
        this.updatePanelSpacing();
    }

    setPosition(left, top, options = {}) {
        const { clamp = false } = options;
        if (!this.modal) return;
        const topOffset = this.getTopOffset();
        let nextLeft = left;
        let nextTop = Math.max(topOffset, top);
        if (clamp) {
            const w = this.modal.offsetWidth || 360;
            const h = this.modal.offsetHeight || 400;
            const minLeft = 12;
            const maxLeft = Math.max(minLeft, window.innerWidth - w - 12);
            const minTop = topOffset;
            const maxTop = Math.max(minTop, window.innerHeight - h - 12);
            nextLeft = Math.min(maxLeft, Math.max(minLeft, nextLeft));
            nextTop = Math.min(maxTop, Math.max(minTop, nextTop));
        }
        this.modal.style.left = `${nextLeft}px`;
        this.modal.style.top = `${nextTop}px`;
    }

    ensureNotOverlapping() {
        if (!this.modal || this.modal.hidden) return;
        if (this.state.docked || this.state.pinned) return;

        const device = document.getElementById('deviceScreen');
        const deviceRect = device?.getBoundingClientRect?.();
        const sidebar = document.querySelector('.right-sidebar');
        const sidebarRect = sidebar?.getBoundingClientRect?.();

        const w = this.modal.offsetWidth || 360;
        const h = this.modal.offsetHeight || 400;
        const topOffset = this.getTopOffset();

        const clampCandidate = (x, y) => {
            const minLeft = 12;
            const maxLeft = Math.max(minLeft, window.innerWidth - w - 12);
            const minTop = topOffset;
            const maxTop = Math.max(minTop, window.innerHeight - h - 12);
            return {
                left: Math.min(maxLeft, Math.max(minLeft, x)),
                top: Math.min(maxTop, Math.max(minTop, y))
            };
        };

        const overlaps = (a, b) => {
            if (!a || !b) return false;
            return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
        };

        const current = this.modal.getBoundingClientRect();
        if (deviceRect && !overlaps(current, deviceRect)) {
            if (sidebarRect && current.right > sidebarRect.left - 20) {
                const c = clampCandidate(sidebarRect.left - w - 20, current.top);
                this.setPosition(c.left, c.top, { clamp: true });
                this.state.left = this.modal.offsetLeft;
                this.state.top = this.modal.offsetTop;
                this.saveState();
            }
            return;
        }

        const candidates = [];
        const rightLimit = sidebarRect ? sidebarRect.left - w - 20 : window.innerWidth - w - 20;
        candidates.push({ left: rightLimit, top: topOffset });

        if (deviceRect) {
            candidates.push({ left: deviceRect.left - w - 20, top: deviceRect.top });
            candidates.push({ left: deviceRect.right + 20, top: deviceRect.top });
            candidates.push({ left: deviceRect.left, top: deviceRect.top - h - 20 });
            candidates.push({ left: deviceRect.left, top: deviceRect.bottom + 20 });
        }

        let best = null;
        let bestScore = Infinity;
        for (const cand of candidates) {
            const c = clampCandidate(cand.left, cand.top);
            const rect = { left: c.left, top: c.top, right: c.left + w, bottom: c.top + h };
            let score = 0;
            if (deviceRect && overlaps(rect, deviceRect)) score += 1000;
            if (sidebarRect && rect.right > sidebarRect.left - 20) score += 500;
            score += Math.abs(rect.left - (window.innerWidth - w - 20));
            score += Math.abs(rect.top - topOffset);
            if (score < bestScore) {
                bestScore = score;
                best = c;
            }
        }

        if (best) {
            this.setPosition(best.left, best.top, { clamp: true });
            this.state.left = this.modal.offsetLeft;
            this.state.top = this.modal.offsetTop;
            this.saveState();
        }
    }

    onDragStart(e) {
        if (!this.modal || this.modal.hidden) return;
        if (!e.isPrimary) return;
        const t = e.target;
        if (t && (t.closest?.('#historyPanelCloseBtn') ||
            t.closest?.('#historyPanelPinBtn') ||
            t.closest?.('#historyPanelDockBtn'))) return;
        if (this.state.docked) return;

        this.drag = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: this.modal.offsetLeft,
            startTop: this.modal.offsetTop
        };
        try { this.header.setPointerCapture(e.pointerId); } catch (_) { }
        e.preventDefault();
    }

    onDragMove(e) {
        if (!this.drag || e.pointerId !== this.drag.pointerId) return;
        const dx = e.clientX - this.drag.startX;
        const dy = e.clientY - this.drag.startY;
        const nextLeft = this.drag.startLeft + dx;
        const nextTop = this.drag.startTop + dy;
        this.setPosition(nextLeft, nextTop, { clamp: true });
        e.preventDefault();
    }

    onDragEnd(e) {
        if (!this.drag || e.pointerId !== this.drag.pointerId) return;
        try { this.header.releasePointerCapture(e.pointerId); } catch (_) { }
        this.drag = null;
        this.state.left = this.modal.offsetLeft;
        this.state.top = this.modal.offsetTop;
        this.saveState();
    }

    onViewportChange() {
        if (!this.modal || this.modal.hidden) return;
        this.applyPosition();
        if (!this.state.pinned && !this.state.docked) this.ensureNotOverlapping();
        this.updatePanelSpacing();
        this.notifyDeviceCentering(); // Notificar al centrado del dispositivo
    }

    applyStateToUI() {
        this.updateModeClasses();
        this.renderHistoryList();
    }

    startAutoUpdate() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            if (!this.modal.hidden) {
                this.renderHistoryList();
            }
        }, 1000); // Actualizar cada segundo
    }

    renderHistoryList() {
        if (!this.historyManager || !this.historyList) return;

        const undoStack = this.historyManager.undoStack || [];
        const redoStack = this.historyManager.redoStack || [];

        // Filtrar acciones según el tipo seleccionado
        let filteredUndo = this.filterActions(undoStack);
        let filteredRedo = this.filterActions(redoStack);

        const totalActions = filteredUndo.length + filteredRedo.length;

        if (totalActions === 0) {
            this.historyList.innerHTML = '';
            this.emptyState.hidden = false;
            this.currentStateIndicator.hidden = true;
            return;
        }

        this.emptyState.hidden = true;
        this.currentStateIndicator.hidden = false;

        this.historyList.innerHTML = '';

        // Renderizar undo stack (acciones pasadas)
        const reversedUndo = [...filteredUndo].reverse();
        reversedUndo.forEach((entry, index) => {
            const item = this.createHistoryItem(entry, 'past', filteredUndo.length - index);
            this.historyList.appendChild(item);
        });

        // Indicador de estado actual
        if (filteredUndo.length > 0) {
            const currentIndicator = document.createElement('div');
            currentIndicator.className = 'history-current-marker';
            currentIndicator.innerHTML = '<span>📍 Estado Actual</span>';
            this.historyList.appendChild(currentIndicator);
        }

        // Renderizar redo stack (acciones futuras)
        filteredRedo.forEach((entry, index) => {
            const item = this.createHistoryItem(entry, 'future', index + 1);
            this.historyList.appendChild(item);
        });
    }

    filterActions(stack) {
        if (this.filterType === 'all') return stack;

        return stack.filter(entry => {
            const meta = entry.meta || {};
            const name = (meta.name || '').toLowerCase();

            switch (this.filterType) {
                case 'element':
                    return name.includes('crear') || name.includes('eliminar') ||
                        name.includes('duplicar') || name.includes('insertar');
                case 'property':
                    return name.includes('editar') || name.includes('modificar') ||
                        name.includes('cambio');
                case 'transform':
                    return name.includes('desplaz') || name.includes('mover') ||
                        name.includes('redimen') || name.includes('rotar') ||
                        name.includes('escal');
                case 'color':
                    return name.includes('color') || name.includes('rellen') ||
                        name.includes('degradado') || name.includes('textura');
                default:
                    return true;
            }
        });
    }

    createHistoryItem(entry, type, stepCount) {
        const item = document.createElement('div');
        item.className = `history-item history-item-${type}`;

        const meta = entry.meta || { name: 'Acción', timestamp: Date.now() };
        const timeStr = window.moment ? moment(meta.timestamp).format('HH:mm:ss') :
            new Date(meta.timestamp).toLocaleTimeString();
        const relativeTime = window.moment ? moment(meta.timestamp).fromNow() : '';

        const icon = this.getActionIcon(meta.name);
        const category = this.getActionCategory(meta.name);

        item.innerHTML = `
            <div class="history-item-icon">${icon}</div>
            <div class="history-item-content">
                <div class="history-item-title">${meta.name}</div>
                <div class="history-item-meta">
                    <span class="history-item-time">${timeStr}</span>
                    <span class="history-item-relative">${relativeTime}</span>
                    <span class="history-item-category">${category}</span>
                </div>
            </div>
            <div class="history-item-actions">
                ${type === 'past' ?
                `<button class="history-item-btn" title="Deshacer hasta aquí" data-steps="${stepCount}">↶</button>` :
                `<button class="history-item-btn" title="Rehacer hasta aquí" data-steps="${stepCount}">↷</button>`
            }
            </div>
        `;

        // Event listener para el botón de acción
        const actionBtn = item.querySelector('.history-item-btn');
        actionBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const steps = parseInt(actionBtn.dataset.steps, 10);
            if (type === 'past') {
                for (let i = 0; i < steps; i++) {
                    this.historyManager.undo();
                }
            } else {
                for (let i = 0; i < steps; i++) {
                    this.historyManager.redo();
                }
            }
            this.renderHistoryList();
        });

        return item;
    }

    getActionIcon(name) {
        if (!name) return '✏️';
        const lowerName = name.toLowerCase();

        // Elementos
        if (lowerName.includes('crear') || lowerName.includes('añadir') || lowerName.includes('insertar')) return '➕';
        if (lowerName.includes('eliminar') || lowerName.includes('borrar')) return '🗑️';
        if (lowerName.includes('duplicar')) return '📋';

        // Texto
        if (lowerName.includes('texto') || lowerName.includes('mensaje') || lowerName.includes('nombre') || lowerName.includes('título')) return '📝';

        // Color y relleno
        if (lowerName.includes('color')) return '🎨';
        if (lowerName.includes('rellen') || lowerName.includes('degradado')) return '🌈';
        if (lowerName.includes('textura')) return '🖼️';
        if (lowerName.includes('opacidad')) return '👁️';

        // Transformaciones
        if (lowerName.includes('mover') || lowerName.includes('desplaz')) return '⬌';
        if (lowerName.includes('redimen') || lowerName.includes('tamaño')) return '⇔';
        if (lowerName.includes('rotar') || lowerName.includes('rotación')) return '🔄';
        if (lowerName.includes('escal')) return '📏';

        // Propiedades
        if (lowerName.includes('fuente') || lowerName.includes('tipografía')) return '🔤';
        if (lowerName.includes('sombra')) return '🌓';
        if (lowerName.includes('borde')) return '◻️';

        // Capas
        if (lowerName.includes('capa') || lowerName.includes('z-index') || lowerName.includes('orden')) return '📚';

        // Multimedia
        if (lowerName.includes('imagen') || lowerName.includes('foto') || lowerName.includes('fondo')) return '🖼️';
        if (lowerName.includes('música') || lowerName.includes('audio')) return '🎵';
        if (lowerName.includes('video')) return '🎬';

        // Interactivo
        if (lowerName.includes('mapa') || lowerName.includes('ubicación') || lowerName.includes('coordenadas')) return '📍';
        if (lowerName.includes('qr') || lowerName.includes('url')) return '🔗';

        return '✏️';
    }

    getActionCategory(name) {
        if (!name) return 'General';
        const lowerName = name.toLowerCase();

        if (lowerName.includes('crear') || lowerName.includes('eliminar') || lowerName.includes('duplicar')) return 'Elemento';
        if (lowerName.includes('texto') || lowerName.includes('mensaje')) return 'Texto';
        if (lowerName.includes('color') || lowerName.includes('rellen') || lowerName.includes('degradado') || lowerName.includes('textura')) return 'Color';
        if (lowerName.includes('mover') || lowerName.includes('redimen') || lowerName.includes('rotar') || lowerName.includes('escal')) return 'Transformación';
        if (lowerName.includes('fuente') || lowerName.includes('sombra') || lowerName.includes('borde')) return 'Estilo';
        if (lowerName.includes('imagen') || lowerName.includes('música') || lowerName.includes('video')) return 'Multimedia';
        if (lowerName.includes('capa') || lowerName.includes('orden')) return 'Capas';

        return 'General';
    }

    /**
     * Notificar al sistema de centrado del dispositivo que hubo un cambio
     */
    notifyDeviceCentering() {
        if (window.deviceAutoCentering?.schedule) {
            window.deviceAutoCentering.schedule();
        }
    }

    clearHistory() {
        if (!confirm('¿Estás seguro de que deseas borrar todo el historial? Esta acción no se puede deshacer.')) {
            return;
        }

        this.historyManager?.clearHistory?.();
        this.renderHistoryList();
        this.notify('Historial borrado', 'success');
    }

    notify(msg, type = 'info') {
        try {
            window.invitationStorage?.showNotification?.(msg, type);
        } catch (_) { }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Export global
window.HistoryPanel = HistoryPanel;
console.log('HistoryPanel system loaded');
