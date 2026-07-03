/**
 * SETTINGS-MANAGER.JS - Gestor de Configuración del Sistema
 * Controla preferencias de usuario, autoguardado, integraciones y optimizaciones
 */

class SettingsManager {
    constructor() {
        this.settings = {
            fontPreviewEnabled: true,
            autoPreviewEnabled: true,
            autoSaveInterval: 5, // en segundos
            lastSaved: null,
            googleMapsApiKey: '' // Nueva configuración para integración
        };

        this.autoSaveTimer = null;
        this.modal = null;

        // Intervalos disponibles
        this.availableIntervals = {
            5: '5 segundos',
            10: '10 segundos',
            30: '30 segundos',
            60: '1 minuto',
            300: '5 minutos',
            600: '10 minutos',
            900: '15 minutos'
        };

        this.init();
    }

    /**
     * Obtener un valor de configuración
     * @param {string} key - Clave de configuración
     * @returns {*} Valor de la configuración
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Establecer un valor de configuración
     * @param {string} key - Clave de configuración
     * @param {*} value - Nuevo valor
     */
    set(key, value) {
        this.settings[key] = value;
    }

    init() {
        this.loadSettings();
        this.injectStyles();
        this.createModal(); // Pre-crear modal o esperar a click
        this.setupEventListeners();
        this.applySettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('editorSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            console.warn('No se pudo cargar la configuración:', e);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('editorSettings', JSON.stringify(this.settings));
            this.showNotification('Configuración guardada', 'success');

            // Notificar cambios globales
            window.dispatchEvent(new CustomEvent('settingsChanged', { detail: this.settings }));

        } catch (e) {
            console.error('Error al guardar configuración:', e);
            this.showNotification('Error al guardar configuración', 'error');
        }
    }

