/**
 * MEDIA-PERSISTENCE-MANAGER.JS
 * Sistema robusto de gestión de persistencia de archivos multimedia
 * Garantiza eliminación completa incluso después de refresh del navegador
 */

class MediaPersistenceManager {
    constructor() {
        this.REGISTRY_KEY = 'media_registry';
        this.DELETION_QUEUE_KEY = 'media_deletion_queue';
        this.ORPHAN_CHECK_KEY = 'media_orphan_check';
    }

    /**
     * Inicializar el sistema de persistencia
     */
    initialize() {
        console.log('🔧 Inicializando MediaPersistenceManager...');

        // Procesar cola de eliminación pendiente (de antes del refresh)
        this.processDeletionQueue();

        // Limpiar archivos huérfanos
        this.cleanOrphanedFiles();

        // Sincronizar registro con estado actual
        this.syncRegistry();

        console.log('✅ MediaPersistenceManager inicializado');
    }

    /**
     * Registrar archivo multimedia cargado
     */
    registerFile(fieldName, fileInfo) {
        try {
            const registry = this.getRegistry();
            registry[fieldName] = {
                name: fileInfo.name,
                type: fileInfo.type,
                size: fileInfo.size,
                timestamp: Date.now(),
                hash: this.generateHash(fileInfo.data)
            };

            localStorage.setItem(this.REGISTRY_KEY, JSON.stringify(registry));
            console.log(`📝 Archivo registrado: ${fieldName} -> ${fileInfo.name}`);
        } catch (e) {
            console.error('Error al registrar archivo:', e);
        }
    }

    /**
     * Desregistrar archivo multimedia
     */
    unregisterFile(fieldName) {
        try {
            const registry = this.getRegistry();
            if (registry[fieldName]) {
                console.log(`🗑️ Desregistrando: ${fieldName} -> ${registry[fieldName].name}`);
                delete registry[fieldName];
                localStorage.setItem(this.REGISTRY_KEY, JSON.stringify(registry));
            }
        } catch (e) {
            console.error('Error al desregistrar archivo:', e);
        }
    }

