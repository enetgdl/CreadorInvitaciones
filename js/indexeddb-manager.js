/**
 * INDEXEDDB-MANAGER.JS
 * Wrapper asíncrono para IndexedDB usando Promesas nativas.
 * Reemplaza a localStorage para persistir el estado de la invitación sin límites de cuota (5MB+).
 */

class IndexedDBManager {
    constructor(dbName = 'CreadorInvitacionesDB', storeName = 'invitations', version = 1) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.version = version;
        this.db = null;
        this.initPromise = this._initDB();
    }

    /**
     * Inicializa la base de datos
     */
    _initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (event) => {
                console.error('[IndexedDB] Error al abrir:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                    console.log(`[IndexedDB] Creado ObjectStore: ${this.storeName}`);
                }
            };
        });
    }

    /**
     * Espera a que la DB esté lista
     */
    async ensureReady() {
        if (!this.db) {
            await this.initPromise;
        }
    }

    /**
     * Obtiene un registro por clave
     * @param {string} key 
     * @returns {Promise<any>}
     */
    async get(key) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Guarda o actualiza un registro
     * @param {string} key 
     * @param {any} value 
     * @returns {Promise<void>}
     */
    async put(key, value) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Elimina un registro por clave
     * @param {string} key 
     * @returns {Promise<void>}
     */
    async delete(key) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Limpia todo el almacén
     * @returns {Promise<void>}
     */
    async clear() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Singleton exportado globalmente
window.indexedDBManager = new IndexedDBManager();
