/**
 * GRADIENT-EDITOR.JS - Editor de Degradados Avanzado
 * Permite crear degradados lineales y radiales con múltiples puntos de control
 */

class GradientEditor {
    constructor() {
        this.gradients = {
            linear: [],
            radial: []
        };
        this.currentType = 'linear'; // 'linear' o 'radial'
        this.currentGradient = null;
        this.maxStops = 6;
        this.previewCanvas = null;
        this.previewCtx = null;

        // Degradados predefinidos metálicos
        this.presets = {
            gold: {
                name: 'Dorado',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#8B7500' },
                    { position: 35, color: '#FFD700' },
                    { position: 65, color: '#FFF4B3' },
                    { position: 100, color: '#FFD700' }
                ]
            },
            silver: {
                name: 'Plateado',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#989898' },
                    { position: 35, color: '#D3D3D3' },
                    { position: 65, color: '#F5F5F5' },
                    { position: 100, color: '#C0C0C0' }
                ]
            },
            bronze: {
                name: 'Bronce',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#804A00' },
                    { position: 35, color: '#CD7F32' },
                    { position: 65, color: '#E9B872' },
                    { position: 100, color: '#B87333' }
                ]
            },
            roseGold: {
                name: 'Dorado Rosa',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#B76E79' },
                    { position: 35, color: '#ECC5C0' },
                    { position: 65, color: '#F4E3E0' },
                    { position: 100, color: '#ECC5C0' }
                ]
            },
            copper: {
                name: 'Cobre',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#B87333' },
                    { position: 35, color: '#D99058' },
                    { position: 65, color: '#F0C9A6' },
                    { position: 100, color: '#C87533' }
                ]
            },
            platinum: {
                name: 'Platino',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#8E8E93' },
                    { position: 35, color: '#E5E4E2' },
                    { position: 65, color: '#FFFFFF' },
                    { position: 100, color: '#D1D0CF' }
                ]
            },
            titanium: {
                name: 'Titanio',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#878681' },
                    { position: 35, color: '#C8C8C8' },
                    { position: 65, color: '#E8E8E8' },
                    { position: 100, color: '#B0B0B0' }
                ]
            },
            champagne: {
                name: 'Champagne',
                type: 'linear',
                angle: 135,
                stops: [
                    { position: 0, color: '#C2A661' },
                    { position: 35, color: '#F7E7CE' },
                    { position: 65, color: '#FAEBD7' },
                    { position: 100, color: '#E8D5B7' }
                ]
            }
        };

        this.init();
    }

    /**
     * Inicializar editor
     */
    init() {
        // Crear degradado inicial
        this.currentGradient = {
            type: 'linear',
            angle: 135,
            stops: [
                { position: 0, color: '#8B5CF6', opacity: 1 },
                { position: 100, color: '#EC4899', opacity: 1 }
            ]
        };
    }

    /**
     * Añadir punto de control
     */
    addStop(position = 50, color = '#FFFFFF', opacity = 1) {
        if (this.currentGradient.stops.length >= this.maxStops) {
            console.warn(`Máximo ${this.maxStops} puntos de control permitidos`);
            return false;
        }

        const newStop = {
            position: position,
            color: color,
            opacity: opacity
        };

        this.currentGradient.stops.push(newStop);
        this.sortStops();
        this.updatePreview();
        return true;
    }

    /**
     * Eliminar punto de control
     */
    removeStop(index) {
        if (this.currentGradient.stops.length <= 2) {
            console.warn('Mínimo 2 puntos de control requeridos');
            return false;
        }

        this.currentGradient.stops.splice(index, 1);
        this.updatePreview();
        return true;
    }

    /**
     * Actualizar punto de control
     */
    updateStop(index, property, value) {
        if (!this.currentGradient.stops[index]) return false;

        this.currentGradient.stops[index][property] = value;

        if (property === 'position') {
            this.sortStops();
        }

        this.updatePreview();
        return true;
    }

    /**
     * Ordenar puntos por posición
     */
    sortStops() {
        this.currentGradient.stops.sort((a, b) => a.position - b.position);
    }

    /**
     * Cambiar tipo de degradado
     */
    setType(type) {
        if (['linear', 'radial'].includes(type)) {
            this.currentGradient.type = type;
            this.updatePreview();
            return true;
        }
        return false;
    }

    /**
     * Cambiar ángulo (solo para linear)
     */
    setAngle(angle) {
        this.currentGradient.angle = angle;
        this.updatePreview();
    }

    /**
     * Generar CSS del degradado
     */
    generateCSS() {
        const { type, angle, stops } = this.currentGradient;

        const colorStops = stops.map(stop => {
            const rgba = this.hexToRgba(stop.color, stop.opacity);
            return `${rgba} ${stop.position}%`;
        }).join(', ');

        if (type === 'linear') {
            return `linear-gradient(${angle}deg, ${colorStops})`;
        } else {
            return `radial-gradient(circle, ${colorStops})`;
        }
    }

    /**
     * Convertir HEX a RGBA
     */
    hexToRgba(hex, opacity = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(0, 0, 0, ${opacity})`;

        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Actualizar vista previa
     */
    updatePreview() {
        if (!this.previewCanvas) {
            this.previewCanvas = document.getElementById('gradient-preview-canvas');
            if (!this.previewCanvas) return;
            this.previewCtx = this.previewCanvas.getContext('2d');
        }

        const canvas = this.previewCanvas;
        const ctx = this.previewCtx;
        const width = canvas.width;
        const height = canvas.height;

        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);

        // Crear degradado
        let gradient;
        const { type, angle, stops } = this.currentGradient;

        if (type === 'linear') {
            // Calcular posiciones basadas en el ángulo
            const angleRad = (angle - 90) * Math.PI / 180;
            const x1 = width / 2 + Math.cos(angleRad) * width / 2;
            const y1 = height / 2 + Math.sin(angleRad) * height / 2;
            const x2 = width / 2 - Math.cos(angleRad) * width / 2;
            const y2 = height / 2 - Math.sin(angleRad) * height / 2;

            gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        } else {
            gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        }

        // Añadir puntos de color
        stops.forEach(stop => {
            const rgba = this.hexToRgba(stop.color, stop.opacity);
            gradient.addColorStop(stop.position / 100, rgba);
        });

        // Dibujar
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Cargar preset
     */
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return false;

        this.currentGradient = {
            type: preset.type,
            angle: preset.angle || 135,
            stops: preset.stops.map(stop => ({
                ...stop,
                opacity: stop.opacity || 1
            }))
        };

        this.updatePreview();
        return true;
    }

    /**
     * Guardar degradado personalizado
     */
    saveCustomGradient(name) {
        const customGradients = JSON.parse(localStorage.getItem('customGradients') || '{}');
        customGradients[name] = { ...this.currentGradient };
        localStorage.setItem('customGradients', JSON.stringify(customGradients));
        return true;
    }

    /**
     * Cargar degradado personalizado
     */
    loadCustomGradient(name) {
        const customGradients = JSON.parse(localStorage.getItem('customGradients') || '{}');
        const gradient = customGradients[name];

        if (gradient) {
            this.currentGradient = { ...gradient };
            this.updatePreview();
            return true;
        }
        return false;
    }

    /**
     * Obtener degradado actual
     */
    getCurrentGradient() {
        return {
            ...this.currentGradient,
            css: this.generateCSS()
        };
    }

    /**
     * Resetear a valores por defecto
     */
    reset() {
        this.currentGradient = {
            type: 'linear',
            angle: 135,
            stops: [
                { position: 0, color: '#8B5CF6', opacity: 1 },
                { position: 100, color: '#EC4899', opacity: 1 }
            ]
        };
        this.updatePreview();
    }

    /**
     * Obtener todos los presets
     */
    getPresets() {
        return this.presets;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GradientEditor;
}
