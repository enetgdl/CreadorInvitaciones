/**
 * MEDIA-UPLOAD-UI.JS
 * Interfaz de usuario para carga y procesamiento de multimedia
 */

class MediaUploadUI {
    constructor(containerSelector, mediaProcessor) {
        this.container = document.querySelector(containerSelector);
        this.processor = mediaProcessor;
        this.uploads = new Map();

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();

        // Escuchar eventos del procesador
        window.addEventListener('mediaProcessorProgress', (e) => {
            this.updateProgress(e.detail);
        });

        console.log('✅ Media Upload UI initialized');
    }

    render() {
        this.container.innerHTML = `
            <div class="media-upload-container">
                <div class="upload-zone" id="uploadZone">
                    <div class="upload-icon">📤</div>
                    <h3>Arrastra archivos aquí</h3>
                    <p>O haz clic para seleccionar</p>
                    <p class="upload-limits">
                        <small>Imágenes: JPEG, PNG, WebP (máx. 50MB)</small><br>
                        <small>Videos: MP4, WebM, MOV (máx. 50MB, 60s)</small>
                    </p>
                    <input type="file" id="fileInput" multiple accept="image/*,video/*" style="display: none;">
                </div>
                
                <div class="uploads-list" id="uploadsList"></div>
                
                <div class="upload-stats" id="uploadStats">
                    <div class="stat">
                        <span class="stat-label">Archivos:</span>
                        <span class="stat-value" id="statFiles">0</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Tamaño total:</span>
                        <span class="stat-value" id="statSize">0 MB</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Límite:</span>
                        <span class="stat-value">10 MB</span>
                    </div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill" id="statBar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
            
            <style>
                .media-upload-container {
                    padding: 1.5rem;
                    background: var(--bg-secondary, #f8f9fa);
                    border-radius: 12px;
                }
                
                .upload-zone {
                    border: 2px dashed var(--primary, #667eea);
                    border-radius: 12px;
                    padding: 3rem 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                }
                
                .upload-zone:hover {
                    border-color: var(--primary-dark, #5568d3);
                    background: #fafbfc;
                    transform: translateY(-2px);
                }
                
                .upload-zone.dragover {
                    border-color: var(--primary-dark, #5568d3);
                    background: #f0f4ff;
                    transform: scale(1.02);
                }
                
                .upload-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .upload-zone h3 {
                    margin: 0.5rem 0;
                    color: var(--text-primary, #333);
                }
                
                .upload-zone p {
                    color: var(--text-secondary, #666);
                    margin: 0.25rem 0;
                }
                
                .upload-limits {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e0e0e0;
                }
                
                .uploads-list {
                    margin-top: 1.5rem;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .upload-item {
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                
                .upload-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .upload-item-name {
                    font-weight: 500;
                    color: var(--text-primary, #333);
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                
                .upload-item-status {
                    font-size: 0.85rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-weight: 500;
                }
                
                .upload-item-status.pending {
                    background: #fef3c7;
                    color: #92400e;
                }
                
                .upload-item-status.processing {
                    background: #dbeafe;
                    color: #1e40af;
                }
                
                .upload-item-status.completed {
                    background: #d1fae5;
                    color: #065f46;
                }
                
                .upload-item-status.failed {
                    background: #fee2e2;
                    color: #991b1b;
                }
                
                .upload-item-progress {
                    margin-top: 0.5rem;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: #e0e0e0;
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    transition: width 0.3s ease;
                    border-radius: 3px;
                }
                
                .upload-item-info {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--text-secondary, #666);
                }
                
                .upload-stats {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .stat {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                
                .stat-label {
                    font-weight: 500;
                    color: var(--text-secondary, #666);
                }
                
                .stat-value {
                    font-weight: 600;
                    color: var(--text-primary, #333);
                }
                
                .stat-bar {
                    margin-top: 0.75rem;
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .stat-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #059669);
                    transition: width 0.3s ease, background 0.3s ease;
                    border-radius: 4px;
                }
                
                .stat-bar-fill.warning {
                    background: linear-gradient(90deg, #f59e0b, #d97706);
                }
                
                .stat-bar-fill.danger {
                    background: linear-gradient(90deg, #ef4444, #dc2626);
                }
            </style>
        `;
    }

