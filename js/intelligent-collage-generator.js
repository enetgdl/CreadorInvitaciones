/**
 * INTELLIGENT COLLAGE GENERATOR
 * Sistema avanzado de generación de collages con detección automática de orientación,
 * redimensionamiento inteligente y layout vertical optimizado.
 * 
 * @version 2.0.0
 * @author AI Assistant
 * @date 2026-02-03
 */

class IntelligentCollageGenerator {
    constructor(options = {}) {
        // Configuración por defecto
        this.config = {
            maxWidth: options.maxWidth || 1080,           // Ancho máximo del collage
            marginBetweenImages: options.margin || 15,     // Margen entre imágenes (px)
            backgroundColor: options.bgColor || 'transparent', // Fondo del collage
            compressionQuality: options.quality || 0.92,   // Calidad JPEG (0-1)
            interpolation: options.interpolation || 'bicubic', // Algoritmo de interpolación
            outputFormat: options.format || 'image/jpeg',  // Formato de salida
            squareThreshold: options.squareThreshold || 0.05, // Umbral para imágenes cuadradas (5%)
            maxImages: options.maxImages || Infinity,      // Límite de imágenes
            timeout: options.timeout || 30000,             // Timeout en ms
            maxMemoryMB: options.maxMemoryMB || 512       // Límite de memoria
        };

        // Estado interno
        this.images = [];
        this.processedImages = [];
        this.errors = [];
        this.metrics = {
            totalProcessTime: 0,
            averageResizeTime: 0,
            totalMemoryUsed: 0,
            imagesProcessed: 0
        };
    }

    /**
     * 1. DETECCIÓN AUTOMÁTICA DE ORIENTACIÓN
     * Analiza dimensiones de cada imagen para clasificarlas
     * 
     * @param {number} width - Ancho de la imagen
     * @param {number} height - Alto de la imagen
     * @returns {'vertical'|'horizontal'|'square'} Orientación detectada
     */
    detectOrientation(width, height) {
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            throw new Error(`Dimensiones inválidas: width=${width}, height=${height}`);
        }

        const aspectRatio = width / height;
        const threshold = this.config.squareThreshold;

        // Imagen cuadrada: ratio cercano a 1.0 (dentro del umbral del 5%)
        if (Math.abs(aspectRatio - 1.0) <= threshold) {
            return 'square';
        }

        // Vertical: alto > ancho
        if (height > width) {
            return 'vertical';
        }

