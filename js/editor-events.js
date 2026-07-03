/**
 * EDITOR-EVENTS.js - Event Listeners y Atajos de Teclado
 * Métodos para configurar eventos y atajos de teclado
 */

if (typeof InvitationEditor !== 'undefined') {
    
    /**
     * Configurar listeners de eventos
     */
    InvitationEditor.prototype.setupEventListeners = function() {
        // Botones principales
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveManually());
        document.getElementById('previewBtn')?.addEventListener('click', () => this.openFullPreview());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.openExportModal());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshPreview());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

        // Inputs generales
        this.setupInputListeners('general-panel');

        // === LÓGICA DE CAMPOS DE MISA ===
        const eventTypeInput = document.getElementById('eventType');
        if (eventTypeInput) {
            eventTypeInput.addEventListener('change', (e) => {
                const type = e.target.value;
                const shouldEnable = ['xv', 'boda', 'bautizo'].includes(type);

                ['enableMassLocation', 'enableMassTime', 'enableMassAddress'].forEach(id => {
                    const switchInput = document.getElementById(id);
                    if (switchInput) {
                        switchInput.checked = shouldEnable;
                        switchInput.dispatchEvent(new Event('change'));
                    }
                });
            });
        }

        // Controlar habilitación de inputs según switches
        ['enableMassLocation', 'enableMassTime', 'enableMassAddress'].forEach(id => {
            const switchInput = document.getElementById(id);
            if (switchInput) {
                switchInput.addEventListener('change', (e) => {
                    const isEnabled = e.target.checked;
                    let inputId = '';
                    if (id === 'enableMassLocation') inputId = 'massLocation';
                    if (id === 'enableMassTime') inputId = 'massTime';
                    if (id === 'enableMassAddress') inputId = 'massAddress';

                    const inputElement = document.getElementById(inputId);
                    if (inputElement) {
                        inputElement.disabled = !isEnabled;
                    }
                });
            }
        });

        this.setupThemeSelector();
        this.setupInputListeners('design-panel');
        this.setupInputListeners('content-panel');
        this.setupInputListeners('interactive-panel');
        this.setupInputListeners('media-panel');

        // Color pickers
        document.querySelectorAll('.color-input').forEach(input => {
            input.addEventListener('input', (e) => this.handleColorChange(e.target));
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyColorPreset(e.currentTarget));
        });

        // Range inputs
        document.querySelectorAll('.control-range').forEach(input => {
            input.addEventListener('input', (e) => this.handleRangeChange(e.target));
        });

        // File inputs
        document.querySelectorAll('.control-file').forEach(input => {
            input.addEventListener('change', (e) => this.handleFileUpload(e.target));
        });

        // Botones de eliminación de archivos multimedia
        document.querySelectorAll('.btn-delete-media').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const fieldName = btn.getAttribute('data-target');
                if (fieldName) {
                    await this.deleteMedia(fieldName, true);
                }
            });
        });

        // Modal de exportación
        document.getElementById('cancelExport')?.addEventListener('click', () => this.closeExportModal());
        document.getElementById('confirmExport')?.addEventListener('click', () => this.performExport());
        document.querySelector('.modal-close')?.addEventListener('click', () => this.closeExportModal());

        // === VALIDACIÓN DE SEGURIDAD PARA URLS ===
        this.setupUrlValidation();
        
        // === ATAJOS DE TECLADO ===
        this.setupKeyboardShortcuts();
    };

    /**
     * Configurar listeners para inputs de un panel
     */
    InvitationEditor.prototype.setupInputListeners = function(panelId) {
        if (this._boundPanels.has(panelId)) return;
        const panel = document.getElementById(panelId);
        if (!panel) return;
        this._boundPanels.add(panelId);

        panel.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.type === 'file') return;

            const handler = (e) => {
                const field = e.target.id;
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                this.handleFieldChange(field, value);
            };

            const isTextInput = input.tagName === 'TEXTAREA' ||
                (input.tagName === 'INPUT' && ['text', 'number', 'url', 'tel', 'email'].includes(input.type));

            if (isTextInput) {
                input.addEventListener('change', handler);
                input.addEventListener('input', (e) => {
                    const autoPreview = window.settingsManager ? window.settingsManager.get('autoPreviewEnabled') : true;
                    if (autoPreview !== false) {
                        handler(e);
                    }
                });
            } else {
                const eventType = (input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
                input.addEventListener(eventType, handler);
            }
        });
    };

    /**
     * Configurar atajos de teclado
     */
    InvitationEditor.prototype.setupKeyboardShortcuts = function() {
        this.keyboardShortcuts = [
            { keys: 'Ctrl+N', action: 'new', description: 'Nuevo proyecto' },
            { keys: 'Ctrl+O', action: 'open', description: 'Abrir plantilla' },
            { keys: 'Ctrl+S', action: 'save', description: 'Guardar plantilla' },
            { keys: 'Ctrl+Z', action: 'undo', description: 'Deshacer' },
            { keys: 'Ctrl+Y', action: 'redo', description: 'Rehacer' },
            { keys: 'Ctrl+E', action: 'export', description: 'Exportar invitación' },
            { keys: 'Ctrl+P', action: 'preview', description: 'Vista previa externa' },
            { keys: 'F1', action: 'shortcuts', description: 'Mostrar atajos de teclado' },
            { keys: 'Escape', action: 'close', description: 'Cerrar modal/panel' }
        ];

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const key = [];
            if (e.ctrlKey || e.metaKey) key.push('Ctrl');
            if (e.shiftKey) key.push('Shift');
            if (e.altKey) key.push('Alt');
            key.push(e.key);
            
            const keyString = key.join('+');
            
            const shortcut = this.keyboardShortcuts.find(s => 
                s.keys.toLowerCase() === keyString.toLowerCase()
            );
            
            if (shortcut) {
                e.preventDefault();
                this.executeShortcut(shortcut.action);
            }
        });
    };

    /**
     * Ejecutar acción de atajo de teclado
     */
    InvitationEditor.prototype.executeShortcut = function(action) {
        switch (action) {
            case 'new':
                document.getElementById('templateNewBtn')?.click();
                break;
            case 'open':
                document.getElementById('templateOpenBtn')?.click();
                break;
            case 'save':
                document.getElementById('templateSaveBtn')?.click();
                break;
            case 'undo':
                document.getElementById('undoBtn')?.click();
                break;
            case 'redo':
                document.getElementById('redoBtn')?.click();
                break;
            case 'export':
                document.getElementById('exportBtn')?.click();
                break;
            case 'preview':
                document.getElementById('previewBtn')?.click();
                break;
            case 'shortcuts':
                this.showShortcutsModal();
                break;
            case 'close':
                this.closeActiveModal();
                break;
        }
    };

    /**
     * Mostrar modal de atajos de teclado
     */
    InvitationEditor.prototype.showShortcutsModal = function() {
        const overlay = document.createElement('div');
        overlay.className = 'shortcuts-modal-overlay';
        
        const groups = {
            'Archivo': this.keyboardShortcuts.filter(s => ['new', 'open', 'save'].includes(s.action)),
            'Edición': this.keyboardShortcuts.filter(s => ['undo', 'redo'].includes(s.action)),
            'Vista': this.keyboardShortcuts.filter(s => ['export', 'preview'].includes(s.action)),
            'General': this.keyboardShortcuts.filter(s => ['shortcuts', 'close'].includes(s.action))
        };
        
        let shortcutsHTML = '';
        for (const [group, shortcuts] of Object.entries(groups)) {
            shortcutsHTML += `
                <div class="shortcut-group">
                    <div class="shortcut-group-title">${group}</div>
                    ${shortcuts.map(s => `
                        <div class="shortcut-item">
                            <span class="shortcut-description">${s.description}</span>
                            <span class="shortcut-keys">
                                ${s.keys.split('+').map(k => `<kbd>${k}</kbd>`).join('')}
                            </span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        overlay.innerHTML = `
            <div class="shortcuts-modal">
                <h3 class="shortcuts-modal-title">
                    ⌨️ Atajos de Teclado
                </h3>
                <div class="shortcuts-list">
                    ${shortcutsHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeModal = () => overlay.remove();
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handler);
                closeModal();
            }
        });
    };

    /**
     * Cerrar modal o panel activo
     */
    InvitationEditor.prototype.closeActiveModal = function() {
        const confirmModal = document.querySelector('.confirm-modal-overlay');
        if (confirmModal) {
            confirmModal.remove();
            return;
        }
        
        const shortcutsModal = document.querySelector('.shortcuts-modal-overlay');
        if (shortcutsModal) {
            shortcutsModal.remove();
            return;
        }
        
        const sidebar = document.getElementById('rightSidebar');
        if (sidebar && sidebar.classList.contains('is-open')) {
            sidebar.classList.remove('is-open');
            return;
        }
    };

    console.log('✅ editor-events.js cargado correctamente');
}