    attachEventListeners() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        // Click para abrir selector
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag & Drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');

            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
            fileInput.value = ''; // Reset input
        });
    }

    async handleFiles(files) {
        console.log(`📁 ${files.length} archivo(s) seleccionado(s)`);

        for (const file of files) {
            const uploadId = this.generateId();

            // Agregar a la interfaz
            this.addUploadItem(uploadId, file);

            try {
                // Procesar archivo
                const result = await this.processor.addToQueue(file);

                this.updateUploadItem(uploadId, {
                    status: 'completed',
                    result
                });

                console.log(`✅ Archivo procesado: ${file.name}`, result);
            } catch (error) {
                this.updateUploadItem(uploadId, {
                    status: 'failed',
                    error: error.message
                });

                console.error(`❌ Error procesando ${file.name}:`, error);
            }

            // Actualizar estadísticas
            this.updateStats();
        }
    }

    addUploadItem(id, file) {
        const uploadsList = document.getElementById('uploadsList');

        const item = document.createElement('div');
        item.className = 'upload-item';
        item.id = `upload-${id}`;
        item.dataset.uploadId = id;

        item.innerHTML = `
            <div class="upload-item-header">
                <span class="upload-item-name" title="${file.name}">${file.name}</span>
                <span class="upload-item-status pending">Pendiente</span>
            </div>
            <div class="upload-item-progress">
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: 0%"></div>
                </div>
            </div>
            <div class="upload-item-info">
                <span>Tamaño: ${this.formatSize(file.size)}</span>
                <span>Tipo: ${this.getFileTypeLabel(file.type)}</span>
            </div>
        `;

        uploadsList.prepend(item);

        this.uploads.set(id, {
            file,
            element: item,
            status: 'pending',
            progress: 0
        });
    }

    updateUploadItem(id, updates) {
        const upload = this.uploads.get(id);
        if (!upload) return;

        Object.assign(upload, updates);

        const item = upload.element;
        const statusEl = item.querySelector('.upload-item-status');
        const progressFill = item.querySelector('.progress-bar-fill');

        if (updates.status) {
            statusEl.className = `upload-item-status ${updates.status}`;
            statusEl.textContent = this.getStatusLabel(updates.status);
        }

        if (updates.progress !== undefined) {
            progressFill.style.width = `${updates.progress}%`;
        }

        if (updates.result) {
            const info = item.querySelector('.upload-item-info');
            const savings = ((1 - updates.result.totalSize / upload.file.size) * 100).toFixed(1);
            info.innerHTML += ` <span style="color: #10b981">Comprimido: ${savings}%</span>`;
        }

        if (updates.error) {
            const info = item.querySelector('.upload-item-info');
            info.innerHTML += ` <span style="color: #ef4444">Error: ${updates.error}</span>`;
        }
    }

    updateProgress(detail) {
        // Buscar upload por fileName
        for (const [id, upload] of this.uploads.entries()) {
            if (upload.file.name === detail.fileName) {
                this.updateUploadItem(id, {
                    status: detail.status,
                    progress: detail.progress
                });
                break;
            }
        }
    }

    updateStats() {
        const status = this.processor.getStatus();

        document.getElementById('statFiles').textContent = status.processedCount;
        document.getElementById('statSize').textContent = this.formatSize(status.totalSize);

        const percentage = status.percentageUsed;
        const statBar = document.getElementById('statBar');
        statBar.style.width = `${percentage}%`;

        // Cambiar color según uso
        statBar.className = 'stat-bar-fill';
        if (percentage > 90) {
            statBar.classList.add('danger');
        } else if (percentage > 70) {
            statBar.classList.add('warning');
        }
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileTypeLabel(mimeType) {
        if (mimeType.startsWith('image/')) return 'Imagen';
        if (mimeType.startsWith('video/')) return 'Video';
        return 'Archivo';
    }

    getStatusLabel(status) {
        const labels = {
            pending: 'Pendiente',
            processing: 'Procesando',
            completed: 'Completado',
            failed: 'Error'
        };
        return labels[status] || status;
    }

    generateId() {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaUploadUI;
}

console.log('✅ Media Upload UI module loaded');
