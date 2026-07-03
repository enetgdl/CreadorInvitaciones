/**
 * MEDIA-PROCESSOR.JS
 * Sistema completo de procesamiento y optimización de multimedia
 * Usa Compressor.js para imágenes y MediaRecorder API para videos
 */

class MediaProcessor {
    constructor(options = {}) {
        this.config = {
            // Límites de tamaño
            maxInputSize: options.maxInputSize || 50 * 1024 * 1024, // 50MB
            maxTotalOutputSize: options.maxTotalOutputSize || 10 * 1024 * 1024, // 10MB

            // Dimensiones máximas
            maxImageWidth: options.maxImageWidth || 1920,
            maxImageHeight: options.maxImageHeight || 1080,
            maxVideoWidth: options.maxVideoWidth || 1280,
            maxVideoHeight: options.maxVideoHeight || 720,

            // Calidad de compresión
            imageQuality: options.imageQuality || 0.8,
            thumbnailQuality: options.thumbnailQuality || 0.7,
            videoQuality: options.videoQuality || 1.5, // Mbps
            audioQuality: options.audioQuality || 128, // kbps

            // Configuración de video
            maxVideoDuration: options.maxVideoDuration || 60, // segundos
            videoFrameRate: options.videoFrameRate || 30,

            // Formatos
            preferWebP: options.preferWebP !== false,
            preferWebM: options.preferWebM !== false,

            ...options
        };

        this.queue = [];
        this.processing = false;
        this.processedFiles = [];
        this.totalSize = 0;

        this.checkBrowserSupport();
    }

    /**
     * Verificar soporte del navegador
     */
    checkBrowserSupport() {
        this.support = {
            webp: this.supportsWebP(),
            webm: this.supportsWebM(),
            canvas: typeof HTMLCanvasElement !== 'undefined',
            mediaRecorder: typeof MediaRecorder !== 'undefined'
        };

        console.log('🎬 Media Processor - Soporte del navegador:', this.support);
    }

    /**
     * Detectar soporte de WebP
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    /**
     * Detectar soporte de WebM
     */
    supportsWebM() {
        if (typeof MediaRecorder === 'undefined') return false;

        return MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
            MediaRecorder.isTypeSupported('video/webm;codecs=vp8');
    }

    /**
     * Agregar archivo a la cola de procesamiento
     */
    async addToQueue(file, options = {}) {
        return new Promise((resolve, reject) => {
            const task = {
                id: this.generateId(),
                file,
                options,
                status: 'pending',
                progress: 0,
                resolve,
                reject,
                retries: 0,
                maxRetries: options.maxRetries || 3
            };

            this.queue.push(task);
            this.processQueue();
        });
    }

    /**
     * Procesar cola de tareas
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();

            try {
                task.status = 'processing';
                this.notifyProgress(task, 0);

                const result = await this.processFile(task);

                task.status = 'completed';
                task.progress = 100;
                this.notifyProgress(task, 100);

                task.resolve(result);
            } catch (error) {
                task.retries++;

                if (task.retries < task.maxRetries) {
                    console.warn(`⚠️ Reintentando tarea ${task.id} (${task.retries}/${task.maxRetries})`);
                    this.queue.unshift(task); // Reintroducir al inicio de la cola
                } else {
                    task.status = 'failed';
                    task.error = error;
                    this.notifyProgress(task, 0);
                    task.reject(error);
                }
            }
        }

        this.processing = false;
    }

    /**
     * Procesar un archivo
     */
    async processFile(task) {
        const { file, options } = task;

        // Validar archivo
        const validation = await this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        this.notifyProgress(task, 10);

        // Determinar tipo de archivo
        const fileType = this.getFileType(file);

        let result;
        if (fileType === 'image') {
            result = await this.processImage(file, task, options);
        } else if (fileType === 'video') {
            result = await this.processVideo(file, task, options);
        } else {
            throw new Error(`Tipo de archivo no soportado: ${file.type}`);
        }

        // Verificar tamaño total
        this.processedFiles.push(result);
        this.updateTotalSize();

        if (this.totalSize > this.config.maxTotalOutputSize) {
            console.warn('⚠️ Tamaño total excedido, aplicando compresión adicional');
            await this.optimizeOutput();
        }

        return result;
    }

