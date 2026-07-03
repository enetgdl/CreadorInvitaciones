/**
 * RESPONSIVE-EXAMPLES.JS
 * Ejemplos de código para extender el sistema responsive
 */

// ============================================================
// EJEMPLO 1: Escuchar cambios de viewport
// ============================================================

window.addEventListener('viewportRecalculated', (event) => {
    const viewport = event.detail;
    console.log('Viewport actualizado:', viewport);

    // Ajustar elementos según el nuevo viewport
    if (viewport.width < 400) {
        document.querySelector('.my-element').style.fontSize = '14px';
    } else {
        document.querySelector('.my-element').style.fontSize = '16px';
    }
});


// ============================================================
// EJEMPLO 2: Obtener información del dispositivo actual
// ============================================================

function getDeviceInfo() {
    const manager = window.responsiveViewportManager;

    if (!manager) {
        console.error('ResponsiveViewportManager no está inicializado');
        return null;
    }

    return {
        tipo: manager.deviceType,
        ancho: manager.viewport.width,
        alto: manager.viewport.height,
        orientacion: manager.viewport.orientation,
        safeAreaTop: manager.viewport.safeAreaTop,
        safeAreaBottom: manager.viewport.safeAreaBottom,
        pixelRatio: manager.viewport.pixelRatio,
        esMovil: manager.deviceType === 'mobile',
        esTablet: manager.deviceType === 'tablet',
        esDesktop: manager.deviceType === 'desktop',
        esPortrait: manager.viewport.orientation === 'portrait',
        esLandscape: manager.viewport.orientation === 'landscape',
        tieneNotch: manager.viewport.safeAreaTop > 20
    };
}

// Uso:
const info = getDeviceInfo();
console.log('Dispositivo actual:', info);


// ============================================================
// EJEMPLO 3: Ajustar estilos según tipo de dispositivo
// ============================================================

function aplicarEstilosResponsivos() {
    const manager = window.responsiveViewportManager;
    const miElemento = document.querySelector('.mi-elemento');

    if (!miElemento) return;

    switch (manager.deviceType) {
        case 'mobile':
            miElemento.style.padding = '1rem';
            miElemento.style.fontSize = '14px';
            break;

        case 'tablet':
            miElemento.style.padding = '1.5rem';
            miElemento.style.fontSize = '16px';
            break;

        case 'desktop':
            miElemento.style.padding = '2rem';
            miElemento.style.fontSize = '18px';
            break;
    }
}

// Ejecutar al cargar y al cambiar viewport
window.addEventListener('DOMContentLoaded', aplicarEstilosResponsivos);
window.addEventListener('viewportRecalculated', aplicarEstilosResponsivos);


// ============================================================
// EJEMPLO 4: Detectar si un elemento está en área segura
// ============================================================

function estaEnAreaSegura(elemento) {
    const rect = elemento.getBoundingClientRect();
    const vp = window.responsiveViewportManager.viewport;

    const dentroTop = rect.top >= vp.safeAreaTop;
    const dentroBottom = rect.bottom <= (vp.height - vp.safeAreaBottom);

    return {
        completo: dentroTop && dentroBottom,
        top: dentroTop,
        bottom: dentroBottom,
        distanciaTop: rect.top - vp.safeAreaTop,
        distanciaBottom: (vp.height - vp.safeAreaBottom) - rect.bottom
    };
}

// Uso:
const miElemento = document.querySelector('.mi-elemento');
const estado = estaEnAreaSegura(miElemento);

if (!estado.completo) {
    console.warn('Elemento fuera del área segura', estado);
}


// ============================================================
// EJEMPLO 5: Ajustar imágenes según pixel ratio
// ============================================================

function cargarImagenOptima(imgElement, baseUrl) {
    const pixelRatio = window.responsiveViewportManager.viewport.pixelRatio;

    let sufijo = '';
    if (pixelRatio >= 3) {
        sufijo = '@3x';
    } else if (pixelRatio >= 2) {
        sufijo = '@2x';
    }

    const extension = baseUrl.split('.').pop();
    const sinExtension = baseUrl.replace(`.${extension}`, '');

    imgElement.src = `${sinExtension}${sufijo}.${extension}`;
}

// Uso:
const foto = document.querySelector('.foto-festejado');
cargarImagenOptima(foto, 'images/foto-festejado.jpg');
// Cargará: foto-festejado@2x.jpg en pantallas Retina


// ============================================================
// EJEMPLO 6: Crear una barra de estado persistente
// ============================================================

