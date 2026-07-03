/**
 * PREVIEW-STYLES.js - Generación de CSS para Vista Previa
 * Métodos de generación de estilos CSS
 */

// Agregar métodos de estilos a InvitationPreview
if (typeof InvitationPreview !== 'undefined') {
    
    /**
     * Generar CSS para estilos avanzados
     */
    InvitationPreview.prototype.generateAdvancedStyles = function(data) {
        let css = '';
        const styles = data.elementStyles || {};
        const containers = data.containerStyles || {};

        // Helper para estilos de texto
        const getTextCss = (targetKey, cssClass) => {
            const s = styles[targetKey];
            if (!s) return '';

            let rules = [];

            // Prioridad: Degradado > Color Sólido
            if (s.gradient) {
                rules.push(`background: ${s.gradient} !important;`);
                rules.push(`-webkit-background-clip: text !important;`);
                rules.push(`background-clip: text !important;`);
                rules.push(`color: transparent !important;`);
                if (s.borderEnabled) {
                    rules.push(`-webkit-text-fill-color: transparent;`);
                }
            } else if (s.color) {
                rules.push(`color: ${s.color} !important;`);
            }

            if (s.borderEnabled) {
                const borderColor = this.hexToRgba(s.borderColor, s.borderOpacity / 100);
                rules.push(`-webkit-text-stroke: ${s.borderWidth}px ${borderColor};`);
            }

            if (s.shadowEnabled) {
                const shadowColor = this.hexToRgba(s.shadowColor, s.shadowOpacity / 100);
                rules.push(`text-shadow: 2px 2px ${s.shadowBlur}px ${shadowColor} !important;`);
            }

            return rules.length ? `.${cssClass} { ${rules.join(' ')} }` : '';
        };

        css += getTextCss('eventType', 'event-type');
        css += getTextCss('eventName', 'event-title');
        css += getTextCss('honoredName', 'honored-name');

        // Estilos de Contenedores
        if (data.showMainContainer === false) {
            css += `.invitation-content { background: transparent !important; box-shadow: none !important; backdrop-filter: none !important; }`;
        }

        const escAttr = (v) => String(v).replace(/"/g, '\\"');
        const escUrl = (v) => String(v).replace(/["\\\n\r]/g, (m) => (m === '"' ? '\\"' : '\\' + m));

        const designElements = data.designElements || {};
        Object.keys(designElements).forEach((id) => {
            const s = designElements[id];
            if (!s) return;

            const rules = [];

            const tx = Number.isFinite(parseFloat(s.tx)) ? parseFloat(s.tx) : 0;
            const ty = Number.isFinite(parseFloat(s.ty)) ? parseFloat(s.ty) : 0;
            if (tx !== 0 || ty !== 0) rules.push(`translate: ${tx}px ${ty}px !important;`);

            if (Number.isFinite(parseFloat(s.width))) rules.push(`width: ${parseFloat(s.width)}px !important;`);
            if (Number.isFinite(parseFloat(s.height))) rules.push(`height: ${parseFloat(s.height)}px !important;`);

            if (Number.isFinite(parseInt(s.zIndex))) {
                rules.push(`position: relative !important;`);
                rules.push(`z-index: ${parseInt(s.zIndex)} !important;`);
            }

            if (s.hidden) rules.push(`display: none !important;`);
            if (Number.isFinite(parseFloat(s.opacity))) rules.push(`opacity: ${Math.min(1, Math.max(0, parseFloat(s.opacity)))} !important;`);

            if (s.fontFamily) rules.push(`font-family: ${s.fontFamily} !important;`);
            if (Number.isFinite(parseFloat(s.fontSize))) rules.push(`font-size: ${parseFloat(s.fontSize)}px !important;`);
            if (s.fontWeight) rules.push(`font-weight: ${s.fontWeight} !important;`);
            if (s.fontStyle) rules.push(`font-style: ${s.fontStyle} !important;`);
            if (s.textAlign) rules.push(`text-align: ${s.textAlign} !important;`);
            if (Number.isFinite(parseFloat(s.lineHeight))) rules.push(`line-height: ${parseFloat(s.lineHeight)} !important;`);
            if (Number.isFinite(parseFloat(s.letterSpacing))) rules.push(`letter-spacing: ${parseFloat(s.letterSpacing)}px !important;`);
            if (s.textTransform) rules.push(`text-transform: ${s.textTransform} !important;`);
            if (s.textDecoration) rules.push(`text-decoration: ${s.textDecoration} !important;`);
            if (s.textShadow) rules.push(`text-shadow: ${s.textShadow} !important;`);

            if (Number.isFinite(parseFloat(s.textStrokeWidth)) && parseFloat(s.textStrokeWidth) > 0) {
                rules.push(`-webkit-text-stroke: ${parseFloat(s.textStrokeWidth)}px ${s.textStrokeColor || '#000000'} !important;`);
            }

            if (s.textColor) rules.push(`color: ${s.textColor} !important;`);
            if (s.textGradient) {
                rules.push(`background: ${s.textGradient} !important;`);
                rules.push(`-webkit-background-clip: text !important;`);
                rules.push(`background-clip: text !important;`);
                rules.push(`color: transparent !important;`);
                rules.push(`-webkit-text-fill-color: transparent;`);
            }

            if (s.fillType === 'solid' && s.fillColor) rules.push(`background: ${s.fillColor} !important;`);
            if (s.fillType === 'gradient' && s.fillGradient) rules.push(`background: ${s.fillGradient} !important;`);
            if (s.fillType === 'texture' && s.textureDataUrl) {
                rules.push(`background-image: url("${escUrl(s.textureDataUrl)}") !important;`);
                rules.push(`background-size: ${Number.isFinite(parseFloat(s.textureScale)) ? Math.max(0.1, parseFloat(s.textureScale)) * 100 : 100}% !important;`);
                rules.push(`background-repeat: ${s.textureRepeat || 'repeat'} !important;`);
            }

            if (Number.isFinite(parseFloat(s.borderWidth)) && parseFloat(s.borderWidth) > 0) {
                rules.push(`border: ${parseFloat(s.borderWidth)}px ${s.borderStyle || 'solid'} ${s.borderColor || '#000000'} !important;`);
            }
            if (Number.isFinite(parseFloat(s.borderRadius))) rules.push(`border-radius: ${Math.max(0, parseFloat(s.borderRadius))}px !important;`);

            if (s.shadowEnabled) {
                const sc = s.shadowColor || '#000000';
                const so = Number.isFinite(parseFloat(s.shadowOpacity)) ? parseFloat(s.shadowOpacity) / 100 : 0.35;
                const sx = Number.isFinite(parseFloat(s.shadowX)) ? parseFloat(s.shadowX) : 0;
                const sy = Number.isFinite(parseFloat(s.shadowY)) ? parseFloat(s.shadowY) : 6;
                const sb = Number.isFinite(parseFloat(s.shadowBlur)) ? parseFloat(s.shadowBlur) : 16;
                const ss = Number.isFinite(parseFloat(s.shadowSpread)) ? parseFloat(s.shadowSpread) : 0;
                rules.push(`box-shadow: ${sx}px ${sy}px ${sb}px ${ss}px ${this.hexToRgba(sc, so)} !important;`);
            }

            const filters = [];
            if (Number.isFinite(parseFloat(s.filterBlur)) && parseFloat(s.filterBlur) > 0) filters.push(`blur(${parseFloat(s.filterBlur)}px)`);
            if (Number.isFinite(parseFloat(s.filterGrayscale)) && parseFloat(s.filterGrayscale) > 0) filters.push(`grayscale(${Math.min(100, Math.max(0, parseFloat(s.filterGrayscale)))}%)`);
            if (filters.length) rules.push(`filter: ${filters.join(' ')} !important;`);

            if (rules.length) css += `[data-editor-id="${escAttr(id)}"] { ${rules.join(' ')} }`;
        });

        return css;
    };

    /**
     * Generar CSS de efectos
     */
    InvitationPreview.prototype.generateEffectCSS = function(effect) {
        const effects = {
            particles: `
                .particles-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
            `,
            bokeh: `
                .bokeh-circle {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(20px);
                    opacity: 0.3;
                    animation: float 15s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-30px); }
                }
            `,
            confetti: `
                .confetti-canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }
            `,
            gradient: `
                .animated-gradient {
                    background: linear-gradient(-45deg, ${this.currentData.primaryColor}, ${this.currentData.secondaryColor}, ${this.currentData.primaryColor});
                    background-size: 400% 400%;
                    animation: gradient 15s ease infinite;
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `
        };

        return effects[effect] || '';
    };

    console.log('✅ preview-styles.js cargado correctamente');
}