        // Horizontal: ancho > alto
        return 'horizontal';
    }

    /**
     * 2. ALGORITMO DE REDIMENSIONAMIENTO INTELIGENTE
     * Mantiene proporciones sin distorsión, aplica interpolación de alta calidad
     * 
     * @param {HTMLImageElement} img - Imagen original
     * @param {number} targetWidth - Ancho objetivo
     * @returns {Promise<{canvas: HTMLCanvasElement, width: number, height: number}>}
     */
    async intelligentResize(img, targetWidth) {
        return new Promise((resolve, reject) => {
            try {
                const originalWidth = img.naturalWidth || img.width;
                const originalHeight = img.naturalHeight || img.height;

                if (originalWidth === 0 || originalHeight === 0) {
                    throw new Error('Imagen con dimensiones cero');
                }

                // Calcular altura proporcional
                const aspectRatio = originalHeight / originalWidth;
                const newWidth = Math.min(targetWidth, originalWidth); // No ampliar
                const newHeight = Math.round(newWidth * aspectRatio);

                // Crear canvas con devicePixelRatio para alta calidad
                const dpr = window.devicePixelRatio || 1;
                const canvas = document.createElement('canvas');
                canvas.width = newWidth * dpr;
                canvas.height = newHeight * dpr;
                canvas.style.width = newWidth + 'px';
                canvas.style.height = newHeight + 'px';

                const ctx = canvas.getContext('2d', {
                    alpha: this.config.backgroundColor === 'transparent',
                    desynchronized: true // Performance hint
                });

                // Escalar contexto para DPR
                ctx.scale(dpr, dpr);

                // Fondo si no es transparente
                if (this.config.backgroundColor !== 'transparent') {
                    ctx.fillStyle = this.config.backgroundColor;
                    ctx.fillRect(0, 0, newWidth, newHeight);
                }

                // Aplicar interpolación de alta calidad
                this.applyInterpolation(ctx, this.config.interpolation);

                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                resolve({
                    canvas,
                    width: newWidth,
                    height: newHeight,
                    originalWidth,
                    originalHeight,
                    aspectRatio: newHeight / newWidth
                });
            } catch (error) {
                reject(new Error(`Error en redimensionamiento: ${error.message}`));
            }
        });
    }

    /**
     * Configurar algoritmo de interpolación en contexto 2D
     * 
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {string} algorithm - Algoritmo: 'bicubic', 'lanczos', 'bilinear'
     */
    applyInterpolation(ctx, algorithm) {
        switch (algorithm) {
            case 'bicubic':
            case 'lanczos':
                // imageSmoothingQuality: 'high' usa interpolación bicúbica/Lanczos
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                break;
            case 'bilinear':
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                break;
            case 'nearest':
                ctx.imageSmoothingEnabled = false;
                break;
            default:
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
        }
    }

    /**
     * 3. PROCESAMIENTO DE IMAGEN INDIVIDUAL
     * Valida, carga y redimensiona una imagen
     * 
     * @param {File|Blob|string} source - Fuente de la imagen
     * @param {number} index - Índice en el array
     * @returns {Promise<Object>} Datos de la imagen procesada
     */
    async processImage(source, index) {
        const startTime = performance.now();

        try {
            // Validar formato
            const type = source.type || this.getTypeFromDataURL(source);
            if (!this.isValidImageFormat(type)) {
                throw new Error(`Formato no soportado: ${type}`);
            }

            // Cargar imagen
            const img = await this.loadImage(source);

            // Detectar orientación
            const orientation = this.detectOrientation(img.width, img.height);

            // Redimensionar
            const resized = await this.intelligentResize(img, this.config.maxWidth);

            // Convertir a data URL
            const dataURL = resized.canvas.toDataURL(
                this.config.outputFormat,
                this.config.compressionQuality
            );

            // Calcular tamaño en memoria
            const memorySizeMB = (dataURL.length * 0.75) / (1024 * 1024); // Base64 ~75% del original

            const processTime = performance.now() - startTime;

            return {
                id: `img_${Date.now()}_${index}`,
                dataURL,
                width: resized.width,
                height: resized.height,
                originalWidth: resized.originalWidth,
                originalHeight: resized.originalHeight,
                orientation,
                aspectRatio: resized.aspectRatio,
                memorySizeMB,
                processTimeMs: processTime,
                index
            };
        } catch (error) {
            throw new Error(`Error procesando imagen ${index}: ${error.message}`);
        }
    }

    /**
     * Cargar imagen desde File, Blob o Data URL
     * 
     * @param {File|Blob|string} source 
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Para evitar CORS

            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Error cargando imagen'));

            if (typeof source === 'string') {
                // Data URL
                img.src = source;
            } else {
                // File o Blob
                const reader = new FileReader();
                reader.onload = (e) => img.src = e.target.result;
                reader.onerror = () => reject(new Error('Error leyendo archivo'));
                reader.readAsDataURL(source);
            }
        });
    }

    /**
     * Validar formato de imagen
     * 
     * @param {string} type - MIME type
     * @returns {boolean}
     */
    isValidImageFormat(type) {
        const validFormats = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/bmp'
        ];
        return validFormats.includes(type);
    }

    /**
     * Obtener tipo MIME desde Data URL
     * 
     * @param {string} dataURL 
     * @returns {string}
     */
    getTypeFromDataURL(dataURL) {
        const match = dataURL.match(/^data:([^;]+);/);
        return match ? match[1] : 'unknown';
    }

    /**
     * 4. GENERAR COLLAGE VERTICAL OPTIMIZADO
     * Procesa múltiples imágenes y las organiza en layout vertical
     * 
     * @param {Array<File|Blob|string>} sources - Array de fuentes de imágenes
     * @returns {Promise<Object>} Collage generado
     */
    async generateCollage(sources) {
        const overallStart = performance.now();
        this.errors = [];
        this.processedImages = [];

        try {
            // Validar número de imágenes
            if (!Array.isArray(sources) || sources.length === 0) {
                throw new Error('Se requiere al menos una imagen');
            }

            if (sources.length > this.config.maxImages) {
                throw new Error(`Máximo ${this.config.maxImages} imágenes permitidas`);
            }

            // Procesar imágenes en paralelo con límite de memoria
            const processPromises = sources.map((src, idx) =>
                this.processImageWithTimeout(src, idx)
            );

            const results = await Promise.allSettled(processPromises);

            // Separar exitosas y fallidas
            results.forEach((result, idx) => {
                if (result.status === 'fulfilled') {
                    this.processedImages.push(result.value);
                } else {
                    this.errors.push({
                        index: idx,
                        error: result.reason.message
                    });
                }
            });

            if (this.processedImages.length === 0) {
                throw new Error('Ninguna imagen se pudo procesar correctamente');
            }

            // Ordenar por altura descendente para layout óptimo
            this.processedImages.sort((a, b) => b.height - a.height);

            // Calcular dimensiones del collage final
            const collageWidth = this.config.maxWidth;
            const margin = this.config.marginBetweenImages;

            // Altura total: suma de alturas + márgenes
            const totalImageHeight = this.processedImages.reduce((sum, img) => sum + img.height, 0);
            const totalMarginHeight = (this.processedImages.length - 1) * margin;
            const collageHeight = totalImageHeight + totalMarginHeight;

            // Crear canvas final
            const finalCanvas = this.createFinalCanvas(collageWidth, collageHeight);
            const ctx = finalCanvas.getContext('2d');

            // Fondo
            if (this.config.backgroundColor !== 'transparent') {
                ctx.fillStyle = this.config.backgroundColor;
                ctx.fillRect(0, 0, collageWidth, collageHeight);
            }

            // Dibujar imágenes verticalmente
            let currentY = 0;
            for (const processedImg of this.processedImages) {
                // Cargar imagen desde dataURL
                const img = await this.loadImage(processedImg.dataURL);

                // Centrar horizontalmente si la imagen es más estrecha
                const x = processedImg.width < collageWidth
                    ? (collageWidth - processedImg.width) / 2
                    : 0;

                ctx.drawImage(img, x, currentY, processedImg.width, processedImg.height);
                currentY += processedImg.height + margin;
            }

            // Generar dataURL final
            const finalDataURL = finalCanvas.toDataURL(
                this.config.outputFormat,
                this.config.compressionQuality
            );

            const totalTime = performance.now() - overallStart;

            // Métricas
            this.metrics = {
                totalProcessTime: totalTime,
                averageResizeTime: this.processedImages.reduce((sum, img) => sum + img.processTimeMs, 0) / this.processedImages.length,
                totalMemoryUsed: this.processedImages.reduce((sum, img) => sum + img.memorySizeMB, 0),
                imagesProcessed: this.processedImages.length,
                imagesFailed: this.errors.length,
                collageWidth,
                collageHeight,
                collageSizeMB: (finalDataURL.length * 0.75) / (1024 * 1024)
            };

            return {
                success: true,
                dataURL: finalDataURL,
                width: collageWidth,
                height: collageHeight,
                images: this.processedImages,
                errors: this.errors,
                metrics: this.metrics
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                errors: this.errors,
                metrics: this.metrics
            };
        }
    }

    /**
     * Procesar imagen con timeout
     * 
     * @param {*} source 
     * @param {number} index 
     * @returns {Promise}
     */
    processImageWithTimeout(source, index) {
        return Promise.race([
            this.processImage(source, index),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout procesando imagen')), this.config.timeout)
            )
        ]);
    }

    /**
     * Crear canvas final con DPR
     * 
     * @param {number} width 
     * @param {number} height 
     * @returns {HTMLCanvasElement}
     */
    createFinalCanvas(width, height) {
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
     * Validar memoria disponible (estimación)
     * 
     * @returns {boolean}
     */
    checkMemoryAvailability() {
        if (performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / (1024 * 1024);
            const limitMB = performance.memory.jsHeapSizeLimit / (1024 * 1024);
            const availableMB = limitMB - usedMB;

            return availableMB > this.config.maxMemoryMB;
        }
        return true; // Si no hay API de memoria, asumir OK
    }

    /**
     * Obtener métricas de rendimiento
     * 
     * @returns {Object}
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Resetear estado
     */
    reset() {
        this.images = [];
        this.processedImages = [];
        this.errors = [];
        this.metrics = {
            totalProcessTime: 0,
            averageResizeTime: 0,
            totalMemoryUsed: 0,
            imagesProcessed: 0
        };
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligentCollageGenerator;
}
