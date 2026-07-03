/**
 * INTEGRATION GUIDE - Intelligent Collage Generator
 * Guía de integración con el sistema existente
 * 
 * @version 1.0.0
 * @date 2026-02-03
 */

// =========================================
// PASO 1: Incluir el nuevo módulo en index.html
// =========================================

/*
<script src="js/intelligent-collage-generator.js"></script>
<script src="js/gallery-manager-enhanced.js"></script>
*/

// =========================================
// PASO 2: GalleryManager Mejorado
// =========================================

class GalleryManagerEnhanced extends GalleryManager {
    constructor(editor) {
        super(editor);

        // Inicializar generador de collages inteligente (vertical)
        this.collageGenerator = new IntelligentCollageGenerator({
            maxWidth: 1080,
            margin: 15,
            backgroundColor: '#FFFFFF',
            quality: 0.92,
            interpolation: 'bicubic',
            outputFormat: 'image/jpeg',
            maxImages: 20
        });

        // Inicializar generador de masonry (grid sin recuadros negros)
        this.masonryGenerator = new MasonryCollageGenerator({
            width: 1080,
            height: 1920,
            margin: 4,
            quality: 0.92,
            backgroundColor: '#000000',
            gridColumns: 6,
            gridRows: 12
        });

        // Estado de generación
        this.isGeneratingCollage = false;
        this.collageProgress = 0;
        this.collageType = 'masonry'; // 'masonry' o 'vertical'
    }

    /**
     * Override: Optimizar imagen con detección de orientación inteligente
     */
    async optimizeImage(file) {
        try {
            // Convertir File a array para usar el generador
            const result = await this.collageGenerator.processImage(file, 0);

            return {
                id: result.id,
                data: result.dataURL,
                width: result.width,
                height: result.height,
                orientation: result.orientation,  // ← Nuevo: orientación detectada
                aspectRatio: result.aspectRatio,   // ← Nuevo: aspect ratio
                memorySizeMB: result.memorySizeMB,
                processTimeMs: result.processTimeMs
            };
        } catch (error) {
            console.error('Error optimizando imagen:', error);
            throw error;
        }
    }

