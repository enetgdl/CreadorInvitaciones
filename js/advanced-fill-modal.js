class AdvancedFillModal {
    constructor() {
        this.storageKey = 'advancedFillModalState';
        this.presetsKey = 'advancedFillGradientPresets';
        this.state = this.loadState();
        this.drag = null;
        this.debouncers = new Map();
        this.historyArmed = false;
        this.activeTextureKey = null;
        this.stopDrag = null;
    }

    init() {
        this.modal = document.getElementById('advancedFillModal');
        this.header = document.getElementById('advancedFillHeader');
        this.btn = document.getElementById('advancedFillBtn');
        this.btnClose = document.getElementById('advancedFillCloseBtn');
        this.btnPin = document.getElementById('advancedFillPinBtn');
        this.btnDock = document.getElementById('advancedFillDockBtn');

        this.tabButtons = Array.from(this.modal?.querySelectorAll?.('.floating-tab-btn, .segmented-btn') || []);
        this.panels = new Map(Array.from(this.modal?.querySelectorAll?.('.floating-tab-panel') || []).map((p) => [p.id, p]));
        this.gradTypeButtons = Array.from(this.modal?.querySelectorAll?.('[data-af-grad-type]') || []);

        this.ui = {
            solidColor: document.getElementById('afSolidColor'),
            solidOpacity: document.getElementById('afSolidOpacity'),
            gradAngleRow: document.getElementById('afAngleRow'),
            gradAngle: document.getElementById('afGradientAngle'),
            gradPreview: document.getElementById('afGradientPreview'),
            gradStops: document.getElementById('afStops'),
            gradAddStop: document.getElementById('afAddStop'),
            gradReset: document.getElementById('afResetGradient'),
            stopBar: document.getElementById('afStopBar'),
            stopBarTrack: document.getElementById('afStopBarTrack'),
            stopColor: document.getElementById('afStopColor'),
            stopOpacity: document.getElementById('afStopOpacity'),
            stopRemove: document.getElementById('afRemoveStop'),
            presetName: document.getElementById('afPresetName'),
            presetSave: document.getElementById('afPresetSave'),
            presetList: document.getElementById('afPresetList'),
            metallicGrid: document.getElementById('afMetallicGrid'),
            textureGrid: document.getElementById('afTextureGrid'),
            textureScale: document.getElementById('afTextureScale'),
            textureRepeat: document.getElementById('afTextureRepeat'),
            textureUpload: document.getElementById('afTextureUpload')
        };

        if (!this.modal || !this.btn) return;

        this.setupTabsNav();

        this.btn.addEventListener('click', () => this.toggle());
        this.btnClose?.addEventListener('click', () => this.close());
        this.btnPin?.addEventListener('click', () => this.togglePinned());
        this.btnDock?.addEventListener('click', () => this.toggleDocked());

        this.tabButtons.forEach((b) => b.addEventListener('click', () => this.activateTab(b.getAttribute('aria-controls'))));

        this.header?.addEventListener('pointerdown', (e) => this.onDragStart(e));
        window.addEventListener('pointermove', (e) => this.onDragMove(e), { passive: false });
        window.addEventListener('pointerup', (e) => this.onDragEnd(e), { passive: true });
        window.addEventListener('resize', () => this.onViewportChange(), { passive: true });
        window.addEventListener('scroll', () => this.onViewportChange(), { passive: true, capture: true });

        this.bindControls();
        this.renderMetallicPresets();
        this.renderTexturePresets();
        this.renderPresetList();
        this.applyStateToUI();

        if (this.state.open) this.open({ focus: false });
        else this.close({ persist: false });
    }

    setupTabsNav() {
        const container = this.modal?.querySelector?.('.floating-modal-tabs');
        if (!container) return;
        if (container.querySelector('.floating-modal-tabs-scroll')) return;

        const buttons = Array.from(container.querySelectorAll('.floating-tab-btn'));
        buttons.forEach((b) => {
            if (!b.title) b.title = b.textContent?.trim?.() || '';
        });

        const leftBtn = document.createElement('button');
        leftBtn.type = 'button';
        leftBtn.className = 'floating-tabs-nav-btn';
        leftBtn.setAttribute('aria-label', 'Desplazar pestañas a la izquierda');
        leftBtn.textContent = '◀';

        const rightBtn = document.createElement('button');
        rightBtn.type = 'button';
        rightBtn.className = 'floating-tabs-nav-btn';
        rightBtn.setAttribute('aria-label', 'Desplazar pestañas a la derecha');
        rightBtn.textContent = '▶';

        const scroll = document.createElement('div');
        scroll.className = 'floating-modal-tabs-scroll';
        buttons.forEach((b) => scroll.appendChild(b));

        container.innerHTML = '';
        container.appendChild(leftBtn);
        container.appendChild(scroll);
        container.appendChild(rightBtn);

        this.tabs = { container, scroll, leftBtn, rightBtn, ro: null, raf: 0 };

        leftBtn.addEventListener('click', () => scroll.scrollBy({ left: -220, behavior: 'smooth' }));
        rightBtn.addEventListener('click', () => scroll.scrollBy({ left: 220, behavior: 'smooth' }));
        scroll.addEventListener('scroll', () => this.scheduleTabsUpdate(), { passive: true });

        if (window.ResizeObserver) {
            this.tabs.ro = new ResizeObserver(() => this.scheduleTabsUpdate());
            try { this.tabs.ro.observe(scroll); } catch (_) { }
            try { this.tabs.ro.observe(container); } catch (_) { }
        }

        this.scheduleTabsUpdate();
    }

    scheduleTabsUpdate() {
        if (!this.tabs) return;
        if (this.tabs.raf) return;
        this.tabs.raf = requestAnimationFrame(() => {
            this.tabs.raf = 0;
            this.updateTabsOverflow();
        });
    }

    updateTabsOverflow() {
        if (!this.tabs) return;
        const { container, scroll } = this.tabs;
        const overflow = scroll.scrollWidth > scroll.clientWidth + 2;
        container.classList.toggle('is-overflowing', overflow);
    }

    updateResponsiveLayout() {
        if (!this.modal || this.modal.hidden) return;

        const rect = this.modal.getBoundingClientRect();
        const width = rect.width || this.modal.offsetWidth || 420;
        const height = rect.height || this.modal.offsetHeight || 520;

        const compact = width < 390 || height < 520;
        this.modal.classList.toggle('is-compact', compact);

        const tabsContainer = this.modal.querySelector('.floating-modal-tabs, .history-filters');
        if (tabsContainer && tabsContainer.classList.contains('floating-modal-tabs')) {
            this.updateTabsOverflow();
        }

        const headerH = this.header?.getBoundingClientRect?.().height || 0;
        const tabsH = tabsContainer?.getBoundingClientRect?.().height || 0;
        const bodyMax = Math.max(180, Math.floor(height - headerH - tabsH - 12));
        this.modal.style.setProperty('--af-body-max', `${bodyMax}px`);
    }

    getHost() {
        return window.visualEditorHost || null;
    }

    notify(msg, type = 'info') {
        try { window.invitationStorage?.showNotification?.(msg, type); } catch (_) { }
    }

    loadState() {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                const normalizedGradient = this.normalizeGradient(parsed.gradient);
                return {
                    open: !!parsed.open,
                    pinned: !!parsed.pinned,
                    docked: !!parsed.docked,
                    left: Number.isFinite(parsed.left) ? parsed.left : 24,
                    top: Number.isFinite(parsed.top) ? parsed.top : 120,
                    tab: parsed.tab || 'afColors',
                    solid: parsed.solid || { color: '#ffffff', opacity: 1 },
                    gradient: normalizedGradient || this.normalizeGradient(null),
                    texture: parsed.texture || { dataUrl: '', scale: 1, repeat: 'repeat' }
                };
            } catch (_) { }
        }
        return {
            open: false,
            pinned: false,
            docked: false,
            left: 24,
            top: 120,
            tab: 'afColors',
            solid: { color: '#ffffff', opacity: 1 },
            gradient: this.normalizeGradient(null),
            texture: { dataUrl: '', scale: 1, repeat: 'repeat' }
        };
    }

    normalizeGradient(input) {
        const g = input && typeof input === 'object' ? input : {};
        const type = g.type === 'radial' || g.type === 'conic' ? g.type : 'linear';
        const angle = Number.isFinite(parseFloat(g.angle)) ? Math.round(parseFloat(g.angle)) : 135;
        const rawStops = Array.isArray(g.stops) ? g.stops : [
            { position: 0, color: '#8B5CF6', opacity: 1 },
            { position: 100, color: '#F97316', opacity: 1 }
        ];
        const stops = rawStops.map((s, i) => ({
            id: s.id || `st_${Date.now()}_${i}_${Math.random().toString(16).slice(2)}`,
            position: Math.min(100, Math.max(0, parseInt(s.position ?? 0, 10) || 0)),
            color: s.color || '#ffffff',
            opacity: Number.isFinite(parseFloat(s.opacity)) ? Math.min(1, Math.max(0, parseFloat(s.opacity))) : 1
        })).sort((a, b) => a.position - b.position);
        const selectedStopId = stops.find((s) => s.id === g.selectedStopId)?.id || stops[0]?.id || null;
        return { type, angle, stops, selectedStopId };
    }

    saveState() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); } catch (_) { }
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
        this.activateTab(this.state.tab);
        this.updateModeClasses();
        this.ensureNotOverlapping();
        this.updateResponsiveLayout();
        this.saveState();
        // Actualizar espaciado del panel de historia si existe
        if (window.invitationEditor?.historyPanel) {
            window.invitationEditor.historyPanel.updatePanelSpacing();
        }
        if (focus) this.tabButtons[0]?.focus?.();
    }

    close(options = {}) {
        const { persist = true } = options;
        if (this.modal) this.modal.hidden = true;
        this.state.open = false;
        this.updateModeClasses();
        // Actualizar espaciado del panel de historia si existe
        if (window.invitationEditor?.historyPanel) {
            window.invitationEditor.historyPanel.updatePanelSpacing();
        }
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
        this.updateResponsiveLayout();
        this.saveState();
        // Actualizar espaciado del panel de historia si existe
        if (window.invitationEditor?.historyPanel) {
            window.invitationEditor.historyPanel.updatePanelSpacing();
        }
    }

    updateModeClasses() {
        this.modal.classList.toggle('is-pinned', !!this.state.pinned);
        this.modal.classList.toggle('is-docked', !!this.state.docked);
    }

    activateTab(panelId) {
        if (!panelId) return;
        this.state.tab = panelId;
        this.tabButtons.forEach((b) => {
            const isActive = b.getAttribute('aria-controls') === panelId;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', isActive ? 'true' : 'false');
            b.tabIndex = isActive ? 0 : -1;
        });
        for (const [id, p] of this.panels) {
            const active = id === panelId;
            p.classList.toggle('active', active);
            p.hidden = !active;
        }
        this.saveState();
        if (panelId === 'afGradients' || panelId === 'afMetallic') this.updateGradientPreview();
    }

    onDragStart(e) {
        if (!this.modal || this.modal.hidden) return;
        if (!e.isPrimary) return;
        const t = e.target;
        if (t && (t.closest?.('#advancedFillCloseBtn') || t.closest?.('#advancedFillPinBtn') || t.closest?.('#advancedFillDockBtn'))) return;
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
        this.updateResponsiveLayout();
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
    }

    setPosition(left, top, options = {}) {
        const { clamp = false } = options;
        if (!this.modal) return;
        const topOffset = this.getTopOffset();
        let nextLeft = left;
        let nextTop = Math.max(topOffset, top);
        if (clamp) {
            const w = this.modal.offsetWidth || 420;
            const h = this.modal.offsetHeight || 360;
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

        const w = this.modal.offsetWidth || 420;
        const h = this.modal.offsetHeight || 420;
        const topOffset = this.getTopOffset();

        const clampCandidate = (x, y) => {
            const minLeft = 12;
            const maxLeft = Math.max(minLeft, window.innerWidth - w - 12);
            const minTop = topOffset;
            const maxTop = Math.max(minTop, window.innerHeight - h - 12);
            return { left: Math.min(maxLeft, Math.max(minLeft, x)), top: Math.min(maxTop, Math.max(minTop, y)) };
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

    armHistoryOnce(actionName = 'Ajuste de diseño') {
        if (this.historyArmed) return;
        const host = this.getHost();
        if (!host?.editor?.historyManager || host.editor.historyManager.isNavigating) return;
        host.editor.historyManager.saveState(host.editor.data, actionName);
        this.historyArmed = true;
        setTimeout(() => { this.historyArmed = false; }, 250);
    }

    debounce(key, fn, wait) {
        const cur = this.debouncers.get(key);
        if (cur) clearTimeout(cur);
        const t = setTimeout(() => {
            this.debouncers.delete(key);
            fn();
        }, wait);
        this.debouncers.set(key, t);
    }

    applySolid() {
        const host = this.getHost();
        if (!host?.selectedId) {
            this.notify('Selecciona un elemento para aplicar relleno', 'info');
            return;
        }
        const color = this.state.solid.color;
        const opacity = this.state.solid.opacity;
        if (host.isProbablyText(host.selectedId)) {
            host.updateDesignElement(host.selectedId, { textColor: color, opacity }, { sendToIframe: true, historyKey: 'fillSolid' });
        } else {
            host.updateDesignElement(host.selectedId, { fillType: 'solid', fillColor: color, opacity }, { sendToIframe: true, historyKey: 'fillSolid' });
        }
    }

    applyGradient() {
        const host = this.getHost();
        if (!host?.selectedId) {
            this.notify('Selecciona un elemento para aplicar relleno', 'info');
            return;
        }
        const css = this.generateGradientCSS();
        if (host.isProbablyText(host.selectedId)) {
            host.updateDesignElement(host.selectedId, { textGradient: css }, { sendToIframe: true, historyKey: 'fillGradient' });
        } else {
            host.updateDesignElement(host.selectedId, { fillType: 'gradient', fillGradient: css }, { sendToIframe: true, historyKey: 'fillGradient' });
        }
    }

    applyTexture() {
        const host = this.getHost();
        if (!host?.selectedId) {
            this.notify('Selecciona un elemento para aplicar relleno', 'info');
            return;
        }
        const t = this.state.texture;
        if (!t?.dataUrl) return;
        if (host.isProbablyText(host.selectedId)) {
            this.notify('Texturas en texto no están disponibles en este modo', 'info');
            return;
        }
        host.updateDesignElement(host.selectedId, {
            fillType: 'texture',
            textureDataUrl: t.dataUrl,
            textureScale: t.scale,
            textureRepeat: t.repeat
        }, { sendToIframe: true, historyKey: 'fillTexture' });
    }

    bindControls() {
        this.ui.solidColor?.addEventListener('input', () => {
            this.armHistoryOnce('Cambio de color sólido');
            this.state.solid.color = this.ui.solidColor.value;
            this.applySolid();
            this.saveState();
        });
        this.ui.solidOpacity?.addEventListener('input', () => {
            this.armHistoryOnce();
            this.state.solid.opacity = parseInt(this.ui.solidOpacity.value, 10) / 100;
            this.applySolid();
            this.saveState();
        });

        const typeBtns = this.gradTypeButtons || Array.from(this.modal.querySelectorAll('[data-af-grad-type]'));
        typeBtns.forEach((b) => {
            b.addEventListener('click', () => {
                typeBtns.forEach((x) => x.classList.remove('active'));
                b.classList.add('active');
                const t = b.dataset.afGradType;
                this.state.gradient.type = t === 'radial' ? 'radial' : (t === 'conic' ? 'conic' : 'linear');
                this.ui.gradAngleRow.style.display = (this.state.gradient.type === 'linear' || this.state.gradient.type === 'conic') ? '' : 'none';
                this.renderStops();
                this.renderStopBar();
                this.syncSelectedStopUI();
                this.updateGradientPreview();
                this.armHistoryOnce('Cambio tipo degradado');
                this.debounce('applyGradient', () => this.applyGradient(), 50);
                this.saveState();
            });
        });

        this.ui.gradAngle?.addEventListener('input', () => {
            this.armHistoryOnce('Ángulo de degradado');
            this.state.gradient.angle = parseInt(this.ui.gradAngle.value, 10);
            this.updateGradientPreview();
            this.debounce('applyGradient', () => this.applyGradient(), 50);
            this.saveState();
        });

        this.ui.gradAddStop?.addEventListener('click', () => {
            const stops = this.state.gradient.stops || [];
            if (stops.length >= 6) return;
            this.armHistoryOnce('Añadir parada de color');
            stops.push({ id: `st_${Date.now()}_${Math.random().toString(16).slice(2)}`, position: 50, color: '#ffffff', opacity: 1 });
            this.state.gradient.stops = stops.sort((a, b) => a.position - b.position);
            this.state.gradient.selectedStopId = this.state.gradient.stops[0]?.id || null;
            this.renderStops();
            this.renderStopBar();
            this.syncSelectedStopUI();
            this.updateGradientPreview();
            this.applyGradient();
            this.saveState();
        });

        this.ui.gradReset?.addEventListener('click', () => {
            this.armHistoryOnce();
            this.state.gradient = this.normalizeGradient(null);
            this.applyStateToUI();
            this.renderStops();
            this.renderStopBar();
            this.syncSelectedStopUI();
            this.updateGradientPreview();
            this.applyGradient();
            this.saveState();
        });

        this.ui.stopColor?.addEventListener('input', () => {
            const stop = this.getSelectedStop();
            if (!stop) return;
            this.armHistoryOnce();
            stop.color = this.ui.stopColor.value;
            this.renderStops();
            this.renderStopBar();
            this.updateGradientPreview();
            this.debounce('applyGradient', () => this.applyGradient(), 50);
            this.saveState();
        });

        this.ui.stopOpacity?.addEventListener('input', () => {
            const stop = this.getSelectedStop();
            if (!stop) return;
            this.armHistoryOnce();
            stop.opacity = parseInt(this.ui.stopOpacity.value, 10) / 100;
            this.renderStops();
            this.renderStopBar();
            this.updateGradientPreview();
            this.debounce('applyGradient', () => this.applyGradient(), 50);
            this.saveState();
        });

        this.ui.stopRemove?.addEventListener('click', () => {
            const g = this.state.gradient;
            const stop = this.getSelectedStop();
            if (!g || !stop) return;
            if ((g.stops || []).length <= 2) return;
            this.armHistoryOnce();
            g.stops = (g.stops || []).filter((s) => s.id !== stop.id);
            g.selectedStopId = g.stops[0]?.id || null;
            this.renderStops();
            this.renderStopBar();
            this.syncSelectedStopUI();
            this.updateGradientPreview();
            this.applyGradient();
            this.saveState();
        });

        this.ui.presetSave?.addEventListener('click', () => {
            const name = String(this.ui.presetName?.value || '').trim();
            if (!name) return;
            const presets = this.loadPresets();
            presets[name] = JSON.parse(JSON.stringify(this.state.gradient));
            this.savePresets(presets);
            this.renderPresetList();
            this.ui.presetName.value = '';
            this.notify('Preset guardado', 'success');
        });

        this.ui.textureScale?.addEventListener('input', () => {
            this.armHistoryOnce('Escala de textura');
            this.state.texture.scale = parseFloat(this.ui.textureScale.value);
            this.debounce('applyTexture', () => this.applyTexture(), 80);
            this.saveState();
        });

        this.ui.textureRepeat?.addEventListener('change', () => {
            this.armHistoryOnce('Repetición de textura');
            this.state.texture.repeat = this.ui.textureRepeat.value;
            this.applyTexture();
            this.saveState();
        });

        this.ui.textureUpload?.addEventListener('change', async () => {
            const file = this.ui.textureUpload.files?.[0];
            if (!file) return;
            this.armHistoryOnce();
            const dataUrl = await this.readFileAsDataUrl(file);
            this.state.texture.dataUrl = dataUrl;
            this.activeTextureKey = 'upload';
            this.renderTexturePresets();
            this.applyTexture();
            this.saveState();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.hidden) {
                this.close();
            }
        });
    }

    loadPresets() {
        try {
            const raw = localStorage.getItem(this.presetsKey);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    savePresets(presets) {
        try { localStorage.setItem(this.presetsKey, JSON.stringify(presets || {})); } catch (_) { }
    }

    renderPresetList() {
        const mount = this.ui.presetList;
        if (!mount) return;
        const presets = this.loadPresets();
        const names = Object.keys(presets).sort((a, b) => a.localeCompare(b));
        mount.innerHTML = '';
        if (!names.length) {
            const empty = document.createElement('div');
            empty.className = 'layer-meta';
            empty.textContent = 'Sin presets guardados';
            mount.appendChild(empty);
            return;
        }

        names.forEach((name) => {
            const row = document.createElement('div');
            row.className = 'af-preset-row';

            const sw = document.createElement('div');
            sw.className = 'af-preset-swatch';
            try {
                const g = this.normalizeGradient(presets[name]);
                const parts = (g.stops || []).map((s) => `${s.color} ${s.position}%`);
                sw.style.background = g.type === 'radial'
                    ? `radial-gradient(circle at center, ${parts.join(', ')})`
                    : g.type === 'conic'
                        ? `conic-gradient(from ${g.angle}deg at center, ${parts.join(', ')})`
                        : `linear-gradient(${g.angle}deg, ${parts.join(', ')})`;
            } catch (_) { }

            const label = document.createElement('button');
            label.type = 'button';
            label.className = 'af-preset-btn';
            label.textContent = name;
            label.addEventListener('click', () => {
                this.armHistoryOnce();
                this.state.gradient = this.normalizeGradient(presets[name]);
                this.applyStateToUI();
                this.applyGradient();
                this.saveState();
            });

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'tool-btn';
            del.style.width = '34px';
            del.style.height = '34px';
            del.textContent = '🗑';
            del.title = 'Eliminar preset';
            del.addEventListener('click', () => {
                const next = this.loadPresets();
                delete next[name];
                this.savePresets(next);
                this.renderPresetList();
            });

            row.appendChild(sw);
            row.appendChild(label);
            row.appendChild(del);
            mount.appendChild(row);
        });
    }

    applyStateToUI() {
        if (this.ui.solidColor) this.ui.solidColor.value = this.state.solid.color || '#ffffff';
        if (this.ui.solidOpacity) this.ui.solidOpacity.value = String(Math.round((this.state.solid.opacity ?? 1) * 100));
        if (this.ui.gradAngle) this.ui.gradAngle.value = String(this.state.gradient.angle ?? 135);
        if (this.ui.gradAngleRow) this.ui.gradAngleRow.style.display = (this.state.gradient.type === 'linear' || this.state.gradient.type === 'conic') ? '' : 'none';
        if (this.ui.textureScale) this.ui.textureScale.value = String(this.state.texture.scale ?? 1);
        if (this.ui.textureRepeat) this.ui.textureRepeat.value = this.state.texture.repeat || 'repeat';
        this.gradTypeButtons?.forEach?.((b) => {
            const t = b.dataset.afGradType;
            const isActive = (t === 'radial' && this.state.gradient.type === 'radial')
                || (t === 'conic' && this.state.gradient.type === 'conic')
                || (t === 'linear' && this.state.gradient.type === 'linear');
            b.classList.toggle('active', isActive);
        });
        this.renderStops();
        this.renderStopBar();
        this.syncSelectedStopUI();
        this.updateGradientPreview();
        this.activateTab(this.state.tab || 'afColors');
        this.updateModeClasses();
    }

    getSelectedStop() {
        const g = this.state.gradient || {};
        const id = g.selectedStopId;
        const stops = Array.isArray(g.stops) ? g.stops : [];
        return stops.find((s) => s.id === id) || stops[0] || null;
    }

    setSelectedStop(id) {
        const g = this.state.gradient;
        if (!g) return;
        g.selectedStopId = id;
        this.renderStopBar();
        this.syncSelectedStopUI();
        this.saveState();
    }

    syncSelectedStopUI() {
        const stop = this.getSelectedStop();
        if (!stop) return;
        if (this.ui.stopColor) this.ui.stopColor.value = stop.color || '#ffffff';
        if (this.ui.stopOpacity) this.ui.stopOpacity.value = String(Math.round((stop.opacity ?? 1) * 100));
        if (this.ui.stopRemove) this.ui.stopRemove.disabled = (this.state.gradient.stops || []).length <= 2;
    }

    renderStopBar() {
        if (!this.ui.stopBarTrack) return;
        const track = this.ui.stopBarTrack;
        const g = this.state.gradient || {};
        const stops = (g.stops || []).slice().sort((a, b) => a.position - b.position);
        track.style.background = this.generateGradientCSS();
        track.innerHTML = '';
        stops.forEach((s) => {
            const h = document.createElement('button');
            h.type = 'button';
            h.className = 'af-stop-handle' + (s.id === g.selectedStopId ? ' active' : '');
            h.style.left = `${s.position}%`;
            h.style.background = s.color;
            h.title = `Parada ${s.position}%`;
            h.dataset.stopId = s.id;
            h.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setSelectedStop(s.id);
            });
            h.addEventListener('pointerdown', (e) => this.onStopDragStart(e, s.id));
            track.appendChild(h);
        });

        if (this.ui.stopBar && !this.ui.stopBar.dataset.bound) {
            this.ui.stopBar.dataset.bound = '1';
            this.ui.stopBar.addEventListener('click', (e) => this.onStopBarClick(e));
            window.addEventListener('pointermove', (e) => this.onStopDragMove(e), { passive: false });
            window.addEventListener('pointerup', (e) => this.onStopDragEnd(e), { passive: true });
        }
    }

    onStopBarClick(e) {
        if (!this.ui.stopBarTrack) return;
        const rect = this.ui.stopBarTrack.getBoundingClientRect();
        if (!rect.width) return;
        const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const pos = Math.min(100, Math.max(0, pct));
        const g = this.state.gradient;
        if (!g) return;
        if ((g.stops || []).length >= 6) return;
        this.armHistoryOnce();
        const selected = this.getSelectedStop();
        const color = selected?.color || '#ffffff';
        const opacity = selected?.opacity ?? 1;
        const stop = { id: `st_${Date.now()}_${Math.random().toString(16).slice(2)}`, position: pos, color, opacity };
        g.stops.push(stop);
        g.stops = g.stops.sort((a, b) => a.position - b.position);
        g.selectedStopId = stop.id;
        this.renderStops();
        this.renderStopBar();
        this.syncSelectedStopUI();
        this.updateGradientPreview();
        this.debounce('applyGradient', () => this.applyGradient(), 50);
        this.saveState();
    }

    onStopDragStart(e, stopId) {
        if (!e.isPrimary) return;
        if (!this.ui.stopBarTrack) return;
        this.armHistoryOnce();
        this.stopDrag = { pointerId: e.pointerId, stopId };
        try { e.target.setPointerCapture(e.pointerId); } catch (_) { }
        e.preventDefault();
    }

    onStopDragMove(e) {
        if (!this.stopDrag || e.pointerId !== this.stopDrag.pointerId) return;
        if (!this.ui.stopBarTrack) return;
        const g = this.state.gradient;
        if (!g) return;
        const stop = (g.stops || []).find((s) => s.id === this.stopDrag.stopId);
        if (!stop) return;
        const rect = this.ui.stopBarTrack.getBoundingClientRect();
        if (!rect.width) return;
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        stop.position = Math.min(100, Math.max(0, Math.round(pct)));
        g.stops = g.stops.sort((a, b) => a.position - b.position);
        g.selectedStopId = stop.id;
        this.renderStopBar();
        this.renderStops();
        this.updateGradientPreview();
        this.debounce('applyGradient', () => this.applyGradient(), 50);
        this.saveState();
        e.preventDefault();
    }

    onStopDragEnd(e) {
        if (!this.stopDrag || e.pointerId !== this.stopDrag.pointerId) return;
        try { e.target?.releasePointerCapture?.(e.pointerId); } catch (_) { }
        this.stopDrag = null;
    }

    renderStops() {
        if (!this.ui.gradStops) return;
        const stops = (this.state.gradient.stops || []).slice().sort((a, b) => a.position - b.position);
        this.ui.gradStops.innerHTML = '';

        stops.forEach((stop, idx) => {
            const row = document.createElement('div');
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '60px 1fr 1fr 44px';
            row.style.gap = '10px';
            row.style.alignItems = 'center';
            row.style.marginBottom = '10px';

            const color = document.createElement('input');
            color.type = 'color';
            color.className = 'control-input';
            color.value = stop.color || '#ffffff';
            color.title = 'Color';

            const pos = document.createElement('input');
            pos.type = 'range';
            pos.className = 'control-range';
            pos.min = '0';
            pos.max = '100';
            pos.value = String(stop.position ?? 0);
            pos.title = 'Posición';

            const op = document.createElement('input');
            op.type = 'range';
            op.className = 'control-range';
            op.min = '0';
            op.max = '100';
            op.value = String(Math.round((stop.opacity ?? 1) * 100));
            op.title = 'Opacidad';

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'tool-btn';
            del.style.width = '44px';
            del.style.height = '34px';
            del.textContent = '🗑';
            del.title = 'Eliminar';

            const sync = () => {
                const target = (this.state.gradient.stops || []).find((x) => x.id === stop.id);
                if (!target) return;
                target.color = color.value;
                target.position = parseInt(pos.value, 10);
                target.opacity = parseInt(op.value, 10) / 100;
                this.state.gradient.stops = this.state.gradient.stops.sort((a, b) => a.position - b.position);
                this.state.gradient.selectedStopId = target.id;
                this.updateGradientPreview();
                this.renderStopBar();
                this.syncSelectedStopUI();
                this.debounce('applyGradient', () => this.applyGradient(), 50);
                this.saveState();
            };

            [color, pos, op].forEach((el) => el.addEventListener('pointerdown', () => this.armHistoryOnce(), { passive: true }));
            color.addEventListener('input', sync);
            pos.addEventListener('input', sync);
            op.addEventListener('input', sync);

            del.addEventListener('click', () => {
                if ((this.state.gradient.stops || []).length <= 2) return;
                this.armHistoryOnce();
                const at = (this.state.gradient.stops || []).findIndex((x) => x.id === stop.id);
                if (at >= 0) this.state.gradient.stops.splice(at, 1);
                if (this.state.gradient.selectedStopId === stop.id) {
                    this.state.gradient.selectedStopId = this.state.gradient.stops[0]?.id || null;
                }
                this.renderStops();
                this.renderStopBar();
                this.syncSelectedStopUI();
                this.updateGradientPreview();
                this.applyGradient();
                this.saveState();
            });

            row.appendChild(color);
            row.appendChild(pos);
            row.appendChild(op);
            row.appendChild(del);
            this.ui.gradStops.appendChild(row);
        });
    }

    updateGradientPreview() {
        const canvas = this.ui.gradPreview;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const g = this.state.gradient || {};
        const stops = (g.stops || []).slice().sort((a, b) => a.position - b.position);

        let grad;
        if (g.type === 'radial') {
            grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        } else if (g.type === 'conic' && typeof ctx.createConicGradient === 'function') {
            const angle = Number.isFinite(parseFloat(g.angle)) ? parseFloat(g.angle) : 0;
            grad = ctx.createConicGradient(((angle - 90) * Math.PI) / 180, w / 2, h / 2);
        } else {
            const angle = Number.isFinite(parseFloat(g.angle)) ? parseFloat(g.angle) : 135;
            const angleRad = (angle - 90) * Math.PI / 180;
            const x1 = w / 2 + Math.cos(angleRad) * w / 2;
            const y1 = h / 2 + Math.sin(angleRad) * h / 2;
            const x2 = w / 2 - Math.cos(angleRad) * w / 2;
            const y2 = h / 2 - Math.sin(angleRad) * h / 2;
            grad = ctx.createLinearGradient(x1, y1, x2, y2);
        }

        stops.forEach((s) => {
            const rgba = this.hexToRgba(s.color || '#ffffff', s.opacity ?? 1);
            grad.addColorStop((s.position ?? 0) / 100, rgba);
        });

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    generateGradientCSS() {
        const g = this.state.gradient || {};
        const stops = (g.stops || []).slice().sort((a, b) => a.position - b.position);
        const parts = stops.map((s) => `${this.hexToRgba(s.color || '#ffffff', s.opacity ?? 1)} ${s.position ?? 0}%`);
        if (g.type === 'radial') return `radial-gradient(circle at center, ${parts.join(', ')})`;
        if (g.type === 'conic') {
            const angle = Number.isFinite(parseFloat(g.angle)) ? parseFloat(g.angle) : 0;
            return `conic-gradient(from ${Math.round(angle)}deg at center, ${parts.join(', ')})`;
        }
        const angle = Number.isFinite(parseFloat(g.angle)) ? parseFloat(g.angle) : 135;
        return `linear-gradient(${Math.round(angle)}deg, ${parts.join(', ')})`;
    }

    renderMetallicPresets() {
        const grid = this.ui.metallicGrid;
        if (!grid) return;
        grid.innerHTML = '';
        const ge = window.designAdvancedIntegrator?.gradientEditor;
        const presets = ge?.getPresets?.() || {};
        const keys = Object.keys(presets);
        keys.forEach((k) => {
            const p = presets[k];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tool-btn';
            btn.style.width = '100%';
            btn.style.height = '54px';
            btn.style.justifyContent = 'flex-start';
            btn.style.padding = '10px';
            btn.style.gap = '10px';

            const swatch = document.createElement('div');
            swatch.style.width = '44px';
            swatch.style.height = '34px';
            swatch.style.borderRadius = '10px';
            swatch.style.border = '1px solid rgba(148, 163, 184, 0.22)';
            const css = this.presetToCss(p);
            swatch.style.background = css;

            const name = document.createElement('div');
            name.style.fontWeight = '900';
            name.style.fontSize = '0.85rem';
            name.textContent = p?.name || k;

            btn.appendChild(swatch);
            btn.appendChild(name);

            btn.addEventListener('click', () => {
                this.armHistoryOnce();
                const loaded = ge?.loadPreset?.(k);
                const current = loaded ? ge.getCurrentGradient?.() : null;
                if (current) {
                    this.state.gradient = this.normalizeGradient({
                        type: current.type,
                        angle: current.angle,
                        stops: (current.stops || []).map((s) => ({
                            position: s.position,
                            color: s.color,
                            opacity: s.opacity ?? 1
                        }))
                    });
                } else {
                    this.state.gradient = this.normalizeGradient({
                        type: p.type || 'linear',
                        angle: p.angle || 135,
                        stops: (p.stops || []).map((s) => ({ position: s.position, color: s.color, opacity: s.opacity ?? 1 }))
                    });
                }
                this.applyStateToUI();
                this.applyGradient();
                this.saveState();
            });

            grid.appendChild(btn);
        });
    }

    presetToCss(preset) {
        const p = preset || {};
        const stops = (p.stops || []).map((s) => `${s.color} ${s.position}%`);
        const angle = p.angle || 135;
        if (p.type === 'radial') return `radial-gradient(circle at center, ${stops.join(', ')})`;
        if (p.type === 'conic') return `conic-gradient(from ${angle}deg at center, ${stops.join(', ')})`;
        return `linear-gradient(${angle}deg, ${stops.join(', ')})`;
    }

    renderTexturePresets() {
        const grid = this.ui.textureGrid;
        if (!grid) return;
        grid.innerHTML = '';
        const textures = window.designAdvancedIntegrator?.textureManager?.presetTextures || {};
        const keys = Object.keys(textures);

        const mkBtn = (key, url) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tool-btn';
            btn.style.width = '100%';
            btn.style.height = '58px';
            btn.style.borderRadius = '12px';
            btn.style.padding = '0';
            btn.style.overflow = 'hidden';
            btn.title = key;

            const inner = document.createElement('div');
            inner.style.width = '100%';
            inner.style.height = '100%';
            inner.style.backgroundImage = `url("${url}")`;
            inner.style.backgroundSize = 'cover';
            inner.style.backgroundPosition = 'center';
            inner.style.borderRadius = '12px';
            btn.appendChild(inner);

            if (this.activeTextureKey === key) {
                btn.style.borderColor = 'rgba(139, 92, 246, 0.9)';
            }

            btn.addEventListener('click', () => {
                this.armHistoryOnce();
                this.activeTextureKey = key;
                this.state.texture.dataUrl = url;
                this.applyTexture();
                this.renderTexturePresets();
                this.saveState();
            });
            return btn;
        };

        keys.slice(0, 30).forEach((k) => {
            const url = textures[k]?.pattern || '';
            if (!url) return;
            grid.appendChild(mkBtn(k, url));
        });

        if (this.state.texture.dataUrl && this.activeTextureKey === 'upload') {
            const uploadBtn = mkBtn('upload', this.state.texture.dataUrl);
            grid.prepend(uploadBtn);
        }
    }

    async readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onerror = () => reject(new Error('read error'));
            r.onload = () => resolve(String(r.result || ''));
            r.readAsDataURL(file);
        });
    }

    hexToRgba(hex, opacity) {
        const h = String(hex || '').replace('#', '').trim();
        if (h.length !== 6) return `rgba(255,255,255,${opacity})`;
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        const o = Math.min(1, Math.max(0, parseFloat(opacity)));
        return `rgba(${r}, ${g}, ${b}, ${o})`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = new AdvancedFillModal();
    modal.init();
    window.advancedFillModal = modal;
});

