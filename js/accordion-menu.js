/**
 * AccordionMenu - Menú acordeón de selección única con accesibilidad.
 * - Un solo panel abierto a la vez
 * - Teclado: Enter/Espacio (toggle), Flechas (mover foco), Home/End
 * - ARIA: aria-expanded / aria-controls / role="region"
 */
class AccordionMenu {
    constructor(root) {
        this.root = typeof root === 'string' ? document.querySelector(root) : root;
        this.triggers = [];
        this.panels = new Map();
        this.onTransitionEnd = this.onTransitionEnd.bind(this);
    }

    init() {
        if (!this.root) return;

        this.triggers = Array.from(this.root.querySelectorAll('.accordion-trigger'));
        this.panels.clear();

        for (const btn of this.triggers) {
            const panelId = btn.getAttribute('aria-controls');
            const panel = panelId ? document.getElementById(panelId) : null;
            if (panelId && panel) this.panels.set(panelId, panel);

            btn.addEventListener('click', () => this.toggle(btn));
            btn.addEventListener('keydown', (e) => this.onKeydown(e, btn));
        }

        this.collapseAll({ animate: false });

        window.addEventListener('resize', () => this.reflowOpenPanel(), { passive: true });
    }

    onKeydown(e, btn) {
        const idx = this.triggers.indexOf(btn);
        if (idx < 0) return;

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggle(btn);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.focusByIndex((idx + 1) % this.triggers.length);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.focusByIndex((idx - 1 + this.triggers.length) % this.triggers.length);
            return;
        }

        if (e.key === 'Home') {
            e.preventDefault();
            this.focusByIndex(0);
            return;
        }