    injectStyles() {
        if (document.getElementById('settings-styles')) return;
        const style = document.createElement('style');
        style.id = 'settings-styles';
        style.textContent = `
            .settings-modal-content { 
                max-width: 900px !important; width: 95% !important; 
                display: flex; flex-direction: column; overflow: hidden;
                background: var(--bg-secondary, #1E293B); 
                color: var(--text-primary, #F1F5F9);
                border: 1px solid var(--border-color, #334155);
                box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.5));
            }
            .settings-modal-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 1.5rem; border-bottom: 1px solid var(--border-color, #334155);
                background: var(--bg-secondary, #1E293B);
            }
            .settings-modal-title { margin: 0; font-size: 1.25rem; font-weight: 600; color: var(--text-primary, #F1F5F9); }
            .settings-modal-close { 
                background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted, #94A3B8); 
                padding: 0; line-height: 1; 
            }
            .settings-modal-close:hover { color: var(--text-primary, #F1F5F9); }
            
            .settings-body-layout { display: flex; height: 500px; border-top: none; border-bottom: none; }
            
            .settings-sidebar { 
                width: 240px; 
                background: var(--bg-secondary, #1E293B); 
                border-right: 1px solid var(--border-color, #334155); 
                padding: 1rem 0; 
                display: flex; flex-direction: column; 
                flex-shrink: 0; 
            }
            
            .settings-tab-btn { 
                padding: 12px 20px; text-align: left; background: none; border: none; cursor: pointer; 
                font-size: 0.95rem; color: var(--text-secondary, #CBD5E1); transition: all 0.2s; 
                border-left: 3px solid transparent; width: 100%; display: flex; align-items: center; gap: 10px;
            }
            .settings-tab-btn:hover { background: var(--bg-tertiary, #334155); color: var(--text-primary, #F1F5F9); }
            .settings-tab-btn.active { 
                background: var(--bg-tertiary, #334155); 
                color: var(--primary-color, #8B5CF6); 
                border-left-color: var(--primary-color, #8B5CF6); 
                font-weight: 600; 
            }
            
            .settings-content-area { 
                flex: 1; padding: 2rem; 
                background: var(--bg-primary, #0F172A); 
                overflow-y: auto; 
            }
            
            .settings-tab-pane { display: none; margin-bottom: 2rem; }
            .settings-tab-pane.active { display: block; animation: fadeIn 0.3s ease-out; }
            
            .settings-section-title { 
                font-size: 1.1rem; margin-bottom: 1.5rem; 
                color: var(--text-primary, #F1F5F9); 
                border-bottom: 1px solid var(--border-color, #334155); padding-bottom: 0.5rem; 
            }
            
            .settings-input-group { margin-bottom: 1.5rem; }
            .settings-input-label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem; color: var(--text-secondary, #CBD5E1); }
            .settings-input-control { 
                width: 100%; padding: 10px; 
                background: var(--bg-tertiary, #334155); 
                color: var(--text-primary, #F1F5F9); 
                border: 1px solid var(--border-color, #334155); 
                border-radius: 6px; font-size: 1rem; transition: border 0.3s; 
            }
            .settings-input-control:focus { border-color: var(--primary-color, #8B5CF6); outline: none; }
            .settings-hint { font-size: 0.85rem; color: var(--text-muted, #94A3B8); margin-top: 0.4rem; display: block; }
            
            .settings-control { 
                background: var(--bg-tertiary, #334155); 
                padding: 1rem; border-radius: 8px; margin-bottom: 1rem; 
                border: 1px solid var(--border-color, #334155); 
            }
            .settings-control-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
            .settings-control-label { font-weight: 500; color: var(--text-primary, #F1F5F9); }
            .settings-control-hint { font-size: 0.85rem; color: var(--text-muted, #94A3B8); margin: 0; }
            
            .settings-modal-footer {
                padding: 1.5rem; background: var(--bg-secondary, #1E293B); 
                border-top: 1px solid var(--border-color, #334155);
                display: flex; justify-content: flex-end; gap: 1rem;
            }
            .settings-btn { padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; }
            .settings-btn-secondary { background: var(--bg-tertiary, #334155); color: var(--text-primary, #F1F5F9); }
            .settings-btn-secondary:hover { background: #475569; }
            .settings-btn-primary { background: var(--primary-color, #8B5CF6); color: white; }
            .settings-btn-primary:hover { background: var(--primary-dark, #7C3AED); }
            
            .settings-link-btn {
                display: inline-flex; align-items: center; gap: 8px;
                text-decoration: none; color: var(--primary-color, #8B5CF6);
                font-weight: 500; font-size: 0.9rem; margin-top: 0.5rem;
                padding: 8px 12px; background: rgba(139, 92, 246, 0.1); border-radius: 4px;
                transition: background 0.2s; border: 1px solid rgba(139, 92, 246, 0.2);
            }
            .settings-link-btn:hover { background: rgba(139, 92, 246, 0.25); }
            
            .settings-details { margin-top: 1.5rem; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; }
            .settings-details summary { 
                padding: 12px 15px; cursor: pointer; background: var(--bg-tertiary); 
                font-weight: 500; user-select: none; color: var(--text-primary);
                list-style: none; display: flex; align-items: center; justify-content: space-between;
            }
            .settings-details summary::-webkit-details-marker { display: none; }
            .settings-details summary::after { content: '+'; font-weight: bold; font-size: 1.2rem; }
            .settings-details[open] summary::after { content: '−'; }
            
            .settings-details-content { padding: 15px 20px; background: var(--bg-secondary); font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); }
            .settings-details-content ol { padding-left: 20px; margin: 0; }
            .settings-details-content li { margin-bottom: 10px; }
            .settings-details-content strong { color: var(--text-primary); }
            
            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

            /* Toggle Switch Styles */
            .settings-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
                flex-shrink: 0;
            }
            .settings-toggle input { 
                opacity: 0;
                width: 0;
                height: 0;
            }
            .settings-toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: var(--bg-tertiary, #334155);
                transition: .3s;
                border-radius: 34px;
                border: 1px solid var(--border-color, #475569);
            }
            .settings-toggle-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 2px;
                bottom: 2px;
                background-color: var(--text-secondary, #94A3B8);
                transition: .3s;
                border-radius: 50%;
            }
            .settings-toggle input:checked + .settings-toggle-slider {
                background-color: var(--primary-color, #8B5CF6);
                border-color: var(--primary-color, #8B5CF6);
            }
            .settings-toggle input:checked + .settings-toggle-slider:before {
                transform: translateX(24px);
                background-color: white;
            }
            .settings-toggle input:focus + .settings-toggle-slider {
                box-shadow: 0 0 1px var(--primary-color, #8B5CF6);
            }

            /* Notification Styles */
            .settings-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background: var(--bg-secondary, #1E293B);
                color: var(--text-primary, #F1F5F9);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border-left: 4px solid var(--primary-color, #8B5CF6);
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                z-index: 10000;
                font-size: 0.95rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .settings-notification.active {
                transform: translateY(0);
                opacity: 1;
            }
            .settings-notification-success { border-left-color: var(--success-color, #10B981); }
            .settings-notification-error { border-left-color: var(--danger-color, #EF4444); }
        `;
        document.head.appendChild(style);
    }