    /**
     * Validar archivo de entrada
     */
    async validateFile(file) {
        const validation = { valid: true, error: null };

        // Verificar tamaño
        if (file.size > this.config.maxInputSize) {
            validation.valid = false;
            validation.error = `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo: ${this.config.maxInputSize / 1024 / 1024}MB)`;
            return validation;
        }

        // Verificar formato
        const supportedFormats = [
            'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
        ];

        if (!supportedFormats.includes(file.type)) {
            validation.valid = false;
            validation.error = `Formato no soportado: ${file.type}`;
            return validation;
        }

        // Para videos, verificar duración
        if (file.type.startsWith('video/')) {
            try {
                const duration = await this.getVideoDuration(file);
                if (duration > this.config.maxVideoDuration) {
                    validation.valid = false;
                    validation.error = `Video demasiado largo: ${duration}s (máximo: ${this.config.maxVideoDuration}s)`;
                    return validation;
                }
            } catch (error) {
                console.warn('No se pudo verificar duración del video:', error);
            }
        }

        return validation;
    }

    /**
     * Procesar imagen
     */
    async processImage(file, task, options = {}) {
        this.notifyProgress(task, 20);

        // Cargar imagen
        const img = await this.loadImage(file);

        this.notifyProgress(task, 30);

        // Detectar orientación y obtener dimensiones
        const metadata = this.getImageMetadata(img);

        // Calcular dimensiones finales
        const finalDimensions = this.calculateImageDimensions(
            metadata.width,
            metadata.height,
            this.config.maxImageWidth,
            this.config.maxImageHeight
        );

        this.notifyProgress(task, 40);

        // Generar versiones
        const versions = await this.generateImageVersions(img, task);

        this.notifyProgress(task, 90);

        // Limpiar metadatos innecesarios (ya están en memoria, no en blob)
        const result = {
            id: task.id,
            type: 'image',
            originalName: file.name,
            originalSize: file.size,
            versions,
            metadata: {
                width: metadata.width,
                height: metadata.height,
                format: versions.full.format
            },
            totalSize: versions.full.size + versions.medium.size + versions.thumbnail.size
        };

        return result;
    }

    /**
     * Generar múltiples versiones de una imagen
     */
    async generateImageVersions(img, task) {
        const versions = {};

        // Version completa (full)
        versions.full = await this.compressImage(img, {
            maxWidth: this.config.maxImageWidth,
            maxHeight: this.config.maxImageHeight,
            quality: this.config.imageQuality,
            mimeType: this.config.preferWebP && this.support.webp ? 'image/webp' : 'image/jpeg'
        });

        this.notifyProgress(task, 60);

        // Version media (medium)
        versions.medium = await this.compressImage(img, {
            maxWidth: 800,
            maxHeight: 600,
            quality: 0.75,
            mimeType: this.config.preferWebP && this.support.webp ? 'image/webp' : 'image/jpeg'
        });

        this.notifyProgress(task, 75);

        // Version thumbnail
        versions.thumbnail = await this.compressImage(img, {
            maxWidth: 400,
            maxHeight: 400,
            quality: this.config.thumbnailQuality,
            mimeType: this.config.preferWebP && this.support.webp ? 'image/webp' : 'image/jpeg'
        });

        return versions;
    }

