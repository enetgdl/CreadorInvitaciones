/**
 * QR-GENERATOR.JS - Generador de Códigos QR
 * Genera códigos QR para enlaces de ubicación, confirmación, etc.
 */

class QRCodeGenerator {
    constructor() {
        this.qrCodeCache = new Map();
    }

    /**
     * Generar código QR para un texto/URL
     * Usando la API gratuita de goqr.me
     */
    async generate(data, size = 250) {
        if (!data) {
            throw new Error('No se proporcionó datos para el código QR');
        }

        // Verificar cache
        const cacheKey = `${data}_${size}`;
        if (this.qrCodeCache.has(cacheKey)) {
            return this.qrCodeCache.get(cacheKey);
        }

        try {
            // Usar API de QR Code Generator
            const encodedData = encodeURIComponent(data);
            const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png`;

            // Guardar en cache
            this.qrCodeCache.set(cacheKey, qrURL);

            return qrURL;
        } catch (error) {
            console.error('Error al generar código QR:', error);
            throw error;
        }
    }

    /**
     * Generar código QR como canvas
     */
    async generateCanvas(data, canvasElement, options = {}) {
        const defaultOptions = {
            width: 250,
            height: 250,
            colorDark: '#000000',
            colorLight: '#FFFFFF',
            correctLevel: 'H'
        };

        const settings = { ...defaultOptions, ...options };

        try {
            // Generar usando canvas (implementación simple)
            const qrURL = await this.generate(data, settings.width);

            // Cargar imagen en canvas
            const img = new Image();
            img.crossOrigin = 'anonymous';

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    const ctx = canvasElement.getContext('2d');
                    canvasElement.width = settings.width;
                    canvasElement.height = settings.height;

                    // Fondo
                    ctx.fillStyle = settings.colorLight;
                    ctx.fillRect(0, 0, settings.width, settings.height);

                    // Dibujar QR
                    ctx.drawImage(img, 0, 0, settings.width, settings.height);

                    resolve(canvasElement.toDataURL());
                };

                img.onerror = reject;
                img.src = qrURL;
            });
        } catch (error) {
            console.error('Error al generar canvas QR:', error);
            throw error;
        }
    }

    /**
     * Generar código QR para ubicación de Google Maps
     */
    generateForLocation(lat, lng, placeName = '') {
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        return this.generate(url);
    }

    /**
     * Generar código QR para coordenadas
     */
    generateForCoordinates(coordinates) {
        // Formato: "19.4326, -99.1332"
        const [lat, lng] = coordinates.split(',').map(c => c.trim());

        if (!lat || !lng) {
            throw new Error('Coordenadas inválidas');
        }

        return this.generateForLocation(lat, lng);
    }

    /**
     * Generar código QR para agregar evento al calendario
     */
    generateForCalendar(eventData) {
        const {
            title,
            location,
            description,
            startDate,
            startTime,
            endDate,
            endTime
        } = eventData;

        // Formato de fecha para calendar (YYYYMMDDTHHMMSS)
        const formatDateTime = (date, time) => {
            const d = new Date(`${date}T${time}`);
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const start = formatDateTime(startDate, startTime);
        const end = endDate && endTime ? formatDateTime(endDate, endTime) : start;

        // URL de Google Calendar
        const calendarURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(location || '')}`;

        return this.generate(calendarURL);
    }

    /**
     * Generar código QR para vCard (contacto)
     */
    generateForContact(contactData) {
        const {
            name,
            phone,
            email,
            organization
        } = contactData;

        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${phone}
EMAIL:${email}
ORG:${organization || ''}
END:VCARD`;

        return this.generate(vcard);
    }

    /**
     * Generar código QR para WiFi
     */
    generateForWiFi(ssid, password, encryption = 'WPA') {
        const wifiString = `WIFI:T:${encryption};S:${ssid};P:${password};;`;
        return this.generate(wifiString);
    }

    /**
     * Renderizar código QR en un elemento img
     */
    async renderToImage(data, imgElement, size = 250) {
        try {
            const qrURL = await this.generate(data, size);
            imgElement.src = qrURL;
            imgElement.alt = 'Código QR';
            imgElement.style.maxWidth = '100%';
            imgElement.style.height = 'auto';
            return qrURL;
        } catch (error) {
            console.error('Error al renderizar código QR:', error);
            throw error;
        }
    }

    /**
     * Descargar código QR como imagen
     */
    async download(data, filename = 'qrcode.png', size = 500) {
        try {
            const qrURL = await this.generate(data, size);

            // Crear enlace de descarga
            const a = document.createElement('a');
            a.href = qrURL;
            a.download = filename;
            a.click();
        } catch (error) {
            console.error('Error al descargar código QR:', error);
            throw error;
        }
    }

    /**
     * Obtener código QR como blob
     */
    async getBlob(data, size = 250) {
        try {
            const qrURL = await this.generate(data, size);
            const response = await fetch(qrURL);
            return await response.blob();
        } catch (error) {
            console.error('Error al obtener blob del código QR:', error);
            throw error;
        }
    }

    /**
     * Generar múltiples códigos QR
     */
    async generateMultiple(dataArray, size = 250) {
        const promises = dataArray.map(data => this.generate(data, size));
        return Promise.all(promises);
    }

    /**
     * Limpiar cache
     */
    clearCache() {
        this.qrCodeCache.clear();
    }

    /**
     * Obtener tamaño del cache
     */
    getCacheSize() {
        return this.qrCodeCache.size;
    }

    /**
     * Validar URL
     */
    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    /**
     * Validar coordenadas
     */
    isValidCoordinates(coords) {
        const pattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
        return pattern.test(coords);
    }
}

/**
 * Función auxiliar para crear QR rápidamente
 */
async function createQRCode(data, elementId, size = 250) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento con ID ${elementId} no encontrado`);
        return null;
    }

    const generator = new QRCodeGenerator();

    if (element.tagName === 'IMG') {
        return await generator.renderToImage(data, element, size);
    } else if (element.tagName === 'CANVAS') {
        return await generator.generateCanvas(data, element, { width: size, height: size });
    } else {
        const qrURL = await generator.generate(data, size);
        const img = document.createElement('img');
        img.src = qrURL;
        img.alt = 'Código QR';
        img.style.maxWidth = '100%';
        element.appendChild(img);
        return qrURL;
    }
}

/**
 * Función para generar QR de evento completo
 */
async function generateEventQR(eventData) {
    const generator = new QRCodeGenerator();

    // Si hay URL de confirmación
    if (eventData.rsvpURL) {
        return await generator.generate(eventData.rsvpURL);
    }

    // Si hay coordenadas
    if (eventData.mapCoords) {
        return await generator.generateForCoordinates(eventData.mapCoords);
    }

    // Si hay información de calendario
    if (eventData.eventDate && eventData.eventTime) {
        return await generator.generateForCalendar({
            title: eventData.eventName || 'Evento',
            location: eventData.eventLocation || '',
            description: eventData.mainMessage || '',
            startDate: eventData.eventDate,
            startTime: eventData.eventTime,
            endDate: eventData.eventDate,
            endTime: eventData.eventTime
        });
    }

    throw new Error('No hay suficiente información para generar código QR');
}

// Crear instancia global
const qrGenerator = new QRCodeGenerator();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QRCodeGenerator,
        qrGenerator,
        createQRCode,
        generateEventQR
    };
}
