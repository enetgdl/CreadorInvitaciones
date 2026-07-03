/**
 * @fileoverview Módulo de seguridad criptográfica usando Web Crypto API.
 * Implementa encriptación AES-256-GCM y derivación de claves PBKDF2.
 */

export class SecurityManager {
    /**
     * @param {string} masterKey - Contraseña maestra para derivar claves.
     */
    constructor(masterKey) {
        if (!masterKey) throw new Error("Se requiere una contraseña maestra");
        this.masterKey = masterKey;
        this.iterations = 100000; // Mínimo recomendado por NIST/OWASP
        this.algo = { name: "AES-GCM", length: 256 };
        this.kdf = "PBKDF2";
        this.hash = "SHA-256";
    }

    /**
     * Genera una sal aleatoria criptográficamente segura.
     * @returns {Uint8Array} Salt de 16 bytes.
     */
    generateSalt() {
        return window.crypto.getRandomValues(new Uint8Array(16));
    }

    /**
     * Genera un Vector de Inicialización (IV) aleatorio.
     * @returns {Uint8Array} IV de 12 bytes.
     */
    generateIV() {
        return window.crypto.getRandomValues(new Uint8Array(12));
    }

    /**
     * Importa la clave maestra como material de clave (KeyMaterial).
     * @private
     * @returns {Promise<CryptoKey>}
     */
    async _importKeyMaterial() {
        const encoder = new TextEncoder();
        return window.crypto.subtle.importKey(
            "raw",
            encoder.encode(this.masterKey),
            { name: this.kdf },
            false,
            ["deriveBits", "deriveKey"]
        );
    }

    /**
     * Deriva una clave AES-GCM a partir de la contraseña maestra y un salt.
     * @private
     * @param {Uint8Array} salt
     * @returns {Promise<CryptoKey>}
     */
    async _deriveKey(salt) {
        const keyMaterial = await this._importKeyMaterial();
        return window.crypto.subtle.deriveKey(
            {
                name: this.kdf,
                salt: salt,
                iterations: this.iterations,
                hash: this.hash
            },
            keyMaterial,
            this.algo,
            false,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encripta datos JSON planos.
     * @param {Object} data - Objeto JSON a encriptar.
     * @returns {Promise<Object>} Objeto con { ciphertext, iv, salt } codificados en base64.
     * @throws {Error} ConfigError con código CONFIG_ENCRYPTION_ERROR
     */
    async encrypt(data) {
        try {
            const salt = this.generateSalt();
            const iv = this.generateIV();
            const key = await this._deriveKey(salt);
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(JSON.stringify(data));

            const encryptedBuffer = await window.crypto.subtle.encrypt(
                { name: this.algo.name, iv: iv },
                key,
                encodedData
            );

            return {
                ciphertext: this._arrayBufferToBase64(encryptedBuffer),
                iv: this._arrayBufferToBase64(iv),
                salt: this._arrayBufferToBase64(salt)
            };
        } catch (error) {
            console.error("Error de encriptación:", error);
            const err = new Error("Fallo al encriptar la configuración.");
            err.code = "CONFIG_ENCRYPTION_ERROR";
            throw err;
        }
    }

    /**
     * Desencripta datos encriptados.
     * @param {Object} encryptedPackage - Objeto { ciphertext, iv, salt }.
     * @returns {Promise<Object>} Datos JSON originales.
     * @throws {Error} ConfigError con código CONFIG_DECRYPTION_ERROR
     */
    async decrypt(encryptedPackage) {
        try {
            const salt = this._base64ToArrayBuffer(encryptedPackage.salt);
            const iv = this._base64ToArrayBuffer(encryptedPackage.iv);
            const ciphertext = this._base64ToArrayBuffer(encryptedPackage.ciphertext);

            const key = await this._deriveKey(salt);

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: this.algo.name, iv: iv },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedBuffer));
        } catch (error) {
            console.error("Error de desencriptación:", error);
            const err = new Error("Contraseña incorrecta o datos corruptos.");
            err.code = "CONFIG_DECRYPTION_ERROR";
            throw err;
        }
    }

    // Helpers para Base64
    _arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    _base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
}
