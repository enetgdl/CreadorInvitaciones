/**
 * @fileoverview Sistema de logging de auditoría.
 * Registra cambios en configuraciones localmente.
 */

export class AuditLogger {
    constructor() {
        this.logKey = 'config_audit_log';
        this.logs = [];
    }

    /**
     * @typedef {'INFO' | 'WARN' | 'ERROR'} LogLevel
     */

    /**
     * Carga logs existentes (si es posible, del localStorage para persistencia simple).
     */
    async init() {
        const stored = localStorage.getItem(this.logKey);
        if (stored) {
            try {
                this.logs = JSON.parse(stored);
            } catch (e) {
                console.error("Error cargando logs de auditoría", e);
                this.logs = [];
            }
        }
    }

    /**
     * Registra un evento.
     * @param {string} action - Acción realizada (e.g., READ, UPDATE).
     * @param {LogLevel} level - Nivel de severidad.
     * @param {string} message - Descripción.
     * @param {Object} [metadata] - Datos adicionales.
     */
    async log(action, level, message, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            action,
            level,
            message,
            metadata
        };

        this.logs.push(entry);

        // Persistir (rotación simple: mantener últimos 1000)
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        localStorage.setItem(this.logKey, JSON.stringify(this.logs));
        console.log(`[AUDIT] [${level}] ${action}: ${message}`, metadata);

        // En una implementación real con FileSystem Access API, 
        // aquí escribiríamos a update ./config-audit.log si tenemos el handle
    }

    /**
     * Exporta los logs como texto.
     */
    exportLogs() {
        return this.logs.map(l => `[${l.timestamp}] [${l.level}] ${l.action}: ${l.message}`).join('\n');
    }
}
