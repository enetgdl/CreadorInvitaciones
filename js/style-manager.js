/**
 * STYLE-MANAGER.JS - Gestor de Estilos Avanzados
 * Maneja la lógica de la UI para tipografía avanzada, bordes, sombras y estilos de contenido.
 */

class StyleManager {
    constructor() {
        this.editor = null; // Se enlazará cuando el editor esté listo
        this.activeTypographyTarget = 'eventType';
        this.activeGradientTarget = 'background';

        this.defaults = {
            color: '#333333',
            borderEnabled: false,
            borderColor: '#000000',
            borderWidth: 1,
            borderOpacity: 100,
            shadowEnabled: false,
            shadowColor: '#000000',
            shadowBlur: 5,
            shadowOpacity: 50
        };
    }

    /**
     * Inicializar manager
     */
    init(editor) {
        this.editor = editor;
        console.log('StyleManager inicializado');

        // Asegurar que existan las estructuras de datos
        if (!this.editor.data.elementStyles) {
            this.editor.data.elementStyles = {
                eventType: { ...this.defaults },
                eventName: { ...this.defaults },
                honoredName: { ...this.defaults }
            };
        }
        if (!this.editor.data.containerStyles) {
            this.editor.data.containerStyles = {
                welcomeMsg: { bgColor: '#ffffff', bgOpacity: 0 },
                mainMsg: { bgColor: '#ffffff', bgOpacity: 0 },
                dressCode: { bgColor: '#ffffff', bgOpacity: 0 }
            };
        }

        this.setupEventListeners();
        this.setupContentStyles();
        this.loadTypographyState();
        this.loadContentStylesState();
    }

    setupEventListeners() {
        // === TIPOGRAFÍA ===
        const typoTarget = document.getElementById('typographyTarget');
        if (typoTarget) {
            typoTarget.addEventListener('change', (e) => {
                this.activeTypographyTarget = e.target.value;
                this.loadTypographyState();
            });
        }

        // Color Texto
        this.bindInput('typographyTextColor', 'color');
        const colorHex = document.getElementById('typographyTextColorHex');
        if (colorHex) {
            document.getElementById('typographyTextColor')?.addEventListener('input', (e) => {
                colorHex.value = e.target.value.toUpperCase();
            });
        }

        // Borde
        this.bindCheckbox('textBorderEnabled', 'borderEnabled', 'textBorderControls');
        this.bindInput('textBorderWidth', 'borderWidth', 'textBorderWidthVal', 'px');
        this.bindInput('textBorderColor', 'borderColor');
        this.bindInput('textBorderOpacity', 'borderOpacity', 'textBorderOpacityVal', '%');

        // Sombra
        this.bindCheckbox('textShadowEnabled', 'shadowEnabled', 'textShadowControls');
        this.bindInput('textShadowOpacity', 'shadowOpacity', 'textShadowOpacityVal', '%');
        this.bindInput('textShadowBlur', 'shadowBlur', 'textShadowBlurVal', 'px');
        this.bindInput('textShadowColor', 'shadowColor');

        // === DEGRADADOS ===
        const gradTarget = document.getElementById('gradientTarget');
        if (gradTarget) {
            gradTarget.addEventListener('change', (e) => {
                this.activeGradientTarget = e.target.value;
                console.log('Target de degradado cambiado a:', this.activeGradientTarget);
                // Aquí se podría integrar con el editor de degradados si tuviera una API pública para cambiar contexto
            });
        }
    }

    setupContentStyles() {
        // Toggle Global
        const showContainer = document.getElementById('showMainContainer');
        if (showContainer) {
            showContainer.checked = this.editor.data.showMainContainer !== false; // Default true
            showContainer.addEventListener('change', (e) => {
                this.editor.handleFieldChange('showMainContainer', e.target.checked);
            });
        }

        // Bloques Individuales
        const blocks = [
            { id: 'welcomeMsg', bgId: 'welcomeMsgBgColor', opId: 'welcomeMsgOpacity' },
            { id: 'mainMsg', bgId: 'mainMsgBgColor', opId: 'mainMsgOpacity' },
            { id: 'dressCode', bgId: 'dressCodeBgColor', opId: 'dressCodeOpacity' }
        ];

        blocks.forEach(block => {
            const bgInput = document.getElementById(block.bgId);
            const opInput = document.getElementById(block.opId);

            if (bgInput) {
                bgInput.addEventListener('input', (e) => {
                    this.updateContainerStyle(block.id, 'bgColor', e.target.value);
                });
            }
            if (opInput) {
                opInput.addEventListener('input', (e) => {
                    this.updateContainerStyle(block.id, 'bgOpacity', e.target.value);
                });
            }
        });
    }

