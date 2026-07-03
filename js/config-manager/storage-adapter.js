/**
 * @fileoverview Adaptador de almacenamiento abstracto.
 * Soporta File System Access API (Browser) y fallback a LocalStorage.
 * Nota: Node.js fs no se implementa directamente aquí ya que esto corre en browser,
 * pero la estructura permitiría inyectarlo.
 */

export class StorageAdapter {
    constructor() {
        this.mode = 'localStorage'; // 'fs-access', 'node-fs', 'localStorage'
        this.fileHandle = null;
    }

    async detectEnvironment() {
        if (typeof window !== 'undefined' && window.showOpenFilePicker) {
            // Capaz de usar FS Access API, pero requiere gesto de usuario primero.
            // Por defecto, iniciamos en localStorage hasta que el usuario "Conecte" el vault.
            this.mode = 'localStorage';
        } else if (typeof process !== 'undefined' && process.versions && process.versions.node) {
            this.mode = 'node-fs';
        }
        return this.mode;
    }

    /**
     * Intenta conectar con un archivo local usando File System Access API.
     * Requiere gesto de usuario.
     */
    async connectFileVault() {
        if (!window.showOpenFilePicker) throw new Error("File System Access API no soportada");

        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Archivos de Configuración Vault',
                    accept: { 'application/octet-stream': ['.vault', '.json'] }
                }],
                multiple: false
            });
            this.fileHandle = handle;
            this.mode = 'fs-access';
            return true;
        } catch (err) {
            console.error("Usuario canceló o error:", err);
            return false;
        }
    }

    /**
     * Crea un nuevo archivo vault.
     */
    async createVaultFile() {
        if (!window.showSaveFilePicker) throw new Error("File System Access API no soportada");
        try {
            const handle = await window.showSaveFilePicker({
                types: [{
                    description: 'Config Vault',
                    accept: { 'application/octet-stream': ['.vault'] }
                }],
                suggestedName: 'config.vault'
            });
            this.fileHandle = handle;
            this.mode = 'fs-access';
            return true;
        } catch (err) {
            return false;
        }
    }

    async read(key) {
        if (this.mode === 'fs-access' && this.fileHandle) {
            const file = await this.fileHandle.getFile();
            const text = await file.text();
            return text ? JSON.parse(text) : null;
        } else {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
    }

    async write(key, data) {
        if (this.mode === 'fs-access' && this.fileHandle) {
            // Crear writable
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    async delete(key) {
        if (this.mode === 'fs-access') {
            // No podemos borrar el archivo físico fácilmente sin permiso de directorio padre
            // Solo truncamos contenido
            await this.write(key, {});
        } else {
            localStorage.removeItem(key);
        }
    }
}