    createModal() {
        if (document.getElementById('settingsModal')) {
            this.modal = document.getElementById('settingsModal');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="settings-modal-overlay"></div>
            <div class="settings-modal-content">
                <div class="settings-modal-header">
                    <h2 class="settings-modal-title">⚙️ Configuración del Sistema</h2>
                    <button class="settings-modal-close" id="settingsCloseIcon">&times;</button>
                </div>
                
                <div class="settings-body-layout">
                    <!-- Sidebar de Pestañas -->
                    <div class="settings-sidebar">
                        <button class="settings-tab-btn active" data-tab="general">
                            <span>🛠️</span> General
                        </button>
                        <button class="settings-tab-btn" data-tab="integrations">
                            <span>🔌</span> Integraciones
                        </button>
                        <button class="settings-tab-btn" data-tab="system">
                            <span>🖥️</span> Sistema
                        </button>
                    </div>

                    <!-- Área de Contenido -->
                    <div class="settings-content-area">
                        
                        <!-- TAB: GENERAL -->
                        <div id="tab-general" class="settings-tab-pane active">
                            <h3 class="settings-section-title">Autoguardado y Vista Previa</h3>
                            
                            <!-- Font Preview Toggle -->
                            <div class="settings-control">
                                <div class="settings-control-header">
                                    <label class="settings-control-label">Previsualización de fuentes</label>
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="fontPreviewToggle" ${this.settings.fontPreviewEnabled ? 'checked' : ''}>
                                        <span class="settings-toggle-slider"></span>
                                    </label>
                                </div>
                                <p class="settings-control-hint">Muestra vista previa real de las fuentes en los selectores.</p>
                            </div>

                            <!-- Auto Preview Toggle -->
                            <div class="settings-control">
                                <div class="settings-control-header">
                                    <label class="settings-control-label">Actualización instantánea</label>
                                    <label class="settings-toggle">
                                        <input type="checkbox" id="autoPreviewToggle" ${this.settings.autoPreviewEnabled ? 'checked' : ''}>
                                        <span class="settings-toggle-slider"></span>
                                    </label>
                                </div>
                                <p class="settings-control-hint">Actualiza el diseño mientras escribes.</p>
                            </div>

                            <!-- Auto Save Slider -->
                            <div class="settings-section">
                                <label class="settings-input-label">Frecuencia de Autoguardado: <span id="autoSaveValueDisplay">${this.availableIntervals[this.settings.autoSaveInterval]}</span></label>
                                <input type="range" id="autoSaveSlider" class="settings-slider" min="0" max="6" step="1" style="width: 100%;">
                                <div class="settings-slider-labels">
                                    <small>5s</small><small>15m</small>
                                </div>
                            </div>
                        </div>

                        <!-- TAB: INTEGRACIONES -->
                        <div id="tab-integrations" class="settings-tab-pane">
                            <h3 class="settings-section-title">Servicios Externos</h3>
                            
                            <div class="settings-input-group">
                                <label class="settings-input-label">Google Maps API Key</label>
                                <input type="text" id="googleApiKeyInput" class="settings-input-control" 
                                       placeholder="Pegue aquí su API Key (AIza...)" 
                                       value="${this.settings.googleMapsApiKey || ''}">
                                
                                <div style="margin-top: 15px; margin-bottom: 20px;">
                                    <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" class="settings-link-btn" title="Ir a Google Cloud Platform">
                                        <span style="font-size: 1.2em;">🔑</span> Obtener API Key de Google Maps 
                                        <span style="font-size: 0.8em; margin-left: 4px;">↗</span>
                                    </a>
                                </div>

                                <details class="settings-details">
                                    <summary>Instrucciones de configuración paso a paso</summary>
                                    <div class="settings-details-content">
                                        <ol>
                                            <li><strong>Crear Proyecto:</strong> Acceda a Google Cloud Console y cree un nuevo proyecto para su invitación.</li>
                                            <li><strong>Habilitar APIs:</strong> En "APIs y servicios" &gt; "Biblioteca", busque y habilite estas 3 APIs:
                                                <ul style="margin: 8px 0; padding-left: 20px; color: var(--text-primary);">
                                                    <li>Maps JavaScript API</li>
                                                    <li>Places API</li>
                                                    <li>Geocoding API</li>
                                                </ul>
                                            </li>
                                            <li><strong>Generar Credenciales:</strong> Vaya a "Credenciales" &gt; "Crear credenciales" &gt; "Clave de API".</li>
                                            <li><strong>Configurar Restricciones:</strong> (Importante) Edite la clave creada y en "Restricciones de aplicaciones" seleccione "Referencia HTTP". Añada su dominio (ej: <code>localhost/*</code> o <code>midominio.com/*</code>) para prevenir uso no autorizado.</li>
                                            <li><strong>Copiar y Pegar:</strong> Copie la clave (comienza con 'AIza') y péguela en el campo de arriba. Guarde los cambios.</li>
                                        </ol>
                                        <p style="margin-top: 15px; font-size: 0.85rem; color: var(--success-color, #10B981); border-top: 1px solid var(--border-color); padding-top: 10px;">
                                            💡 Una vez configurada, la búsqueda de mapas funcionará automáticamente.
                                        </p>
                                    </div>
                                </details>
                            </div>
                        </div>

                        <!-- TAB: SISTEMA -->
                        <div id="tab-system" class="settings-tab-pane">
                            <h3 class="settings-section-title">Estado y Mantenimiento</h3>
                            
                            <div class="settings-performance-info">
                                <div class="performance-stat">
                                    <span class="stat-label">Estado:</span>
                                    <span class="stat-value" style="color: green;">Normal</span>
                                </div>
                                <div class="performance-stat">
                                    <span class="stat-label">Último guardado:</span>
                                    <span class="stat-value" id="lastSaveDisplay">Nunca</span>
                                </div>
                            </div>

                             <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
                                <button class="btn btn-secondary" id="settingsResetBtn" style="width: 100%;">Restablecer valores de fábrica</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-modal-footer">
                    <button class="settings-btn settings-btn-secondary" id="settingsCancelBtn">Cancelar</button>
                    <button class="settings-btn settings-btn-primary" id="settingsSaveBtn">Guardar Cambios</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;
        this.setupTabLogic();
    }

    validateSettings() {
        const apiKey = this.settings.googleMapsApiKey;
        if (apiKey && apiKey.trim() !== '') {
            // Simplistic check: Starts with AIza and reasonable length (39)
            if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
                alert('La API Key parece inválida. Asegúrese de copiarla correctamente (debe comenzar con "AIza").');

                // Switch to tab and focus
                const tabBtn = this.modal.querySelector('button[data-tab="integrations"]');
                if (tabBtn) tabBtn.click();

                const input = this.modal.querySelector('#googleApiKeyInput');
                if (input) {
                    setTimeout(() => input.focus(), 100);
                    input.style.borderColor = '#EF4444'; // Red
                    setTimeout(() => input.style.borderColor = '', 3000);
                }
                return false;
            }
        }
        return true;
    }

    setupTabLogic() {
        const tabs = this.modal.querySelectorAll('.settings-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));

                // Add active to clicked
                tab.classList.add('active');

                // Hide all panes
                const panes = this.modal.querySelectorAll('.settings-tab-pane');
                panes.forEach(p => p.classList.remove('active'));

                // Show target pane
                const targetId = `tab-${tab.dataset.tab}`;
                const targetPane = this.modal.querySelector(`#${targetId}`);
                if (targetPane) targetPane.classList.add('active');
            });
        });

        // Sliders init
        const slider = this.modal.querySelector('#autoSaveSlider');
        if (slider) {
            slider.value = this.getSliderValue();
            slider.addEventListener('input', (e) => {
                const interval = this.getIntervalFromSlider(e.target.value);
                const display = this.modal.querySelector('#autoSaveValueDisplay');
                if (display) display.textContent = this.availableIntervals[interval];
            });
        }
    }

    setupEventListeners() {
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openModal());

        setTimeout(() => {
            if (!this.modal) return;

            // Close buttons
            const closeIcon = this.modal.querySelector('#settingsCloseIcon');
            const cancelBtn = this.modal.querySelector('#settingsCancelBtn');
            const overlay = this.modal.querySelector('.settings-modal-overlay');

            [closeIcon, cancelBtn, overlay].forEach(el => {
                if (el) el.addEventListener('click', () => this.closeModal());
            });

            // Save button
            const saveBtn = this.modal.querySelector('#settingsSaveBtn');
            if (saveBtn) saveBtn.addEventListener('click', () => {
                this.updateSettingsFromUI();
                if (this.validateSettings()) {
                    this.saveSettings();
                    this.closeModal();
                }
            });

            // Reset button
            const resetBtn = this.modal.querySelector('#settingsResetBtn');
            if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettings());

            if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettings());

            // Toggles - Immediate Effect
            const fontToggle = this.modal.querySelector('#fontPreviewToggle');
            if (fontToggle) {
                fontToggle.addEventListener('change', (e) => {
                    this.settings.fontPreviewEnabled = e.target.checked;
                    this.applySettings();
                });
            }

            const autoPreviewToggle = this.modal.querySelector('#autoPreviewToggle');
            if (autoPreviewToggle) {
                autoPreviewToggle.addEventListener('change', (e) => {
                    this.settings.autoPreviewEnabled = e.target.checked;
                    this.applySettings();
                });
            }

        }, 0);
    }

    updateSettingsFromUI() {
        // Collect data from inputs
        const autoSaveSlider = this.modal.querySelector('#autoSaveSlider');
        if (autoSaveSlider) {
            this.settings.autoSaveInterval = this.getIntervalFromSlider(autoSaveSlider.value);
        }

        const fontToggle = this.modal.querySelector('#fontPreviewToggle');
        if (fontToggle) this.settings.fontPreviewEnabled = fontToggle.checked;

        const autoPreviewToggle = this.modal.querySelector('#autoPreviewToggle');
        if (autoPreviewToggle) this.settings.autoPreviewEnabled = autoPreviewToggle.checked;

        const apiKeyInput = this.modal.querySelector('#googleApiKeyInput');
        if (apiKeyInput) {
            const key = apiKeyInput.value.trim();
            // Check if key changed to trigger reload notification if needed
            if (key !== this.settings.googleMapsApiKey) {
                this.settings.googleMapsApiKey = key;
                if (key) {
                    this.showNotification('API Key actualizada. Recargue la página si el mapa no carga.', 'info');
                    // Intentar cargar mapa dinámicamente si no está
                    if (window.mapSearchManager && window.mapSearchManager.loadGoogleMaps) {
                        window.mapSearchManager.loadGoogleMaps(key);
                    }
                }
            }
        }
    }

    applySettings() {
        if (window.uiEnhancements) {
            window.uiEnhancements.fontPreviewEnabled = this.settings.fontPreviewEnabled;
        }
        this.setupAutoSave();
    }

    // ... (Métodos auxiliares slider/autosave iguales) ...
    getSliderValue() {
        const intervals = [5, 10, 30, 60, 300, 600, 900];
        return intervals.indexOf(this.settings.autoSaveInterval);
    }

    getIntervalFromSlider(value) {
        const intervals = [5, 10, 30, 60, 300, 600, 900];
        return intervals[parseInt(value)] || 5;
    }

    setupAutoSave() {
        if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
        const ms = this.settings.autoSaveInterval * 1000;
        this.autoSaveTimer = setInterval(() => this.performAutoSave(), ms);
    }

    performAutoSave() {
        if (window.storage && typeof window.storage.save === 'function') {
            window.storage.save();
            this.settings.lastSaved = Date.now();
            this.saveSettings(); // Actualizar timestamp en settings local

            // Actualizar UI si abierto
            if (this.modal && this.modal.classList.contains('active')) {
                const disp = this.modal.querySelector('#lastSaveDisplay');
                if (disp) disp.textContent = 'Hace un momento';
            }
        }
    }

    resetSettings() {
        if (confirm('¿Restablecer configuración?')) {
            this.settings = {
                fontPreviewEnabled: true,
                autoPreviewEnabled: true,
                autoSaveInterval: 5,
                googleMapsApiKey: ''
            };
            this.saveSettings();
            this.closeModal();
            this.modal.remove(); // Force recreate next open
            this.modal = null;
            this.createModal();
            this.openModal();
            this.showNotification('Restablecido', 'success');
        }
    }

    openModal() {
        if (!this.modal) this.createModal();
        this.modal.classList.add('active');

        // Sync UI
        const apiKeyInput = this.modal.querySelector('#googleApiKeyInput');
        if (apiKeyInput) apiKeyInput.value = this.settings.googleMapsApiKey || '';
    }

    closeModal() {
        if (this.modal) this.modal.classList.remove('active');
    }

    showNotification(msg, type = 'info') {
        const id = 'settings-notification';
        let notif = document.getElementById(id);
        if (!notif) {
            notif = document.createElement('div');
            notif.id = id;
            notif.className = 'settings-notification';
            document.body.appendChild(notif);
        }
        notif.textContent = msg;
        notif.className = `settings-notification active settings-notification-${type}`;
        setTimeout(() => notif.classList.remove('active'), 3000);
    }
}

// Inicialización
let settingsManager = null;
const initSettings = () => {
    settingsManager = new SettingsManager();
    window.settingsManager = settingsManager;
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSettings);
else initSettings();
