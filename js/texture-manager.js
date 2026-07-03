/**
 * TEXTURE-MANAGER.JS - Gestor de Texturas de Fondo
 * Permite seleccionar, subir y ajustar texturas para fondos
 */

class TextureManager {
    constructor() {
        this.currentTexture = null;
        this.customTextures = [];
        this.config = {
            scale: 1,
            opacity: 1,
            blendMode: 'normal',
            repeat: 'repeat'
        };

        // Texturas predefinidas (usando patrones CSS o data URLs)
        this.presetTextures = {
            fabric: {
                name: 'Tela',
                category: 'textile',
                pattern: this.generateFabricPattern()
            },
            linen: {
                name: 'Lino',
                category: 'textile',
                pattern: this.generateLinenPattern()
            },
            wood: {
                name: 'Madera Clara',
                category: 'natural',
                pattern: this.generateWoodPattern()
            },
            darkWood: {
                name: 'Madera Oscura',
                category: 'natural',
                pattern: this.generateDarkWoodPattern()
            },
            paper: {
                name: 'Papel',
                category: 'paper',
                pattern: this.generatePaperPattern()
            },
            parchment: {
                name: 'Pergamino',
                category: 'paper',
                pattern: this.generateParchmentPattern()
            },
            marble: {
                name: 'Mármol',
                category: 'stone',
                pattern: this.generateMarblePattern()
            },
            granite: {
                name: 'Granito',
                category: 'stone',
                pattern: this.generateGranitePattern()
            },
            geometric: {
                name: 'Geométrico',
                category: 'pattern',
                pattern: this.generateGeometricPattern()
            },
            dots: {
                name: 'Puntos',
                category: 'pattern',
                pattern: this.generateDotsPattern()
            },
            hexagon: {
                name: 'Hexágonos',
                category: 'pattern',
                pattern: this.generateHexagonPattern()
            },
            waves: {
                name: 'Ondas',
                category: 'pattern',
                pattern: this.generateWavesPattern()
            }
        };

        this.init();
    }

    /**
     * Inicializar
     */
    init() {
        this.loadCustomTextures();
    }

    /**
     * Generar patrón de tela
     */
    generateFabricPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        // Base
        ctx.fillStyle = '#F5F5F0';
        ctx.fillRect(0, 0, 100, 100);

        // Textura de tela
        for (let i = 0; i < 100; i += 2) {
            for (let j = 0; j < 100; j += 2) {
                const opacity = Math.random() * 0.1;
                ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
                ctx.fillRect(i, j, 1, 1);
            }
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de lino
     */
    generateLinenPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FAF8F3';
        ctx.fillRect(0, 0, 100, 100);

        // Líneas de lino
        ctx.strokeStyle = 'rgba(200, 190, 170, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 100; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 100);
            ctx.stroke();
        }

