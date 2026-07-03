/**
 * STORAGE.JS - Sistema de Almacenamiento Local
 * Maneja la persistencia de datos de invitaciones usando localStorage
 */

class InvitationStorage {
    constructor() {
        this.storageKey = 'invitation_data';
        this.autoSaveInterval = null;
        this.autoSaveDelay = 2000; // 2 segundos
        this.maxImageWidth = 1920; // Ancho máximo para imágenes
        this.imageQuality = 0.8; // Calidad de compresión JPEG
        this.currentData = null; // Mantiene el estado sincronizado en memoria
    }

    /**
     * Inicializa el almacenamiento asíncrono desde IndexedDB o migra desde localStorage
     */
    async initialize() {
        try {
            // 1. Intentar cargar desde IndexedDB
            let data = await window.indexedDBManager.get(this.storageKey);
            
            // 2. Si no hay datos, revisar localStorage (Migración transparente)
            if (!data) {
                const rawLocal = localStorage.getItem(this.storageKey);
                if (rawLocal) {
                    console.log('📦 [Storage] Migrando datos legacy de localStorage a IndexedDB...');
                    data = JSON.parse(rawLocal);
                    localStorage.removeItem(this.storageKey); // Limpiar legacy
                }
            }

            // 3. Setear en memoria y migrar schema si aplica
            if (data) {
                this.currentData = this.migrateData(data);
                await window.indexedDBManager.put(this.storageKey, this.currentData);
            } else {
                this.currentData = this.getDefaultData();
            }
        } catch (error) {
            console.error('❌ [Storage] Error fatal en inicialización:', error);
            this.currentData = this.getDefaultData();
        }
    }