function crearBarraEstado() {
    const vp = window.responsiveViewportManager.viewport;

    const barra = document.createElement('div');
    barra.id = 'barra-estado';
    barra.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: ${vp.safeAreaTop}px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        z-index: 9999;
        padding-top: env(safe-area-inset-top, 0px);
    `;

    barra.textContent = `${vp.width}x${vp.height} - ${window.responsiveViewportManager.deviceType}`;

    document.body.appendChild(barra);

    // Actualizar al cambiar viewport
    window.addEventListener('viewportRecalculated', () => {
        const newVp = window.responsiveViewportManager.viewport;
        barra.style.height = `${newVp.safeAreaTop}px`;
        barra.textContent = `${newVp.width}x${newVp.height} - ${window.responsiveViewportManager.deviceType}`;
    });
}


// ============================================================
// EJEMPLO 7: Lazy loading de imágenes según viewport
// ============================================================

class LazyImageLoader {
    constructor() {
        this.images = document.querySelectorAll('[data-lazy-src]');
        this.observer = null;
        this.init();
    }

    init() {
        // Usar intersection observer
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                rootMargin: `${window.innerHeight * 0.5}px` // Cargar cuando está a 50% del viewport
            }
        );

        this.images.forEach(img => this.observer.observe(img));
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadImage(img) {
        const src = img.dataset.lazySrc;
        const manager = window.responsiveViewportManager;

        // Ajustar calidad según dispositivo
        let quality = 'high';
        if (manager.deviceType === 'mobile') {
            quality = 'medium';
        }

        // Cargar imagen
        img.src = src.replace('{quality}', quality);
        img.classList.add('loaded');
    }
}

// Uso:
window.addEventListener('DOMContentLoaded', () => {
    new LazyImageLoader();
});


// ============================================================
// EJEMPLO 8: Modal responsive con safe-area
// ============================================================

function mostrarModalResponsivo(contenido) {
    const vp = window.responsiveViewportManager.viewport;

    const modal = document.createElement('div');
    modal.className = 'modal-responsive';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding-top: max(${vp.safeAreaTop}px, 2rem);
        padding-bottom: max(${vp.safeAreaBottom}px, 2rem);
        padding-left: max(${vp.safeAreaLeft || 0}px, 1rem);
        padding-right: max(${vp.safeAreaRight || 0}px, 1rem);
    `;

    const contenedor = document.createElement('div');
    contenedor.className = 'modal-contenido';
    contenedor.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: ${vp.width < 600 ? '90%' : '500px'};
        max-height: 80vh;
        overflow-y: auto;
    `;

    contenedor.innerHTML = contenido;
    modal.appendChild(contenedor);

    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    document.body.appendChild(modal);
}


// ============================================================
// EJEMPLO 9: Ajustar fuentes según orientación
// ============================================================

function ajustarFuentesPorOrientacion() {
    const manager = window.responsiveViewportManager;
    const root = document.documentElement;

    if (manager.viewport.orientation === 'landscape' && manager.deviceType !== 'desktop') {
        // Reducir tamaño de fuente en landscape móvil
        root.style.fontSize = '70%';
    } else {
        // Restaurar tamaño normal
        root.style.fontSize = '';
    }
}

window.addEventListener('viewportRecalculated', ajustarFuentesPorOrientacion);


// ============================================================
// EJEMPLO 10: Detectar y manejar iPhone con notch
// ============================================================

function detectarYManejarNotch() {
    const vp = window.responsiveViewportManager.viewport;

    const tieneNotch = vp.safeAreaTop > 20;

    if (tieneNotch) {
        console.log('📱 iPhone con notch detectado');

        // Ajustar header
        const header = document.querySelector('header');
        if (header) {
            header.style.paddingTop = `calc(${vp.safeAreaTop}px + 1rem)`;
        }

        // Agregar clase al body
        document.body.classList.add('has-notch');
    } else {
        document.body.classList.remove('has-notch');
    }
}

window.addEventListener('DOMContentLoaded', detectarYManejarNotch);
window.addEventListener('viewportRecalculated', detectarYManejarNotch);


// ============================================================
// EJEMPLO 11: Sistema de grid responsive personalizado
// ============================================================

class ResponsiveGrid {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.updateLayout();

        window.addEventListener('viewportRecalculated', () => this.updateLayout());
    }

    updateLayout() {
        const manager = window.responsiveViewportManager;
        const width = manager.viewport.width;

        let columns;
        if (width < 768) {
            columns = 1; // Móvil: 1 columna
        } else if (width < 1024) {
            columns = 2; // Tablet: 2 columnas
        } else {
            columns = 3; // Desktop: 3 columnas
        }

        this.container.style.display = 'grid';
        this.container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this.container.style.gap = width < 768 ? '1rem' : '2rem';
    }
}

// Uso:
const grid = new ResponsiveGrid('.mi-galeria');


// ============================================================
// EJEMPLO 12: Debug panel temporal
// ============================================================

function mostrarDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        font-family: monospace;
        font-size: 11px;
        padding: 10px;
        border-radius: 8px;
        z-index: 99999;
        max-width: 300px;
    `;

    function actualizar() {
        const vp = window.responsiveViewportManager.viewport;
        const manager = window.responsiveViewportManager;

        panel.innerHTML = `
            <strong>RESPONSIVE DEBUG</strong><br>
            Width: ${vp.width}px<br>
            Height: ${vp.height}px<br>
            Device: ${manager.deviceType}<br>
            Orientation: ${vp.orientation}<br>
            Pixel Ratio: ${vp.pixelRatio}<br>
            Safe Area Top: ${vp.safeAreaTop}px<br>
            Safe Area Bottom: ${vp.safeAreaBottom}px<br>
            <button onclick="this.parentElement.remove()" style="margin-top:8px">Cerrar</button>
        `;
    }

    actualizar();
    window.addEventListener('viewportRecalculated', actualizar);
    document.body.appendChild(panel);
}

