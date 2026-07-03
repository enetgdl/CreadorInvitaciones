/**
 * PREVIEW-GALLERY.js - Métodos de Galería para Vista Previa
 * Generación de HTML, CSS y scripts de galería
 */

if (typeof InvitationPreview !== 'undefined') {
    
    /**
     * Generar HTML de galería
     */
    InvitationPreview.prototype.generateGalleryHTML = function(gallery) {
        if (!gallery || !gallery.images.length) return '';
        const mode = gallery.mode || 'collage';
        const effect = gallery.carouselSettings?.effect || 'fade';

        let html = '<section class="gallery-section" data-editor-id="gallerySection" data-editor-name="Galeria de Fotos">';

        if (mode === 'carousel') {
            html += `<div class="gallery-carousel-container effect-${effect}">
                <div class="gallery-carousel-wrapper" id="carouselWrapper">`;

            gallery.images.forEach((img, idx) => {
                html += `<div class="gallery-slide ${idx === 0 ? 'active' : ''}">
                    <img src="${img.data}" loading="lazy" alt="Foto ${idx + 1}" style="width:100%;height:100%;object-fit:cover;">
                </div>`;
            });

            html += `</div>
                <button class="carousel-prev">❮</button>
                <button class="carousel-next">❯</button>
                <div class="carousel-dots">`;

            gallery.images.forEach((_, idx) => {
                html += `<span class="carousel-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}"></span>`;
            });

            html += `</div></div>`;
        } else {
            // Collage
            html += `<div class="gallery-collage-grid">`;
            gallery.images.forEach(img => {
                const isWide = img.width > img.height * 1.3;
                const isTall = img.height > img.width * 1.3;
                const spanClass = isWide ? 'span-2' : (isTall ? 'row-span-2' : '');
                html += `<div class="collage-item ${spanClass}"><img src="${img.data}" loading="lazy" alt="Foto"></div>`;
            });
            html += `</div>`;
        }
        html += '</section>';
        return html;
    };

    /**
     * Generar CSS de galería
     */
    InvitationPreview.prototype.generateGalleryCSS = function(gallery) {
        if (!gallery || !gallery.enabled) return '';

        return `
        /* GALERÍA - SECCIÓN PRINCIPAL */
        .gallery-section {
            padding: 1rem;
            margin: 2rem auto;
            position: relative;
            z-index: 5;
            max-width: 1200px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        /* COLLAGE INTELIGENTE */
        .gallery-collage-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            grid-auto-flow: dense;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            justify-items: center;
        }
        
        .collage-item {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.3s;
            height: 100%;
            min-height: 140px;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .collage-item:hover {
            transform: scale(1.03);
            z-index: 2;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        }
        
        .collage-item img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            object-position: center;
            display: block;
        }
        
        .span-2 { grid-column: span 2; }
        .row-span-2 { grid-row: span 2; }

        /* CAROUSEL BASE */
        .gallery-carousel-container {
            position: relative;
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            background: #000;
            margin: 0 auto;
            max-width: 900px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .gallery-carousel-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            perspective: 1000px;
            transform-style: preserve-3d;
        }
        
        .gallery-slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.8s ease-in-out;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
        }
        
        .gallery-slide.active {
            opacity: 1;
            z-index: 1;
        }
        
        /* Carousel Controls */
        .carousel-prev, .carousel-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.9);
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            font-size: 1.4rem;
            cursor: pointer;
            z-index: 10;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.2s;
        }
        
        .carousel-prev { left: 12px; }
        .carousel-next { right: 12px; }
        
        .carousel-prev:hover, .carousel-next:hover {
            background: white;
            transform: translateY(-50%) scale(1.1);
        }
        
        /* Carousel Dots */
        .carousel-dots {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 10;
        }
        
        .carousel-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255,255,255,0.5);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .carousel-dot.active {
            background: white;
            transform: scale(1.2);
        }

        /* Efectos de Transición */
        .effect-fade .gallery-slide { transition: opacity 0.8s ease-in-out; }
        .effect-slide .gallery-slide { transition: transform 0.6s ease-in-out; }
        .effect-zoom .gallery-slide { transition: transform 0.6s ease-in-out; }
        `;
    };

    /**
     * Generar script de galería
     */
    InvitationPreview.prototype.generateGalleryScript = function(gallery) {
        if (!gallery || !gallery.enabled) return '';

        const interval = gallery.carouselSettings?.interval || 3;
        const autoplay = gallery.carouselSettings?.autoplay !== false;

        if (gallery.mode === 'carousel') {
            return `
                // Carrusel de imágenes
                (function() {
                    const wrapper = document.getElementById('carouselWrapper');
                    const slides = wrapper ? wrapper.querySelectorAll('.gallery-slide') : [];
                    const dots = document.querySelectorAll('.carousel-dot');
                    const prevBtn = document.querySelector('.carousel-prev');
                    const nextBtn = document.querySelector('.carousel-next');
                    
                    if (!slides.length) return;
                    
                    let current = 0;
                    let autoTimer;
                    
                    function goToSlide(index) {
                        slides.forEach((s, i) => s.classList.toggle('active', i === index));
                        dots.forEach((d, i) => d.classList.toggle('active', i === index));
                        current = index;
                    }
                    
                    function nextSlide() {
                        goToSlide((current + 1) % slides.length);
                    }
                    
                    function prevSlide() {
                        goToSlide((current - 1 + slides.length) % slides.length);
                    }
                    
                    if (nextBtn) nextBtn.addEventListener('click', () => {
                        nextSlide();
                        resetAuto();
                    });
                    
                    if (prevBtn) prevBtn.addEventListener('click', () => {
                        prevSlide();
                        resetAuto();
                    });
                    
                    dots.forEach((dot, i) => {
                        dot.addEventListener('click', () => {
                            goToSlide(i);
                            resetAuto();
                        });
                    });
                    
                    function startAuto() {
                        if (${autoplay}) {
                            autoTimer = setInterval(nextSlide, ${interval} * 1000);
                        }
                    }
                    
                    function resetAuto() {
                        clearInterval(autoTimer);
                        startAuto();
                    }
                    
                    startAuto();
                })();
            `;
        }
        return '';
    };

    console.log('✅ preview-gallery.js cargado correctamente');
}
