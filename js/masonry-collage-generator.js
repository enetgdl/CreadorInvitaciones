/**
 * MASONRY COLLAGE GENERATOR
 * Sistema de generación de collages tipo grid con recorte inteligente
 * Elimina espacios negros y crea layouts dinámicos
 * 
 * @version 3.0.0
 * @date 2026-02-03
 */

class MasonryCollageGenerator {
    constructor(options = {}) {
        this.config = {
            width: options.width || 1080,           // Ancho del canvas
            height: options.height || 1920,         // Alto del canvas (default vertical móvil)
            margin: options.margin || 4,            // Margen entre imágenes
            quality: options.quality || 0.92,
            outputFormat: options.format || 'image/jpeg',
            backgroundColor: options.bgColor || '#000000',
            gridColumns: options.gridColumns || 6,  // Columnas del grid
            gridRows: options.gridRows || 12        // Filas del grid
        };

        // Patrones de layout predefinidos
        this.layoutPatterns = this.generateLayoutPatterns();
    }

    /**
     * Generar patrones de layout para diferentes cantidades de imágenes
     * Cada patrón define el área que ocupa cada imagen en el grid
     */
    generateLayoutPatterns() {
        return {
            // 3 imágenes
            3: [
                { col: 0, row: 0, width: 3, height: 4 },   // Izquierda grande
                { col: 3, row: 0, width: 3, height: 2 },   // Derecha superior
                { col: 3, row: 2, width: 3, height: 2 }    // Derecha inferior
            ],
            // 4 imágenes
            4: [
                { col: 0, row: 0, width: 4, height: 3 },   // Grande arriba izquierda
                { col: 4, row: 0, width: 2, height: 3 },   // Pequeña arriba derecha
                { col: 0, row: 3, width: 3, height: 3 },   // Mediana abajo izquierda
                { col: 3, row: 3, width: 3, height: 3 }    // Mediana abajo derecha
            ],
            // 5 imágenes
            5: [
                { col: 0, row: 0, width: 3, height: 4 },   // Grande izquierda
                { col: 3, row: 0, width: 3, height: 2 },   // Mediana derecha superior
                { col: 3, row: 2, width: 3, height: 2 },   // Mediana derecha inferior
                { col: 0, row: 4, width: 3, height: 2 },   // Pequeña abajo izquierda
                { col: 3, row: 4, width: 3, height: 2 }    // Pequeña abajo derecha
            ],
            // 6 imágenes (como en tu ejemplo)
            6: [
                { col: 0, row: 0, width: 3, height: 3 },   // Fila superior izquierda
                { col: 3, row: 0, width: 3, height: 6 },   // Grande derecha (vertical)
                { col: 0, row: 3, width: 1.5, height: 2 }, // Pequeña cuadrada izq
                { col: 1.5, row: 3, width: 1.5, height: 2 },// Pequeña cuadrada centro
                { col: 0, row: 5, width: 3, height: 3 },   // Fila inferior izquierda
                { col: 3, row: 6, width: 3, height: 3 }    // Fila inferior derecha
            ],
            // 7 imágenes
            7: [
                { col: 0, row: 0, width: 2, height: 3 },
                { col: 2, row: 0, width: 2, height: 3 },
                { col: 4, row: 0, width: 2, height: 3 },
                { col: 0, row: 3, width: 3, height: 3 },
                { col: 3, row: 3, width: 3, height: 3 },
                { col: 0, row: 6, width: 3, height: 3 },
                { col: 3, row: 6, width: 3, height: 3 }
            ],
            // 8 imágenes
            8: [
                { col: 0, row: 0, width: 3, height: 3 },
                { col: 3, row: 0, width: 3, height: 3 },
                { col: 0, row: 3, width: 2, height: 2 },
                { col: 2, row: 3, width: 2, height: 2 },
                { col: 4, row: 3, width: 2, height: 2 },
                { col: 0, row: 5, width: 3, height: 3 },
                { col: 3, row: 5, width: 3, height: 3 },
                { col: 0, row: 8, width: 6, height: 2 }
            ]
        };
    }

