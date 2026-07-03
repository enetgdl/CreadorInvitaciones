/**
 * EDITOR-FORMS.js - Manejo de Formularios del Editor
 * Métodos para cargar, actualizar y manejar formularios
 */

if (typeof InvitationEditor !== 'undefined') {
    
    /**
     * Cargar valores del formulario
     */
    InvitationEditor.prototype.loadFormValues = function() {
        // General
        this.setInputValue('eventType', this.data.eventType);
        this.setInputValue('eventName', this.data.eventName);
        this.setInputValue('honoredName', this.data.honoredName);
        this.setInputValue('eventDate', this.data.eventDate);
        this.setInputValue('eventTime', this.data.eventTime);
        this.setInputValue('eventLocation', this.data.eventLocation);
        this.setInputValue('eventAddress', this.data.eventAddress);

        // Misa / Ceremonia
        this.setInputValue('massLocation', this.data.massLocation);
        this.setInputValue('enableMassLocation', this.data.enableMassLocation !== false);

        let massTimeVal = this.data.massTime;
        if (!massTimeVal || massTimeVal === '13:00') {
            massTimeVal = '10:00';
            this.data.massTime = massTimeVal;
        }
        this.setInputValue('massTime', massTimeVal);

        this.setInputValue('enableMassTime', this.data.enableMassTime !== false);
        this.setInputValue('massAddress', this.data.massAddress);
        this.setInputValue('enableMassAddress', this.data.enableMassAddress !== false);

        // Diseño
        this.setInputValue('primaryColor', this.data.primaryColor);
        this.setInputValue('secondaryColor', this.data.secondaryColor);
        this.setInputValue('textColor', this.data.textColor);
        this.setInputValue('titleFont', this.data.titleFont);
        this.setInputValue('bodyFont', this.data.bodyFont);
        this.setInputValue('backgroundEffect', this.data.backgroundEffect);
        this.setInputValue('overlayOpacity', this.data.overlayOpacity);

        // Actualizar displays de colores
        this.updateColorDisplay('primaryColor');
        this.updateColorDisplay('secondaryColor');
        this.updateColorDisplay('textColor');

        // Contenido
        this.setInputValue('welcomeMessage', this.data.welcomeMessage);
        this.setInputValue('mainMessage', this.data.mainMessage);
        this.setInputValue('dressCode', this.data.dressCode);
        this.setInputValue('confirmPhone', this.data.confirmPhone);
        this.setInputValue('closingMessage', this.data.closingMessage);
        this.setInputValue('eventHashtag', this.data.eventHashtag);

        // Interactivo
        this.setInputValue('enableCountdown', this.data.enableCountdown);
        this.setInputValue('countdownText', this.data.countdownText);
        this.setInputValue('enableQR', this.data.enableQR);
        this.setInputValue('qrURL', this.data.qrURL);
        this.setInputValue('enableMap', this.data.enableMap);
        this.setInputValue('mapCoords', this.data.mapCoords);
        this.setInputValue('enableRSVP', this.data.enableRSVP);
        this.setInputValue('rsvpURL', this.data.rsvpURL);

        // Multimedia
        this.setInputValue('autoplayMusic', this.data.autoplayMusic);
        this.setInputValue('loopMusic', this.data.loopMusic);

        // Limpieza profunda de UI para Reset/Nueva Invitación
        const fileInputs = ['backgroundImage', 'backgroundVideo', 'honoredPhoto', 'backgroundMusic', 'audioNote'];
        fileInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Limpiar errores de validación visuales
        document.querySelectorAll('.validation-error').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        // Resetear selects que no estén en data
        document.querySelectorAll('select').forEach(sel => {
            if (!this.data[sel.id] && sel.options.length > 0) {
                sel.selectedIndex = 0;
            }
        });

        // Actualizar UI de galería
        if (this.galleryManager && typeof this.galleryManager.renderGallery === 'function') {
            this.galleryManager.renderGallery();
            this.galleryManager.updateControlsVisibility();
        }
    };

    /**
     * Establecer valor de input de forma segura
     */
    InvitationEditor.prototype.setInputValue = function(id, value) {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.type === 'checkbox') {
            el.checked = !!value;
        } else if (el.type === 'color') {
            el.value = value || '#000000';
        } else if (el.tagName === 'SELECT') {
            el.value = value || '';
        } else {
            el.value = value ?? '';
        }
    };

    /**
     * Manejar cambio de campo
     */
    InvitationEditor.prototype.handleFieldChange = function(field, value) {
        if (!field) return;

        // Validación de fecha futura
        if (field === 'eventDate' || field === 'eventTime') {
            const dateVal = field === 'eventDate' ? value : this.data.eventDate;
            const timeVal = field === 'eventTime' ? value : this.data.eventTime;

            if (dateVal) {
                const dateStr = timeVal ? (dateVal + 'T' + timeVal) : (dateVal + 'T00:00');
                const dateObj = new Date(dateStr);
                const now = new Date();

                if (dateObj < now && this.data.enableCountdown) {
                    console.warn('⚠️ Fecha en el pasado detectada');
                }
            }
        }

        // Actualizar datos
        this.data[field] = value;
        this.isDirty = true;

        // Actualizar vista previa
        if (this.preview) {
            this.preview.update(field, value);
        }

        // Registrar en historial (con debounce)
        if (this.historyManager) {
            const now = Date.now();
            if (field !== this._lastHistoryField || now - this._lastHistoryTime > 1000) {
                this.historyManager.saveState(this.data, 'Editar campo: ' + field);
                this._lastHistoryField = field;
                this._lastHistoryTime = now;
            }
        }
    };

    /**
     * Manejar cambio de color
     */
    InvitationEditor.prototype.handleColorChange = function(input) {
        const field = input.id;
        const value = input.value;
        this.handleFieldChange(field, value);
        this.updateColorDisplay(field);
    };

    /**
     * Actualizar display de color
     */
    InvitationEditor.prototype.updateColorDisplay = function(fieldId) {
        const input = document.getElementById(fieldId);
        const display = document.getElementById(fieldId + 'Display');
        if (input && display) {
            display.textContent = input.value;
            display.style.color = input.value;
        }
    };

    /**
     * Manejar cambio de range
     */
    InvitationEditor.prototype.handleRangeChange = function(input) {
        const field = input.id;
        const value = parseFloat(input.value);
        this.handleFieldChange(field, value);

        // Actualizar display del valor
        const display = document.getElementById(field + 'Value');
        if (display) {
            display.textContent = value + (input.id.includes('Opacity') ? '%' : 'px');
        }
    };

    /**
     * Cambiar de tab
     */
    InvitationEditor.prototype.switchTab = function(button) {
        const tabName = button?.dataset?.tab;
        if (!tabName) return;
        const btn = document.querySelector(`.accordion-trigger[data-tab="${tabName}"]`);
        if (!btn) return;
        window.leftAccordion?.open?.(btn);
    };

    /**
     * Configurar selector de temas
     */
    InvitationEditor.prototype.setupThemeSelector = function() {
        const themeGrid = document.getElementById('themeSelector');
        if (!themeGrid) return;

        themeGrid.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-color-option');
            if (!option) return;

            const color = option.dataset.color;
            const secondary = option.dataset.secondary;

            if (color) {
                this.handleFieldChange('primaryColor', color);
                document.getElementById('primaryColor').value = color;
                this.updateColorDisplay('primaryColor');

                if (secondary) {
                    this.handleFieldChange('secondaryColor', secondary);
                    document.getElementById('secondaryColor').value = secondary;
                    this.updateColorDisplay('secondaryColor');
                }

                // Actualizar UI
                themeGrid.querySelectorAll('.theme-color-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            }
        });
    };

    console.log('✅ editor-forms.js cargado correctamente');
}
