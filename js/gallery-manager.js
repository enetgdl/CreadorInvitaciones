/**
 * GALLERY MANAGER - Gestión de Galería
 * Maneja carga de imágenes, optimización y configuración
 */

class GalleryManager {
    constructor(editor) {
        this.editor = editor;
        this.maxImages = 6;
        this.maxSizeMB = 5;
        this.isDragging = false;

        // Elementos UI
        this.dropzone = null;
        this.fileInput = null;
        this.previewList = null;
        this.countDisplay = null;
        this.modeSelect = null;
        this.carouselControls = null;
    }

    initialize() {
        this.dropzone = document.getElementById('gallery-dropzone');
        this.fileInput = document.getElementById('gallery-upload-input');
        this.previewList = document.getElementById('gallery-preview-list');
        this.countDisplay = document.getElementById('gallery-count');
        this.modeSelect = document.getElementById('galleryDisplayMode');
        this.carouselControls = document.getElementById('carousel-controls');

        if (!this.dropzone) return; // Si no existe el panel aún

        this.setupEventListeners();
        this.setupDragAndDrop();
        this.renderGallery();
        this.updateControlsVisibility();
    }

    /**
     * Configurar Listeners
     */
    setupEventListeners() {
        // Clic en dropzone -> File Input
        this.dropzone.addEventListener('click', () => this.fileInput.click());

        // Cambio en File Input
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Cambio de Modo
        this.modeSelect.addEventListener('change', (e) => {
            if (!this.editor.data.gallery) this.initData();
            this.editor.data.gallery.mode = e.target.value;
            this.updateControlsVisibility();
            this.notifyChange();
        });

        // Controles de Carrusel
        document.getElementById('carouselEffect')?.addEventListener('change', (e) => {
            this.updateCarouselSetting('effect', e.target.value);
        });

        document.getElementById('carouselInterval')?.addEventListener('input', (e) => {
            document.getElementById('carouselTimeVal').textContent = e.target.value + 's';
            this.updateCarouselSetting('interval', parseFloat(e.target.value));
        });

        document.getElementById('carouselAutoplay')?.addEventListener('change', (e) => {
            this.updateCarouselSetting('autoplay', e.target.checked);
        });
    }

    /**
     * Inicializar estructura de datos si no existe
     */
    initData() {
        if (!this.editor.data.gallery) {
            this.editor.data.gallery = {
                enabled: true,
                mode: 'collage',
                images: [],
                carouselSettings: {
                    effect: 'fade',
                    interval: 3,
                    autoplay: true
                }
            };
        }
    }

    updateCarouselSetting(key, value) {
        if (!this.editor.data.gallery.carouselSettings) {
            this.editor.data.gallery.carouselSettings = {};
        }
        this.editor.data.gallery.carouselSettings[key] = value;
        this.notifyChange();
    }

    notifyChange() {
        this.editor.isDirty = true;
        this.editor.storage.saveData(this.editor.data);
        if (this.editor.preview) {
            this.editor.preview.update('gallery', this.editor.data.gallery);
        }
    }

    updateControlsVisibility() {
        const mode = this.modeSelect.value;
        if (mode === 'carousel') {
            this.carouselControls.style.display = 'block';
        } else {
            this.carouselControls.style.display = 'none';
        }

        // Cargar valores actuales en inputs
        const data = this.editor.data.gallery || {};
        const settings = data.carouselSettings || {};

        if (document.getElementById('carouselEffect'))
            document.getElementById('carouselEffect').value = settings.effect || 'fade';

        if (document.getElementById('carouselInterval')) {
            const val = settings.interval || 3;
            document.getElementById('carouselInterval').value = val;
            document.getElementById('carouselTimeVal').textContent = val + 's';
        }

        if (document.getElementById('carouselAutoplay'))
            document.getElementById('carouselAutoplay').checked = settings.autoplay !== false;
    }

    /**
     * Drag & Drop
     */
    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, () => {
                this.dropzone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, () => {
                this.dropzone.classList.remove('drag-over');
            }, false);
        });

        this.dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            this.handleFiles(files);
        }, false);
    }

    /**
     * Procesar archivos
     */
    async handleFiles(files) {
        this.initData();
        const currentCount = this.editor.data.gallery.images.length;
        const remaining = this.maxImages - currentCount;

        if (remaining <= 0) {
            this.editor.storage.showNotification('Has alcanzado el límite de 6 imágenes', 'warning');
            return;
        }

        const filesToProcess = Array.from(files).slice(0, remaining);
        let processed = 0;

        for (const file of filesToProcess) {
            // Validaciones
            if (!file.type.startsWith('image/')) {
                this.editor.storage.showNotification(`Archivo no válido: ${file.name}`, 'error');
                continue;
            }

            if (file.size > this.maxSizeMB * 1024 * 1024) {
                this.editor.storage.showNotification(`Imagen muy pesada (>5MB): ${file.name}`, 'warning');
                continue;
            }

            try {
                const imageData = await this.optimizeImage(file);
                this.editor.data.gallery.images.push(imageData);
                processed++;
            } catch (err) {
                console.error('Error procesando imagen', err);
            }
        }

        if (processed > 0) {
            this.renderGallery();
            this.notifyChange();
            this.editor.storage.showNotification(`${processed} imágenes agregadas`, 'success');
        }

        this.fileInput.value = ''; // Reset input
    }

    /**
     * Optimizar y redimensionar imagen
     * @returns {Promise<{id, data, width, height}>}
     */
    optimizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1200;

                    // Resize lógica
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height *= maxDim / width;
                            width = maxDim;
                        } else {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compresión JPEG 0.85
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                    resolve({
                        id: 'img_' + Date.now() + Math.random().toString(36).substr(2, 9),
                        data: dataUrl,
                        width: Math.round(width),
                        height: Math.round(height),
                        orientation: width >= height ? 'horizontal' : 'vertical'
                    });
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    /**
     * Renderizar UI de Grid
     */
    renderGallery() {
        if (!this.editor.data.gallery || !this.editor.data.gallery.images) {
            this.countDisplay.innerText = '0';
            return;
        }

        const images = this.editor.data.gallery.images;
        this.previewList.innerHTML = '';
        this.countDisplay.textContent = images.length;

        images.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.draggable = true;
            div.dataset.index = index;

            div.innerHTML = `
                <img src="${img.data}" alt="Gallery ${index}">
                <button class="gallery-item-remove" title="Eliminar">✕</button>
            `;

            // Eliminar btn
            div.querySelector('.gallery-item-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeImage(index);
            });

            // Drag sorting listeners
            this.setupItemDrag(div, index);

            this.previewList.appendChild(div);
        });

        // Actualizar Select Mode si existe data
        if (this.editor.data.gallery.mode) {
            this.modeSelect.value = this.editor.data.gallery.mode;
        }
        this.updateControlsVisibility();
    }

    removeImage(index) {
        if (confirm('¿Eliminar esta imagen?')) {
            this.editor.data.gallery.images.splice(index, 1);
            this.renderGallery();
            this.notifyChange();
        }
    }

    setupItemDrag(item, index) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.gallery-item').forEach(i => i.classList.remove('drag-over-item'));
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;

            if (fromIndex !== toIndex) {
                this.moveImage(fromIndex, toIndex);
            }
        });
    }

    moveImage(from, to) {
        const images = this.editor.data.gallery.images;
        const element = images.splice(from, 1)[0];
        images.splice(to, 0, element);
        this.renderGallery();
        this.notifyChange();
    }
}
