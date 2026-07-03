/**
 * Componente de Menú Desplegable para Historial
 * Implementa Split Button UI
 */
class HistoryDropdown {
    constructor(manager, type) {
        this.manager = manager;
        this.type = type;
        this.btn = type === 'undo' ? manager.undoBtn : manager.redoBtn;
        this.arrowBtn = null;
        this.menu = null;
        this.isOpen = false;
        this.anchor = null;

        this.onDocClick = this.onDocClick.bind(this);
        this.onDocKey = this.onDocKey.bind(this);
    }

    init() {
        if (!this.btn) {
            console.error('HistoryDropdown: Button not found:', this.type);
            return;
        }

        // Prevent double init
        if (this.btn.parentNode.classList.contains('history-split-group')) return;

        console.log('HistoryDropdown: Creating split button for', this.type);

        const parent = this.btn.parentNode;
        const wrapper = document.createElement('div');
        wrapper.className = 'history-split-group';

        // Insert wrapper
        parent.insertBefore(wrapper, this.btn);
        wrapper.appendChild(this.btn);

        // Create arrow
        this.arrowBtn = document.createElement('button');
        this.arrowBtn.type = 'button';
        this.arrowBtn.className = 'tool-btn tool-btn-arrow';
        this.arrowBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>`;
        this.arrowBtn.title = `Mostrar historial (${this.type})`;
        this.arrowBtn.setAttribute('aria-haspopup', 'true');
        this.arrowBtn.setAttribute('aria-expanded', 'false');

        wrapper.appendChild(this.arrowBtn);
        this.anchor = wrapper;

        this.arrowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        this.monitorDisabledState();
        this.createMenuDOM();
    }

    monitorDisabledState() {
        const syncState = () => {
            if (!this.arrowBtn) return;
            this.arrowBtn.disabled = this.btn.disabled;
            this.arrowBtn.style.opacity = this.btn.disabled ? '0.5' : '1';
            this.arrowBtn.style.pointerEvents = this.btn.disabled ? 'none' : 'auto';
        };
        const observer = new MutationObserver(syncState);
        observer.observe(this.btn, { attributes: true, attributeFilter: ['disabled'] });
        syncState();
    }

    createMenuDOM() {
        this.menu = document.createElement('div');
        this.menu.className = 'history-dropdown-menu';
        this.menu.id = `history-menu-${this.type}`;
        this.menu.setAttribute('role', 'menu');
        this.menu.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.menu);
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        if (this.isOpen || this.arrowBtn.disabled) return;

        // Close others
        document.querySelectorAll('.history-dropdown-menu.active').forEach(m => {
            // Very hacky check to invoke close on other instances? 
            // Better just hide DOM
            m.classList.remove('active');
            m.setAttribute('aria-hidden', 'true');
        });

        this.renderItems();
        this.positionMenu();

        requestAnimationFrame(() => {
            this.menu.classList.add('active');
            this.menu.setAttribute('aria-hidden', 'false');
            this.arrowBtn.setAttribute('aria-expanded', 'true');
            this.isOpen = true;

            const first = this.menu.querySelector('.history-item');
            if (first) first.focus();
        });

        document.addEventListener('click', this.onDocClick);
        document.addEventListener('keydown', this.onDocKey);
    }

    close() {
        if (!this.isOpen) return;
        this.menu.classList.remove('active');
        this.menu.setAttribute('aria-hidden', 'true');
        if (this.arrowBtn) this.arrowBtn.setAttribute('aria-expanded', 'false');
        this.isOpen = false;

        document.removeEventListener('click', this.onDocClick);
        document.removeEventListener('keydown', this.onDocKey);
    }

    renderItems() {
        const stack = this.type === 'undo' ? this.manager.undoStack : this.manager.redoStack;
        this.menu.innerHTML = '';

        if (!stack || stack.length === 0) {
            this.menu.innerHTML = `<div class="history-empty">No hay acciones</div>`;
            return;
        }

        const list = document.createElement('div');
        list.className = 'history-list';

        // Reverse stack
        let items = [...stack].reverse();

        items.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.setAttribute('role', 'menuitem');
            el.tabIndex = 0;

            const meta = item.meta || { name: 'Acción', timestamp: Date.now() };
            const timeStr = window.moment ? moment(meta.timestamp).fromNow() : '';
            const itemNumber = index + 1;

            el.innerHTML = `
                <div class="history-item-number" style="font-size: 0.85em; color: rgba(255,255,255,0.5); min-width: 18px; text-align: right;">${itemNumber}.</div>
                <div class="history-item-icon">${this.getIcon(meta.name)}</div>
                <div class="history-item-details">
                    <div class="history-item-title">${meta.name}</div>
                    <div class="history-item-time">${timeStr}</div>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.executeAction(itemNumber);
            });

            el.addEventListener('mouseenter', () => this.highlightRange(index));
            list.appendChild(el);
        });

        list.addEventListener('mouseleave', () => this.clearHighlights());
        this.menu.appendChild(list);
    }

    getIcon(name) {
        if (!name) return '✏️';
        if (name.includes('Texto') || name.includes('Mensaje') || name.includes('Nombre') || name.includes('Título')) return '📝';
        if (name.includes('Color') || name.includes('Opacidad')) return '🎨';
        if (name.includes('Fuente')) return '🔤';
        if (name.includes('Imagen') || name.includes('Fondo')) return '🖼️';
        if (name.includes('Música')) return '🎵';
        if (name.includes('Mapa') || name.includes('Ubicación') || name.includes('Coordenadas')) return '📍';
        if (name.includes('QR') || name.includes('URL')) return '🔗';
        return '✏️';
    }

    executeAction(steps) {
        this.close();
        // Batch
        for (let i = 0; i < steps; i++) {
            if (this.type === 'undo') this.manager.undo();
            else this.manager.redo();
        }
    }

    highlightRange(endIndex) {
        const items = this.menu.querySelectorAll('.history-item');
        items.forEach((item, idx) => {
            if (idx <= endIndex) item.classList.add('would-select');
            else item.classList.remove('would-select');
        });
    }

    clearHighlights() {
        const items = this.menu.querySelectorAll('.history-item');
        items.forEach(item => item.classList.remove('would-select'));
    }

    positionMenu() {
        const rect = this.anchor.getBoundingClientRect();
        this.menu.style.top = (rect.bottom + 6) + 'px';

        // Center on anchor
        const menuWidth = 300;
        let left = rect.left + (rect.width / 2) - (menuWidth / 2);

        if (left < 10) left = 10;
        if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10;

        this.menu.style.left = left + 'px';
    }

    onDocClick(e) {
        if (!this.menu.contains(e.target) && !this.anchor.contains(e.target)) {
            this.close();
        }
    }

    onDocKey(e) {
        if (e.key === 'Escape') {
            this.close();
            this.btn.focus(); // Focus original button? Or arrow?
            // If Arrow exists, focus Arrow
            if (this.arrowBtn) this.arrowBtn.focus();
        }
    }
}

// Global Export
window.HistoryDropdown = HistoryDropdown;
console.log('HistoryDropdown system loaded');
