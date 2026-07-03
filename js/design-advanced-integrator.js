/**
 * DESIGN-ADVANCED-INTEGRATOR.JS - Integrador de Funcionalidades de Diseño Avanzado
 * Conecta el editor de degradados, texturas y efectos con la interfaz
 */

class DesignAdvancedIntegrator {
    constructor() {
        this.gradientEditor = null;
        this.textureManager = null;
        this.advancedEffects = null;
        this.currentState = {
            gradient: null,
            texture: null,
            effect: null
        };

        this.init();
    }

    /**
     * Inicializar
     */
    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Configurar componentes
     */
    setup() {
        // Inicializar componentes
        this.gradientEditor = new GradientEditor();
        this.textureManager = new TextureManager();

        // Canvas de efectos
        const effectsCanvas = document.getElementById('effects-canvas');
        if (effectsCanvas) {
            this.advancedEffects = new AdvancedEffects(effectsCanvas);
        }

        // Configurar UI
        this.setupGradientUI();
        this.setupTextureUI();
        this.setupEffectsUI();

        // Cargar estado guardado
        this.loadSavedState();
    }

    /**
     * Configurar UI del editor de degradados
     */
    setupGradientUI() {
        // Listener para cambio de Target
        const gradTarget = document.getElementById('gradientTarget');
        if (gradTarget) {
            gradTarget.addEventListener('change', (e) => {
                this.loadGradientForTarget(e.target.value);
            });
        }

        // Selector de tipo
        const typeButtons = document.querySelectorAll('.gradient-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.gradientEditor.setType(type);
                this.updateGradientTypeUI(type);
                this.updateGradientPreview();
            });
        });

        // Control de ángulo
        const angleInput = document.getElementById('gradient-angle');
        const angleValue = document.getElementById('gradient-angle-value');
        if (angleInput && angleValue) {
            angleInput.addEventListener('input', (e) => {
                const angle = parseInt(e.target.value);
                angleValue.textContent = `${angle}°`;
                this.gradientEditor.setAngle(angle);
                this.updateGradientPreview();
            });
        }

        // Botón añadir parada
        const addStopBtn = document.getElementById('gradient-add-stop');
        if (addStopBtn) {
            addStopBtn.addEventListener('click', () => {
                const added = this.gradientEditor.addStop();
                if (added) {
                    this.renderGradientStops();
                    this.updateGradientPreview();
                }
            });
        }

        // Presets
        this.setupGradientPresets();

        // Acciones
        const saveBtn = document.getElementById('gradient-save');
        const resetBtn = document.getElementById('gradient-reset');
        const applyBtn = document.getElementById('gradient-apply');

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveGradient());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetGradient());
        }
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyGradient());
        }

        // Renderizar paradas iniciales
        this.renderGradientStops();
        this.updateGradientPreview();
    }

    /**
     * Configurar presets de degradados
     */
    setupGradientPresets() {
        const presetsContainer = document.getElementById('gradient-presets-gallery');
        if (!presetsContainer) return;

        const presets = this.gradientEditor.getPresets();
        presetsContainer.innerHTML = '';

        Object.entries(presets).forEach(([key, preset]) => {
            const item = document.createElement('div');
            item.className = `gradient-preset-item gradient-${key}`;
            item.dataset.preset = key;

            const name = document.createElement('div');
            name.className = 'gradient-preset-name';
            name.textContent = preset.name;

            item.appendChild(name);

            item.addEventListener('click', () => {
                this.loadGradientPreset(key);

                // Marcar como seleccionado
                document.querySelectorAll('.gradient-preset-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
            });

            presetsContainer.appendChild(item);
        });
    }

    /**
     * Cargar preset de degradado
     */
    loadGradientPreset(presetName) {
        this.gradientEditor.loadPreset(presetName);
        this.renderGradientStops();
        this.updateGradientPreview();
        this.updateGradientTypeUI(this.gradientEditor.currentGradient.type);

        // Actualizar control de ángulo
        const angleInput = document.getElementById('gradient-angle');
        const angleValue = document.getElementById('gradient-angle-value');
        if (angleInput && angleValue) {
            angleInput.value = this.gradientEditor.currentGradient.angle;
            angleValue.textContent = `${this.gradientEditor.currentGradient.angle}°`;
        }
    }

    /**
     * Renderizar paradas de color
     */
    renderGradientStops() {
        const container = document.getElementById('gradient-stops-list');
        if (!container) return;

        const stops = this.gradientEditor.currentGradient.stops;
        container.innerHTML = '';

        stops.forEach((stop, index) => {
            const item = this.createStopElement(stop, index);
            container.appendChild(item);
        });
    }

    /**
     * Crear elemento de parada
     */
    createStopElement(stop, index) {
        const item = document.createElement('div');
        item.className = 'gradient-stop-item';
        item.dataset.index = index;

        // Preview de color
        const colorPreview = document.createElement('div');
        colorPreview.className = 'gradient-stop-color-preview';
        colorPreview.style.backgroundColor = stop.color;
        colorPreview.title = 'Click para cambiar color';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = stop.color;
        colorInput.style.display = 'none';

        colorPreview.addEventListener('click', () => colorInput.click());
        colorInput.addEventListener('change', (e) => {
            this.gradientEditor.updateStop(index, 'color', e.target.value);
            colorPreview.style.backgroundColor = e.target.value;
            this.updateGradientPreview();
        });

        // Control de posición
        const positionControl = document.createElement('div');
        positionControl.className = 'gradient-stop-position';

        const positionRange = document.createElement('input');
        positionRange.type = 'range';
        positionRange.className = 'control-range';
        positionRange.min = '0';
        positionRange.max = '100';
        positionRange.value = stop.position;

        const positionValue = document.createElement('span');
        positionValue.className = 'gradient-stop-position-value';
        positionValue.textContent = `${stop.position}%`;

        positionRange.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            positionValue.textContent = `${value}%`;
            this.gradientEditor.updateStop(index, 'position', value);
            this.updateGradientPreview();
            // Reordenar si es necesario
            this.renderGradientStops();
        });

        positionControl.appendChild(positionRange);
        positionControl.appendChild(positionValue);

        // Control de opacidad
        const opacityControl = document.createElement('div');
        opacityControl.className = 'gradient-stop-opacity';

        const opacityRange = document.createElement('input');
        opacityRange.type = 'range';
        opacityRange.className = 'control-range';
        opacityRange.min = '0';
        opacityRange.max = '1';
        opacityRange.step = '0.1';
        opacityRange.value = stop.opacity || 1;
        opacityRange.title = 'Opacidad';

        opacityRange.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.gradientEditor.updateStop(index, 'opacity', value);
            this.updateGradientPreview();
        });

        opacityControl.appendChild(opacityRange);

        // Botón eliminar
        const removeBtn = document.createElement('button');
        removeBtn.className = 'gradient-stop-remove';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Eliminar parada';
        removeBtn.addEventListener('click', () => {
            const removed = this.gradientEditor.removeStop(index);
            if (removed) {
                this.renderGradientStops();
                this.updateGradientPreview();
            }
        });

        item.appendChild(colorPreview);
        item.appendChild(colorInput);
        item.appendChild(positionControl);
        item.appendChild(opacityControl);
        item.appendChild(removeBtn);

        return item;
    }

    /**
     * Actualizar preview del degradado
     */
    updateGradientPreview() {
        this.gradientEditor.updatePreview();
        this.currentState.gradient = this.gradientEditor.getCurrentGradient();
        this.autoApplyGradientToSelection();
    }

    getSelectedEditorId() {
        return window.visualEditorHost?.selectedId || null;
    }

    isProbablyTextTarget(id) {
        if (!id) return false;
        const s = String(id);
        if (s === 'rsvpButton') return true;
        if (s.endsWith('Title')) return true;
        if (s.endsWith('Name')) return true;
        if (s.endsWith('Message')) return true;
        if (s.toLowerCase().includes('text')) return true;
        if (s.toLowerCase().includes('hashtag')) return true;
        if (s.toLowerCase().includes('date')) return true;
        if (s.toLowerCase().includes('time')) return true;
        if (s.toLowerCase().includes('location')) return true;
        if (s.toLowerCase().includes('address')) return true;
        return false;
    }

    autoApplyGradientToSelection() {
        const id = this.getSelectedEditorId();
        if (!id || !window.visualEditorHost) return;
        const gradient = this.gradientEditor.getCurrentGradient();
        const css = gradient?.css || this.gradientEditor?.generateCSS?.();
        if (!css) return;

        const patch = this.isProbablyTextTarget(id)
            ? { textGradient: css }
            : { fillType: 'gradient', fillGradient: css };

        window.visualEditorHost.updateDesignElement(id, patch, { sendToIframe: true, historyKey: 'gradientAuto' });
        window.visualEditorHost.syncUIFromState();
    }

    /**
     * Actualizar UI de tipo de degradado
     */
    updateGradientTypeUI(type) {
        document.querySelectorAll('.gradient-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // Mostrar/ocultar control de ángulo
        const angleControl = document.querySelector('.gradient-angle-control');
        if (angleControl) {
            angleControl.style.display = type === 'linear' ? 'flex' : 'none';
        }
    }

    /**
     * Guardar degradado personalizado
     */
    saveGradient() {
        const name = prompt('Nombre del degradado:');
        if (name) {
            this.gradientEditor.saveCustomGradient(name);
            alert('Degradado guardado exitosamente');
        }
    }

    /**
     * Resetear degradado
     */
    resetGradient() {
        if (confirm('¿Resetear el degradado a valores por defecto?')) {
            this.gradientEditor.reset();
            this.renderGradientStops();
            this.updateGradientPreview();
            this.updateGradientTypeUI('linear');
        }
    }

    /**
     * Cargar degradado para un target específico
     */
    loadGradientForTarget(target) {
        if (!window.invitationEditor) return;

        let state = null;
        if (target === 'background') {
            state = window.invitationEditor.data.backgroundGradientState;
        } else {
            state = window.invitationEditor.data.elementStyles?.[target]?.gradientState;
        }

        if (state) {
            this.gradientEditor.currentGradient = JSON.parse(JSON.stringify(state));
            this.gradientEditor.updatePreview();
            this.renderGradientStops(); // Actualizar UI de stops
            this.updateGradientTypeUI(state.type);
        } else {
            this.gradientEditor.reset();
            this.renderGradientStops();
            this.updateGradientTypeUI('linear');
        }
    }

    /**
     * Aplicar degradado
     */
    applyGradient() {
        const gradient = this.gradientEditor.getCurrentGradient();

        // Determinar target
        const targetSelect = document.getElementById('gradientTarget');
        const target = targetSelect ? targetSelect.value : 'background';

        const selectedId = this.getSelectedEditorId();
        if (selectedId && window.visualEditorHost) {
            const css = gradient?.css || this.gradientEditor?.generateCSS?.();
            if (css) {
                const patch = this.isProbablyTextTarget(selectedId)
                    ? { textGradient: css }
                    : { fillType: 'gradient', fillGradient: css };
                window.visualEditorHost.updateDesignElement(selectedId, patch, { sendToIframe: true, historyKey: 'gradient' });
                window.visualEditorHost.syncUIFromState();
                window.invitationEditor?.storage?.showNotification?.('Degradado aplicado correctamente', 'success');
                this.saveState();
                return;
            }
        }

        if (window.invitationEditor) {
            const data = window.invitationEditor.data;

            if (target === 'background') {
                window.invitationEditor.handleFieldChange('backgroundEffect', gradient.css);
                data.backgroundGradientState = gradient; // Guardar estado
            } else {
                if (!data.elementStyles) data.elementStyles = {};
                if (!data.elementStyles[target]) data.elementStyles[target] = {}; // Init defaults si falta

                data.elementStyles[target].gradient = gradient.css;
                data.elementStyles[target].gradientState = gradient;

                window.invitationEditor.handleFieldChange('elementStyles', data.elementStyles);
            }
            window.invitationEditor.storage.showNotification('Degradado aplicado correctamente', 'success');
        } else {
            alert('Degradado aplicado (Editor no conectado)');
        }

        this.saveState();
    }

    /**
     * Configurar UI de texturas
     */
    setupTextureUI() {
        // Categorías
        const categories = this.textureManager.getCategories();
        const categoryContainer = document.getElementById('texture-categories');

        if (categoryContainer) {
            categoryContainer.innerHTML = '';

            // Botón "Todas"
            const allBtn = document.createElement('button');
            allBtn.className = 'texture-category-btn active';
            allBtn.textContent = 'Todas';
            allBtn.addEventListener('click', () => {
                this.filterTexturesByCategory(null);
                document.querySelectorAll('.texture-category-btn').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
            });
            categoryContainer.appendChild(allBtn);

            // Botones de categorías
            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'texture-category-btn';
                btn.textContent = this.getCategoryDisplayName(cat);
                btn.dataset.category = cat;
                btn.addEventListener('click', () => {
                    this.filterTexturesByCategory(cat);
                    document.querySelectorAll('.texture-category-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                categoryContainer.appendChild(btn);
            });
        }

        // Galería
        this.renderTextureGallery();

        // Upload
        const uploadBtn = document.getElementById('texture-upload-btn');
        const uploadInput = document.getElementById('texture-upload-input');

        if (uploadBtn && uploadInput) {
            uploadBtn.addEventListener('click', () => uploadInput.click());
            uploadInput.addEventListener('change', (e) => this.handleTextureUpload(e));
        }

        // Propiedades
        this.setupTextureProperties();
    }

    /**
     * Renderizar galería de texturas
     */
    renderTextureGallery(category = null) {
        const gallery = document.getElementById('texture-gallery');
        if (!gallery) return;

        gallery.innerHTML = '';

        const textures = category
            ? this.textureManager.getTexturesByCategory(category)
            : this.textureManager.presetTextures;

        Object.entries(textures).forEach(([key, texture]) => {
            const item = document.createElement('div');
            item.className = 'texture-item';
            item.dataset.texture = key;
            item.style.backgroundImage = `url(${texture.pattern})`;

            const name = document.createElement('div');
            name.className = 'texture-item-name';
            name.textContent = texture.name;

            item.appendChild(name);

            item.addEventListener('click', () => {
                this.selectTexture(key);
                document.querySelectorAll('.texture-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
            });

            gallery.appendChild(item);
        });

        // Texturas personalizadas
        this.textureManager.customTextures.forEach((texture, index) => {
            const item = document.createElement('div');
            item.className = 'texture-item';
            item.dataset.customIndex = index;
            item.style.backgroundImage = `url(${texture.pattern})`;

            const name = document.createElement('div');
            name.className = 'texture-item-name';
            name.textContent = texture.name;

            item.appendChild(name);

            item.addEventListener('click', () => {
                this.selectCustomTexture(index);
                document.querySelectorAll('.texture-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
            });

            gallery.appendChild(item);
        });
    }

    /**
     * Filtrar texturas por categoría
     */
    filterTexturesByCategory(category) {
        this.renderTextureGallery(category);
    }

    /**
     * Obtener nombre de categoría para mostrar
     */
    getCategoryDisplayName(category) {
        const names = {
            textile: 'Tela',
            natural: 'Natural',
            paper: 'Papel',
            stone: 'Piedra',
            pattern: 'Patrones'
        };
        return names[category] || category;
    }

    /**
     * Manejar subida de textura
     */
    async handleTextureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const texture = await this.textureManager.uploadCustomTexture(file);
            this.renderTextureGallery();
            alert('Textura subida exitosamente');
        } catch (error) {
            alert('Error al subir textura: ' + error.message);
        }
    }

    /**
     * Seleccionar textura
     */
    selectTexture(textureName) {
        this.textureManager.applyTexture(textureName);
        this.currentState.texture = this.textureManager.generateCSS();
        this.updateTexturePreview();
        this.saveState();
    }

    /**
     * Seleccionar textura personalizada
     */
    selectCustomTexture(index) {
        const texture = this.textureManager.customTextures[index];
        if (texture) {
            this.textureManager.currentTexture = texture;
            this.currentState.texture = this.textureManager.generateCSS();
            this.updateTexturePreview();
            this.saveState();
        }
    }

    /**
     * Configurar propiedades de textura
     */
    setupTextureProperties() {
        const scaleInput = document.getElementById('texture-scale');
        const opacityInput = document.getElementById('texture-opacity');
        const blendModeSelect = document.getElementById('texture-blend-mode');
        const repeatSelect = document.getElementById('texture-repeat');

        if (scaleInput) {
            scaleInput.addEventListener('input', (e) => {
                this.textureManager.setProperty('scale', parseFloat(e.target.value));
                this.updateTexturePreview();
            });
        }

        if (opacityInput) {
            opacityInput.addEventListener('input', (e) => {
                this.textureManager.setProperty('opacity', parseFloat(e.target.value));
                this.updateTexturePreview();
            });
        }

        if (blendModeSelect) {
            blendModeSelect.addEventListener('change', (e) => {
                this.textureManager.setProperty('blendMode', e.target.value);
                this.updateTexturePreview();
            });
        }

        if (repeatSelect) {
            repeatSelect.addEventListener('change', (e) => {
                this.textureManager.setProperty('repeat', e.target.value);
                this.updateTexturePreview();
            });
        }
    }

    /**
     * Actualizar preview de textura
     */
    updateTexturePreview() {
        this.currentState.texture = this.textureManager.generateCSS();
        this.autoApplyTextureToSelection();
        this.saveState();
    }

    autoApplyTextureToSelection() {
        const id = this.getSelectedEditorId();
        if (!id || !window.visualEditorHost) return;
        const tex = this.textureManager.currentTexture;
        const cfg = this.textureManager.config || {};
        if (!tex || !tex.pattern) return;

        const patch = {
            fillType: 'texture',
            textureDataUrl: tex.pattern,
            textureScale: Number.isFinite(parseFloat(cfg.scale)) ? parseFloat(cfg.scale) : 1,
            textureRepeat: cfg.repeat || 'repeat'
        };

        window.visualEditorHost.updateDesignElement(id, patch, { sendToIframe: true, historyKey: 'textureAuto' });
        window.visualEditorHost.syncUIFromState();
    }

    /**
     * Configurar UI de efectos
     */
    setupEffectsUI() {
        const effects = [
            { id: 'none', name: 'Sin Efecto', icon: '🚫' },
            { id: 'fireworks', name: 'Fuegos Artificiales', icon: '🎆' },
            { id: 'balloons', name: 'Globos', icon: '🎈' },
            { id: 'bubbles', name: 'Burbujas', icon: '🫧' },
            { id: 'rainbow', name: 'Arcoíris', icon: '🌈' },
            { id: 'stars', name: 'Estrellas', icon: '⭐' },
            { id: 'waves', name: 'Ondas', icon: '🌊' },
            { id: 'particles', name: 'Partículas', icon: '✨' },
            { id: 'bokeh', name: 'Bokeh', icon: '⭕' },
            { id: 'confetti', name: 'Confetti', icon: '🎊' },
            { id: 'snow', name: 'Nieve', icon: '❄️' }
        ];

        const effectsGrid = document.getElementById('effects-grid');
        if (!effectsGrid) return;

        effectsGrid.innerHTML = '';

        effects.forEach(effect => {
            const card = document.createElement('div');
            card.className = 'effect-card';
            if (effect.id === 'none') card.classList.add('active'); // Por defecto seleccionado si no hay estado
            card.dataset.effect = effect.id;

            const icon = document.createElement('div');
            icon.className = 'effect-card-icon'; // Nombre actualizado
            icon.textContent = effect.icon;

            const name = document.createElement('div');
            name.className = 'effect-card-name'; // Nombre actualizado
            name.textContent = effect.name;

            card.appendChild(icon);
            card.appendChild(name);

            card.addEventListener('click', () => {
                this.toggleEffect(effect.id, effect.name);

                // Marcar como activo
                document.querySelectorAll('.effect-card').forEach(el => {
                    el.classList.remove('active');
                });
                card.classList.add('active');
            });

            effectsGrid.appendChild(card);
        });
    }

    /**
     * Configurar controles de efectos (eliminada configuración global)
     * Ahora cada efecto tiene su propia configuración
     */
    setupEffectConfig() {
        // Ya no se usa configuración global
        // Los controles se crean dinámicamente al seleccionar un efecto
    }

    /**
     * Toggle efecto
     */
    toggleEffect(effectId, effectName) {
        if (this.advancedEffects) {
            if (effectId === 'none') {
                this.advancedEffects.stop();
                this.currentState.effect = null;
                // Ocultar panel de configuración
                const configPanel = document.getElementById('effect-individual-config');
                if (configPanel) configPanel.style.display = 'none';
            } else {
                this.advancedEffects.start(effectId);
                this.currentState.effect = effectId;
                // Mostrar configuración INDIVIDUAL del efecto
                this.showEffectIndividualConfig(effectId, effectName);
            }
            this.saveState();
        }
    }

    /**
     * Mostrar configuración individual por efecto
     */
    showEffectIndividualConfig(effectId, effectName) {
        const configPanel = document.getElementById('effect-individual-config');
        const effectNameSpan = document.getElementById('current-effect-name');
        const controlsContainer = document.getElementById('effect-controls-container');

        if (!configPanel || !effectNameSpan || !controlsContainer) return;

        // Mostrar panel
        configPanel.style.display = 'block';
        effectNameSpan.textContent = effectName;

        // Limpiar controles anteriores
        controlsContainer.innerHTML = '';

        // Configuraciones específicas por efecto
        const effectsConfig = {
            fireworks: [
                { name: 'Velocidad', type: 'range', min: 0.5, max: 3, value: 1, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 1, max: 10, value: 3, step: 1, key: 'density' }
            ],
            balloons: [
                { name: 'Velocidad', type: 'range', min: 0.1, max: 2, value: 0.5, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 5, max: 20, value: 10, step: 1, key: 'density' }
            ],
            bubbles: [
                { name: 'Velocidad', type: 'range', min: 0.3, max: 2, value: 0.8, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 5, max: 30, value: 15, step: 1, key: 'density' }
            ],
            rainbow: [
                { name: 'Velocidad de ondas', type: 'range', min: 0.1, max: 2, value: 0.3, step: 0.1, key: 'speed' }
            ],
            stars: [
                { name: 'Velocidad', type: 'range', min: 0.5, max: 3, value: 1, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 20, max: 100, value: 50, step: 5, key: 'density' }
            ],
            waves: [
                { name: 'Velocidad', type: 'range', min: 0.1, max: 2, value: 0.5, step: 0.1, key: 'speed' },
                { name: 'Amplitud', type: 'range', min: 10, max: 80, value: 30, step: 5, key: 'amplitude' }
            ],
            particles: [
                { name: 'Velocidad', type: 'range', min: 0.5, max: 3, value: 1, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 10, max: 50, value: 20, step: 5, key: 'density' }
            ],
            bokeh: [
                { name: 'Velocidad', type: 'range', min: 0.1, max: 1, value: 0.3, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 5, max: 20, value: 10, step: 1, key: 'density' }
            ],
            confetti: [
                { name: 'Velocidad', type: 'range', min: 0.5, max: 3, value: 1, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 10, max: 50, value: 30, step: 5, key: 'density' }
            ],
            snow: [
                { name: 'Velocidad', type: 'range', min: 0.2, max: 2, value: 0.5, step: 0.1, key: 'speed' },
                { name: 'Cantidad', type: 'range', min: 20, max: 100, value: 50, step: 5, key: 'density' }
            ]
        };

        // Crear controles dinámicamente
        const config = effectsConfig[effectId] || [];
        config.forEach(control => {
            const item = this.createEffectControl(control, effectId);
            controlsContainer.appendChild(item);
        });
    }

    /**
     * Crear control individual para efecto
     */
    createEffectControl(control, effectId) {
        const item = document.createElement('div');
        item.className = 'effect-control-item';

        const label = document.createElement('div');
        label.className = 'effect-control-label';
        label.innerHTML = `
            <span>${control.name}</span>
            <span class="effect-control-value" id="${effectId}-${control.key}-value">${control.value}</span>
        `;

        const input = document.createElement('input');
        input.type = 'range';
        input.min = control.min;
        input.max = control.max;
        input.value = control.value;
        input.step = control.step;
        input.className = 'control-range effect-control-input';

        input.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById(`${effectId}-${control.key}-value`).textContent = control.step < 1 ? value.toFixed(1) : value;
            this.updateIndividualEffectParameter(effectId, control.key, value);
        });

        item.appendChild(label);
        item.appendChild(input);
        return item;
    }

    /**
     * Actualizar parámetro individual de efecto
     */
    updateIndividualEffectParameter(effectId, paramKey, value) {
        if (this.advancedEffects && this.currentState.effect === effectId) {
            const config = {};
            config[paramKey] = value;

            // Reiniciar efecto con nueva configuración
            this.advancedEffects.stop();
            this.advancedEffects.start(effectId, config);
        }
    }

    /**
     * Actualizar configuración de efecto (LEGACY - ahora se usa updateIndividualEffectParameter)
     */
    updateEffectConfig(config) {
        if (this.advancedEffects && this.currentState.effect) {
            this.advancedEffects.stop();
            this.advancedEffects.start(this.currentState.effect, config);
        }
    }

    /**
     * Guardar estado
     */
    saveState() {
        localStorage.setItem('designAdvancedState', JSON.stringify(this.currentState));
    }

    /**
     * Cargar estado guardado
     */
    loadSavedState() {
        try {
            const saved = localStorage.getItem('designAdvancedState');
            if (saved) {
                this.currentState = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('No se pudo cargar el estado guardado:', e);
        }
    }
}

// Inicializar cuando esté listo
let designAdvancedIntegrator = null;

document.addEventListener('DOMContentLoaded', () => {
    designAdvancedIntegrator = new DesignAdvancedIntegrator();
    window.designAdvancedIntegrator = designAdvancedIntegrator;
});

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DesignAdvancedIntegrator;
}
