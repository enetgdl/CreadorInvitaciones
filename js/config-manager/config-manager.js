/**
 * @fileoverview Config Manager principal.
 * Orquesta seguridad, almacenamiento, validación y auditoría.
 */

import { SecurityManager } from './security.js';
import { SchemaValidator } from './schema-validator.js';
import { StorageAdapter } from './storage-adapter.js';
import { AuditLogger } from './audit-logger.js';

export class ConfigManager {
    constructor(masterKey) {
        this.security = new SecurityManager(masterKey);
        this.validator = new SchemaValidator();
        this.storage = new StorageAdapter();
        this.audit = new AuditLogger();
        this.vaultKey = 'app_config_vault'; // Clave para LocalStorage o ID lógico

        this.mutexLocked = false;

        // Estado en memoria
        this.config = null;
        this.metadata = {
            version: 1,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
    }

    /**
     * Inicializa el gestor.
     */
    async init() {
        await this.audit.init();
        await this.storage.detectEnvironment();
        this.audit.log('INIT', 'INFO', `Gestor inicializado en modo ${this.storage.mode}`);
    }

    /**
     * Adquiere un lock (Simulación de Mutex para single-thread async).
     * En un entorno real multi-tab, usaríamos Web Locks API.
     */
    async _acquireLock() {
        if ('locks' in navigator) {
            // Web Locks API
            return new Promise((resolve, reject) => {
                navigator.locks.request('config_mutex', async (lock) => {
                    this.mutexLocked = true;
                    resolve(lock); // El lock se mantiene hasta que se retorne de la función que lo llamó,
                    // pero aquí necesitamos un patrón manual. 
                    // Simplificación: usaremos una bandera simple para este entorno.
                });
            });
        }

        let retries = 10;
        while (this.mutexLocked && retries > 0) {
            await new Promise(r => setTimeout(r, 100));
            retries--;
        }
        if (this.mutexLocked) throw new Error("Recurso bloqueado (Race condition prevented)");
        this.mutexLocked = true;
    }

    _releaseLock() {
        this.mutexLocked = false;
    }

    /**
     * Crea/Inicializa una nueva configuración.
     * @param {Object} initialData 
     */
    async createConfig(initialData) {
        await this._acquireLock();
        try {
            const validation = this.validator.validate(initialData);
            if (!validation.valid) {
                const err = new Error("Datos iniciales inválidos: " + validation.errors.join(", "));
                err.code = "SCHEMA_VALIDATION_FAILED";
                throw err;
            }

            this.config = initialData;
            this.metadata.lastModified = new Date().toISOString();

            await this._save();
            await this.audit.log('CREATE', 'INFO', 'Configuración creada exitosamente');
        } catch (e) {
            await this.audit.log('CREATE', 'ERROR', e.message);
            throw e;
        } finally {
            this._releaseLock();
        }
    }

    /**
     * Lee la configuración desencriptando.
     */
    async readConfig() {
        await this._acquireLock();
        try {
            const encryptedData = await this.storage.read(this.vaultKey);

            if (!encryptedData) {
                await this.audit.log('READ', 'WARN', 'No hay configuración guardada');
                return null;
            }

            const decrypted = await this.security.decrypt(encryptedData);

            // Validar checksum/integridad si estuviera implementado

            this.config = decrypted.data;
            this.metadata = decrypted.metadata;

            await this.audit.log('READ', 'INFO', 'Configuración leída exitosamente');
            return this.config;
        } catch (e) {
            if (e.code === 'CONFIG_DECRYPTION_ERROR') {
                await this.audit.log('READ', 'ERROR', 'Fallo de autenticación/decripción');
            } else {
                await this.audit.log('READ', 'ERROR', 'Error leyendo configuración', e);
            }
            throw e;
        } finally {
            this._releaseLock();
        }
    }

    /**
     * Actualiza la configuración.
     * @param {Object} partialData - Datos a mezclar o reemplazar.
     */
    async updateConfig(partialData) {
        await this._acquireLock();
        try {
            // Asegurar tener datos frescos
            if (!this.config) {
                // Intentar cargar si no está en memoria
                try {
                    const encrypted = await this.storage.read(this.vaultKey);
                    if (encrypted) {
                        const dec = await this.security.decrypt(encrypted);
                        this.config = dec.data;
                        this.metadata = dec.metadata;
                    } else {
                        throw new Error("Configuración no existe, use createConfig");
                    }
                } catch (err) { throw err; }
            }

            // Merge
            const newConfig = { ...this.config, ...partialData };

            // Validate
            const validation = this.validator.validate(newConfig);
            if (!validation.valid) {
                const err = new Error("Esquema inválido tras actualización: " + validation.errors.join(", "));
                err.code = "SCHEMA_VALIDATION_FAILED";
                throw err;
            }

            // Backup antes de guardar
            await this._backup();

            this.config = newConfig;
            this.metadata.lastModified = new Date().toISOString();
            this.metadata.version++;

            await this._save();
            await this.audit.log('UPDATE', 'INFO', `Configuración actualizada a v${this.metadata.version}`);
        } catch (e) {
            await this.audit.log('UPDATE', 'ERROR', e.message);
            throw e;
        } finally {
            this._releaseLock();
        }
    }

    async deleteConfig() {
        await this._acquireLock();
        try {
            await this.storage.delete(this.vaultKey);
            this.config = null;
            await this.audit.log('DELETE', 'WARN', 'Configuración eliminada');
        } finally {
            this._releaseLock();
        }
    }

    async listConfigs() {
        // En este diseño de archivo único, solo hay una configuración activa.
        // Si soportáramos perfiles múltiples, aquí iteraríamos.
        return this.config ? [this.metadata] : [];
    }

    /**
     * Helper interno para encriptar y guardar.
     */
    async _save() {
        const payload = {
            data: this.config,
            metadata: this.metadata
        };
        const encrypted = await this.security.encrypt(payload);
        await this.storage.write(this.vaultKey, encrypted);
    }

    /**
     * Genera backup automático
     */
    async _backup() {
        const currentEncrypted = await this.storage.read(this.vaultKey);
        if (currentEncrypted) {
            const backupKey = `${this.vaultKey}.backup.${Date.now()}`;
            // En FS Access API esto requeriría otro handle, aquí simulamos en localStorage o
            // si usáramos Node iría al FS.
            if (this.storage.mode === 'localStorage') {
                localStorage.setItem(backupKey, JSON.stringify(currentEncrypted));
            }
            await this.audit.log('BACKUP', 'INFO', `Backup creado: ${backupKey}`);
        }
    }

    // Método para conectar vault archivo explícito
    async connectVault() {
        const success = await this.storage.connectFileVault();
        if (success) {
            await this.readConfig(); // Intentar leer inmediatamente
        }
        return success;
    }

    async createVault() {
        return await this.storage.createVaultFile();
    }
}