    /**
     * Generar collage tipo masonry con recorte automático
     * 
     * @param {Array} sources - Array de Files, Blobs o Data URLs
     * @returns {Promise<Object>}
     */
    async generateCollage(sources) {
        try {
            if (!sources || sources.length === 0) {
                throw new Error('Se requiere al menos una imagen');
            }

            // Cargar todas las imágenes
            const loadedImages = await Promise.all(
                sources.map((src, idx) => this.loadImage(src, idx))
            );

            // Seleccionar patrón de layout según cantidad de imágenes
            const pattern = this.getLayoutPattern(loadedImages.length);

            // Crear canvas principal
            const mainCanvas = this.createCanvas(this.config.width, this.config.height);
            const ctx = mainCanvas.getContext('2d');

            // Fondo
            ctx.fillStyle = this.config.backgroundColor;
            ctx.fillRect(0, 0, this.config.width, this.config.height);

            // Calcular tamaño de celda del grid
            const cellWidth = this.config.width / this.config.gridColumns;
            const cellHeight = this.config.height / this.config.gridRows;

            // Dibujar cada imagen según el patrón
            for (let i = 0; i < loadedImages.length && i < pattern.length; i++) {
                const img = loadedImages[i];
                const layout = pattern[i];

                // Calcular posición y tamaño en píxeles
                const x = layout.col * cellWidth + (this.config.margin / 2);
                const y = layout.row * cellHeight + (this.config.margin / 2);
                const width = layout.width * cellWidth - this.config.margin;
                const height = layout.height * cellHeight - this.config.margin;

                // Dibujar imagen con recorte tipo "cover"
                this.drawImageCover(ctx, img, x, y, width, height);
            }

            // Convertir a dataURL
            const dataURL = mainCanvas.toDataURL(
                this.config.outputFormat,
                this.config.quality
            );

            return {
                success: true,
                dataURL,
                width: this.config.width,
                height: this.config.height,
                imagesUsed: Math.min(loadedImages.length, pattern.length),
                pattern: pattern.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Dibujar imagen con comportamiento "object-fit: cover"
     * Recorta la imagen para llenar completamente el área sin distorsión
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {HTMLImageElement} img 
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} width - Ancho del área
     * @param {number} height - Alto del área
     */
    drawImageCover(ctx, img, x, y, width, height) {
        const imgRatio = img.width / img.height;
        const areaRatio = width / height;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        // Determinar cómo recortar la imagen
        if (imgRatio > areaRatio) {
            // Imagen más ancha que el área: recortar los lados
            sourceWidth = img.height * areaRatio;
            sourceX = (img.width - sourceWidth) / 2;
        } else {
            // Imagen más alta que el área: recortar arriba y abajo
            sourceHeight = img.width / areaRatio;
            sourceY = (img.height - sourceHeight) / 2;
        }

        // Aplicar interpolación de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar la porción recortada de la imagen
        ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,  // Área source (recorte)
            x, y, width, height                           // Área destino
        );
    }

    /**
     * Obtener patrón de layout para N imágenes
     * 
     * @param {number} count 
     * @returns {Array}
     */
    getLayoutPattern(count) {
        // Si hay un patrón exacto, usarlo
        if (this.layoutPatterns[count]) {
            return this.layoutPatterns[count];
        }

        // Si hay más imágenes, usar patrón de 8 y repetir
        if (count >= 8) {
            return this.layoutPatterns[8];
        }

        // Generar patrón dinámico para cantidades no definidas
        return this.generateDynamicPattern(count);
    }

    /**
     * Generar patrón dinámico para cantidades no predefinidas
     * 
     * @param {number} count 
     * @returns {Array}
     */
    generateDynamicPattern(count) {
        const pattern = [];
        const cols = this.config.gridColumns;
        const rows = Math.ceil(count / 2);
        const cellsPerImage = Math.floor((cols * this.config.gridRows) / count);

        let currentRow = 0;
        let currentCol = 0;

        for (let i = 0; i < count; i++) {
            const width = i % 2 === 0 ? 3 : 3;
            const height = Math.min(3, this.config.gridRows - currentRow);

            pattern.push({
                col: currentCol,
                row: currentRow,
                width,
                height
            });

            currentCol += width;
            if (currentCol >= cols) {
                currentCol = 0;
                currentRow += height;
            }
        }

        return pattern;
    }

    /**
     * Cargar imagen desde fuente
     * 
     * @param {*} source 
     * @param {number} index 
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(source, index) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Error cargando imagen ${index}`));

            if (typeof source === 'string') {
                img.src = source;
            } else {
                const reader = new FileReader();
                reader.onload = (e) => img.src = e.target.result;
                reader.onerror = () => reject(new Error(`Error leyendo archivo ${index}`));
                reader.readAsDataURL(source);
            }
        });
    }

    /**
     * Crear canvas con DPR
     * 
     * @param {number} width 
     * @param {number} height 
     * @returns {HTMLCanvasElement}
     */
    createCanvas(width, height) {
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        return canvas;
    }

    /**
     * Generar collage con patrón personalizado
     * 
     * @param {Array} sources 
     * @param {Array} customPattern 
     * @returns {Promise<Object>}
     */
    async generateWithCustomPattern(sources, customPattern) {
        const tempPattern = this.layoutPatterns[sources.length];
        this.layoutPatterns[sources.length] = customPattern;
        const result = await this.generateCollage(sources);
        this.layoutPatterns[sources.length] = tempPattern;
        return result;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MasonryCollageGenerator;
}
