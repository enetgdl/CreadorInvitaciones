/**
 * UTILS.JS - Funciones de utilidad compartidas
 * Centraliza funciones comunes para evitar duplicación de código
 */

const Utils = {
    // ==========================================
    // FUNCIONES DE SEGURIDAD (delegar a Sanitize)
    // ==========================================

    /**
     * Escapar HTML (delega a Sanitize.escapeHtml)
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        return Sanitize.escapeHtml(text);
    },

    /**
     * Escapar atributos (delega a Sanitize.escapeAttr)
     * @param {string} value - Valor a escapar
     * @returns {string} Valor escapado
     */
    escapeAttr(value) {
        return Sanitize.escapeAttr(value);
    },

    // ==========================================
    // FUNCIONES DE FORMATO
    // ==========================================

    /**
     * Formatear bytes a formato legible
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} Tamaño formateado (B, KB, MB, GB)
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    },

    /**
     * Formatear número con separadores de miles
     * @param {number} num - Número a formatear
     * @returns {string} Número formateado
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Formatear fecha a formato legible
     * @param {string|Date} date - Fecha a formatear
     * @param {object} options - Opciones de formato
     * @returns {string} Fecha formateada
     */
    formatDate(date, options = {}) {
        const d = new Date(date);
        const defaultOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            ...options 
        };
        return d.toLocaleDateString('es-MX', defaultOptions);
    },

    /**
     * Formatear hora a formato 12h
     * @param {string} time - Hora en formato HH:mm
     * @returns {string} Hora formateada (ej: 2:30 PM)
     */
    formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    },

    // ==========================================
    // FUNCIONES DE FECHA Y HORA
    // ==========================================

    /**
     * Obtener timestamp ISO actual
     * @returns {string} Timestamp ISO
     */
    now() {
        return new Date().toISOString();
    },

    /**
     * Calcular diferencia entre dos fechas en días
     * @param {string|Date} date1 - Primera fecha
     * @param {string|Date} date2 - Segunda fecha
     * @returns {number} Diferencia en días
     */
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // ==========================================
    // FUNCIONES DE VALIDACIÓN
    // ==========================================

    /**
     * Validar si un valor no está vacío
     * @param {any} value - Valor a validar
     * @returns {boolean} true si tiene contenido
     */
    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    },

    /**
     * Validar formato de email
     * @param {string} email - Email a validar
     * @returns {boolean} true si es válido
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validar formato de teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} true si es válido
     */
    isValidPhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 7;
    },

    // ==========================================
    // FUNCIONES DE DOM
    // ==========================================

    /**
     * Obtener elemento por ID con fallback
     * @param {string} id - ID del elemento
     * @returns {HTMLElement|null} Elemento o null
     */
    $(id) {
        return document.getElementById(id);
    },

    /**
     * Seleccionar elementos por query selector
     * @param {string} selector - Selector CSS
     * @param {HTMLElement} parent - Elemento padre (opcional)
     * @returns {HTMLElement[]} Array de elementos
     */
    $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },

    /**
     * Crear elemento HTML con atributos y contenido
     * @param {string} tag - Nombre del tag
     * @param {object} attrs - Atributos del elemento
     * @param {string|HTMLElement} content - Contenido
     * @returns {HTMLElement} Elemento creado
     */
    createElement(tag, attrs = {}, content = null) {
        const el = document.createElement(tag);
        
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        
        if (content !== null) {
            if (typeof content === 'string') {
                el.textContent = content;
            } else if (content instanceof HTMLElement) {
                el.appendChild(content);
            }
        }
        
        return el;
    },

    /**
     * Mostrar notificación temporal
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo (success, error, warning, info)
     * @param {number} duration - Duración en ms
     */
    notify(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    // ==========================================
    // FUNCIONES DE RENDIMIENTO
    // ==========================================

    /**
     * Debounce - Retardar ejecución hasta que deje de dispararse
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} Función debounced
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle - Ejecutar como máximo una vez por período
     * @param {Function} func - Función a ejecutar
     * @param {number} limit - Límite en ms
     * @returns {Function} Función throttled
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ==========================================
    // FUNCIONES DE UTILIDAD GENERAL
    // ==========================================

    /**
     * Generar ID único basado en timestamp
     * @returns {string} ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Clonar objeto profundo (solo objetos serializables)
     * @param {object} obj - Objeto a clonar
     * @returns {object} Clon del objeto
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Mezclar objetos shallow (como Object.assign)
     * @param {object} target - Objeto destino
     * @param {...object} sources - Fuentes
     * @returns {object} Objeto mezclado
     */
    merge(target, ...sources) {
        return Object.assign({}, target, ...sources);
    },

    /**
     * Diferencias entre dos objetos
     * @param {object} obj1 - Primer objeto
     * @param {object} obj2 - Segundo objeto
     * @returns {object} Diferencias
     */
    diff(obj1, obj2) {
        const changes = {};
        
        Object.keys(obj2).forEach(key => {
            if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                changes[key] = {
                    from: obj1[key],
                    to: obj2[key]
                };
            }
        });
        
        return changes;
    },

    /**
     * Esperar un tiempo determinado
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise} Promesa que se resuelve después del tiempo
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Reintentar una función con backoff exponencial
     * @param {Function} fn - Función a reintentar
     * @param {number} maxRetries - Número máximo de reintentos
     * @param {number} baseDelay - Delay base en ms
     * @returns {Promise} Resultado de la función
     */
    async retry(fn, maxRetries = 3, baseDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await this.sleep(baseDelay * Math.pow(2, i));
            }
        }
    },

    // ==========================================
    // FUNCIONES DE CONSOLA (Debug)
    // ==========================================

    /**
     * Log con timestamp
     * @param {string} message - Mensaje
     * @param {string} level - Nivel (log, warn, error, info)
     */
    log(message, level = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        console[level](`${prefix} ${message}`);
    },

    /**
     * Medir tiempo de ejecución
     * @param {string} label - Etiqueta
     * @param {Function} fn - Función a medir
     * @returns {any} Resultado de la función
     */
    measure(label, fn) {
        console.time(label);
        const result = fn();
        console.timeEnd(label);
        return result;
    }
};

// Exportar para uso global
window.Utils = Utils;

// Compatibilidad con módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

console.log('✅ Utils.js cargado correctamente');
