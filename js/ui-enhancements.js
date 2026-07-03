/**
 * UI-ENHANCEMENTS.JS - Mejoras de UI  
 * Maneja switches de visibilidad, preview de fuentes y modo de vista
 */

class UIEnhancements {
    constructor() {
        this.visibilityStates = {};
        this.viewMode = 'mobile'; // 'mobile' o 'desktop'
        this.fontPreviewEnabled = true; // Controlado por settings-manager
        this.init();
    }

    /**
     * Inicializar mejoras de UI
     */
    init() {
        this.loadVisibilityStates();
        this.setupFieldVisibilitySwitches();
        this.setupFontPreviews();
    }

    /**
     * Cargar estados de visibilidad desde localStorage
     */
    loadVisibilityStates() {
        const saved = localStorage.getItem('fieldVisibility');
        this.visibilityStates = saved ? JSON.parse(saved) : {
            eventType: true,
            eventName: true,
            honoredName: true,
            eventDate: true,
            eventTime: true,
            eventLocation: true,
            eventAddress: true
        };
    }

    /**
     * Guardar estados de visibilidad
     */
    saveVisibilityStates() {
        localStorage.setItem('fieldVisibility', JSON.stringify(this.visibilityStates));
    }

    /**
     * Configurar selector de modo de vista (Desktop/Mobile)
     */
    setupViewModeSelector() {
        const previewHeader = document.querySelector('.preview-header');
        if (!previewHeader) return;

        // Crear selector de modo
        const modeSelector = document.createElement('div');
        modeSelector.className = 'view-mode-selector';
        modeSelector.innerHTML = `
            <button class="mode-btn ${this.viewMode === 'desktop' ? 'active' : ''}" data-mode="desktop">
                <span class="mode-icon">💻</span>
                <span>Escritorio</span>
            </button>
            <button class="mode-btn ${this.viewMode === 'mobile' ? 'active' : ''}" data-mode="mobile">
                <span class="mode-icon">📱</span>
                <span>Celular</span>
            </button>
        `;

        // Insertar antes de los controles existentes
        const controls = previewHeader.querySelector('.preview-controls');
        if (controls) {
            previewHeader.insertBefore(modeSelector, controls);
        }

        // Event listeners
        modeSelector.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchViewMode(mode);
            });
        });
    }

    /**
     * Cambiar modo de vista
     */
    switchViewMode(mode) {
        this.viewMode = mode;

        // Actualizar botones activos
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Actualizar frame de vista previa
        const deviceScreen = document.querySelector('.device-screen');
        if (deviceScreen) {
            deviceScreen.classList.remove('desktop-mode', 'mobile-mode');
            deviceScreen.classList.add(`${mode}-mode`);
        }

        // Guardar preferencia
        localStorage.setItem('viewMode', mode);
    }

    /**
     * Configurar switches de visibilidad de campos
     */
    setupFieldVisibilitySwitches() {
        const fields = [
            { id: 'eventType', label: 'Tipo de Evento' },
            { id: 'eventName', label: 'Nombre del Evento' },
            { id: 'honoredName', label: 'Nombre de(los) Festejado(s)' },
            { id: 'eventDate', label: 'Fecha del Evento' },
            { id: 'eventTime', label: 'Hora del Evento' },
            { id: 'eventLocation', label: 'Lugar del Evento' },
            { id: 'eventAddress', label: 'Dirección' }
        ];

        fields.forEach(field => {
            this.addVisibilitySwitch(field.id, field.label);
        });
    }

    /**
     * Agregar switch de visibilidad a un campo
     */
    addVisibilitySwitch(fieldId, label) {
        const controlGroup = document.getElementById(fieldId)?.closest('.control-group');
        if (!controlGroup) return;

        const existingLabel = controlGroup.querySelector('.control-label');
        if (!existingLabel) return;

        // Crear header con switch
        const fieldHeader = document.createElement('div');
        fieldHeader.className = 'field-header';

        const labelText = document.createElement('label');
        labelText.className = 'control-label';
        labelText.textContent = label;

        const toggleSwitch = document.createElement('label');
        toggleSwitch.className = 'toggle-switch';
        toggleSwitch.title = `Mostrar/Ocultar ${label}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.visibilityStates[fieldId] !== false;
        checkbox.dataset.field = fieldId;

        const slider = document.createElement('span');
        slider.className = 'toggle-slider';

        toggleSwitch.appendChild(checkbox);
        toggleSwitch.appendChild(slider);

        fieldHeader.appendChild(labelText);
        fieldHeader.appendChild(toggleSwitch);

        // Reemplazar label existente
        existingLabel.replaceWith(fieldHeader);

        // Event listener
        checkbox.addEventListener('change', (e) => {
            this.toggleFieldVisibility(fieldId, e.target.checked);
        });

        // Aplicar estado inicial
        this.updateFieldVisibility(fieldId, checkbox.checked);
    }

    /**
     * Toggle de visibilidad de campo
     */
    toggleFieldVisibility(fieldId, visible) {
        this.visibilityStates[fieldId] = visible;
        this.updateFieldVisibility(fieldId, visible);
        this.saveVisibilityStates();

        // Notificar cambio al editor
        if (window.invitationEditor && window.invitationEditor.preview) {
            window.invitationEditor.preview.forceUpdate();
        }
    }

    /**
     * Actualizar visibilidad visual del campo
     */
    updateFieldVisibility(fieldId, visible) {
        const controlGroup = document.getElementById(fieldId)?.closest('.control-group');
        if (!controlGroup) return;

        if (visible) {
            controlGroup.classList.remove('field-disabled');
        } else {
            controlGroup.classList.add('field-disabled');
        }
    }

    /**
     * Obtener estado de visibilidad de un campo
     */
    isFieldVisible(fieldId) {
        return this.visibilityStates[fieldId] !== false;
    }

    /**
     * Configurar previews de fuentes
     */
    setupFontPreviews() {
        const titleFont = document.getElementById('titleFont');
        const bodyFont = document.getElementById('bodyFont');

        if (titleFont) this.setupFontPreview(titleFont, 'Título de Ejemplo');
        if (bodyFont) this.setupFontPreview(bodyFont, 'Texto de ejemplo para lectura');
    }

    /**
     * Configurar preview para un selector de fuente
     */
    setupFontPreview(selectElement, sampleText) {
        const container = selectElement.parentElement;

        // Envolver en container si no existe
        if (!container.classList.contains('font-select-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'font-select-container';
            selectElement.parentNode.insertBefore(wrapper, selectElement);
            wrapper.appendChild(selectElement);
        }

        // Crear el tooltip si no existe
        if (!document.getElementById('font-preview-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.id = 'font-preview-tooltip';
            tooltip.className = 'font-preview-tooltip';
            tooltip.innerHTML = `
                <div class="font-preview-text" id="font-preview-text"></div>
                <div class="font-preview-size-row">
                    <input class="font-preview-size" id="font-preview-size" type="range" min="10" max="72" step="1" value="24" />
                    <div class="font-preview-size-value" id="font-preview-size-value">24pt</div>
                </div>
            `;
            document.body.appendChild(tooltip);
        }

        const pollState = { timer: 0, lastValue: null, lastIndex: -1 };

        const startPolling = () => {
            if (pollState.timer) return;
            pollState.lastValue = selectElement.value;
            pollState.lastIndex = selectElement.selectedIndex;
            pollState.timer = setInterval(() => {
                if (document.activeElement !== selectElement) return;
                const v = selectElement.value;
                const idx = selectElement.selectedIndex;
                if (v !== pollState.lastValue || idx !== pollState.lastIndex) {
                    pollState.lastValue = v;
                    pollState.lastIndex = idx;
                    const selectedOption = selectElement.options[idx];
                    const optionText = selectedOption ? selectedOption.textContent : sampleText;
                    this.showPreview(v, optionText, selectElement);
                }
            }, 80);
        };

        const stopPolling = () => {
            if (!pollState.timer) return;
            clearInterval(pollState.timer);
            pollState.timer = 0;
        };

        // Mostrar preview de la fuente actual al hacer click/focus
        selectElement.addEventListener('focus', () => {
            const currentValue = selectElement.value;
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const optionText = selectedOption ? selectedOption.textContent : sampleText;
            this.showPreview(currentValue, optionText, selectElement);
            startPolling();
        });

        // Actualizar preview al navegar con teclado (flechas arriba/abajo)
        selectElement.addEventListener('keydown', (e) => {
            // Detectar si es una tecla de navegación
            if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
                setTimeout(() => {
                    const currentValue = selectElement.value;
                    const selectedOption = selectElement.options[selectElement.selectedIndex];
                    const optionText = selectedOption ? selectedOption.textContent : sampleText;
                    this.showPreview(currentValue, optionText, selectElement);
                }, 10);
            }
        });

        // Actualizar preview en tiempo real cuando el navegador emite input (algunos navegadores lo disparan al navegar opciones)
        selectElement.addEventListener('input', (e) => {
            const fontValue = e.target.value;
            const selectedOption = e.target.options[e.target.selectedIndex];
            const optionText = selectedOption ? selectedOption.textContent : sampleText;
            this.showPreview(fontValue, optionText, selectElement);
        });

        // Preview al cambiar (click en una opción)
        selectElement.addEventListener('change', (e) => {
            const fontValue = e.target.value;
            const selectedOption = e.target.options[e.target.selectedIndex];
            const optionText = selectedOption ? selectedOption.textContent : sampleText;
            this.showPreview(fontValue, optionText, selectElement);

            // Mantener preview visible por 2 segundos
            setTimeout(() => this.hidePreview(), 2000);
        });

        // Ocultar al perder focus
        selectElement.addEventListener('blur', () => {
            stopPolling();
            setTimeout(() => {
                if (this.isFontPreviewPinned) return;
                this.hidePreview();
            }, 120);
        });
    }

    /**
     * Mostrar preview de fuente
     */
    showPreview(fontValue, sampleText, anchorEl) {
        // Verificar si el preview está habilitado
        if (!this.fontPreviewEnabled) {
            return;
        }

        let preview = document.getElementById('font-preview-tooltip');

        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'font-preview-tooltip';
            preview.className = 'font-preview-tooltip';
            preview.innerHTML = `
                <div class="font-preview-text" id="font-preview-text"></div>
                <div class="font-preview-size-row">
                    <input class="font-preview-size" id="font-preview-size" type="range" min="10" max="72" step="1" value="24" />
                    <div class="font-preview-size-value" id="font-preview-size-value">24pt</div>
                </div>
            `;
            document.body.appendChild(preview);
        }

        const previewTextEl = preview.querySelector('#font-preview-text');
        const sizeInput = preview.querySelector('#font-preview-size');
        const sizeValue = preview.querySelector('#font-preview-size-value');

        this.fontPreviewAnchorEl = anchorEl || this.fontPreviewAnchorEl || null;

        if (!preview.dataset.bound) {
            preview.dataset.bound = 'true';
            preview.addEventListener('pointerenter', () => { this.isFontPreviewPinned = true; });
            preview.addEventListener('pointerleave', () => {
                this.isFontPreviewPinned = false;
                if (document.activeElement !== this.fontPreviewAnchorEl) this.hidePreview();
            });
            const scheduleReposition = () => {
                if (this.fontPreviewRaf) return;
                this.fontPreviewRaf = requestAnimationFrame(() => {
                    this.fontPreviewRaf = 0;
                    this.positionFontPreview(this.fontPreviewAnchorEl);
                });
            };
            window.addEventListener('resize', scheduleReposition, { passive: true });
            window.addEventListener('scroll', scheduleReposition, { passive: true, capture: true });
            sizeInput?.addEventListener('input', () => {
                const v = parseInt(sizeInput.value || '24', 10);
                if (Number.isFinite(v)) {
                    preview.dataset.size = String(v);
                    if (sizeValue) sizeValue.textContent = `${v}pt`;
                    if (previewTextEl) previewTextEl.style.fontSize = `${v}pt`;
                    this.positionFontPreview(this.fontPreviewAnchorEl);
                }
            });
        }

        // Debouncing para optimizar rendimiento
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }

        this.previewTimeout = setTimeout(() => {
            const size = Number.isFinite(parseInt(preview.dataset.size || '24', 10)) ? parseInt(preview.dataset.size || '24', 10) : 24;
            if (sizeInput) sizeInput.value = String(size);
            if (sizeValue) sizeValue.textContent = `${size}pt`;

            if (previewTextEl) {
                previewTextEl.style.fontFamily = fontValue;
                previewTextEl.style.fontSize = `${size}pt`;
                previewTextEl.textContent = sampleText;
            }
            preview.classList.add('visible');
            this.positionFontPreview(this.fontPreviewAnchorEl);
        }, 50); // Delay mínimo para reducir actualizaciones frecuentes
    }

    positionFontPreview(anchorEl) {
        const preview = document.getElementById('font-preview-tooltip');
        if (!preview || !preview.classList.contains('visible')) return;
        if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return;

        const rect = anchorEl.getBoundingClientRect();
        const width = Math.max(120, Math.round(rect.width));

        preview.style.width = `${width}px`;

        const leftPreferred = Math.round(rect.left);
        const left = Math.min(Math.max(0, leftPreferred), Math.max(0, window.innerWidth - width));

        preview.style.left = `${left}px`;
        preview.style.top = `${Math.round(rect.bottom + 5)}px`;

        const height = preview.offsetHeight || 0;
        const belowTop = rect.bottom + 5;
        const belowBottom = belowTop + height;

        if (belowBottom > window.innerHeight) {
            const aboveTop = rect.top - 5 - height;
            if (aboveTop >= 0) {
                preview.style.top = `${Math.round(aboveTop)}px`;
            } else {
                preview.style.top = `${Math.max(0, Math.round(window.innerHeight - height))}px`;
            }
        }
    }

    /**
     * Ocultar preview de fuente
     */
    hidePreview() {
        const preview = document.getElementById('font-preview-tooltip');
        if (preview) {
            preview.classList.remove('visible');
        }

        // Limpiar timeout si existe
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = null;
        }
    }

    /**
     * Obtener todos los estados de visibilidad
     */
    getVisibilityStates() {
        return { ...this.visibilityStates };
    }
}

// Inicializar cuando el DOM esté listo
let uiEnhancements = null;

document.addEventListener('DOMContentLoaded', () => {
    uiEnhancements = new UIEnhancements();

    // Hacer disponible globalmente
    window.uiEnhancements = uiEnhancements;

    // Cargar modo de vista guardado
    const savedMode = localStorage.getItem('viewMode');
    if (savedMode) {
        uiEnhancements.switchViewMode(savedMode);
    }
});

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEnhancements;
}
