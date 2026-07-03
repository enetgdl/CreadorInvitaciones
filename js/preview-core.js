/**
 * PREVIEW-CORE.js - Núcleo del Sistema de Vista Previa
 * Clase principal y métodos de inicialización/renderizado
 */

class InvitationPreview {
    constructor(iframeElement) {
        this.iframe = iframeElement;
        this.currentData = null;
        this.updateQueue = [];
        this.isUpdating = false;
        this.debounceTimer = null;
        this.debounceDelay = 300; // ms
        this._runtimeCode = null; // cached runtime script content
        this._runtimeFetchPromise = null; // pending fetch promise
    }

    /**
     * Inicializar vista previa
     */
    initialize(data) {
        this.currentData = data || invitationStorage.getData();
        this.render();
    }

    /**
     * Actualizar la previsualización de forma inteligente.
     * Los campos estructurales (texto, toggles, fechas) disparan un render completo (debounced).
     * Los campos de estilo (color, opacidad, translate...) solo parchean el CSS inline.
     *
     * @param {string} field  - Nombre del campo en `data` que cambió
     * @param {*}      value  - Nuevo valor (ya aplicado a this.currentData antes de llamar)
     */
    smartUpdate(field, value) {
        // Campos que requieren re-render completo del HTML
        const STRUCTURE_FIELDS = new Set([
            'eventType', 'eventName', 'honoredName',
            'eventDate', 'eventTime', 'eventLocation', 'eventAddress',
            'massTime', 'massLocation', 'massAddress',
            'enableMassLocation', 'enableMassTime', 'enableMassAddress',
            'enableCountdown', 'enableRSVP', 'enableMap', 'enableQR',
            'welcomeMessage', 'mainMessage', 'dressCode', 'closingMessage',
            'countdownText', 'eventHashtag', 'confirmPhone',
            'honoredPhoto', 'backgroundImage', 'backgroundVideo',
            'backgroundMusic', 'audioNote', 'autoplayMusic', 'loopMusic',
            'backgroundEffect', 'gallery', '_themeId'
        ]);

        if (field !== undefined) {
            // Aplicar el valor al currentData antes de decidir la estrategia
            if (field.includes('.')) {
                // Soporte para rutas profundas como 'gallery.enabled'
                const parts = field.split('.');
                let obj = this.currentData;
                for (let i = 0; i < parts.length - 1; i++) obj = obj?.[parts[i]];
                if (obj) obj[parts[parts.length - 1]] = value;
            } else {
                if (this.currentData) this.currentData[field] = value;
            }
        }

        if (STRUCTURE_FIELDS.has(field)) {
            // Re-render completo con debounce
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.render(), this.debounceDelay);
        } else {
            // Solo parchear el CSS dinámico — instantáneo, sin destruir el DOM
            this.patchStyles();
        }
    }

    /**
     * Actualizar un campo individual (alias de smartUpdate para compatibilidad)
     */
    update(field, value) {
        this.smartUpdate(field, value);
    }

    /**
     * Actualizar múltiples campos a la vez.
     * Si alguno es estructural, se hace un render completo; si no, solo parcheo de CSS.
     */
    updateMultiple(updates) {
        const STRUCTURE_FIELDS = new Set([
            'eventType', 'eventName', 'honoredName',
            'eventDate', 'eventTime', 'eventLocation', 'eventAddress',
            'massTime', 'massLocation', 'massAddress',
            'enableMassLocation', 'enableMassTime', 'enableMassAddress',
            'enableCountdown', 'enableRSVP', 'enableMap', 'enableQR',
            'welcomeMessage', 'mainMessage', 'dressCode', 'closingMessage',
            'countdownText', 'eventHashtag', 'confirmPhone',
            'honoredPhoto', 'backgroundImage', 'backgroundVideo',
            'backgroundMusic', 'audioNote', 'autoplayMusic', 'loopMusic',
            'backgroundEffect', 'gallery', '_themeId'
        ]);

        Object.assign(this.currentData, updates);

        const needsFullRender = Object.keys(updates).some(k => STRUCTURE_FIELDS.has(k));

        clearTimeout(this.debounceTimer);
        if (needsFullRender) {
            this.debounceTimer = setTimeout(() => this.render(), this.debounceDelay);
        } else {
            this.patchStyles();
        }
    }

    /**
     * Parchar SOLO el bloque de estilos dinámicos dentro del iframe.
     * No toca el HTML, no reinicia el countdown, no reparpadea imágenes.
     * Se usa para: colores, fuentes, opacidades, posiciones (designElements), bordes.
     */
    patchStyles() {
        try {
            const doc = this.iframe?.contentDocument;
            if (!doc || !doc.head) return;

            let styleEl = doc.getElementById('__dynamic_styles__');
            if (!styleEl) {
                styleEl = doc.createElement('style');
                styleEl.id = '__dynamic_styles__';
                doc.head.appendChild(styleEl);
            }

            // Reutilizar la instancia de InvitationPreview para generar los estilos
            styleEl.textContent = this.generateAdvancedStyles(this.currentData);
        } catch (e) {
            // Si el iframe aún no está listo, simplemente ignorar
        }
    }

    /**
     * Forzar re-render completo desde fuera (ej. al cargar plantilla o cambiar tema)
     */
    forceRender() {
        clearTimeout(this.debounceTimer);
        this.render();
    }

    /**
     * Renderizar HTML completo de la invitación
     */
    async render() {
        if (!this.iframe) {
            console.error('Iframe no disponible');
            return;
        }

        let html = this.generateHTML();

        // Convertir rutas de scripts relativas a absolutas para que funcionen con blob URLs.
        // Un blob URL tiene origen diferente, así que las rutas relativas no resuelven.
        const base = location.origin + location.pathname.replace(/\/[^/]*$/, '/');

        // Fetch and inline the runtime script to avoid cross-origin issues with Blob URLs.
        // Cache the result so we only fetch once.
        if (!this._runtimeCode && !this._runtimeFetchPromise) {
            const runtimeUrl = base + 'js/iframe-editor-runtime.js';
            this._runtimeFetchPromise = fetch(runtimeUrl, { cache: 'no-cache' })
                .then(r => r.ok ? r.text() : '')
                .then(code => { this._runtimeCode = code; this._runtimeFetchPromise = null; return code; })
                .catch(e => { console.warn('Could not inline iframe-editor-runtime.js', e); this._runtimeFetchPromise = null; return ''; });
        }

        // Wait for any in-flight fetch
        if (this._runtimeFetchPromise) {
            await this._runtimeFetchPromise;
        }

        if (this._runtimeCode) {
            // Replace the external script tag with an inline script using a function
            // to prevent interpreting any "$&" in the runtime code as a replacement pattern
            html = html.replace(
                '<script src="js/iframe-editor-runtime.js"></script>',
                () => `<script>\n${this._runtimeCode}\n</script>`
            );
        }

        // Convert remaining relative script paths (e.g. moment.min.js) to absolute
        html = html.replace(
            /(<script\s+src=")(js\/)/g,
            '$1' + base + 'js/'
        );

        const blob = new Blob([html], { type: 'text/html' });
        const blobURL = URL.createObjectURL(blob);

        if (this._prevBlobURL) {
            URL.revokeObjectURL(this._prevBlobURL);
        }
        this._prevBlobURL = blobURL;

        this.iframe.onload = () => {
            this.iframe.onload = null;
            try {
                this.iframe.contentWindow.__INVITATION_EDITOR__ = true;
            } catch (_) { }
        };

        this.iframe.src = blobURL;
    }

    /**
     * Generar HTML completo de la invitación
     */
    generateHTML() {
        const data = this.currentData;

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>${Sanitize.escapeHtml(data.eventName) || 'Invitación Digital'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:wght@300;400;600&family=Cinzel:wght@400;600;700&family=Crimson+Text:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600&family=Merriweather:wght@300;400;700&family=EB+Garamond:wght@400;600&family=Bodoni+Moda:wght@400;700&family=Spectral:wght@400;600&family=Montserrat:wght@300;400;600;700&family=Poppins:wght@300;400;600;700&family=Raleway:wght@300;400;600&family=Nunito:wght@300;400;600;700&family=Work+Sans:wght@300;400;600&family=Inter:wght@300;400;600&family=Rubik:wght@300;400;600&family=DM+Sans:wght@400;500;700&family=Josefin+Sans:wght@300;400;600&family=Quicksand:wght@400;500;700&family=Great+Vibes&family=Dancing+Script:wght@400;700&family=Pacifico&family=Sacramento&family=Allura&family=Satisfy&family=Kaushan+Script&family=Cookie&family=Alex+Brush&family=Amatic+SC:wght@400;700&family=Fredoka+One&family=Lilita+One&family=Baloo+2:wght@400;700&family=Caveat:wght@400;700&family=Indie+Flower&family=Permanent+Marker&family=Righteous&family=Chewy&family=Lobster&family=Bangers&family=Bungee&family=Carter+One&family=Monoton&family=Abril+Fatface&family=Bebas+Neue&family=Anton&family=Philosopher:wght@400;700&family=Orbitron:wght@400;700&family=Press+Start+2P&family=Archivo+Black&family=Oswald:wght@400;600&family=Bitter:wght@400;700&family=Vollkorn:wght@400;700&family=Cabin:wght@400;600&family=Arvo:wght@400;700&family=PT+Serif:wght@400;700&family=Source+Sans+Pro:wght@400;600&family=Ubuntu:wght@400;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        ${this.generateCSS()}
    </style>
</head>
<body>
    ${this.generateBody()}
    <script>window.__INVITATION_EDITOR__ = true;</script>
    <script src="js/moment.min.js"></script>
    <script src="js/iframe-editor-runtime.js"></script>
    <script>
        ${this.generateScript()}
    </script>
</body>
</html>`;
    }

    /**
     * Generar CSS completo de la invitación
     * Compone variables CSS, estilos base, estilos avanzados y efectos
     */
    generateCSS() {
        const data = this.currentData;
        const esc = (v) => String(v).replace(/"/g, '\\"');

        let css = '';

        // Variables CSS del tema
        css += `
        :root {
            --primary: ${data.primaryColor || '#FFD700'};
            --secondary: ${data.secondaryColor || '#FFF8DC'};
            --text-color: ${data.textColor || '#333333'};
            --title-font: ${data.titleFont || "'Great Vibes', cursive"};
            --body-font: ${data.bodyFont || "'Montserrat', sans-serif"};
        }
        
        /* Sistema de Animaciones al Scroll (Intersection Observer) */
        [data-animate] {
            opacity: 0;
            will-change: transform, opacity;
        }
        [data-animate].is-visible {
            opacity: 1;
        }
        
        [data-animate="fade-up"].is-visible {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        [data-animate="fade-in"].is-visible {
            animation: fadeIn 0.8s ease-out forwards;
        }
        [data-animate="zoom-in"].is-visible {
            animation: zoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes zoomIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }`;

        // Estilos base de la invitación
        css += `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: var(--body-font);
            color: var(--text-color);
            overflow-x: hidden;
            background: #000;
            overflow-y: scroll;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        body::-webkit-scrollbar { display: none; width: 0; height: 0; }
        html { scroll-behavior: smooth; scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar { display: none; }

        .invitation-container {
            width: 100%; max-width: 100vw; min-height: 100vh;
            position: relative; overflow: hidden;
        }
        .invitation-background {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;
        }
        .bg-video, .bg-image {
            width: 100%; height: 100%; object-fit: cover;
            position: absolute; top: 0; left: 0;
        }
        .bg-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(180deg,
                rgba(0,0,0,${(data.overlayOpacity || 30) / 100}) 0%,
                rgba(0,0,0,${((data.overlayOpacity || 30) - 15) / 100}) 50%,
                rgba(0,0,0,${(data.overlayOpacity || 30) / 100}) 100%);
        }
        .invitation-content {
            position: relative; z-index: 10;
            padding: 2rem 1.5rem; min-height: 100vh;
            display: flex; flex-direction: column;
            transform: translateZ(0); will-change: transform;
        }

        /* Hero Section */
        .hero-section {
            text-align: center; padding: 3rem 1rem;
            animation: fadeInDown 1s ease-out;
        }
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .event-type {
            font-size: 0.9rem; letter-spacing: 3px; text-transform: uppercase;
            color: var(--primary); margin-bottom: 1rem; font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .event-title {
            font-family: var(--title-font); font-size: 2.8rem;
            color: var(--primary); margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            line-height: 1.2;
        }
        .honored-photo-container {
            margin: 2rem auto; width: 200px; height: 200px; position: relative;
        }
        .honored-photo {
            width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
            border: 5px solid var(--primary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: photoZoom 1s ease-out 0.3s both;
        }
        @keyframes photoZoom {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
        }
        .photo-decoration {
            position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px;
            border: 2px solid var(--primary); border-radius: 50%;
            opacity: 0.5; animation: rotate 20s linear infinite;
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .honored-name {
            font-family: var(--title-font); font-size: 2.2rem;
            color: var(--primary); margin-top: 1rem;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
        }

        /* Content Section */
        .content-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Event details grid */
        .event-details {
            display: flex; flex-direction: column; gap: 1rem;
        }
        .detail-item {
            display: flex; align-items: center; gap: 0.75rem;
            padding: 0.875rem;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        .detail-item:hover {
            background: rgba(255, 255, 255, 0.85);
            transform: translateX(4px);
        }
        .detail-icon {
            font-size: 1.8rem; min-width: 44px; text-align: center;
        }
        .detail-content h3 {
            font-size: 0.72rem; text-transform: uppercase;
            letter-spacing: 1.2px; color: var(--primary);
            margin: 0 0 0.2rem;
        }
        .detail-content p {
            font-size: 0.95rem; font-weight: 600;
            color: var(--text-color); margin: 0;
            line-height: 1.4;
        }
        .event-date { font-size: 1rem; font-weight: 700; color: var(--primary); }
        .event-time { font-size: 0.95rem; }
        .event-location { font-size: 0.95rem; }
        .event-address { font-size: 0.9rem; white-space: pre-line; }
        .main-message {
            font-size: 1rem; color: var(--text-color); margin: 1rem 0;
            line-height: 1.6; text-align: center;
        }

        /* Countdown Section */
        .countdown-section {
            text-align: center;
            padding: 2rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 20px;
            margin: 1.5rem 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .countdown-title {
            font-family: var(--title-font); font-size: 1.2rem;
            color: rgba(0,0,0,0.7); margin-bottom: 1.5rem; font-weight: 600;
        }
        /* Classes used by preview-effects.js */
        .countdown-display {
            display: flex; justify-content: center; gap: 1rem;
            flex-wrap: wrap;
        }
        .countdown-item {
            display: flex; flex-direction: column; align-items: center;
            background: rgba(255,255,255,0.9);
            padding: 0.8rem 1.2rem; border-radius: 12px;
            min-width: 70px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            backdrop-filter: blur(5px);
        }
        .countdown-value {
            font-size: 2rem; font-weight: 800;
            color: var(--primary); line-height: 1.1;
        }
        .countdown-label {
            font-size: 0.7rem; color: var(--text-color);
            text-transform: uppercase; letter-spacing: 1px; margin-top: 0.3rem; opacity: 0.8;
        }
        /* Legacy class aliases */
        .countdown-values { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; }
        .countdown-number { font-size: 2rem; font-weight: 800; color: var(--primary); }
        .countdown-error, .countdown-finished {
            font-size: 1rem; color: var(--primary); font-style: italic;
        }

        /* Gallery Section */
        .gallery-section {
            padding: 1rem; margin: 2rem auto; position: relative; z-index: 5;
            max-width: 1200px; display: flex; flex-direction: column; align-items: center;
        }
        .gallery-collage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px; grid-auto-flow: dense; width: 100%;
            max-width: 900px; margin: 0 auto; justify-items: center;
        }
        .collage-item {
            border-radius: 8px; overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.3s; height: 100%; min-height: 140px;
            background: #000; display: flex; align-items: center; justify-content: center;
        }
        .collage-item:hover { transform: scale(1.03); z-index: 2; box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
        .collage-item img { width: 100%; height: 100%; object-fit: contain; object-position: center; display: block; }
        .span-2 { grid-column: span 2; }
        .row-span-2 { grid-row: span 2; }
        .gallery-carousel-container {
            position: relative; width: 100%; aspect-ratio: 16/9;
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3); background: #000;
            margin: 0 auto; max-width: 900px;
            display: flex; align-items: center; justify-content: center;
        }
        .gallery-carousel-wrapper {
            position: relative; width: 100%; height: 100%;
            perspective: 1000px; transform-style: preserve-3d;
        }
        .gallery-slide {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            opacity: 0; transition: opacity 0.8s ease-in-out;
            background-size: contain; background-position: center; background-repeat: no-repeat;
        }
        .gallery-slide.active { opacity: 1; z-index: 1; }
        .carousel-prev, .carousel-next {
            position: absolute; top: 50%; transform: translateY(-50%);
            background: rgba(255,255,255,0.9); border: none;
            width: 44px; height: 44px; border-radius: 50%; font-size: 1.4rem;
            cursor: pointer; z-index: 10; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
        }
        .carousel-prev { left: 12px; }
        .carousel-next { right: 12px; }
        .carousel-prev:hover, .carousel-next:hover {
            background: white; transform: translateY(-50%) scale(1.1);
        }
        .carousel-dots {
            position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 8px; z-index: 10;
        }
        .carousel-dot {
            width: 10px; height: 10px; border-radius: 50%;
            background: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.3s;
        }
        .carousel-dot.active { background: white; transform: scale(1.2); }
        .effect-fade .gallery-slide { transition: opacity 0.8s ease-in-out; }
        .effect-slide .gallery-slide { transition: transform 0.6s ease-in-out; }
        .effect-zoom .gallery-slide { transition: transform 0.6s ease-in-out; }

        /* RSVP Section */
        .rsvp-section {
            text-align: center; padding: 2rem 1rem;
        }
        .rsvp-title {
            font-family: var(--title-font); font-size: 1.5rem;
            color: var(--primary); margin-bottom: 1rem;
        }
        .rsvp-button {
            display: inline-block; padding: 14px 40px;
            background: var(--primary); color: #fff;
            border: none; border-radius: 50px; font-size: 1rem;
            font-weight: 600; text-transform: uppercase; letter-spacing: 2px;
            cursor: pointer; text-decoration: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s;
        }
        .rsvp-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }

        /* Map Section */
        .map-section {
            text-align: center; padding: 1.5rem 1rem;
        }
        .map-title {
            font-family: var(--title-font); font-size: 1.3rem;
            color: var(--primary); margin-bottom: 1rem;
        }
        .map-container {
            width: 100%; max-width: 600px; margin: 0 auto;
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .map-container iframe {
            width: 100%; height: 300px; border: none;
        }

        /* QR Section */
        .qr-section {
            text-align: center; padding: 1.5rem 1rem;
        }
        .qr-title {
            font-family: var(--title-font); font-size: 1.3rem;
            color: var(--primary); margin-bottom: 1rem;
        }
        .qr-container {
            display: inline-block; padding: 15px; background: white;
            border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .qr-container img { width: 150px; height: 150px; }

        /* Footer */
        .footer-section {
            text-align: center; padding: 2rem 1rem;
        }
        .closing-message {
            font-family: var(--title-font); font-size: 1.3rem;
            color: var(--primary); margin-bottom: 1rem;
        }
        .event-hashtag {
            font-size: 1rem; color: var(--primary); font-weight: 600;
            letter-spacing: 1px;
        }

        /* Dress Code */
        .dress-code {
            font-size: 0.95rem; color: var(--text-color); margin: 0.5rem 0;
            font-style: italic;
        }

        /* Mass Info */
        .mass-info {
            font-size: 0.95rem; color: var(--text-color); margin: 0.5rem 0;
        }

        /* Confirm */
        .confirm-section {
            text-align: center; padding: 1rem;
        }
        .confirm-phone {
            font-size: 1rem; color: var(--primary); font-weight: 600;
        }

        /* Efectos */
        .particles-canvas, .confetti-canvas {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
        }
        .bokeh-circle {
            position: absolute; border-radius: 50%; filter: blur(20px);
            opacity: 0.3; animation: float 15s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
        }
        .animated-gradient {
            background: linear-gradient(-45deg, ${data.primaryColor}, ${data.secondaryColor}, ${data.primaryColor});
            background-size: 400% 400%; animation: gradient 15s ease infinite;
        }
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }`;

        // Estilos avanzados (elementos, diseño, contenedores)
        css += this.generateAdvancedStyles(data);

        return css;
    }

    /**
     * Generar el HTML del cuerpo de la invitación
     * Compone todas las secciones: fondo, header, galería, countdown, RSVP, mapa
     */
    generateBody() {
        const data = this.currentData;
        const esc = (v) => Sanitize.escapeHtml(String(v || ''));
        let html = '';

        // === CONTENEDOR PRINCIPAL ===
        html += '<div class="invitation-container">';

        // === FONDO ===
        html += '<div class="invitation-background" data-editor-id="background" data-editor-name="Fondo">';
        if (data.backgroundType === 'video' && data.backgroundVideo) {
            html += `<video class="bg-video" autoplay muted loop playsinline><source src="${data.backgroundVideo}" type="video/mp4"></video>`;
        } else if (data.backgroundType === 'image' && data.backgroundImage) {
            html += `<img class="bg-image" src="${data.backgroundImage}" alt="Fondo">`;
        }
        html += '<div class="bg-overlay"></div>';
        html += this.generateBackgroundEffect(data.backgroundEffect);
        html += '</div>';

        // === CONTENIDO ===
        html += '<div class="invitation-content">';

        // --- HERO SECTION ---
        html += '<section class="hero-section" data-editor-id="heroSection" data-editor-name="Seccion Principal" data-animate="fade-in">';
        if (data.eventType) {
            const eventLabels = {
                xv: 'XV Años', boda: 'Bautizo', bautizo: 'Boda',
                cumpleanos: 'Cumpleaños', babyshower: 'Baby Shower',
                graduacion: 'Graduacion', general: 'Evento Especial'
            };
            html += `<div class="event-type" data-editor-id="eventType" data-editor-name="Tipo de Evento">${esc(eventLabels[data.eventType] || data.eventType)}</div>`;
        }
        if (data.eventName) {
            html += `<h1 class="event-title" data-editor-id="eventName" data-editor-name="Nombre del Evento">${esc(data.eventName)}</h1>`;
        }
        if (data.honoredPhoto) {
            html += `<div class="honored-photo-container" data-editor-id="honoredPhoto" data-editor-name="Foto Principal">`;
            html += `<img class="honored-photo" src="${data.honoredPhoto}" alt="Foto">`;
            html += '<div class="photo-decoration"></div>';
            html += '</div>';
        }
        if (data.honoredName) {
            html += `<div class="honored-name" data-editor-id="honoredName" data-editor-name="Nombre de Honrada">${esc(data.honoredName)}</div>`;
        }
        
        html += '<div class="divider" data-editor-id="divider"></div>';
        
        html += '</section>';

        // --- CONTENT SECTION ---
        html += '<section class="content-section" data-editor-id="contentSection" data-editor-name="Seccion de Contenido" data-animate="fade-up">';
        
        if (data.mainMessage) {
            html += `<div class="main-message section-text" data-editor-id="mainMessage" data-editor-name="Mensaje Principal" style="margin-bottom: 1.5rem; text-align: center;">${esc(data.mainMessage)}</div>`;
        }
        
        html += '<div class="event-details" data-editor-id="eventDetails">';
        
        // Fecha del evento
        if (data.eventDate) {
            let formattedDate = esc(data.eventDate);
            try {
                const dateObj = new Date(data.eventDate + 'T12:00:00');
                if (!isNaN(dateObj.getTime())) {
                    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    formattedDate = dateObj.toLocaleDateString('es-MX', options);
                }
            } catch (e) {}
            
            html += `<div class="detail-item" data-editor-id="eventDate" data-editor-name="Fecha">
                <div class="detail-icon">📅</div>
                <div class="detail-content">
                    <h3>Fecha</h3>
                    <p class="event-date">${formattedDate}</p>
                </div>
            </div>`;
        }
        
        // Hora del evento
        if (data.eventTime) {
            html += `<div class="detail-item" data-editor-id="eventTime" data-editor-name="Hora">
                <div class="detail-icon">🕐</div>
                <div class="detail-content">
                    <h3>Hora</h3>
                    <p class="event-time">${esc(data.eventTime)} hrs</p>
                </div>
            </div>`;
        }
        
        // Lugar del evento
        if (data.eventLocation) {
            html += `<div class="detail-item" data-editor-id="eventLocation" data-editor-name="Lugar">
                <div class="detail-icon">📍</div>
                <div class="detail-content">
                    <h3>Lugar</h3>
                    <p class="event-location">${esc(data.eventLocation)}</p>
                </div>
            </div>`;
        }
        
        // Dirección del evento
        if (data.eventAddress) {
            html += `<div class="detail-item" data-editor-id="eventAddress" data-editor-name="Dirección">
                <div class="detail-icon">🏠</div>
                <div class="detail-content">
                    <h3>Dirección</h3>
                    <p class="event-address">${esc(data.eventAddress)}</p>
                </div>
            </div>`;
        }
        
        // === CAMPOS DE MISA / CEREMONIA (dentro de la misma tarjeta) ===
        if (data.enableMassTime !== false && data.massTime) {
            html += `<div class="detail-item" data-editor-id="massTime" data-editor-name="Hora Ceremonia">
                <div class="detail-icon">🔔</div>
                <div class="detail-content">
                    <h3>Hora Ceremonia</h3>
                    <p class="mass-time">${esc(data.massTime)} hrs</p>
                </div>
            </div>`;
        }
        
        if (data.enableMassLocation !== false && data.massLocation) {
            html += `<div class="detail-item" data-editor-id="massLocation" data-editor-name="Lugar Ceremonia">
                <div class="detail-icon">📍</div>
                <div class="detail-content">
                    <h3>Lugar Ceremonia</h3>
                    <p class="mass-location">${esc(data.massLocation)}</p>
                </div>
            </div>`;
        }
        
        if (data.enableMassAddress !== false && data.massAddress) {
            html += `<div class="detail-item" data-editor-id="massAddress" data-editor-name="Dirección Templo">
                <div class="detail-icon">⛪</div>
                <div class="detail-content">
                    <h3>Dirección Templo</h3>
                    <p class="mass-address">${esc(data.massAddress)}</p>
                </div>
            </div>`;
        }
        
        // Código de vestimenta (como detail-item con ícono 👔)
        if (data.dressCode) {
            html += `<div class="detail-item" data-editor-id="dressCode" data-editor-name="Código de Vestimenta">
                <div class="detail-icon">👔</div>
                <div class="detail-content">
                    <h3>Código de Vestimenta</h3>
                    <p class="dress-code">${esc(data.dressCode)}</p>
                </div>
            </div>`;
        }
        
        html += '</div>'; // .event-details
        html += '</section>'; // .content-section

        // --- CUENTA REGRESIVA ---
        if (data.enableCountdown) {
            html += '<section class="countdown-section" data-editor-id="countdownSection" data-editor-name="Cuenta Regresiva" data-animate="zoom-in">';
            html += `<div class="countdown-title" data-editor-id="countdownText" data-editor-name="Texto Cuenta Regresiva">${esc(data.countdownText || 'Faltan para el gran día:')}</div>`;
            html += '<div id="countdown" class="countdown-display"></div>';
            html += '</section>';
        }

        // --- GALERÍA ---
        if (data.gallery && data.gallery.enabled) {
            html += this.generateGalleryHTML(data.gallery);
        }

        // --- RSVP ---
        if (data.enableRSVP && data.rsvpURL) {
            html += '<section class="rsvp-section" data-editor-id="rsvpSection" data-editor-name="RSVP" data-animate="fade-up">';
            html += `<div class="rsvp-title" data-editor-id="rsvpTitle" data-editor-name="Titulo RSVP">Confirma tu asistencia</div>`;
            html += `<a class="rsvp-btn" href="${Sanitize.sanitizeUrl(data.rsvpURL)}" target="_blank" data-editor-id="rsvpButton" data-editor-name="Boton RSVP">RSVP</a>`;
            html += '</section>';
        }

        // --- MAPA ---
        if (data.enableMap && data.mapCoords) {
            html += '<section class="map-section" data-editor-id="mapSection" data-editor-name="Mapa" data-animate="fade-up">';
            html += `<div class="map-title" data-editor-id="mapTitle" data-editor-name="Titulo Mapa">Ubicacion</div>`;
            html += '<div class="map-container">';
            html += `<iframe src="https://maps.google.com/maps?q=${Sanitize.sanitizeCoords(data.mapCoords)}&t=&z=15&ie=UTF8&iwloc=&output=embed" allowfullscreen loading="lazy"></iframe>`;
            html += '</div>';
            html += '</section>';
        }

        // --- QR ---
        if (data.enableQR && data.qrURL) {
            html += '<section class="qr-section" data-editor-id="qrSection" data-editor-name="Codigo QR" data-animate="fade-up">';
            html += `<div class="qr-title">Escanea el codigo QR</div>`;
            html += '<div class="qr-container">';
            html += `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qrURL)}" alt="QR Code">`;
            html += '</div>';
            html += '</section>';
        }

        // --- PIE DE PAGINA ---
        if (data.closingMessage || data.eventHashtag) {
            html += '<section class="footer-section" data-editor-id="footerSection" data-editor-name="Pie de Pagina" data-animate="fade-in">';
            if (data.closingMessage) {
                html += `<div class="closing-message" data-editor-id="closingMessage" data-editor-name="Mensaje de Cierre">${esc(data.closingMessage)}</div>`;
            }
            if (data.eventHashtag) {
                html += `<div class="event-hashtag" data-editor-id="eventHashtag" data-editor-name="Hashtag">#${esc(data.eventHashtag)}</div>`;
            }
            html += '</section>';
        }

        // --- CONFIRMAR ASISTENCIA ---
        if (data.confirmPhone) {
            html += '<section class="confirm-section" data-editor-id="confirmSection" data-editor-name="Confirmacion" data-animate="fade-in">';
            html += `<div class="confirm-phone">Confirma al ${esc(data.confirmPhone)}</div>`;
            html += '</section>';
        }

        html += '</div>'; // .invitation-content
        html += '</div>'; // .invitation-container

        return html;
    }

    /**
     * Generar scripts de la invitación
     * Compone todos los scripts: countdown, carrusel, efectos de fondo, musica, e intersection observer
     */
    generateScript() {
        const data = this.currentData;
        let script = '';
        
        // Intersection Observer (Scroll Animations)
        script += `
            (function() {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            // Si solo queremos que anime una vez: observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                
                document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
            })();
        `;

        // Countdown
        if (data.enableCountdown) {
            script += this.getCountdownScript();
        }

        // Galería (carrusel)
        if (data.gallery && data.gallery.enabled) {
            script += this.generateGalleryScript(data.gallery);
        }

        // Efectos de fondo
        if (data.backgroundEffect === 'particles') {
            script += this.getParticlesScript();
        } else if (data.backgroundEffect === 'confetti') {
            script += this.getConfettiScript();
        }

        // Musica de fondo
        if (data.backgroundMusic && data.backgroundMusic.data) {
            script += `
            (function() {
                var audio = new Audio('${data.backgroundMusic.data}');
                audio.loop = ${data.loopMusic !== false};
                audio.volume = 0.5;
                ${data.autoplayMusic !== false ? 'audio.play().catch(function(){});' : ''}
            })();`;
        }

        return script;
    }

    /**
     * Convertir HEX a RGBA
     */
    hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex) {
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length === 7) {
                r = parseInt(hex.substring(1, 3), 16);
                g = parseInt(hex.substring(3, 5), 16);
                b = parseInt(hex.substring(5, 7), 16);
            }
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Forzar actualización de la vista previa
     */
    forceUpdate() {
        clearTimeout(this.debounceTimer);
        this.render();
    }

    /**
     * Obtener HTML generado
     */
    getHTML() {
        return this.generateHTML();
    }

    /**
     * Abrir vista previa en nueva ventana
     */
    openInNewWindow() {
        const html = this.generateHTML();
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    }
}

// Exportar para uso global
window.InvitationPreview = InvitationPreview;