// Ejecutar en consola para ver info
// mostrarDebugPanel();


// ============================================================
// EJEMPLO 13: Optimizar rendimiento con throttle
// ============================================================

function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func(...args);
        }
    };
}

// Uso para actualizar elementos frecuentemente
const actualizarElementos = throttle(() => {
    const vp = window.responsiveViewportManager.viewport;
    console.log('Actualizando elementos...', vp.width);
    // ... lógica de actualización
}, 200);

window.addEventListener('viewportRecalculated', actualizarElementos);


// ============================================================
// EJEMPLO 14: Guardar preferencias de visualización
// ============================================================

class ViewportPreferences {
    static save() {
        const vp = window.responsiveViewportManager.viewport;
        const prefs = {
            lastWidth: vp.width,
            lastHeight: vp.height,
            lastDeviceType: window.responsiveViewportManager.deviceType,
            timestamp: Date.now()
        };

        localStorage.setItem('viewport_prefs', JSON.stringify(prefs));
    }

    static load() {
        const stored = localStorage.getItem('viewport_prefs');
        return stored ? JSON.parse(stored) : null;
    }

    static hasChanged() {
        const saved = this.load();
        if (!saved) return true;

        const vp = window.responsiveViewportManager.viewport;
        return saved.lastWidth !== vp.width ||
            saved.lastHeight !== vp.height;
    }
}

// Guardar al cambiar
window.addEventListener('viewportRecalculated', () => {
    ViewportPreferences.save();
});


// ============================================================
// EJEMPLO 15: Crear componente adaptativo
// ============================================================

class AdaptiveCard {
    constructor(data) {
        this.data = data;
        this.element = null;
        this.render();

        window.addEventListener('viewportRecalculated', () => this.render());
    }

    render() {
        const manager = window.responsiveViewportManager;
        const isMobile = manager.deviceType === 'mobile';

        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'adaptive-card';
            document.body.appendChild(this.element);
        }

        this.element.style.cssText = `
            padding: ${isMobile ? '1rem' : '2rem'};
            font-size: ${isMobile ? '14px' : '16px'};
            max-width: ${isMobile ? '100%' : '600px'};
            margin: ${isMobile ? '0' : '0 auto'};
        `;

        this.element.innerHTML = `
            <h3>${this.data.title}</h3>
            <p>${this.data.content}</p>
        `;
    }
}

// Uso:
const card = new AdaptiveCard({
    title: 'Mi Invitación',
    content: 'Contenido adaptativo'
});


// ============================================================
// NOTAS FINALES
// ============================================================

console.log(`
✨ RESPONSIVE EXAMPLES CARGADO
================================

Funciones disponibles:
- getDeviceInfo()
- aplicarEstilosResponsivos()
- estaEnAreaSegura(elemento)
- cargarImagenOptima(img, url)
- crearBarraEstado()
- mostrarModalResponsivo(html)
- mostrarDebugPanel()

Clases disponibles:
- LazyImageLoader
- ResponsiveGrid
- ViewportPreferences
- AdaptiveCard

Para más info: docs/RESPONSIVE-SYSTEM.md
`);