    /**
     * Comprimir imagen antes de guardar
     * @param {string} dataURL - Data URL de la imagen
     * @param {number} maxWidth - Ancho máximo (default: 1920)
     * @param {number} quality - Calidad JPEG (default: 0.8)
     * @returns {Promise<string>} Data URL comprimido
     */
    async compressImage(dataURL, maxWidth = null, quality = null) {
        const maxW = maxWidth || this.maxImageWidth;
        const q = quality || this.imageQuality;
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                // Redimensionar si excede el ancho máximo
                if (width > maxW) {
                    height = (height * maxW) / width;
                    width = maxW;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convertir a JPEG con calidad reducida
                const compressedDataURL = canvas.toDataURL('image/jpeg', q);
                resolve(compressedDataURL);
            };
            img.onerror = () => resolve(dataURL); // Si falla, retornar original
            img.src = dataURL;
        });
    }

    /**
     * Comprimir todas las imágenes de la galería
     * @param {object} galleryData - Datos de la galería
     * @returns {Promise<object>} Galería con imágenes comprimidas
     */
    async compressGalleryImages(galleryData) {
        if (!galleryData || !galleryData.images || galleryData.images.length === 0) {
            return galleryData;
        }
        
        const compressedImages = [];
        for (const img of galleryData.images) {
            if (img.data && img.data.startsWith('data:image/')) {
                const compressed = await this.compressImage(img.data, 1200, 0.75);
                compressedImages.push({
                    ...img,
                    data: compressed
                });
            } else {
                compressedImages.push(img);
            }
        }
        
        return {
            ...galleryData,
            images: compressedImages
        };
    }

    /**
     * Obtener datos de la invitación actual (síncrono desde memoria)
     */
    getData() {
        if (!this.currentData) {
            console.warn('⚠️ [Storage] getData() llamado antes de la inicialización asíncrona.');
            this.currentData = this.getDefaultData();
        }
        return this.currentData;
    }

    /**
     * Migración automática del schema de datos.
     * Garantiza que datos de versiones anteriores no rompan el layout actual.
     */
    migrateData(data) {
        const CURRENT_SCHEMA = 2;
        if (data._schemaVersion >= CURRENT_SCHEMA) return data; // ya actualizado

        console.log(`[Storage] Migrando schema v${data._schemaVersion || 1} → v${CURRENT_SCHEMA}...`);

        // ── Migración v1 → v2 ──
        // Elementos cuyo tamaño es gestionado por CSS de plantilla.
        // Se eliminan width/height/tx/ty guardados de sesiones anteriores
        // para evitar que rompan el flujo flexbox del layout actual.
        const FLOW_ELEMENTS = new Set([
            'heroSection', 'contentSection', 'massInfo', 'countdownSection',
            'rsvpSection', 'mapSection', 'qrSection', 'footerSection', 'confirmSection',
            'eventDate', 'eventTime', 'eventLocation', 'eventAddress',
            'massTime', 'massLocation', 'massAddress',
            'eventDetails', 'eventType', 'eventName', 'honoredName', 'divider',
            'dressCode', 'mainMessage', 'countdownText', 'countdownDisplay',
            'rsvpTitle', 'rsvpButton', 'mapTitle', 'closingMessage',
            'eventHashtag', 'confirmPhone', 'footerText'
        ]);

        if (data.designElements && typeof data.designElements === 'object') {
            for (const [id, el] of Object.entries(data.designElements)) {
                if (!el || typeof el !== 'object') continue;
                if (FLOW_ELEMENTS.has(id)) {
                    // Preservar solo propiedades visuales; borrar dimensiones forzadas
                    delete el.width;
                    delete el.height;
                    delete el.tx;
                    delete el.ty;
                    delete el.zIndex;
                }
            }
            console.log('[Storage] designElements de elementos de flujo limpiados.');
        }

        data._schemaVersion = CURRENT_SCHEMA;
        return data;
    }

    /**
     * Datos predeterminados para nueva invitación (Schema v2)
     */
    getDefaultData() {
        return {
            _schemaVersion: 2,
            // General
            eventType: 'xv',
            eventName: '',
            honoredName: '',
            eventDate: '',
            eventTime: '12:00',
            eventLocation: '',
            eventAddress: '',

            // Misa / Ceremonia
            massLocation: '',
            enableMassLocation: true,
            massTime: '10:00',
            enableMassTime: true,
            massAddress: '',
            enableMassAddress: true,

            // Diseño
            primaryColor: '#FFD700',
            secondaryColor: '#FFF8DC',
            textColor: '#333333',
            titleFont: "'Great Vibes', cursive",
            bodyFont: "'Montserrat', sans-serif",
            backgroundEffect: 'none',
            overlayOpacity: 30,

            // Galería
            gallery: {
                enabled: true,
                mode: 'collage', // 'collage' o 'carousel'
                images: [], // Array de { id, data, width, height }
                carouselSettings: {
                    effect: 'fade',
                    interval: 3,
                    autoplay: true
                }
            },

            // Estilos Avanzados por Elemento
            elementStyles: {
                eventType: {
                    color: '',
                    borderEnabled: false,
                    borderColor: '#000000',
                    borderWidth: 1,
                    borderOpacity: 100,
                    shadowEnabled: false,
                    shadowColor: '#000000',
                    shadowBlur: 5,
                    shadowOpacity: 50,
                    gradient: null
                },
                eventName: {
                    color: '',
                    borderEnabled: false,
                    borderColor: '#000000',
                    borderWidth: 1,
                    borderOpacity: 100,
                    shadowEnabled: false,
                    shadowColor: '#000000',
                    shadowBlur: 5,
                    shadowOpacity: 50,
                    gradient: null
                },
                honoredName: {
                    color: '',
                    borderEnabled: false,
                    borderColor: '#000000',
                    borderWidth: 1,
                    borderOpacity: 100,
                    shadowEnabled: false,
                    shadowColor: '#000000',
                    shadowBlur: 5,
                    shadowOpacity: 50,
                    gradient: null
                }
            },

            // Estilos de Contenedores
            showMainContainer: true,
            containerStyles: {
                welcomeMsg: { bgColor: '#ffffff', bgOpacity: 0 },
                mainMsg: { bgColor: '#ffffff', bgOpacity: 0 },
                dressCode: { bgColor: '#ffffff', bgOpacity: 0 }
            },

            designElements: {
                background: {
                    fillType: 'gradient',
                    fillGradient: 'linear-gradient(180deg, #FFD700 0%, #ffffff 100%)'
                }
            },
            editorSettings: {
                snappingEnabled: true
            },
            templateMeta: {
                id: null,
                name: null
            },

            // Contenido
            welcomeMessage: '',
            mainMessage: '',
            dressCode: '',
            confirmPhone: '',
            closingMessage: '',
            eventHashtag: '',

            // Multimedia
            backgroundImage: null,
            backgroundVideo: null,
            honoredPhoto: null,
            backgroundMusic: null,
            audioNote: null,
            autoplayMusic: true,
            loopMusic: true,

            // Interactivo
            enableCountdown: true,
            countdownText: 'Faltan para el gran día:',
            enableQR: true,
            qrURL: '',
            enableMap: true,
            mapCoords: '',
            enableRSVP: false,
            rsvpURL: '',

            // Elementos Dinámicos (insertados por el usuario)
            dynamicElements: [],

            // Metadatos
            lastModified: moment().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Guardar datos de la invitación en IndexedDB
     */
    async saveData(data) {
        this.showAutosaveIndicator('saving');
        
        try {
            data.lastModified = moment().toISOString();
            this.currentData = data; // Sincronizar memoria
            
            // Persistir en IndexedDB
            await window.indexedDBManager.put(this.storageKey, data);
            
            this.showAutosaveIndicator('saved');
            return true;
        } catch (error) {
            console.error('❌ [Storage] Error al guardar datos:', error);
            this.showAutosaveIndicator('error');
            this.showNotification('Error grave al guardar', 'error');
            return false;
        }
    }

    /**
     * Mostrar indicador de guardado automático
     * @param {string} status - Estado: 'saving', 'saved', 'error'
     */
    showAutosaveIndicator(status) {
        // Crear indicador si no existe
        if (!this.autosaveIndicator) {
            this.autosaveIndicator = document.createElement('div');
            this.autosaveIndicator.className = 'autosave-indicator';
            this.autosaveIndicator.innerHTML = `
                <span class="autosave-icon"></span>
                <span class="autosave-text"></span>
            `;
            document.body.appendChild(this.autosaveIndicator);
        }
        
        const indicator = this.autosaveIndicator;
        const icon = indicator.querySelector('.autosave-icon');
        const text = indicator.querySelector('.autosave-text');
        
        // Configurar según estado
        indicator.className = 'autosave-indicator visible ' + status;
        
        switch (status) {
            case 'saving':
                icon.innerHTML = '<div class="autosave-spinner"></div>';
                text.textContent = 'Guardando...';
                break;
            case 'saved':
                icon.textContent = '✓';
                text.textContent = 'Guardado';
                // Ocultar después de 2 segundos
                setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 2000);
                break;
            case 'error':
                icon.textContent = '✗';
                text.textContent = 'Error al guardar';
                // Ocultar después de 3 segundos
                setTimeout(() => {
                    indicator.classList.remove('visible');
                }, 3000);
                break;
        }
    }

    /**
     * Comprimir datos automáticamente cuando se excede la cuota
     * Reduce calidad de imágenes de galería y elimina duplicados
     */
    async compressDataAutomatically(data) {
        let compressed = false;

        // 1. Comprimir imágenes de galería
        if (data.gallery && data.gallery.images && data.gallery.images.length > 0) {
            console.log(`📊 Comprimiendo ${data.gallery.images.length} imágenes de galería...`);

            const compressedImages = [];
            for (let idx = 0; idx < data.gallery.images.length; idx++) {
                const img = data.gallery.images[idx];
                if (img.data && img.data.startsWith('data:image/')) {
                    try {
                        const compressedData = await this.compressDataURL(img.data, 0.7);
                        const originalSize = img.data.length;
                        const newSize = compressedData.length;
                        const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

                        console.log(`  Imagen ${idx + 1}: -${savings}% (${this.formatBytes(originalSize)} → ${this.formatBytes(newSize)})`);

                        compressed = true;
                        compressedImages.push({
                            ...img,
                            data: compressedData
                        });
                    } catch (err) {
                        console.error(`Error comprimiendo imagen ${idx}:`, err);
                        compressedImages.push(img);
                    }
                } else {
                    compressedImages.push(img);
                }
            }
            data.gallery.images = compressedImages;
        }

        // 2. Comprimir foto del festejado si existe
        if (data.honoredPhoto && data.honoredPhoto.data) {
            try {
                const compressedData = await this.compressDataURL(data.honoredPhoto.data, 0.75);
                data.honoredPhoto.data = compressedData;
                compressed = true;
                console.log('✅ Foto del festejado comprimida');
            } catch (err) {
                console.error('Error comprimiendo foto del festejado:', err);
            }
        }

        // 3. Comprimir imagen de fondo si existe
        if (data.backgroundImage && data.backgroundImage.data) {
            try {
                const compressedData = await this.compressDataURL(data.backgroundImage.data, 0.75);
                data.backgroundImage.data = compressedData;
                compressed = true;
                console.log('✅ Imagen de fondo comprimida');
            } catch (err) {
                console.error('Error comprimiendo imagen de fondo:', err);
            }
        }

        return compressed;
    }

    /**
     * Comprimir un dataURL de imagen reduciendo su calidad
     */
    compressDataURL(dataURL, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convertir a JPEG con calidad reducida (más compresión)
                const compressedDataURL = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataURL);
            };
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    /**
     * Formatear bytes a formato legible
     */
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Actualizar campo específico
     */
    updateField(field, value) {
        const data = this.getData();
        data[field] = value;
        this.saveData(data);
    }

    /**
     * Guardar archivo multimedia como base64
     */
    async saveFile(file, fieldName) {
        return new Promise(async (resolve, reject) => {
            if (!file) {
                reject(new Error('No se proporcionó archivo'));
                return;
            }

            // Validar tamaño
            const maxSizes = {
                backgroundImage: 5 * 1024 * 1024, // Aumentado a 5MB (se optimizará)
                backgroundVideo: 10 * 1024 * 1024, // 10MB
                honoredPhoto: 5 * 1024 * 1024, // Aumentado a 5MB (se optimizará)
                backgroundMusic: 5 * 1024 * 1024, // 5MB
                audioNote: 3 * 1024 * 1024 // 3MB
            };

            // Verificar si es necesario optimizar
            const needsOptimization = (fieldName === 'backgroundImage' || fieldName === 'honoredPhoto') &&
                file.type.startsWith('image/') &&
                window.ImageOptimizer;

            if (!needsOptimization && file.size > maxSizes[fieldName]) {
                reject(new Error(`Archivo muy grande. Tamaño máximo: ${maxSizes[fieldName] / (1024 * 1024)}MB`));
                return;
            }

            try {
                let fileData = null;
                let fileType = file.type;
                let fileSize = file.size;

                if (needsOptimization) {
                    this.showNotification('Optimizando imagen...', 'info');
                    if (!this.imageOptimizer) this.imageOptimizer = new ImageOptimizer();

                    const result = await this.imageOptimizer.compress(file);
                    fileData = result.data;
                    fileType = result.format;
                    fileSize = result.compressedSize;

                    this.showNotification(`Imagen optimizada: reducción del ${result.savings}`, 'success');
                } else {
                    // Lectura estándar para otros archivos
                    fileData = await new Promise((res, rej) => {
                        const reader = new FileReader();
                        reader.onload = (e) => res(e.target.result);
                        reader.onerror = rej;
                        reader.readAsDataURL(file);
                    });
                }

                // Guardar
                const data = this.getData();
                data[fieldName] = {
                    data: fileData,
                    type: fileType,
                    name: file.name,
                    size: fileSize
                };

                // Verificar espacio antes de guardar definitivamente
                try {
                    this.saveData(data);

                    // Registrar en el sistema de persistencia
                    if (window.mediaPersistenceManager) {
                        window.mediaPersistenceManager.registerFile(fieldName, {
                            name: file.name,
                            type: fileType,
                            size: fileSize,
                            data: fileData
                        });
                    }

                    resolve(fileData);
                } catch (e) {
                    reject(new Error('Espacio de almacenamiento lleno'));
                }

            } catch (error) {
                console.error('Error procesando archivo:', error);
                // Fallback si falla optimización pero el archivo es válido
                if (error.message.includes('Formato') || error.message.includes('Espacio')) {
                    this.showNotification(error.message, 'error');
                    reject(error);
                } else {
                    // Intentar guardar sin optimizar si cabe
                    this.showNotification('Falló optimización, intentando guardar original...', 'warning');
                    // (Logica de fallback simplificada: reintentar lectura directa)
                    // En este caso simple, rechazamos para forzar corrección
                    reject(error);
                }
            }
        });
    }

    /**
     * Eliminar archivo multimedia
     */
    removeFile(fieldName) {
        const data = this.getData();
        data[fieldName] = null;
        this.saveData(data);

        // Desregistrar del sistema de persistencia
        if (window.mediaPersistenceManager) {
            window.mediaPersistenceManager.unregisterFile(fieldName);
            // Encolar para eliminación post-refresh
            window.mediaPersistenceManager.queueForDeletion(fieldName);
        }
    }

    /**
     * Iniciar guardado automático
     */
    startAutoSave(callback) {
        this.stopAutoSave();
        this.autoSaveInterval = setInterval(() => {
            if (callback) callback();
        }, this.autoSaveDelay);
    }

    /**
     * Detener guardado automático
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Limpiar todos los datos (borra de IndexedDB y reseta en memoria)
     */
    async clearData() {
        if (confirm('¿Estás seguro de que deseas eliminar todos los datos?')) {
            await window.indexedDBManager.delete(this.storageKey);
            this.currentData = this.getDefaultData();
            this.showNotification('Datos eliminados', 'success');
            return true;
        }
        return false;
    }

    /**
     * Exportar datos como JSON estandarizado v2.0
     */
    exportJSON() {
        const schema = this.exportToJSON();
        const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invitacion_${moment().valueOf()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Importar datos desde JSON (detecta schema v2.0 o legacy)
     */
    async importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const parsed = JSON.parse(e.target.result);
                    let data;

                    if (parsed._version === '2.0.0') {
                        // Schema moderno
                        data = this.importFromJSON(parsed);
                    } else {
                        // Schema legacy plano: cargar directamente
                        data = this.migrateData(parsed);
                        this.currentData = data;
                    }

                    await this.saveData(data);
                    resolve(data);
                    this.showNotification('Datos importados correctamente', 'success');
                } catch (error) {
                    reject(error);
                    this.showNotification('Error al importar datos', 'error');
                }
            };

            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Obtener tamaño estimado del almacenamiento actual (en memoria)
     */
    getStorageSize() {
        const data = JSON.stringify(this.currentData || {});
        const bytes = new Blob([data]).size;
        const kb = bytes / 1024;
        const mb = kb / 1024;

        return {
            bytes,
            kb: kb.toFixed(2),
            mb: mb.toFixed(2)
        };
    }

    /**
     * Verificar si hay espacio disponible
     */
    hasSpaceAvailable(additionalBytes = 0) {
        const current = this.getStorageSize().bytes;
        const limit = 5 * 1024 * 1024; // Límite de 5MB para localStorage
        return (current + additionalBytes) < limit;
    }

    /**
     * Mostrar notificación (delega a Utils.notify)
     */
    showNotification(message, type = 'info') {
        // Usar Utils.notify si está disponible
        if (typeof Utils !== 'undefined' && Utils.notify) {
            Utils.notify(message, type);
        } else {
            // Fallback si Utils no está cargado
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Obtener estadísticas de la invitación
     */
    getStats() {
        const data = this.getData();
        const storage = this.getStorageSize();

        return {
            hasData: data.eventName !== '',
            lastModified: data.lastModified,
            storageUsed: storage.mb + ' MB',
            filesCount: [
                data.backgroundImage,
                data.backgroundVideo,
                data.honoredPhoto,
                data.backgroundMusic,
                data.audioNote
            ].filter(f => f !== null).length,
            version: data.version
        };
    }
    /**
     * Exporta los datos al esquema JSON estandarizado v2.0 (Separation of Concerns)
     */
    exportToJSON() {
        const data = this.getData();
        
        // Extraer Tema (Colores, Fuentes, Efectos Generales)
        const theme = {
            id: data.templateMeta?.id || 'custom',
            name: data.templateMeta?.name || 'Personalizado',
            tokens: {
                colors: {
                    primary: data.primaryColor,
                    secondary: data.secondaryColor,
                    text: data.textColor
                },
                fonts: {
                    heading: data.titleFont,
                    body: data.bodyFont
                },
                effects: {
                    backgroundEffect: data.backgroundEffect,
                    overlayOpacity: data.overlayOpacity
                }
            }
        };

        // Extraer Contenido (Textos, Fechas, Ubicaciones, Multimedia)
        const content = {
            eventType: data.eventType,
            eventName: data.eventName,
            honoredName: data.honoredName,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            eventLocation: data.eventLocation,
            eventAddress: data.eventAddress,
            massTime: data.massTime,
            massLocation: data.massLocation,
            massAddress: data.massAddress,
            enableMassLocation: data.enableMassLocation,
            enableMassTime: data.enableMassTime,
            enableMassAddress: data.enableMassAddress,
            welcomeMessage: data.welcomeMessage,
            mainMessage: data.mainMessage,
            dressCode: data.dressCode,
            confirmPhone: data.confirmPhone,
            closingMessage: data.closingMessage,
            eventHashtag: data.eventHashtag,
            assets: {
                backgroundImage: data.backgroundImage,
                backgroundVideo: data.backgroundVideo,
                honoredPhoto: data.honoredPhoto,
                backgroundMusic: data.backgroundMusic,
                audioNote: data.audioNote,
                gallery: data.gallery
            },
            interactive: {
                enableCountdown: data.enableCountdown,
                countdownText: data.countdownText,
                enableQR: data.enableQR,
                qrURL: data.qrURL,
                enableMap: data.enableMap,
                mapCoords: data.mapCoords,
                enableRSVP: data.enableRSVP,
                rsvpURL: data.rsvpURL
            }
        };

        // Extraer Overrides (Ajustes finos del editor visual)
        const overrides = {
            designElements: data.designElements || {},
            elementStyles: data.elementStyles || {},
            containerStyles: data.containerStyles || {}
        };

        return {
            _version: "2.0.0",
            metadata: {
                id: data.templateMeta?.id || `inv-${Date.now().toString(36)}`,
                lastModified: new Date().toISOString()
            },
            theme,
            content,
            overrides
        };
    }

    /**
     * Importa desde el esquema JSON estandarizado v2.0
     * @param {Object} schema 
     */
    importFromJSON(schema) {
        if (schema._version !== "2.0.0") {
            console.warn("[Storage] Importando schema antiguo o versión desconocida:", schema._version);
            // Lógica de fallback si fuera necesario
        }

        const data = this.getDefaultData();
        
        // Restaurar Tema
        if (schema.theme && schema.theme.tokens) {
            data.templateMeta = { id: schema.theme.id, name: schema.theme.name };
            data.primaryColor = schema.theme.tokens.colors?.primary || data.primaryColor;
            data.secondaryColor = schema.theme.tokens.colors?.secondary || data.secondaryColor;
            data.textColor = schema.theme.tokens.colors?.text || data.textColor;
            data.titleFont = schema.theme.tokens.fonts?.heading || data.titleFont;
            data.bodyFont = schema.theme.tokens.fonts?.body || data.bodyFont;
            data.backgroundEffect = schema.theme.tokens.effects?.backgroundEffect || data.backgroundEffect;
            data.overlayOpacity = schema.theme.tokens.effects?.overlayOpacity ?? data.overlayOpacity;
        }

        // Restaurar Contenido
        if (schema.content) {
            Object.assign(data, schema.content); // Copia las propiedades planas
            if (schema.content.assets) {
                Object.assign(data, schema.content.assets);
            }
            if (schema.content.interactive) {
                Object.assign(data, schema.content.interactive);
            }
            // Eliminar las keys anidadas que se esparcieron en la raíz
            delete data.assets;
            delete data.interactive;
        }

        // Restaurar Overrides
        if (schema.overrides) {
            data.designElements = schema.overrides.designElements || {};
            data.elementStyles = schema.overrides.elementStyles || {};
            data.containerStyles = schema.overrides.containerStyles || {};
        }

        this.currentData = data;
        return data;
    }
}

// Instancia global
window.invitationStorage = new InvitationStorage();

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvitationStorage;
}
