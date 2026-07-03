/**
 * COLOR-PICKER-INTEGRATOR.JS - Integra el selector avanzado con inputs de color existentes
 * Agrega un botón flotante junto a cada input[type="color"] para abrir el picker avanzado
 */

class ColorPickerIntegrator {
    constructor() {
        this.picker = null;
        this.enhancedInputs = new WeakSet();

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.picker = window.advancedColorPicker;
            if (!this.picker) {
                console.warn('AdvancedColorPicker no encontrado');
                return;
            }
            this.enhanceExistingInputs();
            this.observeNewInputs();
        });
    }

    enhanceExistingInputs() {
        const colorInputs = document.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => this.enhanceInput(input));
    }

    enhanceInput(input) {
        if (this.enhancedInputs.has(input)) return;
        if (input.closest('.acp-enhanced')) return;

        this.enhancedInputs.add(input);

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'acp-enhanced';
        wrapper.style.cssText = 'position:relative;display:inline-flex;align-items:center;gap:4px;';

        // Insert wrapper before input
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Create trigger button
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'acp-trigger';
        trigger.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="8" cy="8" r="3"/>
        </svg>`;
        trigger.title = 'Selector avanzado de color';
        trigger.setAttribute('aria-label', 'Abrir selector avanzado de color');
        trigger.style.cssText = `
            width: 24px;
            height: 24px;
            border: 1px solid #94a3b8;
            border-radius: 4px;
            background: #f1f5f9;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #475569;
            flex-shrink: 0;
            transition: all 0.15s;
        `;

        trigger.addEventListener('mouseenter', () => {
            trigger.style.background = '#e2e8f0';
            trigger.style.borderColor = '#64748b';
        });
        trigger.addEventListener('mouseleave', () => {
            trigger.style.background = '#f1f5f9';
            trigger.style.borderColor = '#94a3b8';
        });

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.picker.open(input);
        });

        wrapper.appendChild(trigger);

        // Sync picker with native input changes
        input.addEventListener('input', () => {
            // Update trigger color indicator if needed
        });
    }

    observeNewInputs() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'INPUT' && node.type === 'color') {
                            this.enhanceInput(node);
                        }
                        node.querySelectorAll?.('input[type="color"]')?.forEach(input => {
                            this.enhanceInput(input);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Initialize
window.colorPickerIntegrator = new ColorPickerIntegrator();
