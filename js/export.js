/**
 * EXPORT.JS - Sistema de Exportación
 * Genera paquete descargable de la invitación
 */

class InvitationExporter {
    constructor() {
        this.filesMap = new Map();
    }

    /**
     * Exportar invitación como HTML completo
     */
    async exportAsHTML(data = null, options = {}) {
        const invitationData = data || invitationStorage.getData();
        const defaultOptions = {
            minify: false,
            optimizeImages: false,
            includeResources: true
        };
        const settings = { ...defaultOptions, ...options };

        try {
            // Generar HTML completo
            const html = this.generateStandaloneHTML(invitationData, settings);

            // Crear blob
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

            // Descargar
            this.downloadFile(blob, 'invitacion.html');

            return true;
        } catch (error) {
            console.error('Error al exportar HTML:', error);
            throw error;
        }
    }

    /**
     * Exportar como paquete ZIP
     */
    async exportAsZIP(data = null, options = {}) {
        const invitationData = data || invitationStorage.getData();

        try {
            // Crear estructura de archivos
            const files = await this.prepareFilesForZIP(invitationData, options);

            // Generar ZIP (usando simulación ya que necesitaríamos una librería)
            // En producción, usar JSZip
            const zipBlob = await this.createZIPBlob(files);

            // Descargar
            this.downloadFile(zipBlob, 'invitacion.zip');

            return true;
        } catch (error) {
            console.error('Error al exportar ZIP:', error);
            throw error;
        }
    }

    /**
     * Generar HTML standalone completo
     */
    generateStandaloneHTML(data, options = {}) {
        const cssContent = this.generateInlineCSS(data);
        const jsContent = this.generateInlineJS(data);
        const bodyContent = this.generateBodyHTML(data);

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${Sanitize.escapeAttr(data.eventName || 'Invitación Digital')}">
    <meta property="og:title" content="${Sanitize.escapeAttr(data.eventName || 'Invitación Digital')}">
    <meta property="og:description" content="${Sanitize.escapeAttr(data.welcomeMessage || 'Te invitamos a nuestro evento especial')}">
    <meta property="og:type" content="website">
    <title>${Sanitize.escapeHtml(data.eventName || 'Invitación Digital')}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Cormorant+Garamond:wght@300;400;600&family=Poppins:wght@300;400;600;700&family=Cinzel:wght@400;600;700&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet">
    <style>${options.minify ? this.minifyCSS(cssContent) : cssContent}</style>
</head>
<body>
    ${bodyContent}
    <script>${options.minify ? this.minifyJS(jsContent) : jsContent}</script>
</body>
</html>`;
    }

    /**
     * Generar CSS inline completo
     */
    generateInlineCSS(data) {
        return `
        :root {
            --primary: ${Sanitize.sanitizeColor(data.primaryColor) || data.primaryColor};
            --secondary: ${Sanitize.sanitizeColor(data.secondaryColor) || data.secondaryColor};
            --text-color: ${Sanitize.sanitizeColor(data.textColor) || data.textColor};
            --title-font: ${Sanitize.escapeCss(data.titleFont)};
            --body-font: ${Sanitize.escapeCss(data.bodyFont)};
        }

        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            height: 100%;
            width: 100%;
        }

        body {
            font-family: var(--body-font);
            color: var(--text-color);
            background: #000;
            line-height: 1.6;
            min-height: 100vh;
            margin: 0;
            display: flex;
            flex-direction: column;
        }

        .invitation-container {
            width: 100%;
            min-height: 100vh;
            position: relative;
            overflow: hidden; /* Controlado */
            display: flex;
            flex-direction: column;
        }

