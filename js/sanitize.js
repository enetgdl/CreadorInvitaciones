/**
 * SANITIZE.JS - Funciones de sanitización para prevenir XSS
 * Módulo de seguridad para escape de HTML, URLs y entrada de usuario
 */

const Sanitize = {
    /**
     * Escapar HTML para inserción segura en contenido
     * Previene inyección de scripts en elementos del DOM
     * @param {string|number|boolean|null|undefined} text - Texto a escapar
     * @returns {string} Texto escapado seguro para innerHTML
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const str = String(text);
        
        // Mapa de caracteres peligrosos
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#96;'
        };
        
        // Reemplazar caracteres peligrosos usando regex
        return str.replace(/[&<>"'`\/]/g, (char) => escapeMap[char] || char);
    },

    /**
     * Escapar para inserción en atributos HTML
     * Previene inyección en atributos como href, src, style, etc.
     * @param {string} value - Valor a escapar
     * @returns {string} Valor escapado seguro para atributos
     */
    escapeAttr(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/`/g, '&#96;');
    },

    /**
     * Escapar contenido para inserción en CSS
     * Previene inyección de CSS malicioso
     * @param {string} value - Valor CSS a escapar
     * @returns {string} Valor CSS seguro
     */
    escapeCss(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/[{}<>"'`;]/g, (char) => '\\' + char);
    },

    /**
     * Escapar contenido para inserción en JavaScript
     * Previene inyección de código JavaScript
     * @param {string} value - Valor JS a escapar
     * @returns {string} Valor JS seguro
     */
    escapeJs(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/`/g, '\\`')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    },

    /**
     * Validar y sanitizar URL
     * Bloquea javascript:, data:, vbscript: y otras URLs peligrosas
     * @param {string} url - URL a validar
     * @returns {string|null} URL sanitizada o null si es inválida
     */
    sanitizeUrl(url) {
        if (!url) return null;
        
        const trimmed = url.trim();
        if (!trimmed) return null;
        
        // Bloquear protocolos peligrosos (case-insensitive)
        const dangerousProtocols = /^(javascript|data|vbscript|blob|file):/i;
        if (dangerousProtocols.test(trimmed)) {
            console.warn('URL peligrosa bloqueada:', trimmed.substring(0, 50));
            return null;
        }
        
        // Permitir solo http/https (y protocolos relativos)
        if (!/^https?:\/\//i.test(trimmed) && !/^\/\//i.test(trimmed) && !/^[a-zA-Z0-9]/.test(trimmed)) {
            // Permitir URLs relativas que empiezan con /
            if (!trimmed.startsWith('/')) {
                return null;
            }
        }
        
        // Bloquear caracteres de nueva línea que podrían usarse para inyección
        if (/[\n\r]/.test(trimmed)) {
            return null;
        }
        
        return trimmed;
    },

    /**
     * Validar URL para enlaces (href)
     * Más estricto que sanitizeUrl, solo permite http/https
     * @param {string} url - URL a validar para enlace
     * @returns {string|null} URL segura o null
     */
    sanitizeLinkUrl(url) {
        if (!url) return null;
        
        const trimmed = url.trim();
        if (!trimmed) return null;
        
        // Solo permitir http/https
        if (!/^https?:\/\//i.test(trimmed)) {
            console.warn('URL de enlace no permitida:', trimmed.substring(0, 50));
            return null;
        }
        
        // Bloquear javascript: y data: (redundante pero seguro)
        if (/^(javascript|data|vbscript):/i.test(trimmed)) {
            return null;
        }
        
        // Bloquear caracteres peligrosos
        if (/[\n\r"'<>]/.test(trimmed)) {
            return null;
        }
        
        return trimmed;
    },

    /**
     * Validar y sanitizar coordenadas del mapa
     * Acepta formato "latitud,longitud" o "lat,lng,zoom"
     * @param {string} coords - Coordenadas a validar
     * @returns {string|null} Coordenadas sanitizadas o null
     */
    sanitizeCoords(coords) {
        if (!coords) return null;
        
        const trimmed = coords.trim();
        if (!trimmed) return null;
        
        // Dividir por coma y limpiar espacios
        const parts = trimmed.split(',').map(c => c.trim());
        
        // Permitir 2 o 3 partes (lat,lng o lat,lng,zoom)
        if (parts.length < 2 || parts.length > 3) {
            return null;
        }
        
        // Validar que sean números
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        const zoom = parts.length === 3 ? parseInt(parts[2], 10) : 15;
        
        // Validar rangos
        if (isNaN(lat) || isNaN(lng)) return null;
        if (lat < -90 || lat > 90) return null;
        if (lng < -180 || lng > 180) return null;
        if (parts.length === 3 && (zoom < 1 || zoom > 21)) return null;
        
        // Retornar formato limpio
        return parts.length === 3 
            ? `${lat},${lng},${zoom}` 
            : `${lat},${lng}`;
    },

    /**
     * Sanitizar número de teléfono
     * Solo permite números, espacios, guiones, paréntesis y +
     * @param {string} phone - Teléfono a sanitizar
     * @returns {string} Teléfono sanitizado
     */
    sanitizePhone(phone) {
        if (!phone) return '';
        return String(phone).replace(/[^0-9+\-() ]/g, '');
    },

    /**
     * Sanitizar hashtag
     * Solo permite caracteres alfanuméricos y guiones bajos
     * @param {string} hashtag - Hashtag a sanitizar
     * @returns {string} Hashtag sanitizado
     */
    sanitizeHashtag(hashtag) {
        if (!hashtag) return '';
        let str = String(hashtag).trim();
        // Asegurar que empiece con #
        if (!str.startsWith('#')) {
            str = '#' + str;
        }
        // Permitir solo caracteres válidos después del #
        return '#' + str.substring(1).replace(/[^a-zA-Z0-9_]/g, '');
    },

    /**
     * Sanitizar color HEX
     * Valida y limpia formato de color hexadecimal
     * @param {string} color - Color a sanitizar
     * @returns {string|null} Color HEX válido o null
     */
    sanitizeColor(color) {
        if (!color) return null;
        
        let str = String(color).trim();
        
        // Agregar # si falta
        if (!str.startsWith('#')) {
            str = '#' + str;
        }
        
        // Validar formato HEX (#RGB, #RRGGBB, #RRGGBBAA)
        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(str)) {
            return str.toUpperCase();
        }
        
        return null;
    },

    /**
     * Sanitizar nombre de archivo
     * Remueve caracteres peligrosos para nombres de archivo
     * @param {string} filename - Nombre de archivo a sanitizar
     * @returns {string} Nombre de archivo seguro
     */
    sanitizeFilename(filename) {
        if (!filename) return 'unnamed';
        
        return String(filename)
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
            .replace(/\.{2,}/g, '.')
            .replace(/^[.\s]+/, '')
            .substring(0, 255);
    },

    /**
     * Sanitizar texto general (múltiples líneas)
     * Limpia pero preserva saltos de línea legítimos
     * @param {string} text - Texto a sanitizar
     * @param {number} maxLength - Longitud máxima (opcional)
     * @returns {string} Texto sanitizado
     */
    sanitizeText(text, maxLength = null) {
        if (!text) return '';
        
        let str = String(text);
        
        // Escapar HTML
        str = this.escapeHtml(str);
        
        // Preservar saltos de línea pero eliminar otros caracteres de control
        str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        
        // Limitar longitud si se especifica
        if (maxLength && str.length > maxLength) {
            str = str.substring(0, maxLength);
        }
        
        return str;
    },

    /**
     * Sanitizar entrada de formulario completa
     * Aplica el nivel de sanitización apropiado según el tipo de campo
     * @param {string} value - Valor del campo
     * @param {string} type - Tipo de campo (text, url, phone, hashtag, color, coords)
     * @returns {string|null} Valor sanitizado
     */
    sanitizeInput(value, type) {
        if (value === null || value === undefined) return null;
        
        switch (type) {
            case 'url':
                return this.sanitizeUrl(value);
            case 'linkUrl':
                return this.sanitizeLinkUrl(value);
            case 'coords':
                return this.sanitizeCoords(value);
            case 'phone':
                return this.sanitizePhone(value);
            case 'hashtag':
                return this.sanitizeHashtag(value);
            case 'color':
                return this.sanitizeColor(value);
            case 'filename':
                return this.sanitizeFilename(value);
            case 'text':
            default:
                return this.sanitizeText(value);
        }
    },

    /**
     * Verificar si un valor contiene contenido potencialmente peligroso
     * Util para validación antes de procesar
     * @param {string} value - Valor a verificar
     * @returns {boolean} true si es seguro, false si contiene contenido peligroso
     */
    isSafe(value) {
        if (!value) return true;
        
        const str = String(value);
        
        // Patrones peligrosos
        const dangerousPatterns = [
            /<script[\s>]/i,           // Tags de script
            /javascript:/i,            // Protocolo javascript
            /data:text\/html/i,        // URLs data con HTML
            /on\w+\s*=/i,             // Event handlers (onclick, onerror, etc.)
            /expression\s*\(/i,        // CSS expression
            /url\s*\(/i,              // CSS url() con contenido
            /<iframe[\s>]/i,          // Tags iframe
            /<object[\s>]/i,          // Tags object
            /<embed[\s>]/i,           // Tags embed
            /<form[\s>]/i,            // Tags form
            /eval\s*\(/i,             // eval()
            /document\.(cookie|write|location)/i,  // Document access
            /window\.location/i,      // Window location
            /\.innerHTML\s*=/i,       // innerHTML assignment
            /<\s*img[^>]+onerror/i    // Image with onerror
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(str));
    },

    /**
     * Logger de seguridad para auditoría
     * Registra intentos de inyección detectados
     * @param {string} type - Tipo de intento detectado
     * @param {string} value - Valor peligroso detectado
     * @param {string} context - Contexto donde se detectó
     */
    logSecurityEvent(type, value, context) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            value: String(value).substring(0, 100),
            context,
            userAgent: navigator.userAgent
        };
        
        // Console warning en desarrollo
        console.warn(`🚨 [SECURITY] ${type} detected in ${context}:`, logEntry);
        
        // Almacenar en sessionStorage para auditoría
        try {
            const logs = JSON.parse(sessionStorage.getItem('security_logs') || '[]');
            logs.push(logEntry);
            // Mantener solo los últimos 50 logs
            if (logs.length > 50) logs.shift();
            sessionStorage.setItem('security_logs', JSON.stringify(logs));
        } catch (e) {
            // Ignorar errores de storage
        }
    }
};

// Exportar para uso global
window.Sanitize = Sanitize;

// Compatibilidad con módulos ES6 (si se usa import)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sanitize;
}

console.log('✅ Sanitize.js cargado correctamente');