        if (e.key === 'End') {
            e.preventDefault();
            this.focusByIndex(this.triggers.length - 1);
            return;
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.open(btn, { focus: false });
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.close(btn);
            return;
        }
    }

    focusByIndex(index) {
        const el = this.triggers[index];
        if (el) el.focus();
    }

    toggle(btn) {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
            this.close(btn);
            return;
        }
        this.open(btn);
    }

    collapseAll(options = {}) {
        const { animate = false } = options;
        for (const btn of this.triggers) {
            this.close(btn, { animate });
        }
    }

    open(btn, options = {}) {
        const { focus = true, animate = true, scrollToTop = true, focusFirstField = true } = options;
        const panelId = btn.getAttribute('aria-controls');
        const panel = panelId ? this.panels.get(panelId) : null;
        if (!panel) return;

        // Close other panels first
        for (const other of this.triggers) {
            if (other !== btn) this.close(other, { animate });
        }

        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');

        panel.classList.add('active');
        panel.hidden = false;
        panel.setAttribute('aria-hidden', 'false');

        const inner = panel.querySelector('.accordion-panel-inner') || panel;

        if (!animate) {
            panel.style.maxHeight = 'none';
            panel.style.opacity = '1';

            // Execute scroll and focus even without animation
            if (scrollToTop || focusFirstField) {
                this.handleNavigationEnhancements(panel, { scrollToTop, focusFirstField });
            }

            if (focus) btn.focus();
            return;
        }

        panel.removeEventListener('transitionend', this.onTransitionEnd);
        panel.dataset.state = 'opening';

        panel.style.maxHeight = '0px';
        panel.style.opacity = '0';

        requestAnimationFrame(() => {
            const target = inner.scrollHeight;
            panel.style.maxHeight = `${target}px`;
            panel.style.opacity = '1';

            // Store navigation options for after transition
            panel.dataset.scrollToTop = scrollToTop;
            panel.dataset.focusFirstField = focusFirstField;

            panel.addEventListener('transitionend', this.onTransitionEnd);
        });

        if (focus) btn.focus();
    }

    /**
     * Handle navigation enhancements: scroll to top and focus first field
     * @param {HTMLElement} panel - The accordion panel
     * @param {Object} options - Navigation options
     */
    handleNavigationEnhancements(panel, options = {}) {
        const { scrollToTop = true, focusFirstField = true } = options;

        if (scrollToTop) {
            this.smoothScrollToTop().then(() => {
                // After scroll completes, focus first field if requested
                if (focusFirstField) {
                    this.focusFirstInputField(panel);
                }
            });
        } else if (focusFirstField) {
            // If no scroll, focus immediately
            this.focusFirstInputField(panel);
        }
    }

    /**
     * Instant scroll to top of left sidebar panel (no animation)
     * @returns {Promise} Resolves immediately after scroll
     */
    smoothScrollToTop() {
        return new Promise((resolve) => {
            // Find the scrollable container (left panel)
            const scrollContainer = document.getElementById('leftPanel') ||
                document.querySelector('.control-panel') ||
                document.querySelector('[role="complementary"]');

            if (!scrollContainer) {
                console.warn('Scroll container not found, falling back to window scroll');
                // Fallback to window scroll - instant
                window.scrollTo(0, 0);
                resolve();
                return;
            }

            // Instant scroll to top (no animation)
            scrollContainer.scrollTop = 0;

            // Resolve immediately
            resolve();
        });
    }

    /**
     * Polyfill for smooth scroll (older browsers)
     * @param {HTMLElement} container - Container to scroll
     * @param {number} targetY - Target scroll position
     * @param {number} duration - Animation duration in ms
     */
    smoothScrollPolyfill(container, targetY, duration) {
        return new Promise((resolve) => {
            const startY = container.scrollTop;
            const distance = targetY - startY;
            const startTime = performance.now();

            const easeInOutCubic = (t) => {
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            };

            const scroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeInOutCubic(progress);

                container.scrollTop = startY + distance * eased;

                if (progress < 1) {
                    requestAnimationFrame(scroll);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(scroll);
        });
    }

    /**
     * Focus the first interactive element in the panel
     * WCAG 2.1 compliant with visual feedback and screen reader support
     * @param {HTMLElement} panel - The accordion panel
     */
    focusFirstInputField(panel) {
        if (!panel) return;

        // Find first focusable element (comprehensive list for accessibility)
        const selectors = [
            'input:not([type="hidden"]):not([disabled]):not([aria-hidden="true"])',
            'textarea:not([disabled]):not([aria-hidden="true"])',
            'select:not([disabled]):not([aria-hidden="true"])',
            'button:not([disabled]):not([aria-hidden="true"])',
            'a[href]:not([disabled]):not([aria-hidden="true"])',
            '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])',
            '[contenteditable="true"]:not([aria-hidden="true"])'
        ];

        const firstField = panel.querySelector(selectors.join(', '));

        if (firstField) {
            // Small delay to ensure DOM is ready and scroll is complete
            setTimeout(() => {
                try {
                    // Store original outline for restoration
                    const originalOutline = firstField.style.outline;
                    const originalOutlineOffset = firstField.style.outlineOffset;

                    // Apply focus
                    firstField.focus({ preventScroll: true }); // Prevent auto-scroll since we already scrolled


                    // Add visual feedback (WCAG 2.1 - Focus Visible)
                    firstField.style.outline = '3px solid rgba(139, 92, 246, 0.8)';
                    firstField.style.outlineOffset = '2px';

                    // Remove custom outline after a moment (let native focus take over)
                    setTimeout(() => {
                        firstField.style.outline = originalOutline;
                        firstField.style.outlineOffset = originalOutlineOffset;
                    }, 1500);

                    // For text inputs, clear any existing selection (do NOT select content)
                    if (firstField.tagName === 'INPUT' || firstField.tagName === 'TEXTAREA') {
                        // Move cursor to end and clear selection
                        if (firstField.setSelectionRange) {
                            const length = firstField.value.length;
                            firstField.setSelectionRange(length, length);
                        }
                        // Also clear any window selection
                        if (window.getSelection) {
                            window.getSelection().removeAllRanges();
                        }
                    }


                    // Get descriptive name for screen reader announcement
                    const fieldName = this.getFieldDescription(firstField);

                    // Announce to screen readers with context
                    this.announceToScreenReader(
                        `Panel expandido. ${fieldName} enfocado y listo para edición.`,
                        'polite'
                    );

                    // Scroll element into view if it's not fully visible within the panel
                    this.ensureElementVisible(firstField, panel);

                } catch (e) {
                    console.warn('Could not focus first field:', e);
                    // Announce error to screen reader
                    this.announceToScreenReader('Panel expandido. Navegue con Tab para acceder a los controles.', 'polite');
                }
            }, 150); // Increased delay for better reliability
        } else {
            console.log('No focusable field found in panel');
            // Announce that panel is open but has no interactive elements
            this.announceToScreenReader('Panel expandido. No hay campos interactivos en esta sección.', 'polite');
        }
    }

    /**
     * Get descriptive name for a form field (for screen readers)
     * @param {HTMLElement} field - The form field
     * @returns {string} Descriptive name
     */
    getFieldDescription(field) {
        // Try aria-label first (highest priority)
        if (field.getAttribute('aria-label')) {
            return field.getAttribute('aria-label');
        }

        // Try associated label
        if (field.id) {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Try parent label
        const parentLabel = field.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.trim();
        }

        // Try placeholder
        if (field.placeholder) {
            return `Campo: ${field.placeholder}`;
        }

        // Try name attribute
        if (field.name) {
            return `Campo ${field.name}`;
        }

        // Try id
        if (field.id) {
            return `Campo ${field.id}`;
        }

        // Fallback to element type
        const tagName = field.tagName.toLowerCase();
        const typeMap = {
            'input': 'campo de entrada',
            'textarea': 'área de texto',
            'select': 'menú desplegable',
            'button': 'botón'
        };
        return typeMap[tagName] || 'elemento interactivo';
    }

    /**
     * Ensure element is visible within its scrollable container
     * @param {HTMLElement} element - Element to make visible
     * @param {HTMLElement} container - Scrollable container
     */
    ensureElementVisible(element, container) {
        if (!element || !container) return;

        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if element is fully visible
        const isVisible = (
            elementRect.top >= containerRect.top &&
            elementRect.bottom <= containerRect.bottom &&
            elementRect.left >= containerRect.left &&
            elementRect.right <= containerRect.right
        );

        if (!isVisible) {
            // Scroll element into view within the container
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    /**
     * Announce message to screen readers
     * WCAG 2.1 compliant with configurable priority
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' (default) or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        // Create or reuse live region for announcements
        let liveRegion = document.getElementById('accordion-live-region');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'accordion-live-region';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            // Visually hidden but accessible to screen readers
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            liveRegion.style.clip = 'rect(0, 0, 0, 0)';
            liveRegion.style.whiteSpace = 'nowrap';
            document.body.appendChild(liveRegion);
        }

        // Update priority if different
        if (liveRegion.getAttribute('aria-live') !== priority) {
            liveRegion.setAttribute('aria-live', priority);
        }

        // Clear and set new message
        liveRegion.textContent = '';

        // Small delay to ensure screen readers pick up the change
        setTimeout(() => {
            liveRegion.textContent = message;

            // Auto-clear after announcement (prevent stale content)
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 3000);
        }, 100);
    }

    close(btn, options = {}) {
        const { animate = true } = options;
        const panelId = btn.getAttribute('aria-controls');
        const panel = panelId ? this.panels.get(panelId) : null;
        if (!panel) return;

        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');

        if (!panel.classList.contains('active')) {
            panel.hidden = true;
            panel.setAttribute('aria-hidden', 'true');
            panel.style.maxHeight = '0px';
            panel.style.opacity = '0';
            panel.dataset.state = '';
            return;
        }

        if (!animate) {
            panel.classList.remove('active');
            panel.hidden = true;
            panel.setAttribute('aria-hidden', 'true');
            panel.style.maxHeight = '0px';
            panel.style.opacity = '0';
            panel.dataset.state = '';
            return;
        }

        panel.removeEventListener('transitionend', this.onTransitionEnd);
        panel.dataset.state = 'closing';

        const inner = panel.querySelector('.accordion-panel-inner') || panel;
        const current = inner.scrollHeight;
        panel.style.maxHeight = `${current}px`;
        panel.style.opacity = '1';

        requestAnimationFrame(() => {
            panel.style.maxHeight = '0px';
            panel.style.opacity = '0';
            panel.addEventListener('transitionend', this.onTransitionEnd);
        });
    }

    onTransitionEnd(e) {
        const panel = e.currentTarget;
        if (!panel || panel !== e.target) return;
        if (e.propertyName !== 'max-height' && e.propertyName !== 'opacity') return;

        const state = panel.dataset.state;
        if (state === 'opening') {
            panel.style.maxHeight = 'none';
            panel.style.opacity = '1';
            panel.dataset.state = '';
            panel.removeEventListener('transitionend', this.onTransitionEnd);

            // Trigger navigation enhancements after panel is fully open
            const scrollToTop = panel.dataset.scrollToTop === 'true';
            const focusFirstField = panel.dataset.focusFirstField === 'true';

            if (scrollToTop || focusFirstField) {
                this.handleNavigationEnhancements(panel, { scrollToTop, focusFirstField });

                // Clean up dataset
                delete panel.dataset.scrollToTop;
                delete panel.dataset.focusFirstField;
            }

            return;
        }

        if (state === 'closing') {
            panel.classList.remove('active');
            panel.hidden = true;
            panel.setAttribute('aria-hidden', 'true');
            panel.style.maxHeight = '0px';
            panel.style.opacity = '0';
            panel.dataset.state = '';
            panel.removeEventListener('transitionend', this.onTransitionEnd);
        }
    }

    reflowOpenPanel() {
        const openBtn = this.triggers.find((b) => b.getAttribute('aria-expanded') === 'true');
        if (!openBtn) return;
        const panelId = openBtn.getAttribute('aria-controls');
        const panel = panelId ? this.panels.get(panelId) : null;
        if (!panel || panel.hidden) return;
        if (panel.style.maxHeight === 'none') return;

        const inner = panel.querySelector('.accordion-panel-inner') || panel;
        panel.style.maxHeight = `${inner.scrollHeight}px`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const buildFromTabs = () => {
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return null;

        const tabs = controlPanel.querySelector('.tabs');
        const content = controlPanel.querySelector('.tab-content');
        if (!tabs || !content) return null;

        if (!tabs.id) tabs.id = 'leftAccordion';

        const buttons = Array.from(tabs.querySelectorAll('.tab-btn'));
        const panels = new Map(Array.from(content.querySelectorAll('.tab-panel')).map((p) => [p.id, p]));

        tabs.innerHTML = '';
        tabs.classList.add('accordion-menu');

        for (const btn of buttons) {
            const tabName = btn.dataset.tab;
            const panelId = `${tabName}-panel`;
            const panel = panels.get(panelId);
            if (!panel) continue;

            const isOpen = false;

            btn.classList.add('accordion-trigger');
            btn.id = btn.id || `acc-${tabName}`;
            btn.setAttribute('aria-controls', panelId);
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            if (!btn.querySelector('.accordion-chevron')) {
                const chevron = document.createElement('span');
                chevron.className = 'accordion-chevron';
                chevron.setAttribute('aria-hidden', 'true');
                chevron.textContent = '▾';
                btn.appendChild(chevron);
            }

            panel.classList.add('accordion-panel');
            panel.setAttribute('role', 'region');
            panel.setAttribute('aria-labelledby', btn.id);
            panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            panel.hidden = !isOpen;

            if (!panel.querySelector('.accordion-panel-inner')) {
                const inner = document.createElement('div');
                inner.className = 'accordion-panel-inner';
                while (panel.firstChild) inner.appendChild(panel.firstChild);
                panel.appendChild(inner);
            }

            if (!isOpen) {
                panel.classList.remove('active');
                btn.classList.remove('active');
            } else {
                panel.classList.add('active');
                btn.classList.add('active');
            }

            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.appendChild(btn);
            item.appendChild(panel);
            tabs.appendChild(item);
        }

        content.remove();
        return tabs;
    };

    const root = document.getElementById('leftAccordion') || buildFromTabs();
    if (!root) return;

    const menu = new AccordionMenu(root);
    menu.init();
    window.leftAccordion = menu;
});