    /**
     * NUEVO: Generar collage automático vertical
     */
    async generateAutomaticCollage() {
        if (!this.editor.data.gallery || !this.editor.data.gallery.images) {
            this.editor.storage.showNotification('No hay imágenes para generar collage', 'warning');
            return;
        }

        const images = this.editor.data.gallery.images;

        if (images.length === 0) {
            this.editor.storage.showNotification('Agrega al menos una imagen', 'warning');
            return;
        }

        this.isGeneratingCollage = true;
        this.showCollageProgress(0);

        try {
            // Extraer data URLs de las imágenes
            const dataSources = images.map(img => img.data);

            // Generar collage
            const result = await this.collageGenerator.generateCollage(dataSources);

            if (result.success) {
                // Reemplazar galería con el collage generado
                this.editor.data.gallery.images = [{
                    id: 'collage_' + Date.now(),
                    data: result.dataURL,
                    width: result.width,
                    height: result.height,
                    orientation: 'vertical', // Siempre vertical
                    isCollage: true
                }];

                // Cambiar modo a collage
                this.editor.data.gallery.mode = 'collage';

                this.renderGallery();
                this.notifyChange();

                // Mostrar estadísticas
                const metrics = result.metrics;
                this.editor.storage.showNotification(
                    `✓ Collage generado: ${metrics.imagesProcessed} imágenes en ${(metrics.totalProcessTime / 1000).toFixed(1)}s`,
                    'success'
                );

                this.showCollageMetrics(metrics);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error generando collage:', error);
            this.editor.storage.showNotification(
                `Error generando collage: ${error.message}`,
                'error'
            );
        } finally {
            this.isGeneratingCollage = false;
            this.hideCollageProgress();
        }
    }

    /**
     * NUEVO: Generar collage tipo Masonry (grid sin recuadros negros)
     * Usa recorte inteligente tipo object-fit: cover
     */
    async generateMasonryCollage() {
        if (!this.editor.data.gallery || !this.editor.data.gallery.images) {
            this.editor.storage.showNotification('No hay imágenes para generar collage', 'warning');
            return;
        }

        const images = this.editor.data.gallery.images;

        if (images.length < 3) {
            this.editor.storage.showNotification('Se requieren al menos 3 imágenes para collage masonry', 'warning');
            return;
        }

        this.isGeneratingCollage = true;
        this.showCollageProgress(0, 'Generando Collage Masonry (sin recuadros)...');

        try {
            // Extraer data URLs de las imágenes
            const dataSources = images.map(img => img.data);

            // Generar collage masonry
            const result = await this.masonryGenerator.generateCollage(dataSources);

            if (result.success) {
                // Reemplazar galería con el collage generado
                this.editor.data.gallery.images = [{
                    id: 'masonry_collage_' + Date.now(),
                    data: result.dataURL,
                    width: result.width,
                    height: result.height,
                    orientation: 'vertical',
                    isCollage: true,
                    collageType: 'masonry'
                }];

                // Cambiar modo a collage
                this.editor.data.gallery.mode = 'collage';

                this.renderGallery();
                this.notifyChange();

                // Mostrar estadísticas
                this.editor.storage.showNotification(
                    `✓ Collage Masonry generado: ${result.imagesUsed} imágenes (${result.width}x${result.height}px) - Sin recuadros negros`,
                    'success'
                );

                console.log('Collage Masonry generado:', {
                    dimensiones: `${result.width}x${result.height}px`,
                    imágenesUsadas: result.imagesUsed,
                    patrón: result.pattern
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error generando collage masonry:', error);
            this.editor.storage.showNotification(
                `Error generando collage: ${error.message}`,
                'error'
            );
        } finally {
            this.isGeneratingCollage = false;
            this.hideCollageProgress();
        }
    }

    /**
     * Mostrar barra de progreso
     */
    showCollageProgress(percentage, message = 'Procesando imágenes...') {
        let progressBar = document.getElementById('collage-progress-bar');

        if (!progressBar) {
            const container = document.createElement('div');
            container.id = 'collage-progress-container';
            container.innerHTML = `
                <div class="collage-progress-overlay">
                    <div class="collage-progress-modal">
                        <h3 id="collage-progress-title">Generando Collage Inteligente...</h3>
                        <div class="progress-bar-container">
                            <div id="collage-progress-bar" class="progress-bar"></div>
                        </div>
                        <p id="collage-progress-text">Procesando imágenes...</p>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
            progressBar = document.getElementById('collage-progress-bar');
        }

        // Actualizar título si es masonry
        if (message.includes('Masonry')) {
            const title = document.getElementById('collage-progress-title');
            if (title) title.textContent = message;
        }

        progressBar.style.width = percentage + '%';
        document.getElementById('collage-progress-text').textContent =
            `${Math.round(percentage)}% completado`;
    }

    hideCollageProgress() {
        const container = document.getElementById('collage-progress-container');
        if (container) {
            container.remove();
        }
    }

    /**
     * Mostrar métricas del collage generado
     */
    showCollageMetrics(metrics) {
        console.table({
            'Dimensiones': `${metrics.collageWidth}x${metrics.collageHeight}px`,
            'Imágenes procesadas': metrics.imagesProcessed,
            'Imágenes fallidas': metrics.imagesFailed || 0,
            'Tiempo total': `${(metrics.totalProcessTime / 1000).toFixed(2)}s`,
            'Tiempo promedio': `${metrics.averageResizeTime.toFixed(2)}ms`,
            'Memoria usada': `${metrics.totalMemoryUsed.toFixed(2)}MB`,
            'Tamaño collage': `${metrics.collageSizeMB.toFixed(2)}MB`
        });
    }

    /**
     * NUEVO: Añadir botón de "Generar Collage Automático" en UI
     */
    initialize() {
        super.initialize();

        // Añadir botón de collage automático
        const galleryPanel = document.querySelector('#media-tab');
        if (galleryPanel && !document.getElementById('auto-collage-btn')) {
            const collageBtn = document.createElement('button');
            collageBtn.id = 'auto-collage-btn';
            collageBtn.className = 'btn btn-collage';
            collageBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                </svg>
                Generar Collage Automático
            `;

            collageBtn.addEventListener('click', () => {
                this.generateAutomaticCollage();
            });

            // Insertar después del contador de imágenes
            const countDisplay = document.getElementById('gallery-count');
            if (countDisplay && countDisplay.parentElement) {
                countDisplay.parentElement.appendChild(collageBtn);
            }
        }
    }

    /**
     * NUEVO: Descargar collage generado
     */
    downloadCollage() {
        const images = this.editor.data.gallery.images;
        const collageImage = images.find(img => img.isCollage);

        if (!collageImage) {
            this.editor.storage.showNotification('No hay collage generado', 'warning');
            return;
        }

        const a = document.createElement('a');
        a.href = collageImage.data;
        a.download = `collage_${Date.now()}.jpg`;
        a.click();

        this.editor.storage.showNotification('Collage descargado', 'success');
    }
}

// =========================================
// PASO 3: Uso en el Editor Principal
// =========================================

/*
// En editor.js o main.js

// Reemplazar GalleryManager por GalleryManagerEnhanced
class InvitationEditor {
    constructor() {
        // ... código existente ...
        
        // Cambiar esto:
        // this.galleryManager = new GalleryManager(this);
        
        // Por esto:
        this.galleryManager = new GalleryManagerEnhanced(this);
        
        // ... resto del código ...
    }
}
*/

// =========================================
// PASO 4: Estilos CSS para UI del Collage
// =========================================

const collageStyles = `
<style>
/* Botón de Collage Automático */
.btn-collage {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    margin-top: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-collage:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-collage:active {
    transform: translateY(0);
}

.btn-collage svg {
    fill: currentColor;
}

/* Progress Overlay */
.collage-progress-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
}

.collage-progress-modal {
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    min-width: 400px;
    text-align: center;
}

.collage-progress-modal h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 20px;
    font-weight: 600;
}

.progress-bar-container {
    width: 100%;
    height: 8px;
    background: #E0E0E0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 16px;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    width: 0%;
    transition: width 0.3s ease;
    border-radius: 4px;
}

#collage-progress-text {
    color: #666;
    font-size: 14px;
    margin: 0;
}

/* Indicador de collage en galería */
.gallery-item.is-collage {
    border: 2px solid #667eea;
    position: relative;
}

.gallery-item.is-collage::after {
    content: 'COLLAGE';
    position: absolute;
    top: 8px;
    right: 8px;
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

/* Métricas del collage */
.collage-metrics {
    margin-top: 16px;
    padding: 16px;
    background: #f5f5f5;
    border-radius: 8px;
    font-size: 13px;
}

.collage-metrics h4 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 14px;
}

.collage-metrics dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    margin: 0;
}

.collage-metrics dt {
    font-weight: 600;
    color: #666;
}

.collage-metrics dd {
    margin: 0;
    color: #333;
    text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
    .collage-progress-modal {
        min-width: auto;
        width: 90%;
        padding: 24px;
    }
    
    .btn-collage {
        width: 100%;
        justify-content: center;
    }
}
</style>
`;

// =========================================
// PASO 5: Ejemplo de HTML Completo
// =========================================

const exampleHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Demo - Intelligent Collage Generator</title>
    ${collageStyles}
</head>
<body>
    <div class="container">
        <h1>🎨 Generador de Collages Inteligente</h1>
        
        <div class="upload-section">
            <input type="file" id="imageInput" multiple accept="image/*" />
            <button id="generateBtn" class="btn-collage">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                </svg>
                Generar Collage Automático
            </button>
        </div>

        <div id="output-section" style="display: none;">
            <h2>Resultado</h2>
            <img id="collageOutput" style="max-width: 100%; border-radius: 8px;" />
            
            <div class="collage-metrics">
                <h4>📊 Métricas de Rendimiento</h4>
                <dl id="metricsDisplay"></dl>
            </div>

            <button id="downloadBtn" class="btn-collage">Descargar Collage</button>
        </div>
    </div>

    <script src="js/intelligent-collage-generator.js"></script>
    <script>
        const generator = new IntelligentCollageGenerator({
            maxWidth: 1080,
            margin: 15,
            backgroundColor: '#FFFFFF',
            quality: 0.92
        });

        document.getElementById('generateBtn').addEventListener('click', async () => {
            const files = document.getElementById('imageInput').files;
            
            if (files.length === 0) {
                alert('Selecciona al menos una imagen');
                return;
            }

            const btn = document.getElementById('generateBtn');
            btn.disabled = true;
            btn.textContent = 'Generando...';

            try {
                const result = await generator.generateCollage(Array.from(files));

                if (result.success) {
                    // Mostrar resultado
                    document.getElementById('collageOutput').src = result.dataURL;
                    document.getElementById('output-section').style.display = 'block';

                    // Mostrar métricas
                    const metrics = result.metrics;
                    document.getElementById('metricsDisplay').innerHTML = \`
                        <dt>Dimensiones:</dt>
                        <dd>\${metrics.collageWidth}x\${metrics.collageHeight}px</dd>
                        
                        <dt>Imágenes:</dt>
                        <dd>\${metrics.imagesProcessed}</dd>
                        
                        <dt>Tiempo total:</dt>
                        <dd>\${(metrics.totalProcessTime / 1000).toFixed(2)}s</dd>
                        
                        <dt>Tiempo promedio:</dt>
                        <dd>\${metrics.averageResizeTime.toFixed(2)}ms</dd>
                        
                        <dt>Tamaño:</dt>
                        <dd>\${metrics.collageSizeMB.toFixed(2)}MB</dd>
                    \`;

                    // Scroll al resultado
                    document.getElementById('output-section').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error(error);
                alert('Error inesperado: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = \`
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                    </svg>
                    Generar Collage Automático
                \`;
            }
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            const img = document.getElementById('collageOutput');
            const a = document.createElement('a');
            a.href = img.src;
            a.download = \`collage_\${Date.now()}.jpg\`;
            a.click();
        });
    </script>
</body>
</html>
`;

// =========================================
// EXPORTAR PARA USO
// =========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GalleryManagerEnhanced,
        collageStyles,
        exampleHTML
    };
}
