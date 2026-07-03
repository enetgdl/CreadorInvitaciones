/**
 * EDITOR-VALIDATION.js - Validación de Formularios
 * Métodos para validar campos y mostrar errores
 */

if (typeof InvitationEditor !== 'undefined') {
    
    /**
     * Validar dinámicamente el estado de campos requeridos
     */
    InvitationEditor.prototype.validateDynamicFields = function() {
        this.validateCountdownVisibility();

        this.validateSingleField({
            checkboxId: 'enableQR',
            inputId: 'qrURL',
            errorMessage: '⚠️ Ingresa una URL para el código QR',
            validationFn: (val) => val && val.trim().length > 0
        });

        this.validateSingleField({
            checkboxId: 'enableMap',
            inputId: 'mapCoords',
            errorMessage: '⚠️ Ingresa coordenadas válidas (latitud, longitud)',
            validationFn: (val) => val && val.trim().length > 0 && val.includes(',')
        });

        this.validateSingleField({
            checkboxId: 'enableRSVP',
            inputId: 'rsvpURL',
            errorMessage: '⚠️ Ingresa la URL del formulario',
            validationFn: (val) => val && val.trim().length > 0
        });
    };

    /**
     * Validar visibilidad del contenedor de cuenta regresiva
     */
    InvitationEditor.prototype.validateCountdownVisibility = function() {
        const container = document.getElementById('countdownContainer');
        const dateInput = document.getElementById('eventDate');

        if (!container) return;

        const isDateValid = this.isValidEventDate(dateInput);

        if (isDateValid) {
            if (container.style.display === 'none' || !container.style.display) {
                container.style.display = 'block';
                container.style.opacity = '0';
                container.style.animation = 'fadeIn 0.3s ease forwards';
                void container.offsetWidth;
                container.style.opacity = '1';
            }
        } else {
            container.style.display = 'none';
            container.style.opacity = '0';
        }
    };

    /**
     * Validar si la fecha del evento es válida
     */
    InvitationEditor.prototype.isValidEventDate = function(dateInput) {
        if (!dateInput) return false;

        const dateValue = dateInput.value;

        if (!dateValue || dateValue === null || dateValue === undefined) {
            return false;
        }

        if (typeof dateValue !== 'string' || dateValue.trim() === '') {
            return false;
        }

        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateFormatRegex.test(dateValue.trim())) {
            return false;
        }

        const dateObj = new Date(dateValue);

        if (isNaN(dateObj.getTime())) {
            return false;
        }

        const [year, month, day] = dateValue.split('-').map(Number);
        if (dateObj.getFullYear() !== year ||
            dateObj.getMonth() !== month - 1 ||
            dateObj.getDate() !== day) {
            return false;
        }

        if (year < 1900 || year > 2100) {
            return false;
        }

        return true;
    };

    /**
     * Helper para validar un campo individual y su checkbox asociado
     */
    InvitationEditor.prototype.validateSingleField = function({ checkboxId, inputId, errorMessage, validationFn }) {
        const checkbox = document.getElementById(checkboxId);
        const input = document.getElementById(inputId);

        if (!checkbox || !input) return;

        const isChecked = checkbox.checked;
        const value = input.value;
        const isValid = validationFn(value);

        let errorEl = input.parentNode.querySelector('.validation-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'validation-error';
            errorEl.setAttribute('role', 'alert');
            input.parentNode.appendChild(errorEl);
        }

        if (isChecked && !isValid) {
            errorEl.textContent = errorMessage;
            errorEl.style.display = 'block';
            input.classList.add('input-error');
            input.setAttribute('aria-invalid', 'true');
        } else {
            errorEl.style.display = 'none';
            input.classList.remove('input-error');
            input.removeAttribute('aria-invalid');
        }
    };

    /**
     * Configurar validación de seguridad para campos de URL
     */
    InvitationEditor.prototype.setupUrlValidation = function() {
        const urlFields = [
            { id: 'qrURL', type: 'url', errorMsg: 'URL inválida para QR' },
            { id: 'rsvpURL', type: 'linkUrl', errorMsg: 'URL inválida para RSVP (solo http/https)' },
            { id: 'mapCoords', type: 'coords', errorMsg: 'Coordenadas inválidas (formato: latitud,longitud)' }
        ];

        urlFields.forEach(({ id, type, errorMsg }) => {
            const input = document.getElementById(id);
            if (!input) return;

            input.addEventListener('blur', (e) => {
                const value = e.target.value.trim();
                
                if (!value) {
                    input.classList.remove('input-error');
                    input.removeAttribute('aria-invalid');
                    this.removeFieldError(input);
                    return;
                }

                let isValid = false;
                switch (type) {
                    case 'url':
                        isValid = Sanitize.sanitizeUrl(value) !== null;
                        break;
                    case 'linkUrl':
                        isValid = Sanitize.sanitizeLinkUrl(value) !== null;
                        break;
                    case 'coords':
                        isValid = Sanitize.sanitizeCoords(value) !== null;
                        break;
                }

                if (!isValid) {
                    input.classList.add('input-error');
                    input.setAttribute('aria-invalid', 'true');
                    this.showFieldError(input, errorMsg);
                    
                    if (typeof Sanitize !== 'undefined') {
                        Sanitize.logSecurityEvent('INVALID_URL', value, `field:${id}`);
                    }
                } else {
                    input.classList.remove('input-error');
                    input.removeAttribute('aria-invalid');
                    this.removeFieldError(input);
                }
            });

            let debounceTimer;
            input.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const value = e.target.value.trim();
                    
                    if (!value) {
                        input.classList.remove('input-error');
                        input.removeAttribute('aria-invalid');
                        this.removeFieldError(input);
                        return;
                    }

                    let isValid = false;
                    switch (type) {
                        case 'url':
                            isValid = Sanitize.sanitizeUrl(value) !== null;
                            break;
                        case 'linkUrl':
                            isValid = Sanitize.sanitizeLinkUrl(value) !== null;
                            break;
                        case 'coords':
                            isValid = Sanitize.sanitizeCoords(value) !== null;
                            break;
                    }

                    if (!isValid) {
                        input.classList.add('input-error');
                        input.setAttribute('aria-invalid', 'true');
                    } else {
                        input.classList.remove('input-error');
                        input.removeAttribute('aria-invalid');
                        this.removeFieldError(input);
                    }
                }, 500);
            });
        });
    };

    /**
     * Mostrar mensaje de error debajo de un campo
     */
    InvitationEditor.prototype.showFieldError = function(input, message) {
        this.removeFieldError(input);
        
        const errorEl = document.createElement('div');
        errorEl.className = 'validation-error';
        errorEl.setAttribute('role', 'alert');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        input.parentNode.appendChild(errorEl);
    };

    /**
     * Remover mensaje de error de un campo
     */
    InvitationEditor.prototype.removeFieldError = function(input) {
        const existingError = input.parentNode.querySelector('.validation-error');
        if (existingError) {
            existingError.remove();
        }
    };

    /**
     * Mostrar modal de confirmación personalizado
     */
    InvitationEditor.prototype.showConfirmModal = function(icon, title, message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            
            overlay.innerHTML = `
                <div class="confirm-modal">
                    <div class="confirm-modal-icon">${icon}</div>
                    <h3 class="confirm-modal-title">${title}</h3>
                    <p class="confirm-modal-message">${message}</p>
                    <div class="confirm-modal-actions">
                        <button class="confirm-modal-btn confirm-modal-btn-cancel" data-action="cancel">
                            Cancelar
                        </button>
                        <button class="confirm-modal-btn confirm-modal-btn-danger" data-action="confirm">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const handleAction = (action) => {
                overlay.remove();
                resolve(action === 'confirm');
            };
            
            overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction('cancel'));
            overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction('confirm'));
            
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyDown);
                    handleAction('cancel');
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleAction('cancel');
                }
            });
            
            setTimeout(() => {
                overlay.querySelector('[data-action="cancel"]').focus();
            }, 100);
        });
    };

    console.log('✅ editor-validation.js cargado correctamente');
}