        .invitation-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
        }

        .bg-video, .bg-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: absolute;
            top: 0;
            left: 0;
        }

        .bg-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, ${data.overlayOpacity / 100});
        }

        /* AJUSTES PARA IMPRESIÓN Y EXPORTACIÓN */
        @media print {
            @page {
                margin: 0;
                size: auto;
            }
            
            html, body {
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                background-color: white !important;
            }

            .invitation-container {
                min-height: 0 !important;
                height: auto !important;
                overflow: visible !important;
                display: block !important;
            }

            .invitation-background {
                position: absolute !important;
                height: 100% !important;
                width: 100% !important;
                top: 0;
                left: 0;
                z-index: -1;
            }
            
            .invitation-content {
                min-height: 0 !important;
                padding: 1rem !important;
            }

            /* Evitar cortes indeseados */
            section, .content-section, .detail-item {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            /* Fix Opera/Blink: imágenes no se truncan al 50% */
            .hero-section,
            .honored-photo-container,
            .event-photo-container {
                break-inside: avoid;
                page-break-inside: avoid;
                overflow: visible !important;
                contain: none !important;
                display: block !important;
                max-height: none !important;
                height: auto !important;
            }

            .honored-photo,
            .event-photo,
            img {
                max-width: 100% !important;
                max-height: none !important;
                height: auto !important;
                break-inside: avoid;
                page-break-inside: avoid;
                object-fit: contain !important;
            }

            /* Fix Opera: eliminar espaciados anómalos */
            .invitation-container > *:first-child {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }

            .invitation-container > *:last-child {
                margin-bottom: 0 !important;
                padding-bottom: 0 !important;
            }

            /* Fix Opera: flex containers no deben causar truncamiento */
            .hero-section {
                display: block !important;
                flex-direction: unset !important;
                align-items: unset !important;
                justify-content: unset !important;
            }

            /* Forzar colores de fondo */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

        .invitation-content {
            position: relative;
            z-index: 10;
            padding: 2rem 1.5rem;
            min-height: 100vh;
        }

        .hero-section {
            text-align: center;
            padding: 3rem 1rem;
            animation: fadeInDown 1s ease-out;
            position: relative;
            height: auto !important;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 2rem;
            z-index: 5;
        }

        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes photoZoom {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
        }

        .event-type {
            font-size: 0.9rem;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: var(--primary);
            margin-bottom: 1rem;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .honored-photo-container {
            margin: 2rem auto;
            width: 200px;
            height: 200px;
            position: relative;
        }

        .honored-photo {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 5px solid var(--primary);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: photoZoom 1s ease-out 0.3s both;
        }

        .event-title {
            font-family: var(--title-font);
            font-size: 3rem;
            color: var(--primary);
            margin: 2rem 0 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            line-height: 1.2;
            animation: fadeInUp 1s ease-out 0.5s both;
        }

        .honored-name {
            font-size: 2.5rem;
            font-weight: 700;
            color: #fff;
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
            margin-bottom: 1.5rem;
            animation: fadeInUp 1s ease-out 0.7s both;
        }

        .divider {
            width: 100px;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
            margin: 2rem auto;
        }

        .content-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            margin: 1.5rem 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            animation: fadeInUp 1s ease-out;
        }

        .section-title {
            font-family: var(--title-font);
            font-size: 2rem;
            color: var(--primary);
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .section-text {
            font-size: 1rem;
            line-height: 1.8;
            text-align: center;
        }

        .event-details {
            display: grid;
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .detail-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 15px;
            transition: all 0.3s ease;
        }

        .detail-item:hover {
            background: rgba(255, 255, 255, 0.8);
            transform: translateX(5px);
        }

        .detail-icon {
            font-size: 2rem;
            min-width: 50px;
            text-align: center;
        }

        .detail-content h3 {
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--primary);
            margin-bottom: 0.25rem;
        }

        .detail-content p {
            font-size: 1.1rem;
            font-weight: 600;
        }

        .countdown-section {
            text-align: center;
            padding: 2rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 20px;
            margin: 2rem 0;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .countdown-title {
            font-size: 1.2rem;
            color: var(--text-color);
            margin-bottom: 1.5rem;
            font-weight: 600;
        }

        .countdown-display {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .countdown-inline {
            display: inline-block;
            padding: 1rem 1.25rem;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            color: var(--primary);
            font-weight: 800;
            font-variant-numeric: tabular-nums;
            letter-spacing: 0.5px;
            font-size: 1.8rem;
        }

        .countdown-item {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            padding: 1rem;
            min-width: 70px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .countdown-value {
            display: block;
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            line-height: 1;
        }

        .countdown-label {
            display: block;
            font-size: 0.8rem;
            text-transform: uppercase;
            color: var(--text-color);
            margin-top: 0.5rem;
            letter-spacing: 1px;
        }

        .map-section, .qr-section {
            text-align: center;
            padding: 2rem;
        }

        .map-container {
            width: 100%;
            height: 300px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            margin-top: 1rem;
        }

        .map-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .qr-code-container {
            display: inline-block;
            padding: 1.5rem;
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            margin-top: 1rem;
        }

        .qr-code {
            max-width: 200px;
            height: auto;
        }

        .music-controls {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1000;
        }

        .music-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: var(--text-color);
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        }

        .music-btn:hover {
            transform: scale(1.1);
        }

        .rsvp-btn {
            display: inline-block;
            padding: 1rem 3rem;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: var(--text-color);
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            border-radius: 50px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .rsvp-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        }

        .footer-section {
            text-align: center;
            padding: 3rem 1rem;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            margin-top: 3rem;
        }

        .hashtag {
            font-size: 1.5rem;
            color: var(--primary);
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .footer-message {
            font-size: 1rem;
            color: #fff;
            font-style: italic;
        }

        @media (max-width: 768px) {
            .event-title { font-size: 2.5rem; }
            .honored-name { font-size: 2rem; }
            .content-section { padding: 1.5rem; margin: 1rem 0; }
            .countdown-item { min-width: 60px; padding: 0.75rem; }
            .countdown-value { font-size: 1.5rem; }
            .music-btn { width: 50px; height: 50px; font-size: 1.2rem; }
        }

        .animated-gradient {
            background: linear-gradient(-45deg, var(--primary), var(--secondary), var(--primary));
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
        }

        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .particles-canvas, .confetti-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .bokeh-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(20px);
            opacity: 0.3;
            animation: float 15s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
        }
        ` + this.generateDesignElementCSS(data);
    }

    hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex) {
            const h = String(hex).trim();
            if (h.length === 4) {
                r = parseInt(h[1] + h[1], 16);
                g = parseInt(h[2] + h[2], 16);
                b = parseInt(h[3] + h[3], 16);
            } else if (h.length === 7) {
                r = parseInt(h.substring(1, 3), 16);
                g = parseInt(h.substring(3, 5), 16);
                b = parseInt(h.substring(5, 7), 16);
            }
        }
        const a = Number.isFinite(parseFloat(alpha)) ? parseFloat(alpha) : 1;
        return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
    }

    generateDesignElementCSS(data) {
        const escAttr = (v) => String(v).replace(/"/g, '\\"');
        const escUrl = (v) => String(v).replace(/["\\\n\r]/g, (m) => (m === '"' ? '\\"' : '\\' + m));

        const designElements = data.designElements || {};
        let css = '';

        Object.keys(designElements).forEach((id) => {
            const s = designElements[id];
            if (!s) return;

            const rules = [];

            const tx = Number.isFinite(parseFloat(s.tx)) ? parseFloat(s.tx) : 0;
            const ty = Number.isFinite(parseFloat(s.ty)) ? parseFloat(s.ty) : 0;
            if (tx !== 0 || ty !== 0) rules.push(`translate: ${tx}px ${ty}px !important;`);

            if (Number.isFinite(parseFloat(s.width))) rules.push(`width: ${parseFloat(s.width)}px !important;`);
            if (Number.isFinite(parseFloat(s.height))) rules.push(`height: ${parseFloat(s.height)}px !important;`);

            if (Number.isFinite(parseInt(s.zIndex))) {
                rules.push(`position: relative !important;`);
                rules.push(`z-index: ${parseInt(s.zIndex)} !important;`);
            }

            if (s.hidden) rules.push(`display: none !important;`);

            if (Number.isFinite(parseFloat(s.opacity))) rules.push(`opacity: ${Math.min(1, Math.max(0, parseFloat(s.opacity)))} !important;`);

            if (s.textColor) rules.push(`color: ${s.textColor} !important;`);
            if (s.textGradient) {
                rules.push(`background: ${s.textGradient} !important;`);
                rules.push(`-webkit-background-clip: text !important;`);
                rules.push(`background-clip: text !important;`);
                rules.push(`color: transparent !important;`);
                rules.push(`-webkit-text-fill-color: transparent;`);
            }

            if (s.fillType === 'solid' && s.fillColor) rules.push(`background: ${s.fillColor} !important;`);
            if (s.fillType === 'gradient' && s.fillGradient) rules.push(`background: ${s.fillGradient} !important;`);
            if (s.fillType === 'texture' && s.textureDataUrl) {
                rules.push(`background-image: url("${escUrl(s.textureDataUrl)}") !important;`);
                rules.push(`background-size: ${Number.isFinite(parseFloat(s.textureScale)) ? Math.max(0.1, parseFloat(s.textureScale)) * 100 : 100}% !important;`);
                rules.push(`background-repeat: ${s.textureRepeat || 'repeat'} !important;`);
            }

            if (Number.isFinite(parseFloat(s.borderWidth)) && parseFloat(s.borderWidth) > 0) {
                rules.push(`border: ${parseFloat(s.borderWidth)}px ${s.borderStyle || 'solid'} ${s.borderColor || '#000000'} !important;`);
            }
            if (Number.isFinite(parseFloat(s.borderRadius))) rules.push(`border-radius: ${Math.max(0, parseFloat(s.borderRadius))}px !important;`);

            if (s.shadowEnabled) {
                const sc = s.shadowColor || '#000000';
                const so = Number.isFinite(parseFloat(s.shadowOpacity)) ? parseFloat(s.shadowOpacity) / 100 : 0.35;
                const sx = Number.isFinite(parseFloat(s.shadowX)) ? parseFloat(s.shadowX) : 0;
                const sy = Number.isFinite(parseFloat(s.shadowY)) ? parseFloat(s.shadowY) : 6;
                const sb = Number.isFinite(parseFloat(s.shadowBlur)) ? parseFloat(s.shadowBlur) : 16;
                const ss = Number.isFinite(parseFloat(s.shadowSpread)) ? parseFloat(s.shadowSpread) : 0;
                rules.push(`box-shadow: ${sx}px ${sy}px ${sb}px ${ss}px ${this.hexToRgba(sc, so)} !important;`);
            }

            const filters = [];
            if (Number.isFinite(parseFloat(s.filterBlur)) && parseFloat(s.filterBlur) > 0) filters.push(`blur(${parseFloat(s.filterBlur)}px)`);
            if (Number.isFinite(parseFloat(s.filterGrayscale)) && parseFloat(s.filterGrayscale) > 0) filters.push(`grayscale(${Math.min(100, Math.max(0, parseFloat(s.filterGrayscale)))}%)`);
            if (filters.length) rules.push(`filter: ${filters.join(' ')} !important;`);

            if (rules.length) css += `[data-editor-id="${escAttr(id)}"] { ${rules.join(' ')} }`;
        });

        return css;
    }

    /**
     * Generar JavaScript inline
     */
    generateInlineJS(data) {
        let script = '';

        // Cuenta regresiva
        if (data.enableCountdown && data.eventDate && data.eventTime) {
            script += `
            function updateCountdown() {
                const countdownEl = document.getElementById('countdown');
                if (!countdownEl) return;

                const rawDate = '${data.eventDate}';
                const rawTime = '${data.eventTime}';

                const matchDate = /^\\s*(\\d{4})-(\\d{2})-(\\d{2})\\s*$/.exec(rawDate || '');
                const matchTime = /^\\s*(\\d{2}):(\\d{2})(?::(\\d{2}))?\\s*$/.exec(rawTime || '');

                if (!matchDate || !matchTime) {
                    countdownEl.innerHTML = '<div class="countdown-inline">Fecha/hora inválida</div>';
                    return;
                }

                const y = parseInt(matchDate[1], 10);
                const mo = parseInt(matchDate[2], 10);
                const d = parseInt(matchDate[3], 10);
                const hh = parseInt(matchTime[1], 10);
                const mm = parseInt(matchTime[2], 10);
                const ss = parseInt(matchTime[3] || '0', 10);

                const target = new Date(y, mo - 1, d, hh, mm, ss, 0);
                if (!Number.isFinite(target.getTime())) {
                    countdownEl.innerHTML = '<div class="countdown-inline">Fecha/hora inválida (zona horaria)</div>';
                    return;
                }

                const now = new Date();
                const diff = target.getTime() - now.getTime();
                
                if (diff <= 0) {
                    countdownEl.innerHTML = '<div class="countdown-inline">Evento finalizado</div>';
                    return;
                }
                
                const totalSeconds = Math.floor(diff / 1000);
                const days = Math.floor(totalSeconds / 86400);
                const hours = Math.floor((totalSeconds % 86400) / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');
                const text = \`\${pad2(days)}d \${pad2(hours)}h \${pad2(minutes)}m \${pad2(seconds)}s\`;
                countdownEl.innerHTML = \`<div class="countdown-inline" aria-label="Tiempo restante">\${text}</div>\`;
            }
            
            updateCountdown();
            setInterval(updateCountdown, 1000);
            `;
        }

        // Control de música
        if (data.backgroundMusic && data.backgroundMusic.data) {
            script += `
            const music = document.getElementById('backgroundMusic');
            const musicToggle = document.getElementById('musicToggle');
            let isPlaying = ${data.autoplayMusic};
            
            if (musicToggle) {
                musicToggle.addEventListener('click', () => {
                    if (isPlaying) {
                        music.pause();
                        musicToggle.textContent = '🔇';
                    } else {
                        music.play().catch(e => console.log('Error al reproducir:', e));
                        musicToggle.textContent = '🎵';
                    }
                    isPlaying = !isPlaying;
                });
            }
            
            // Autoplay con interacción del usuario
            document.addEventListener('click', () => {
                if (${data.autoplayMusic} && music.paused) {
                    music.play().catch(e => console.log('Error al reproducir:', e));
                }
            }, { once: true });
            `;
        }

        // QR Code
        if (data.enableQR && data.qrURL) {
            script += `
            const qrImage = document.getElementById('qr-image');
            if (qrImage) {
                qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrURL)}';
            }
            `;
        }

        // Efectos
        if (data.backgroundEffect === 'particles') {
            script += this.getParticlesScript();
        } else if (data.backgroundEffect === 'confetti') {
            script += this.getConfettiScript(data);
        }

        return script;
    }

    /**
     * Generar HTML del cuerpo
     */
    generateBodyHTML(data) {
        // Usar la misma lógica que preview.js
        const preview = new InvitationPreview(null);
        preview.currentData = data;
        return preview.generateBody();
    }

    /**
     * Script de partículas
     */
    getParticlesScript() {
        return `
        window.addEventListener('load', () => {
            const canvas = document.getElementById('particles');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const particles = [];
            const particleCount = 50;
            
            class Particle {
                constructor() {
                    this.reset();
                }
                
                reset() {
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + 10;
                    this.size = Math.random() * 3 + 1;
                    this.speedY = Math.random() * 2 + 1;
                    this.opacity = Math.random() * 0.5 + 0.3;
                }
                
                update() {
                    this.y -= this.speedY;
                    if (this.y < -10) this.reset();
                }
                
                draw() {
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + this.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
            
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => { p.update(); p.draw(); });
                requestAnimationFrame(animate);
            }
            
            animate();
            
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        });
        `;
    }

    /**
     * Script de confetti
     */
    getConfettiScript(data) {
        return `
        window.addEventListener('load', () => {
            const canvas = document.getElementById('confetti');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const confetti = [];
            const colors = ['${data.primaryColor}', '${data.secondaryColor}', '#FFD700', '#FF69B4'];
            
            class Confetti {
                constructor() {
                    this.reset();
                }
                
                reset() {
                    this.x = Math.random() * canvas.width;
                    this.y = -10;
                    this.size = Math.random() * 8 + 4;
                    this.speedY = Math.random() * 3 + 2;
                    this.speedX = (Math.random() - 0.5) * 2;
                    this.color = colors[Math.floor(Math.random() * colors.length)];
                    this.rotation = Math.random() * 360;
                    this.rotationSpeed = (Math.random() - 0.5) * 10;
                }
                
                update() {
                    this.y += this.speedY;
                    this.x += this.speedX;
                    this.rotation += this.rotationSpeed;
                    if (this.y > canvas.height + 10) this.reset();
                }
                
                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.rotate(this.rotation * Math.PI / 180);
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                    ctx.restore();
                }
            }
            
            for (let i = 0; i < 100; i++) {
                confetti.push(new Confetti());
            }
            
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                confetti.forEach(c => { c.update(); c.draw(); });
                requestAnimationFrame(animate);
            }
            
            animate();
            
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            });
        });
        `;
    }

    /**
     * Minificar CSS (simple)
     */
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,])\s*/g, '$1')
            .trim();
    }

    /**
     * Minificar JS (simple)
     */
    minifyJS(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Preparar archivos para ZIP
     */
    async prepareFilesForZIP(data, options) {
        const files = new Map();

        // HTML principal
        const html = this.generateStandaloneHTML(data, options);
        files.set('index.html', html);

        // README
        const readme = this.generateREADME(data);
        files.set('README.txt', readme);

        return files;
    }

    /**
     * Generar README
     */
    generateREADME(data) {
        return `INVITACIÓN DIGITAL
==================

Evento: ${data.eventName || 'Sin nombre'}
Fecha: ${data.eventDate || 'No especificada'}
Hora: ${data.eventTime || 'No especificada'}

INSTRUCCIONES:
1. Abre el archivo index.html en tu navegador web preferido
2. Para subir a internet, sube todos los archivos a tu servidor web
3. Comparte el link con tus invitados

COMPATIBILIDAD:
- Chrome, Firefox, Safari, Edge (últimas versiones)
- Dispositivos móviles (iOS, Android)

NOTA: Para mejor experiencia, asegúrate de que tu navegador permita la reproducción automática de audio.

Generado con Sistema de Invitaciones Digitales
${new Date().toLocaleDateString('es-ES')}
`;
    }

    /**
     * Crear blob de ZIP (simulación simple)
     */
    async createZIPBlob(files) {
        // En producción, usar JSZip
        // Por ahora, solo exportamos el HTML
        const html = files.get('index.html');
        return new Blob([html], { type: 'text/html;charset=utf-8' });
    }

    /**
     * Descargar archivo
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Obtener tamaño estimado del export
     */
    getEstimatedSize(data) {
        const html = this.generateStandaloneHTML(data, { minify: false });
        const blob = new Blob([html]);
        const bytes = blob.size;
        const kb = bytes / 1024;
        const mb = kb / 1024;

        return {
            bytes,
            kb: kb.toFixed(2),
            mb: mb.toFixed(2),
            formatted: mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`
        };
    }
}

// Crear instancia global
const invitationExporter = new InvitationExporter();

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvitationExporter;
}
