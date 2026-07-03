/**
 * EDITOR-MEDIA.js - Manejo de Multimedia
 * Métodos para archivos multimedia y exportación
 */

if (typeof InvitationEditor !== 'undefined') {
    
    /**
     * Manejar carga de archivos
     */
    InvitationEditor.prototype.handleFileUpload = async function(input) {
        const file = input.files[0];
        if (!file) return;

        const fieldName = input.id;
        
        try {
            // Validar tipo de archivo
            const validTypes = {
                backgroundImage: ['image/jpeg', 'image/png', 'image/webp'],
                backgroundVideo: ['video/mp4', 'video/webm'],
                honoredPhoto: ['image/jpeg', 'image/png', 'image/webp'],
                backgroundMusic: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
                audioNote: ['audio/mpeg', 'audio/wav', 'audio/ogg']
            };

            if (validTypes[fieldName] && !validTypes[fieldName].includes(file.type)) {
                this.storage.showNotification('Tipo de archivo no permitido', 'error');
                return;
            }

            // Verificar si se necesita reemplazar
            if (this.data[fieldName] && this.data[fieldName].data) {
                const confirmed = await this.showConfirmModal(
                    '🔄',
                    'Reemplazar archivo',
                    `Ya existe un archivo para ${fieldName}. ¿Deseas reemplazarlo?`
                );
                if (!confirmed) {
                    input.value = '';
                    return;
                }
            }

            // Guardar archivo
            await this.storage.saveFile(file, fieldName);
            
            // Actualizar datos locales
            this.data = this.storage.getData();
            
            // Actualizar vista previa
            if (this.preview) {
                this.preview.forceUpdate();
            }

            this.storage.showNotification('Archivo cargado correctamente', 'success');
        } catch (error) {
            console.error('Error al cargar archivo:', error);
            this.storage.showNotification(error.message || 'Error al cargar archivo', 'error');
            input.value = '';
        }
    };

    /**
     * Eliminar archivo multimedia
     */
    InvitationEditor.prototype.deleteMedia = async function(fieldName, showConfirmation = true) {
        if (showConfirmation) {
            const confirmed = await this.showConfirmModal(
                '🗑️',
                'Eliminar archivo',
                `¿Estás seguro de eliminar este archivo multimedia?`
            );
            if (!confirmed) return;
        }

        this.storage.removeFile(fieldName);
        this.data = this.storage.getData();
        
        if (this.preview) {
            this.preview.forceUpdate();
        }

        this.storage.showNotification('Archivo eliminado', 'success');
    };

    /**
     * Guardar manualmente
     */
    InvitationEditor.prototype.saveManually = function() {
        this.storage.saveData(this.data);
        this.storage.showNotification('Guardado exitoso', 'success');
    };

    /**
     * Iniciar guardado automático
     */
    InvitationEditor.prototype.startAutoSave = function() {
        this.storage.startAutoSave(() => {
            if (this.isDirty) {
                this.storage.saveData(this.data);
                this.isDirty = false;
            }
        });
    };

    /**
     * Abrir vista previa completa
     */
    InvitationEditor.prototype.openFullPreview = function() {
        if (this.preview) {
            this.preview.openInNewWindow();
        }
    };

    /**
     * Actualizar vista previa
     */
    InvitationEditor.prototype.refreshPreview = function() {
        if (this.preview) {
            this.preview.forceUpdate();
        }
        this.storage.showNotification('Vista previa actualizada', 'info');
    };

    /**
     * Alternar pantalla completa
     */
    InvitationEditor.prototype.toggleFullscreen = function() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Error al entrar en pantalla completa:', err);
            });
        } else {
            document.exitFullscreen();
        }
    };

    /**
     * Abrir modal de exportación
     */
    InvitationEditor.prototype.openExportModal = function() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.add('active');
        }
    };

    /**
     * Cerrar modal de exportación
     */
    InvitationEditor.prototype.closeExportModal = function() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('active');
        }
    };

    /**
     * Realizar exportación
     */
    InvitationEditor.prototype.performExport = async function() {
        const format = document.querySelector('input[name="exportFormat"]:checked')?.value || 'html';
        
        try {
            if (format === 'html') {
                await this.exporter.exportAsHTML(this.data);
            } else if (format === 'zip') {
                await this.exporter.exportAsZIP(this.data);
            }
            this.closeExportModal();
            this.storage.showNotification('Exportación completada', 'success');
        } catch (error) {
            console.error('Error al exportar:', error);
            this.storage.showNotification('Error al exportar', 'error');
        }
    };

    /**
     * Mostrar modal de reemplazo de fondo
     */
    InvitationEditor.prototype.showBackgroundReplaceModal = async function(currentType, newType) {
        const typeNames = {
            'image': 'imagen',
            'video': 'video',
            'none': 'gradiente/color'
        };

        const confirmed = await this.showConfirmModal(
            '🔄',
            'Cambiar tipo de fondo',
            `¿Deseas cambiar de ${typeNames[currentType] || 'nada'} a ${typeNames[newType] || 'nada'}? Se eliminará el fondo actual.`
        );

        return confirmed;
    };

    /**
     * Aplicar preset de color
     */
    InvitationEditor.prototype.applyColorPreset = function(btn) {
        const color = btn.dataset.color;
        if (!color) return;

        const field = btn.dataset.target || 'primaryColor';
        this.handleFieldChange(field, color);
        
        const input = document.getElementById(field);
        if (input) {
            input.value = color;
        }
        this.updateColorDisplay(field);
    };

    console.log('✅ editor-media.js cargado correctamente');
}
