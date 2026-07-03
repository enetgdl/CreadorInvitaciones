/**
 * EDITOR-CORE.js - Núcleo del Editor de Invitaciones
 * Clase principal y métodos de inicialización
 */

class InvitationEditor {
    constructor() {
        this.storage = invitationStorage;
        this.preview = null;
        this.exporter = invitationExporter;
        this.data = null;
        this.isDirty = false;
        this._boundPanels = new Set();
        this.keyboardShortcuts = [];
        this.autosaveIndicator = null;
    }

    /**
     * Inicializar cuando el DOM esté listo
     */
    initialize() {
        // Inyectar estilos de validación
        this.addValidationStyles();

        // Inyectar estilos del diálogo de inicio
        this.addStartupDialogStyles();

        // Verificar si hay datos guardados y mostrar diálogo de inicio
        const savedData = this.storage.getData();
        const hasSavedData = savedData && savedData.eventName && savedData.eventName.trim() !== '';

        if (hasSavedData) {
            this.showStartupDialog(savedData);
        } else {
            // No hay datos guardados, iniciar con datos predeterminados
            this.data = savedData;
            this.initEditor();
        }
    }

    /**
     * Inyectar estilos CSS para mensajes de error validación
     */
    addValidationStyles() {
        const styleId = 'dynamic-validation-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .validation-error {
                    color: #e74c3c;
                    font-size: 0.8rem;
                    margin-top: 5px;
                    display: none;
                    animation: fadeIn 0.3s ease;
                }
                .input-error {
                    border-color: #e74c3c !important;
                    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.2) !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Inyectar estilos CSS para el diálogo de inicio
     */
    addStartupDialogStyles() {
        const styleId = 'startup-dialog-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .startup-dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                .startup-dialog {
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 480px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    text-align: center;
                }
                .startup-dialog h2 {
                    margin: 0 0 12px 0;
                    color: #333;
                    font-size: 1.5rem;
                }
                .startup-dialog p {
                    margin: 0 0 24px 0;
                    color: #666;
                    line-height: 1.5;
                }
                .startup-dialog .saved-name {
                    background: #f5f5f5;
                    padding: 8px 16px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    font-weight: 500;
                    color: #333;
                }
                .startup-dialog-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .startup-dialog-btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s ease;
                }
                .startup-dialog-btn:hover {
                    transform: translateY(-1px);
                }
                .startup-dialog-btn-primary {
                    background: #5327a0;
                    color: white;
                }
                .startup-dialog-btn-primary:hover {
                    background: #6b3fb5;
                }
                .startup-dialog-btn-secondary {
                    background: #e0e0e0;
                    color: #333;
                }
                .startup-dialog-btn-secondary:hover {
                    background: #d0d0d0;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Mostrar diálogo de inicio para elegir entre continuar o empezar nuevo
     */
    showStartupDialog(savedData) {
        const overlay = document.createElement('div');
        overlay.className = 'startup-dialog-overlay';

        const invitationName = savedData.eventName || 'Sin nombre';
        const eventType = savedData.eventType || 'invitación';
        const eventTypeLabels = {
            'xv': 'XV Años',
            'boda': 'Boda',
            'baby-shower': 'Baby Shower',
            'bautizo': 'Bautizo',
            'comunion': 'Comunión',
            'cumpleanos': 'Cumpleaños',
            'graduacion': 'Graduación',
            'otro': 'Otro'
        };
        const eventLabel = eventTypeLabels[eventType] || eventType;

        overlay.innerHTML = `
            <div class="startup-dialog">
                <h2>Invitación Guardada</h2>
                <p>Tienes una invitación guardada recientemente:</p>
                <div class="saved-name">${eventLabel}: ${invitationName}</div>
                <p>¿Qué deseas hacer?</p>
                <div class="startup-dialog-buttons">
                    <button class="startup-dialog-btn startup-dialog-btn-secondary" id="startupNew">
                        Nueva Invitación
                    </button>
                    <button class="startup-dialog-btn startup-dialog-btn-primary" id="startupContinue">
                        Continuar Editando
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('startupNew')?.addEventListener('click', () => {
            overlay.remove();
            this.data = this.storage.getDefaultData();
            this.initEditor();
        });

        document.getElementById('startupContinue')?.addEventListener('click', () => {
            overlay.remove();
            this.data = savedData;
            this.initEditor();
        });
    }

    /**
     * Inicializar el editor (después del diálogo de inicio)
     */
    initEditor() {
        // Inicializar vista previa
        const previewFrame = document.getElementById('previewFrame');
        if (previewFrame) {
            this.preview = new InvitationPreview(previewFrame);
            this.preview.initialize(this.data);
        }

        // Cargar valores en formularios
        this.loadFormValues();

        // Ejecutar validación inicial
        this.validateDynamicFields();

        // Configurar event listeners
        this.setupEventListeners();

        // Iniciar auto-guardado
        this.startAutoSave();

        // Inicializar Historial
        if (window.HistoryManager) {
            this.historyManager = new HistoryManager();
            this.historyManager.init(this);
            this._lastHistoryField = null;
            this._lastHistoryTime = 0;

            if (window.HistoryPanel) {
                this.historyPanel = new HistoryPanel();
                this.historyPanel.init(this.historyManager);
            }
        }

        // Inicializar Gestor de Elementos Dinámicos
        if (window.DynamicElementsManager) {
            this.dynamicElementsManager = new DynamicElementsManager(this);
            this.dynamicElementsManager.init();
        }

        // Inicializar Sistema de Persistencia de Multimedia
        if (window.mediaPersistenceManager) {
            window.mediaPersistenceManager.initialize();
        }

        // Inicializar Gestor de Galería
        if (typeof GalleryManager !== 'undefined') {
            this.galleryManager = new GalleryManager(this);
            this.galleryManager.initialize();
        }

        console.log('Editor inicializado correctamente');
    }

    /**
     * Forzar actualización de la vista previa
     */
    forceUpdate() {
        if (this.preview) {
            this.preview.forceUpdate();
        }
    }

    /**
     * Cargar datos completos (Para Undo/Redo)
     */
    loadData(newData) {
        if (!newData) return;

        // Clonar para evitar referenciar el objeto del historial directamente
        this.data = JSON.parse(JSON.stringify(newData));

        // Actualizar UI
        this.loadFormValues();

        // Actualizar Preview
        if (this.preview) {
            this.preview.currentData = this.data;
            this.preview.render();
        }

        // Persistir cambio
        this.isDirty = true;
        this.storage.saveData(this.data);
    }
}

// Crear instancia global y exponerla en window
const invitationEditor = new InvitationEditor();
window.invitationEditor = invitationEditor;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    invitationEditor.initialize();
});

window.InvitationEditor = InvitationEditor;