    /**
     * Bindear input a propiedad de estilo del target actual
     */
    bindInput(elementId, property, labelId = null, suffix = '') {
        const input = document.getElementById(elementId);
        if (!input) return;

        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (labelId) {
                const label = document.getElementById(labelId);
                if (label) label.textContent = val + suffix;
            }
            this.updateElementStyle(this.activeTypographyTarget, property, val);
        });
    }

    bindCheckbox(elementId, property, controlsId = null) {
        const input = document.getElementById(elementId);
        if (!input) return;

        input.addEventListener('change', (e) => {
            const checked = e.target.checked;
            if (controlsId) {
                const controls = document.getElementById(controlsId);
                // Asegurar display flex para controles anidados
                if (controls) controls.style.display = checked ? 'flex' : 'none';
            }
            this.updateElementStyle(this.activeTypographyTarget, property, checked);
        });
    }

    /**
     * Actualizar estilo en data
     */
    updateElementStyle(target, property, value) {
        if (!this.editor.data.elementStyles[target]) {
            this.editor.data.elementStyles[target] = { ...this.defaults };
        }
        this.editor.data.elementStyles[target][property] = value;
        // Notificar cambio 'deep' detectado por el nombre 'elementStyles'
        this.editor.handleFieldChange('elementStyles', this.editor.data.elementStyles);
    }

    updateContainerStyle(blockId, property, value) {
        if (!this.editor.data.containerStyles[blockId]) {
            this.editor.data.containerStyles[blockId] = { bgColor: '#ffffff', bgOpacity: 0 };
        }
        this.editor.data.containerStyles[blockId][property] = value;
        this.editor.handleFieldChange('containerStyles', this.editor.data.containerStyles);
    }

    /**
     * Cargar estado visual desde data
     */
    loadTypographyState() {
        const target = this.activeTypographyTarget;
        const styles = this.editor.data.elementStyles?.[target] || this.defaults;

        this.setVal('typographyTextColor', styles.color || '#333333');
        this.setVal('typographyTextColorHex', (styles.color || '#333333').toUpperCase());

        this.setCheck('textBorderEnabled', styles.borderEnabled);
        this.setVal('textBorderWidth', styles.borderWidth || 1);
        this.setText('textBorderWidthVal', (styles.borderWidth || 1) + 'px');
        this.setVal('textBorderColor', styles.borderColor || '#000000');
        this.setVal('textBorderOpacity', styles.borderOpacity || 100);
        this.setText('textBorderOpacityVal', (styles.borderOpacity || 100) + '%');
        this.setDisplay('textBorderControls', styles.borderEnabled ? 'flex' : 'none');

        this.setCheck('textShadowEnabled', styles.shadowEnabled);
        this.setVal('textShadowOpacity', styles.shadowOpacity || 50);
        this.setText('textShadowOpacityVal', (styles.shadowOpacity || 50) + '%');
        this.setVal('textShadowBlur', styles.shadowBlur || 5);
        this.setText('textShadowBlurVal', (styles.shadowBlur || 5) + 'px');
        this.setVal('textShadowColor', styles.shadowColor || '#000000');
        this.setDisplay('textShadowControls', styles.shadowEnabled ? 'flex' : 'none');
    }

    loadContentStylesState() {
        const styles = this.editor.data.containerStyles || {};
        const blocks = [
            { id: 'welcomeMsg', bgId: 'welcomeMsgBgColor', opId: 'welcomeMsgOpacity' },
            { id: 'mainMsg', bgId: 'mainMsgBgColor', opId: 'mainMsgOpacity' },
            { id: 'dressCode', bgId: 'dressCodeBgColor', opId: 'dressCodeOpacity' }
        ];

        blocks.forEach(block => {
            const data = styles[block.id] || { bgColor: '#ffffff', bgOpacity: 0 };
            this.setVal(block.bgId, data.bgColor);
            this.setVal(block.opId, data.bgOpacity);
        });

        this.setCheck('showMainContainer', this.editor.data.showMainContainer !== false);
    }

    // Helpers UI
    setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
    setCheck(id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; }
    setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
    setDisplay(id, val) { const el = document.getElementById(id); if (el) el.style.display = val; }
}

// Inicialización global
window.styleManager = new StyleManager();

// Hook para inicializar cuando el editor esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco a que el editor principal se cargue
    setTimeout(() => {
        if (window.invitationEditor) {
            window.styleManager.init(window.invitationEditor);
        }
    }, 100);
});