    /**
     * Obtener registro de archivos
     */
    getRegistry() {
        try {
            const data = localStorage.getItem(this.REGISTRY_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error al leer registro:', e);
            return {};
        }
    }

    /**
     * Agregar archivo a cola de eliminación
     * (Para procesar después del refresh)
     */
    queueForDeletion(fieldName) {
        try {
            const queue = this.getDeletionQueue();
            if (!queue.includes(fieldName)) {
                queue.push(fieldName);
                localStorage.setItem(this.DELETION_QUEUE_KEY, JSON.stringify(queue));
                console.log(`📋 Archivo en cola de eliminación: ${fieldName}`);
            }
        } catch (e) {
            console.error('Error al encolar eliminación:', e);
        }
    }

    /**
     * Obtener cola de eliminación
     */
    getDeletionQueue() {
        try {
            const data = localStorage.getItem(this.DELETION_QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Procesar cola de eliminación pendiente
     */
    processDeletionQueue() {
        const queue = this.getDeletionQueue();

        if (queue.length === 0) return;

        console.log(`🔄 Procesando ${queue.length} eliminaciones pendientes...`);

        queue.forEach(fieldName => {
            this.forceDeleteFile(fieldName);
        });

        // Limpiar cola
        localStorage.removeItem(this.DELETION_QUEUE_KEY);
        console.log('✅ Cola de eliminación procesada');
    }

    /**
     * Forzar eliminación completa de archivo
     */
    forceDeleteFile(fieldName) {
        try {
            // 1. Eliminar del almacenamiento principal
            if (window.invitationStorage) {
                window.invitationStorage.removeFile(fieldName);
            }

            // 2. Desregistrar del registro de persistencia
            this.unregisterFile(fieldName);

            // 3. Limpiar referencias en memoria
            this.clearMemoryReferences(fieldName);

            // 4. Actualizar preview si existe
            if (window.invitationEditor && window.invitationEditor.preview) {
                window.invitationEditor.preview.forceUpdate();
            }

            console.log(`✅ Eliminación forzada completada: ${fieldName}`);
            return true;
        } catch (e) {
            console.error(`❌ Error en eliminación forzada de ${fieldName}:`, e);
            return false;
        }
    }

    /**
     * Limpiar referencias en memoria
     */
    clearMemoryReferences(fieldName) {
        // Limpiar del objeto de datos del editor
        if (window.invitationEditor && window.invitationEditor.data) {
            window.invitationEditor.data[fieldName] = null;
        }

        // Limpiar input del formulario
        const input = document.getElementById(fieldName);
        if (input) {
            input.value = '';
        }

        // Forzar garbage collection de URLs de objeto si existen
        if (window.URL && window.URL.revokeObjectURL) {
            // Intentar revocar cualquier URL de objeto asociada
            try {
                const data = window.invitationStorage?.getData();
                if (data && data[fieldName] && data[fieldName].data) {
                    if (data[fieldName].data.startsWith('blob:')) {
                        window.URL.revokeObjectURL(data[fieldName].data);
                    }
                }
            } catch (e) {
                // Silenciar errores de revocación
            }
        }
    }

    /**
     * Limpiar archivos huérfanos
     * (Archivos en localStorage sin registro correspondiente)
     */
    cleanOrphanedFiles() {
        console.log('🔍 Buscando archivos huérfanos...');

        const registry = this.getRegistry();
        const currentData = window.invitationStorage?.getData();

        if (!currentData) return;

        const mediaFields = [
            'backgroundImage',
            'backgroundVideo',
            'honoredPhoto',
            'backgroundMusic',
            'audioNote'
        ];

        let orphansFound = 0;

        mediaFields.forEach(field => {
            // Si hay datos pero no está registrado, es huérfano
            if (currentData[field] && !registry[field]) {
                console.log(`🧹 Archivo huérfano detectado: ${field}`);
                this.forceDeleteFile(field);
                orphansFound++;
            }

            // Si está registrado pero no hay datos, limpiar registro
            if (!currentData[field] && registry[field]) {
                console.log(`🧹 Registro huérfano detectado: ${field}`);
                this.unregisterFile(field);
                orphansFound++;
            }
        });

        if (orphansFound > 0) {
            console.log(`✅ ${orphansFound} archivos huérfanos limpiados`);
            if (window.invitationStorage) {
                window.invitationStorage.showNotification(
                    `${orphansFound} archivo(s) huérfano(s) eliminado(s)`,
                    'info'
                );
            }
        } else {
            console.log('✅ No se encontraron archivos huérfanos');
        }
    }

    /**
     * Sincronizar registro con estado actual
     */
    syncRegistry() {
        const currentData = window.invitationStorage?.getData();
        if (!currentData) return;

        const mediaFields = [
            'backgroundImage',
            'backgroundVideo',
            'honoredPhoto',
            'backgroundMusic',
            'audioNote'
        ];

        mediaFields.forEach(field => {
            if (currentData[field]) {
                // Asegurar que esté registrado
                this.registerFile(field, currentData[field]);
            }
        });
    }

    /**
     * Generar hash simple para identificar archivos
     */
    generateHash(data) {
        if (!data) return null;

        // Hash simple basado en longitud y primeros/últimos caracteres
        const str = data.toString();
        const len = str.length;
        const sample = str.substring(0, 100) + str.substring(len - 100);

        let hash = 0;
        for (let i = 0; i < sample.length; i++) {
            const char = sample.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return hash.toString(36) + len.toString(36);
    }

    /**
     * Verificar integridad del sistema
     */
    verifyIntegrity() {
        const registry = this.getRegistry();
        const currentData = window.invitationStorage?.getData();

        const report = {
            registeredFiles: Object.keys(registry).length,
            actualFiles: 0,
            mismatches: [],
            status: 'OK'
        };

        if (currentData) {
            const mediaFields = [
                'backgroundImage',
                'backgroundVideo',
                'honoredPhoto',
                'backgroundMusic',
                'audioNote'
            ];

            mediaFields.forEach(field => {
                if (currentData[field]) {
                    report.actualFiles++;

                    if (!registry[field]) {
                        report.mismatches.push(`${field}: en datos pero no registrado`);
                        report.status = 'WARNING';
                    }
                }
            });
        }

        console.table(report);
        return report;
    }

    /**
     * Limpiar todo el sistema (para debugging)
     */
    clearAll() {
        localStorage.removeItem(this.REGISTRY_KEY);
        localStorage.removeItem(this.DELETION_QUEUE_KEY);
        localStorage.removeItem(this.ORPHAN_CHECK_KEY);
        console.log('🧹 Sistema de persistencia limpiado completamente');
    }
}

// Crear instancia global
const mediaPersistenceManager = new MediaPersistenceManager();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaPersistenceManager;
} else {
    window.MediaPersistenceManager = MediaPersistenceManager;
    window.mediaPersistenceManager = mediaPersistenceManager;
}