    /**
     * Comprimir imagen usando Canvas y Compressor.js
     */
    async compressImage(img, options) {
        return new Promise((resolve, reject) => {
            // Crear canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calcular dimensiones
            const dims = this.calculateImageDimensions(
                img.naturalWidth || img.width,
                img.naturalHeight || img.height,
                options.maxWidth,
                options.maxHeight
            );

            canvas.width = dims.width;
            canvas.height = dims.height;

            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, dims.width, dims.height);

            // Convertir a blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Error al generar blob de imagen'));
                        return;
                    }

                    // Si existe Compressor.js, usarlo para comprimir más
                    if (typeof Compressor !== 'undefined') {
                        new Compressor(blob, {
                            quality: options.quality,
                            mimeType: options.mimeType,
                            success: (compressedBlob) => {
                                resolve({
                                    blob: compressedBlob,
                                    url: URL.createObjectURL(compressedBlob),
                                    size: compressedBlob.size,
                                    format: compressedBlob.type,
                                    width: dims.width,
                                    height: dims.height
                                });
                            },
                            error: (err) => {
                                // Fallback al blob original si Compressor falla
                                console.warn('Compressor.js falló, usando blob original:', err);
                                resolve({
                                    blob,
                                    url: URL.createObjectURL(blob),
                                    size: blob.size,
                                    format: blob.type,
                                    width: dims.width,
                                    height: dims.height
                                });
                            }
                        });
                    } else {
                        // Sin Compressor.js, usar blob directo
                        resolve({
                            blob,
                            url: URL.createObjectURL(blob),
                            size: blob.size,
                            format: blob.type,
                            width: dims.width,
                            height: dims.height
                        });
                    }
                },
                options.mimeType,
                options.quality
            );
        });
    }

    /**
     * Procesar video
     */
    async processVideo(file, task, options = {}) {
        if (!this.support.mediaRecorder) {
            throw new Error('MediaRecorder API no soportada en este navegador');
        }

        this.notifyProgress(task, 20);

        // Cargar video
        const video = await this.loadVideo(file);

        this.notifyProgress(task, 30);

        // Obtener metadatos
        const metadata = this.getVideoMetadata(video);

        // Calcular dimensiones finales
        const finalDimensions = this.calculateImageDimensions(
            metadata.width,
            metadata.height,
            this.config.maxVideoWidth,
            this.config.maxVideoHeight
        );

        this.notifyProgress(task, 40);

        // Recodificar video
        const compressed = await this.compressVideo(video, finalDimensions, task);

        this.notifyProgress(task, 90);

        const result = {
            id: task.id,
            type: 'video',
            originalName: file.name,
            originalSize: file.size,
            compressed,
            metadata: {
                width: finalDimensions.width,
                height: finalDimensions.height,
                duration: metadata.duration,
                format: compressed.format
            },
            totalSize: compressed.size
        };

        return result;
    }

    /**
     * Comprimir video usando Canvas + MediaRecorder
     */
    async compressVideo(video, dimensions, task) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = dimensions.width;
            canvas.height = dimensions.height;

            const ctx = canvas.getContext('2d');

            // Determinar formato y codec
            let mimeType;
            let codecOptions;

            if (this.support.webm && this.config.preferWebM) {
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    mimeType = 'video/webm;codecs=vp9';
                } else {
                    mimeType = 'video/webm;codecs=vp8';
                }
            } else {
                mimeType = 'video/mp4'; // Safari fallback
            }

            // Configurar MediaRecorder
            const stream = canvas.captureStream(this.config.videoFrameRate);

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: this.config.videoQuality * 1000000, // Convertir Mbps a bps
                audioBitsPerSecond: this.config.audioQuality * 1000
            });

            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                resolve({
                    blob,
                    url: URL.createObjectURL(blob),
                    size: blob.size,
                    format: mimeType,
                    width: dimensions.width,
                    height: dimensions.height
                });
            };

            recorder.onerror = (error) => {
                reject(error);
            };

            // Iniciar grabación
            recorder.start();

            // Dibujar frames del video
            video.currentTime = 0;
            video.play();

            const drawFrame = () => {
                if (video.paused || video.ended) {
                    recorder.stop();
                    video.pause();
                    return;
                }

                ctx.drawImage(video, 0, 0, dimensions.width, dimensions.height);

                // Actualizar progreso
                const progress = 40 + (video.currentTime / video.duration) * 50;
                this.notifyProgress(task, Math.min(90, progress));

                requestAnimationFrame(drawFrame);
            };

            video.onplaying = () => {
                drawFrame();
            };
        });
    }

    /**
     * Cargar imagen desde archivo
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Cargar video desde archivo
     */
    loadVideo(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;

            video.onloadedmetadata = () => resolve(video);
            video.onerror = reject;

            video.src = URL.createObjectURL(file);
        });
    }

    /**
     * Obtener metadatos de imagen
     */
    getImageMetadata(img) {
        return {
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height)
        };
    }

    /**
     * Obtener metadatos de video
     */
    getVideoMetadata(video) {
        return {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            aspectRatio: video.videoWidth / video.videoHeight
        };
    }

    /**
     * Obtener duración de video
     */
    getVideoDuration(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                resolve(video.duration);
                URL.revokeObjectURL(video.src);
            };

            video.onerror = reject;
            video.src = URL.createObjectURL(file);
        });
    }

    /**
     * Calcular dimensiones manteniendo aspect ratio
     */
    calculateImageDimensions(width, height, maxWidth, maxHeight) {
        let newWidth = width;
        let newHeight = height;

        if (width > maxWidth) {
            newWidth = maxWidth;
            newHeight = (height * maxWidth) / width;
        }

        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = (width * maxHeight) / height;
        }

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight)
        };
    }

    /**
     * Determinar tipo de archivo
     */
    getFileType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        return 'unknown';
    }

    /**
     * Actualizar tamaño total de archivos procesados
     */
    updateTotalSize() {
        this.totalSize = this.processedFiles.reduce((sum, file) => {
            return sum + (file.totalSize || 0);
        }, 0);

        console.log(`📊 Tamaño total actual: ${(this.totalSize / 1024 / 1024).toFixed(2)}MB / ${(this.config.maxTotalOutputSize / 1024 / 1024).toFixed(2)}MB`);
    }

    /**
     * Optimizar salida si excede el límite
     */
    async optimizeOutput() {
        console.log('🔧 Optimizando archivos para cumplir límite de tamaño...');

        // Reducir calidad de imágenes
        for (const file of this.processedFiles) {
            if (file.type === 'image') {
                // Recomprimir con calidad reducida
                // Implementar lógica de recompresión
            }
        }

        this.updateTotalSize();
    }

    /**
     * Notificar progreso
     */
    notifyProgress(task, progress) {
        task.progress = progress;

        const event = new CustomEvent('mediaProcessorProgress', {
            detail: {
                taskId: task.id,
                fileName: task.file.name,
                progress,
                status: task.status
            }
        });

        window.dispatchEvent(event);
    }

    /**
     * Generar ID único
     */
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtener estado del procesador
     */
    getStatus() {
        return {
            processing: this.processing,
            queueLength: this.queue.length,
            processedCount: this.processedFiles.length,
            totalSize: this.totalSize,
            maxTotalSize: this.config.maxTotalOutputSize,
            percentageUsed: (this.totalSize / this.config.maxTotalOutputSize) * 100
        };
    }

    /**
     * Limpiar archivos procesados
     */
    cleanup() {
        this.processedFiles.forEach(file => {
            if (file.type === 'image') {
                Object.values(file.versions).forEach(version => {
                    URL.revokeObjectURL(version.url);
                });
            } else if (file.type === 'video') {
                URL.revokeObjectURL(file.compressed.url);
            }
        });

        this.processedFiles = [];
        this total = 0;

        console.log('🗑️ Archivos temporales limpiados');
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaProcessor;
}

console.log('✅ Media Processor module loaded');
