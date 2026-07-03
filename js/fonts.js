/**
 * FONTS.JS - Biblioteca Extendida de Fuentes
 * 50+ fuentes adicionales con preview en tiempo real
 */

const FONT_LIBRARY = {
    // === ELEGANTES Y FORMALES (Serif) ===
    elegant: [
        { name: 'Playfair Display', value: "'Playfair Display', serif", category: 'Elegante', sample: 'Elegancia Clásica' },
        { name: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", category: 'Elegante', sample: 'Sofisticación' },
        { name: 'Cinzel', value: "'Cinzel', serif", category: 'Elegante', sample: 'Romano Moderno' },
        { name: 'Crimson Text', value: "'Crimson Text', serif", category: 'Elegante', sample: 'Texto Refinado' },
        { name: 'Libre Baskerville', value: "'Libre Baskerville', serif", category: 'Elegante', sample: 'Baskerville Libre' },
        { name: 'Lora', value: "'Lora', serif", category: 'Elegante', sample: 'Lectura Elegante' },
        { name: 'Merriweather', value: "'Merriweather', serif", category: 'Elegante', sample: 'Texto Clásico' },
        { name: 'EB Garamond', value: "'EB Garamond', serif", category: 'Elegante', sample: 'Garamond Digital' },
        { name: 'Bodoni Moda', value: "'Bodoni Moda', serif", category: 'Elegante', sample: 'Bodoni Moderno' },
        { name: 'Spectral', value: "'Spectral', serif", category: 'Elegante', sample: 'Espectral' },
    ],

    // === SANS-SERIF DE ALTA GAMA ===
    modern: [
        { name: 'Montserrat', value: "'Montserrat', sans-serif", category: 'Moderna', sample: 'Clean & Modern' },
        { name: 'Poppins', value: "'Poppins', sans-serif", category: 'Moderna', sample: 'Geométrica Suave' },
        { name: 'Raleway', value: "'Raleway', sans-serif", category: 'Moderna', sample: 'Elegancia Moderna' },
        { name: 'Nunito', value: "'Nunito', sans-serif", category: 'Moderna', sample: 'Redondeada Amigable' },
        { name: 'Work Sans', value: "'Work Sans', sans-serif", category: 'Moderna', sample: 'Profesional' },
        { name: 'Inter', value: "'Inter', sans-serif", category: 'Moderna', sample: 'Interface Design' },
        { name: 'Rubik', value: "'Rubik', sans-serif", category: 'Moderna', sample: 'Geométrica' },
        { name: 'DM Sans', value: "'DM Sans', sans-serif", category: 'Moderna', sample: 'Minimalista' },
        { name: 'Josefin Sans', value: "'Josefin Sans', sans-serif", category: 'Moderna', sample: 'Vintage Moderna' },
        { name: 'Quicksand', value: "'Quicksand', sans-serif", category: 'Moderna', sample: 'Suave Redondeada' },
    ],

    // === MANUSCRITAS (Handwritten) ===
    handwritten: [
        { name: 'Great Vibes', value: "'Great Vibes', cursive", category: 'Manuscrita', sample: 'Script Elegante' },
        { name: 'Dancing Script', value: "'Dancing Script', cursive", category: 'Manuscrita', sample: 'Baile de Letras' },
        { name: 'Pacifico', value: "'Pacifico', cursive", category: 'Manuscrita', sample: 'Surf Vintage' },
        { name: 'Sacramento', value: "'Sacramento', cursive", category: 'Manuscrita', sample: 'Caligrafía Fina' },
        { name: 'Allura', value: "'Allura', cursive", category: 'Manuscrita', sample: 'Script Fluido' },
        { name: 'Satisfy', value: "'Satisfy', cursive", category: 'Manuscrita', sample: 'Escritura Natural' },
        { name: 'Kaushan Script', value: "'Kaushan Script', cursive", category: 'Manuscrita', sample: 'Brush Script' },
        { name: 'Cookie', value: "'Cookie', cursive", category: 'Manuscrita', sample: 'Dulce Cursiva' },
        { name: 'Alex Brush', value: "'Alex Brush', cursive", category: 'Manuscrita', sample: 'Pincel Elegante' },
        { name: 'Amatic SC', value: "'Amatic SC', cursive", category: 'Manuscrita', sample: 'Mano Alzada' },
    ],

    // === CÓMICAS Y DIVERTIDAS ===
    playful: [
        { name: 'Fredoka One', value: "'Fredoka One', cursive", category: 'Divertida', sample: 'Redondeada Bold' },
        { name: 'Lilita One', value: "'Lilita One', cursive", category: 'Divertida', sample: 'Display Bold' },
        { name: 'Baloo 2', value: "'Baloo 2', cursive", category: 'Divertida', sample: 'Amigable Redondeada' },
        { name: 'Caveat', value: "'Caveat', cursive", category: 'Divertida', sample: 'Escritura Casual' },
        { name: 'Indie Flower', value: "'Indie Flower', cursive", category: 'Divertida', sample: 'Flor Indie' },
        { name: 'Permanent Marker', value: "'Permanent Marker', cursive", category: 'Divertida', sample: 'Marcador' },
        { name: 'Righteous', value: "'Righteous', cursive", category: 'Divertida', sample: 'Retro Geométrica' },
        { name: 'Chewy', value: "'Chewy', cursive", category: 'Divertida', sample: 'Masticable' },
        { name: 'Lobster', value: "'Lobster', cursive", category: 'Divertida', sample: 'Script Moderno' },
        { name: 'Bangers', value: "'Bangers', cursive", category: 'Divertida', sample: 'Comic Bold' },
    ],

    // === CREATIVAS Y ARTÍSTICAS ===
    creative: [
        { name: 'Bungee', value: "'Bungee', cursive", category: 'Creativa', sample: 'Display Urbano' },
        { name: 'Carter One', value: "'Carter One', cursive", category: 'Creativa', sample: 'Cartoon Bold' },
        { name: 'Monoton', value: "'Monoton', cursive", category: 'Creativa', sample: 'Líneas Paralelas' },
        { name: 'Abril Fatface', value: "'Abril Fatface', cursive", category: 'Creativa', sample: 'Display Dramático' },
        { name: 'Bebas Neue', value: "'Bebas Neue', cursive", category: 'Creativa', sample: 'Condensada Bold' },
        { name: 'Anton', value: "'Anton', sans-serif", category: 'Creativa', sample: 'Impact Moderno' },
        { name: 'Righteous', value: "'Righteous', cursive", category: 'Creativa', sample: 'Futurista' },
        { name: 'Philosopher', value: "'Philosopher', sans-serif", category: 'Creativa', sample: 'Filosófica' },
        { name: 'Orbitron', value: "'Orbitron', sans-serif", category: 'Creativa', sample: 'Sci-Fi Geométrica' },
        { name: 'Press Start 2P', value: "'Press Start 2P', cursive", category: 'Creativa', sample: 'Retro Game' },
    ],

    // === ADICIONALES VARIADAS ===
    additional: [
        { name: 'Archivo Black', value: "'Archivo Black', sans-serif", category: 'Display', sample: 'Ultra Bold' },
        { name: 'Oswald', value: "'Oswald', sans-serif", category: 'Display', sample: 'Condensada Alta' },
        { name: 'Bitter', value: "'Bitter', serif", category: 'Texto', sample: 'Slab Serif' },
        { name: 'Vollkorn', value: "'Vollkorn', serif", category: 'Texto', sample: 'Lectura Serif' },
        { name: 'Cabin', value: "'Cabin', sans-serif", category: 'Sans', sample: 'Humanística' },
        { name: 'Arvo', value: "'Arvo', serif", category: 'Slab', sample: 'Slab Geométrica' },
        { name: 'PT Serif', value: "'PT Serif', serif", category: 'Texto', sample: 'Transitional' },
        { name: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif", category: 'Sans', sample: 'Adobe Sans' },
        { name: 'Ubuntu', value: "'Ubuntu', sans-serif", category: 'Sans', sample: 'Humanística Tech' },
        { name: 'Lato', value: "'Lato', sans-serif", category: 'Sans', sample: 'Corporativa' },
    ]
};

// Combinar todas las fuentes en un array único
const ALL_FONTS = [
    ...FONT_LIBRARY.elegant,
    ...FONT_LIBRARY.modern,
    ...FONT_LIBRARY.handwritten,
    ...FONT_LIBRARY.playful,
    ...FONT_LIBRARY.creative,
    ...FONT_LIBRARY.additional
];

// URL de Google Fonts con TODAS las fuentes
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?' +
    'family=Playfair+Display:wght@400;700&' +
    'family=Cormorant+Garamond:wght@300;400;600&' +
    'family=Cinzel:wght@400;600;700&' +
    'family=Crimson+Text:wght@400;600&' +
    'family=Libre+Baskerville:wght@400;700&' +
    'family=Lora:wght@400;600&' +
    'family=Merriweather:wght@300;400;700&' +
    'family=EB+Garamond:wght@400;600&' +
    'family=Bodoni+Moda:wght@400;700&' +
    'family=Spectral:wght@400;600&' +
    'family=Montserrat:wght@300;400;600;700&' +
    'family=Poppins:wght@300;400;600;700&' +
    'family=Raleway:wght@300;400;600&' +
    'family=Nunito:wght@300;400;600;700&' +
    'family=Work+Sans:wght@300;400;600&' +
    'family=Inter:wght@300;400;600&' +
    'family=Rubik:wght@300;400;600&' +
    'family=DM+Sans:wght@400;500;700&' +
    'family=Josefin+Sans:wght@300;400;600&' +
    'family=Quicksand:wght@400;500;700&' +
    'family=Great+Vibes&' +
    'family=Dancing+Script:wght@400;700&' +
    'family=Pacifico&' +
    'family=Sacramento&' +
    'family=Allura&' +
    'family=Satisfy&' +
    'family=Kaushan+Script&' +
    'family=Cookie&' +
    'family=Alex+Brush&' +
    'family=Amatic+SC:wght@400;700&' +
    'family=Fredoka+One&' +
    'family=Lilita+One&' +
    'family=Baloo+2:wght@400;700&' +
    'family=Caveat:wght@400;700&' +
    'family=Indie+Flower&' +
    'family=Permanent+Marker&' +
    'family=Righteous&' +
    'family=Chewy&' +
    'family=Lobster&' +
    'family=Bangers&' +
    'family=Bungee&' +
    'family=Carter+One&' +
    'family=Monoton&' +
    'family=Abril+Fatface&' +
    'family=Bebas+Neue&' +
    'family=Anton&' +
    'family=Philosopher:wght@400;700&' +
    'family=Orbitron:wght@400;700&' +
    'family=Press+Start+2P&' +
    'family=Archivo+Black&' +
    'family=Oswald:wght@400;600&' +
    'family=Bitter:wght@400;700&' +
    'family=Vollkorn:wght@400;700&' +
    'family=Cabin:wght@400;600&' +
    'family=Arvo:wght@400;700&' +
    'family=PT+Serif:wght@400;700&' +
    'family=Source+Sans+Pro:wght@400;600&' +
    'family=Ubuntu:wght@400;700&' +
    'family=Lato:wght@300;400;700&' +
    'display=swap';

/**
 * Cargar fuentes de Google
 */
function loadGoogleFonts() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
}

/**
 * Generar opciones de selector de fuentes
 */
function generateFontOptions(targetElement, type = 'all') {
    const select = document.getElementById(targetElement);
    if (!select) return;

    // Limpiar opciones existentes
    select.innerHTML = '';

    // Filtrar fuentes según tipo
    let fonts = ALL_FONTS;
    if (type === 'title') {
        // Para títulos: elegantes, manuscritas, creativas
        fonts = [...FONT_LIBRARY.elegant, ...FONT_LIBRARY.handwritten, ...FONT_LIBRARY.creative];
    } else if (type === 'body') {
        // Para texto: modernas, elegantes
        fonts = [...FONT_LIBRARY.modern, ...FONT_LIBRARY.elegant];
    }

    // Agrupar por categoría
    const groups = {};
    fonts.forEach(font => {
        if (!groups[font.category]) {
            groups[font.category] = [];
        }
        groups[font.category].push(font);
    });

    // Generar optgroups
    Object.keys(groups).forEach(category => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;

        groups[category].forEach(font => {
            const option = document.createElement('option');
            option.value = font.value;
            option.textContent = `${font.name} - ${font.sample}`;
            option.style.fontFamily = font.value;
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });
}

/**
 * Mostrar preview de fuente en tiempo real
 */
function showFontPreview(fontValue, sampleText = 'Muestra de texto') {
    // Crear o obtener elemento de preview
    let preview = document.getElementById('font-preview-tooltip');

    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'font-preview-tooltip';
        preview.className = 'font-preview-tooltip';
        document.body.appendChild(preview);
    }

    preview.style.fontFamily = fontValue;
    preview.textContent = sampleText;
    preview.classList.add('visible');

    return preview;
}

/**
 * Ocultar preview de fuente
 */
function hideFontPreview() {
    const preview = document.getElementById('font-preview-tooltip');
    if (preview) {
        preview.classList.remove('visible');
    }
}

/**
 * Configurar preview interactivo en selector
 */
function setupFontPreviewOnHover(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'OPTION') {
            const fontValue = e.target.value;
            const sampleText = e.target.textContent;
            showFontPreview(fontValue, sampleText);
        }
    });

    select.addEventListener('mouseout', () => {
        hideFontPreview();
    });

    select.addEventListener('change', () => {
        hideFontPreview();
    });
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.FONT_LIBRARY = FONT_LIBRARY;
    window.ALL_FONTS = ALL_FONTS;
    window.loadGoogleFonts = loadGoogleFonts;
    window.generateFontOptions = generateFontOptions;
    window.showFontPreview = showFontPreview;
    window.hideFontPreview = hideFontPreview;
    window.setupFontPreviewOnHover = setupFontPreviewOnHover;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FONT_LIBRARY,
        ALL_FONTS,
        GOOGLE_FONTS_URL,
        loadGoogleFonts,
        generateFontOptions,
        showFontPreview,
        hideFontPreview,
        setupFontPreviewOnHover
    };
}