        for (let i = 0; i < 100; i += 6) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(100, i);
            ctx.stroke();
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de madera clara
     */
    generateWoodPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 200, 0);
        gradient.addColorStop(0, '#D4A574');
        gradient.addColorStop(0.5, '#C9965F');
        gradient.addColorStop(1, '#D4A574');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);

        // Vetas
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 20);
            ctx.bezierCurveTo(50, i * 20 + 10, 150, i * 20 - 10, 200, i * 20);
            ctx.stroke();
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de madera oscura
     */
    generateDarkWoodPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 200, 0);
        gradient.addColorStop(0, '#3E2723');
        gradient.addColorStop(0.5, '#5D4037');
        gradient.addColorStop(1, '#3E2723');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de papel
     */
    generatePaperPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFEF0';
        ctx.fillRect(0, 0, 100, 100);

        // Ruido de papel
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const opacity = Math.random() * 0.05;
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fillRect(x, y, 1, 1);
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de pergamino
     */
    generateParchmentPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#F4E7D7';
        ctx.fillRect(0, 0, 100, 100);

        // Manchas antiguas
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 10 + 5;
            ctx.fillStyle = `rgba(139, 115, 85, ${Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de mármol
     */
    generateMarblePattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, '#F5F5F5');
        gradient.addColorStop(0.6, '#E8E8E8');
        gradient.addColorStop(1, '#FFFFFF');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);

        // Vetas de mármol
        ctx.strokeStyle = 'rgba(180, 180, 180, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 200, 0);
            ctx.quadraticCurveTo(
                Math.random() * 200, Math.random() * 200,
                Math.random() * 200, 200
            );
            ctx.stroke();
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de granito
     */
    generateGranitePattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#6B6B6B';
        ctx.fillRect(0, 0, 100, 100);

        // Motas de granito
        const colors = ['#4A4A4A', '#8C8C8C', '#A0A0A0'];
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 3;
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillRect(x, y, size, size);
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón geométrico
     */
    generateGeometricPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 100, 100);

        // Líneas diagonales
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
        ctx.lineWidth = 1;
        for (let i = -100; i < 200; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 100, 100);
            ctx.stroke();
        }

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de puntos
     */
    generateDotsPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 40, 40);

        ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.beginPath();
        ctx.arc(20, 20, 3, 0, Math.PI * 2);
        ctx.fill();

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de hexágonos
     */
    generateHexagonPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 52;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 60, 52);

        // Hexágono
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = 30 + 15 * Math.cos(angle);
            const y = 26 + 15 * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        return canvas.toDataURL();
    }

    /**
     * Generar patrón de ondas
     */
    generateWavesPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 100, 100);

        ctx.strokeStyle = 'rgba(139, 92, 246, 0.15)';
        ctx.lineWidth = 2;

        for (let y = 0; y < 100; y += 20) {
            ctx.beginPath();
            for (let x = 0; x <= 100; x++) {
                const waveY = y + Math.sin(x * 0.1) * 5;
                if (x === 0) {
                    ctx.moveTo(x, waveY);
                } else {
                    ctx.lineTo(x, waveY);
                }
            }
            ctx.stroke();
        }

        return canvas.toDataURL();
    }

    /**
     * Aplicar textura
     */
    applyTexture(textureName, customConfig = {}) {
        const texture = this.presetTextures[textureName];
        if (!texture) return false;

        this.currentTexture = {
            name: textureName,
            pattern: texture.pattern,
            category: texture.category
        };

        this.config = { ...this.config, ...customConfig };
        return true;
    }

    /**
     * Subir textura personalizada
     */
    uploadCustomTexture(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Por favor, selecciona una imagen válida'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const textureData = {
                    name: file.name,
                    pattern: e.target.result,
                    category: 'custom',
                    timestamp: Date.now()
                };

                this.customTextures.push(textureData);
                this.saveCustomTextures();
                resolve(textureData);
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Configurar propiedades de textura
     */
    setProperty(property, value) {
        if (this.config.hasOwnProperty(property)) {
            this.config[property] = value;
            return true;
        }
        return false;
    }

    /**
     * Generar CSS de textura
     */
    generateCSS() {
        if (!this.currentTexture) return '';

        const { scale, opacity, blendMode, repeat } = this.config;

        return {
            backgroundImage: `url(${this.currentTexture.pattern})`,
            backgroundSize: `${100 * scale}%`,
            backgroundRepeat: repeat,
            opacity: opacity,
            mixBlendMode: blendMode
        };
    }

    /**
     * Guardar texturas personalizadas
     */
    saveCustomTextures() {
        try {
            localStorage.setItem('customTextures', JSON.stringify(this.customTextures));
        } catch (e) {
            console.warn('No se pudieron guardar las texturas personalizadas:', e);
        }
    }

    /**
     * Cargar texturas personalizadas
     */
    loadCustomTextures() {
        try {
            const saved = localStorage.getItem('customTextures');
            if (saved) {
                this.customTextures = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('No se pudieron cargar las texturas personalizadas:', e);
        }
    }

    /**
     * Eliminar textura personalizada
     */
    deleteCustomTexture(index) {
        if (index >= 0 && index < this.customTextures.length) {
            this.customTextures.splice(index, 1);
            this.saveCustomTextures();
            return true;
        }
        return false;
    }

    /**
     * Obtener todas las texturas
     */
    getAllTextures() {
        return {
            presets: this.presetTextures,
            custom: this.customTextures
        };
    }

    /**
     * Obtener categorías
     */
    getCategories() {
        const categories = new Set();
        Object.values(this.presetTextures).forEach(texture => {
            categories.add(texture.category);
        });
        return Array.from(categories);
    }

    /**
     * Obtener texturas por categoría
     */
    getTexturesByCategory(category) {
        return Object.entries(this.presetTextures)
            .filter(([key, texture]) => texture.category === category)
            .reduce((obj, [key, texture]) => {
                obj[key] = texture;
                return obj;
            }, {});
    }

    /**
     * Resetear configuración
     */
    reset() {
        this.currentTexture = null;
        this.config = {
            scale: 1,
            opacity: 1,
            blendMode: 'normal',
            repeat: 'repeat'
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextureManager;
}
