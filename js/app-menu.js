class AppMenuBar {
    constructor(root) {
        this.root = root;
        this.buttons = [];
        this.menus = new Map();
        this.openMenuId = null;
        this.isHoverCapable = false;
        this.hoverTimeout = null; // Debounce timer

        this.onDocPointerMove = this.onDocPointerMove.bind(this);
        this.onDocPointerDown = this.onDocPointerDown.bind(this);
        this.onDocKeyDown = this.onDocKeyDown.bind(this);
    }

    init() {
        if (!this.root) return;
        // Detect hover capability
        this.isHoverCapable = typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover)').matches;

        this.buttons = Array.from(this.root.querySelectorAll('.menu-bar-btn[aria-controls]'));
        for (const btn of this.buttons) {
            const id = btn.getAttribute('aria-controls');
            const menu = id ? document.getElementById(id) : null;
            if (id && menu) this.menus.set(id, menu);

            // Click toggles menu
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Avoid immediate close by doc listener
                this.toggle(id);
            });

            btn.addEventListener('keydown', (e) => this.onButtonKeyDown(e, id));

            // Mouse Enter for debounced switching
            btn.addEventListener('mouseenter', () => this.handleButtonHover(id));
        }

        for (const [id, menu] of this.menus) {
            menu.addEventListener('keydown', (e) => this.onMenuKeyDown(e, id));
            menu.addEventListener('click', (e) => this.onMenuClick(e));
        }

        // Global listeners
        if (this.isHoverCapable) {
            // We listen to buttons mouseenter primarily, but pointermove on doc 
            // is useful if we need to track movement between gaps. 
            // For now, button 'mouseenter' is cleaner for the "switch" logic.
        }

        document.addEventListener('pointerdown', this.onDocPointerDown, true);
        document.addEventListener('keydown', this.onDocKeyDown, true);

        this.repositionAll();
        window.addEventListener('resize', () => this.repositionAll(), { passive: true });
        window.addEventListener('scroll', () => this.repositionAll(), { passive: true, capture: true });
    }

    repositionAll() {
        for (const id of this.menus.keys()) this.reposition(id);
    }

    reposition(id) {
        const btn = this.buttons.find((b) => b.getAttribute('aria-controls') === id);
        const menu = this.menus.get(id);
        if (!btn || !menu) return;

        const rect = btn.getBoundingClientRect();
        const top = Math.round(rect.bottom + 6); // Offset
        const left = Math.round(rect.left);
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        // min-width logic
        menu.style.minWidth = `${Math.max(200, Math.round(rect.width) + 80)}px`;
    }

    toggle(id) {
        if (!id) return;
        if (this.openMenuId === id) {
            this.close({ focusButton: false }); // User clicked active button -> close
        } else {
            this.open(id, { focusFirstItem: false }); // User clicked new button -> open
        }
    }

    handleButtonHover(id) {
        // Requirement: "Once opened... hover navigation...".
        // So we only act if something IS open.
        if (!this.openMenuId) return;

        // If hovering the ALREADY open one, cancel any close timer?
        if (this.openMenuId === id) {
            if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
            return;
        }

        // If hovering a NEW one, switch after debounce
        if (this.hoverTimeout) clearTimeout(this.hoverTimeout);

        this.hoverTimeout = setTimeout(() => {
            if (this.openMenuId) { // Verify still open
                this.open(id, { focusFirstItem: false, closePreviousImmediately: true });
            }
        }, 150); // 150ms debounce
    }

    open(id, options = {}) {
        const { focusFirstItem = true, closePreviousImmediately = true } = options;
        const menu = this.menus.get(id);
        if (!menu) return;

        if (this.openMenuId && this.openMenuId !== id) {
            if (closePreviousImmediately) this.closeImmediate();
            else this.close({ focusButton: false });
        }

        this.openMenuId = id;
        const btn = this.buttons.find((b) => b.getAttribute('aria-controls') === id);
        if (btn) btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('active'); // Visual state

        menu.hidden = false;
        // Reset state for transition
        menu.classList.remove('is-open');
        this.reposition(id);

        // Trigger reflow/animation
        requestAnimationFrame(() => {
            menu.classList.add('is-open');
        });

        if (focusFirstItem) {
            const first = menu.querySelector('[role="menuitem"]:not([disabled])');
            if (first) first.focus();
        }
    }

    closeImmediate() {
        if (!this.openMenuId) return;
        const id = this.openMenuId;
        const menu = this.menus.get(id);
        const btn = this.buttons.find((b) => b.getAttribute('aria-controls') === id);

        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.classList.remove('active');
        }

        if (menu) {
            menu.classList.remove('is-open');
            menu.hidden = true;
        }
        this.openMenuId = null;
    }

    close(options = {}) {
        const { focusButton = true } = options;
        if (!this.openMenuId) return;

        const id = this.openMenuId;
        const menu = this.menus.get(id);
        const btn = this.buttons.find((b) => b.getAttribute('aria-controls') === id);

        if (btn) {
            btn.setAttribute('aria-expanded', 'false');
            btn.classList.remove('active');
        }

        if (menu) {
            menu.classList.remove('is-open');

            // Wait for transition
            const onEnd = (e) => {
                if (e.target !== menu) return;
                menu.removeEventListener('transitionend', onEnd);
                if (!menu.classList.contains('is-open')) {
                    menu.hidden = true;
                }
            };
            menu.addEventListener('transitionend', onEnd);
            // Fallback safety
            setTimeout(() => {
                if (!menu.classList.contains('is-open')) menu.hidden = true;
            }, 350);
        }

        this.openMenuId = null;
        if (focusButton && btn) btn.focus();
    }

    onDocPointerDown(e) {
        if (!this.openMenuId) return;

        const t = e.target;
        const openMenu = this.menus.get(this.openMenuId);
        const openBtn = this.buttons.find((b) => b.getAttribute('aria-controls') === this.openMenuId);

        // If click inside menu or button, ignore (handled by specific listeners)
        if (openMenu && openMenu.contains(t)) return;
        if (openBtn && openBtn.contains(t)) return;

        // Click outside -> close
        this.close({ focusButton: false });
    }

    // Keyboard and legacy methods...
    onButtonKeyDown(e, id) {
        if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            this.open(id);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.openByDelta(+1, id);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.openByDelta(-1, id);
        }
    }

    openByDelta(delta, currentId) {
        const ids = this.buttons.map(b => b.getAttribute('aria-controls')).filter(Boolean);
        const idx = Math.max(0, ids.indexOf(currentId));
        const next = ids[(idx + delta + ids.length) % ids.length];
        if (next) this.open(next);
    }

    onMenuKeyDown(e, id) {
        const menu = this.menus.get(id);
        if (!menu) return;
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])'));
        const active = document.activeElement;
        const idx = items.indexOf(active);

        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = items[(idx + 1 + items.length) % items.length] || items[0];
            next?.focus();
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = items[(idx - 1 + items.length) % items.length] || items[items.length - 1];
            prev?.focus();
            return;
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.openByDelta(+1, id);
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.openByDelta(-1, id);
            return;
        }
        if (e.key === 'Enter') {
            // Let default click happen or trigger click
            if (active) active.click();
        }
    }

    onMenuClick(e) {
        const item = e.target?.closest?.('[role="menuitem"]');
        if (!item || item.disabled) return;

        // Execute action
        const action = item.dataset.action;
        if (action === 'trigger') {
            const targetId = item.dataset.target;
            const t = targetId ? document.getElementById(targetId) : null;
            t?.click?.();
        } else if (action === 'exec') {
            const cmd = item.dataset.cmd;
            if (cmd) {
                try { document.execCommand(cmd); } catch (_) { }
            }
        }
        this.close();
    }

    // Unused but kept for structure
    onDocPointerMove(e) { }
    onDocKeyDown(e) {
        if (e.key === 'Escape' && this.openMenuId) {
            e.preventDefault();
            this.close();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('.menu-bar');
    if (!root) return;
    window.appMenuBar = new AppMenuBar(root);
    window.appMenuBar.init();
});
