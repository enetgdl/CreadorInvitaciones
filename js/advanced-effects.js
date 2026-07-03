/**
 * ADVANCED-EFFECTS.JS - Efectos de Fondo Avanzados
 * 10 efectos dinámicos y estáticos para fondos de invitación
 */

class AdvancedEffects {
    constructor(canvas) {
        console.log("%c🎆 EFECTOS AVANZADOS v2.0 CARGADOS - CON EFECTO PYRO", "background: #222; color: #bada55; font-size: 20px");
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.animationId = null;
        this.currentEffect = null;
        this.particles = [];
        this.config = {};

        // Configuraciones por defecto de cada efecto
        this.defaultConfigs = {
            fireworks: {
                speed: 1,
                density: 3,
                colors: ['#FF1744', '#FFD600', '#00E676', '#2979FF', '#F50057']
            },
            balloons: {
                speed: 0.5,
                density: 10,
                colors: ['#FF6B9D', '#C44569', '#FFC312', '#12CBC4', '#FDA7DF']
            },
            bubbles: {
                speed: 0.8,
                density: 15,
                colors: ['rgba(255,107,157,0.3)', 'rgba(196,69,105,0.3)', 'rgba(255,195,18,0.3)', 'rgba(18,203,196,0.3)']
            },
            rainbow: {
                speed: 0.3,
                animated: true,
                direction: 'horizontal'
            },
            stars: {
                speed: 1,
                density: 50,
                twinkle: true
            },
            waves: {
                speed: 0.5,
                amplitude: 30,
                colors: ['#8B5CF6', '#EC4899', '#F59E0B']
            },
            particles: {
                speed: 1,
                density: 20,
                colors: ['#8B5CF6', '#EC4899']
            },
            bokeh: {
                speed: 0.3,
                density: 10,
                colors: ['#8B5CF6', '#EC4899', '#F59E0B']
            },
            confetti: {
                speed: 1,
                density: 30,
                colors: ['#FF1744', '#FFD600', '#00E676', '#2979FF', '#F50057', '#FF6B9D']
            },
            snow: {
                speed: 0.5,
                density: 50,
                colors: ['#FFFFFF']
            }
        };
    }

    /**
     * Iniciar efecto
     */
    start(effectName, customConfig = {}) {
        this.stop();
        this.currentEffect = effectName;
        this.config = { ...this.defaultConfigs[effectName], ...customConfig };
        this.particles = [];

        if (!this.canvas || !this.ctx) {
            console.error('Canvas no disponible');
            return;
        }

        // Ajustar tamaño del canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Inicializar partículas según el efecto
        this.initEffect();

        // Iniciar animación
        this.animate();
    }

    /**
     * Detener efecto
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.particles = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Ajustar tamaño del canvas
     */
    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    /**
     * Inicializar efecto específico
     */
    initEffect() {
        const effects = {
            fireworks: () => this.initFireworks(),
            balloons: () => this.initBalloons(),
            bubbles: () => this.initBubbles(),
            rainbow: () => this.initRainbow(),
            stars: () => this.initStars(),
            waves: () => this.initWaves(),
            particles: () => this.initParticles(),
            bokeh: () => this.initBokeh(),
            confetti: () => this.initConfetti(),
            snow: () => this.initSnow()
        };

        const initFn = effects[this.currentEffect];
        if (initFn) {
            initFn();
        }
    }

    /**
     * Fireworks - Fuegos artificiales
     */
    initFireworks() {
        // Los fuegos artificiales se crean dinámicamente
        this.nextFirework = 0;
    }

    createFirework() {
        const x = Math.random() * this.canvas.width;
        const y = this.canvas.height;
        // Explotar entre 20-60% de altura
        const targetY = this.canvas.height * (0.2 + Math.random() * 0.4);
        const color = this.getRandomColor();

        this.particles.push({
            type: 'rocket',
            x: x,
            y: y,
            targetY: targetY,
            color: color,
            speed: (3 + Math.random() * 3) * this.config.speed,
            trail: [],
            exploded: false
        });
    }

    explodeFirework(rocket) {
        // Explosión ESPECTACULAR inspirada en efecto CSS pyro
        // 50+ partículas para explosión masiva
        const particleCount = 50 + Math.floor(Math.random() * 30);

        for (let i = 0; i < particleCount; i++) {
            // Ángulo aleatorio con ligera variación para efecto realista
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.3 - 0.15);

            // Velocidad variada - algunas partículas van más lejos
            const speedMultiplier = 0.5 + Math.random() * 1.5;
            const speed = (2 + Math.random() * 4) * speedMultiplier;

            // Colores HSL variados (como en el código CSS)
            const hue = Math.random() * 360;
            const color = `hsl(${hue}, 100%, 50%)`;

            this.particles.push({
                type: 'spark',
                x: rocket.x,
                y: rocket.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 1,
                decay: 0.006 + Math.random() * 0.004, // Vida variable
                size: 1.5 + Math.random() * 2, // Tamaños variados
                gravity: 0.1 + Math.random() * 0.05, // Gravedad individual
                brightness: 1, // Para efecto de brillo
                trail: [] // Trail para algunas partículas especiales
            });
        }

        // Agregar partículas especiales brillantes (tipo estrellas)
        const specialCount = 10;
        for (let i = 0; i < specialCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            this.particles.push({
                type: 'star-spark',
                x: rocket.x,
                y: rocket.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#FFFFFF',
                life: 1,
                decay: 0.005,
                size: 3,
                gravity: 0.08,
                brightness: 1,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Balloons - Globos flotantes
     */
    initBalloons() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createBalloon());
        }
    }

    createBalloon() {
        // Colores base para los globos (más vibrantes para que con opacidad 0.7 se vean bien)
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);

        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + 10 + Math.random() * 40, // Empezar justo abajo para loop continuo
            baseSize: 30 + Math.random() * 10,  // Tamaño base (escalado respecto al CSS original)
            color: `rgba(${r},${g},${b},0.7)`, // Color principal
            shadowColor: `rgba(${Math.max(0, r - 50)},${Math.max(0, g - 50)},${Math.max(0, b - 50)},0.7)`, // Sombra más oscura
            stringColor: '#FDFD96', // Hilo amarillo claro
            speed: (1.5 + Math.random() * 2.0) * this.config.speed, // Velocidad min 1.5 para flujo continuo
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            wobbleAmp: 20 + Math.random() * 10 // Amplitud del movimiento lateral
        };
    }

    /**
     * Bubbles - Burbujas transparentes
     */
    initBubbles() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createBubble());
        }
    }

    createBubble() {
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + 50,
            size: 10 + Math.random() * 40,
            color: this.getRandomColor(),
            speed: (0.5 + Math.random() * 1) * this.config.speed,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03
        };
    }

    /**
     * Rainbow - Arcoíris animado
     */
    initRainbow() {
        this.rainbowOffset = 0;
    }

    /**
     * Stars - Estrellas centelleantes
     */
    initStars() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createStar());
        }
    }

    createStar() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 1 + Math.random() * 3,
            brightness: Math.random(),
            twinkleSpeed: 0.02 + Math.random() * 0.05,
            growing: Math.random() > 0.5
        };
    }

    /**
     * Waves - Ondas de color
     */
    initWaves() {
        this.waveOffset = 0;
    }

    /**
     * Generic Particles
     */
    initParticles() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createGenericParticle());
        }
    }

    createGenericParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2 * this.config.speed,
            vy: (Math.random() - 0.5) * 2 * this.config.speed,
            size: 2 + Math.random() * 4,
            color: this.getRandomColor()
        };
    }

    /**
     * Bokeh
     */
    initBokeh() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createBokehCircle());
        }
    }

    createBokehCircle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 30 + Math.random() * 100,
            color: this.getRandomColor(),
            opacity: 0.1 + Math.random() * 0.2,
            vx: (Math.random() - 0.5) * 0.5 * this.config.speed,
            vy: (Math.random() - 0.5) * 0.5 * this.config.speed
        };
    }

    /**
     * Confetti
     */
    initConfetti() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createConfettiPiece());
        }
    }

    createConfettiPiece() {
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            width: 5 + Math.random() * 10,
            height: 10 + Math.random() * 20,
            color: this.getRandomColor(),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 3,
            gravity: 0.1
        };
    }

    /**
     * Snow
     */
    initSnow() {
        for (let i = 0; i < this.config.density; i++) {
            this.particles.push(this.createSnowflake());
        }
    }

    createSnowflake() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 2 + Math.random() * 4,
            speed: (0.5 + Math.random() * 1.5) * this.config.speed,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03
        };
    }

    /**
     * Obtener color aleatorio
     */
    getRandomColor() {
        const colors = this.config.colors;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Loop de animación
     */
    animate() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Renderizar según el efecto
        const renderFunctions = {
            fireworks: () => this.renderFireworks(),
            balloons: () => this.renderBalloons(),
            bubbles: () => this.renderBubbles(),
            rainbow: () => this.renderRainbow(),
            stars: () => this.renderStars(),
            waves: () => this.renderWaves(),
            particles: () => this.renderParticles(),
            bokeh: () => this.renderBokeh(),
            confetti: () => this.renderConfetti(),
            snow: () => this.renderSnow()
        };

        const renderFn = renderFunctions[this.currentEffect];
        if (renderFn) {
            renderFn();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Renderizar fuegos artificiales
     */
    renderFireworks() {
        // Crear nuevo fuego artificial periódicamente
        this.nextFirework = (this.nextFirework || 0) - 1;
        if (this.nextFirework <= 0) {
            this.createFirework();
            this.nextFirework = 60 / this.config.density;
        }

        // Array para acumular nuevas partículas generadas en este frame (explosiones)
        const newParticles = [];

        this.particles = this.particles.filter(p => {
            if (p.type === 'rocket') {
                p.y -= p.speed;

                // Agregar trail (estela)
                p.trail.push({ x: p.x, y: p.y, alpha: 1 });
                if (p.trail.length > 10) p.trail.shift();

                // Dibujar trail como línea ascendente
                if (p.trail.length > 1) {
                    this.ctx.strokeStyle = p.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    p.trail.forEach((point, i) => {
                        point.alpha -= 0.1;
                        this.ctx.globalAlpha = Math.max(0, point.alpha);
                        if (i === 0) {
                            this.ctx.moveTo(point.x, point.y);
                        } else {
                            this.ctx.lineTo(point.x, point.y);
                        }
                    });
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }

                // Dibujar cabeza del cohete
                this.ctx.fillStyle = p.color;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;

                // Explotar al alcanzar altura objetivo (>60% arriba)
                if (p.y <= p.targetY && !p.exploded) {
                    p.exploded = true;
                    // FIX: Usar acumulador temporal
                    const explosion = this.generateExplosionParticles(p);
                    newParticles.push(...explosion);
                    return false;
                }

                return p.y > 0;
            } else if (p.type === 'spark') {
                // Partículas normales de explosión con gravedad individual
                p.x += p.vx;
                p.y += p.vy;
                p.vy += (p.gravity || 0.15); // Usar gravedad individual
                p.life -= p.decay;

                // Fade out del brillo
                if (p.brightness) {
                    p.brightness = p.life;
                }

                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;

                // Glow effect proporcional al brillo
                const glowSize = 5 + (p.brightness || 0) * 10;
                this.ctx.shadowBlur = glowSize;
                this.ctx.shadowColor = p.color;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size || 2.5, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;

                return p.life > 0;
            } else if (p.type === 'star-spark') {
                // Partículas especiales brillantes con efecto twinkle
                p.x += p.vx;
                p.y += p.vy;
                p.vy += (p.gravity || 0.08);
                p.life -= p.decay;

                // Efecto twinkle (centelleo)
                p.twinkle += 0.1;
                const twinkleAlpha = Math.abs(Math.sin(p.twinkle));

                this.ctx.globalAlpha = p.life * twinkleAlpha;
                this.ctx.fillStyle = p.color;

                // Glow muy brillante para estas partículas
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = p.color;

                // Dibujar estrella (cruz)
                this.ctx.beginPath();
                // Cruz horizontal
                this.ctx.moveTo(p.x - p.size, p.y);
                this.ctx.lineTo(p.x + p.size, p.y);
                // Cruz vertical
                this.ctx.moveTo(p.x, p.y - p.size);
                this.ctx.lineTo(p.x, p.y + p.size);
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = p.color;
                this.ctx.stroke();

                // Punto central
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.shadowBlur = 0;
                this.ctx.globalAlpha = 1;

                return p.life > 0;
            }
        });

        // IMPORTANTE: Agregar las nuevas partículas DESPUÉS del filter
        if (newParticles.length > 0) {
            this.particles.push(...newParticles);
        }
    }

    /**
     * Generar partículas de explosión (Helper method)
     */
    generateExplosionParticles(rocket) {
        const particles = [];
        // Explosión ESPECTACULAR inspirada en efecto CSS pyro
        const particleCount = 50 + Math.floor(Math.random() * 30);

        console.log(`💥 Creando explosión: ${particleCount} partículas`);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.3 - 0.15);
            const speedMultiplier = 0.5 + Math.random() * 1.5;
            const speed = (2 + Math.random() * 4) * speedMultiplier;
            const hue = Math.random() * 360;
            const color = `hsl(${hue}, 100%, 50%)`;

            particles.push({
                type: 'spark',
                x: rocket.x,
                y: rocket.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 1,
                decay: 0.006 + Math.random() * 0.004,
                size: 1.5 + Math.random() * 2,
                gravity: 0.1 + Math.random() * 0.05,
                brightness: 1,
                trail: []
            });
        }

        const specialCount = 10;
        for (let i = 0; i < specialCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;

            particles.push({
                type: 'star-spark',
                x: rocket.x,
                y: rocket.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#FFFFFF',
                life: 1,
                decay: 0.005,
                size: 3,
                gravity: 0.08,
                brightness: 1,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        return particles;
    }

    /**
     * Renderizar globos
     */
    renderBalloons() {
        this.particles.forEach((balloon, i) => {
            // Movimiento
            balloon.y -= balloon.speed;
            balloon.wobble += balloon.wobbleSpeed;
            const wobbleX = Math.sin(balloon.wobble) * 20;

            const x = balloon.x + wobbleX;
            const y = balloon.y;
            const w = (balloon.baseSize || 30) * 0.9; // Más estrechos
            const h = (balloon.baseSize || 30) * 1.6; // Mucho más altos (ovales verticales)

            // 1. Dibujar Hilo (String) - Moviendo esto ANTES del globo
            this.ctx.beginPath();
            this.ctx.strokeStyle = balloon.stringColor || '#FDFD96';
            this.ctx.lineWidth = 1.5;
            this.ctx.moveTo(x, y + h + 2);
            this.ctx.lineTo(x, y + h + h * 0.7);
            this.ctx.stroke();

            // 2. Dibujar Nudo (Triángulo) - "▲"
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = balloon.color;
            this.ctx.font = `${w * 0.5}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('▲', x, y + h - 5);

            // 3. Dibujar Cuerpo del Globo (Bezier)
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + h); // Abajo centro

            this.ctx.bezierCurveTo(x - w, y + h, x - w, y, x, y); // Izq
            this.ctx.bezierCurveTo(x + w, y, x + w, y + h, x, y + h); // Der

            this.ctx.fillStyle = balloon.color;
            this.ctx.fill();

            // 4. Sombra interior (Inset Shadow simulada con gradiente)
            const gradient = this.ctx.createRadialGradient(x - w * 0.3, y - h * 0.3, 0, x, y, w);
            gradient.addColorStop(0, 'rgba(255,255,255,0.2)'); // Brillo especular
            gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, balloon.shadowColor || 'rgba(0,0,0,0.3)'); // Sombra interna

            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Resetear si sale de la pantalla (muy arriba)
            if (balloon.y < -200) {
                this.particles[i] = this.createBalloon();
            }
        });
    }

    /**
     * Renderizar burbujas
     */
    renderBubbles() {
        this.particles.forEach((bubble, i) => {
            bubble.y -= bubble.speed;
            bubble.wobble += bubble.wobbleSpeed;
            const wobbleX = Math.sin(bubble.wobble) * 15;

            // Gradiente para efecto de burbuja
            const gradient = this.ctx.createRadialGradient(
                bubble.x + wobbleX - bubble.size * 0.3,
                bubble.y - bubble.size * 0.3,
                0,
                bubble.x + wobbleX,
                bubble.y,
                bubble.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(0.5, bubble.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(bubble.x + wobbleX, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Borde
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            if (bubble.y + bubble.size < 0) {
                this.particles[i] = this.createBubble();
            }
        });
    }

    /**
     * Renderizar arcoíris
     */
    renderRainbow() {
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const barHeight = this.canvas.height / colors.length;
        const time = Date.now() * 0.001 * this.config.speed;

        colors.forEach((color, i) => {
            // Efecto ripple/ondulante con opacidad variable
            const rippleOpacity = 0.5 + Math.sin(time + i * 0.5) * 0.2;

            // Crear gradient con blur entre franjas
            const gradient = this.ctx.createLinearGradient(0, i * barHeight, 0, (i + 1) * barHeight);

            // Color actual con transición suave
            gradient.addColorStop(0, i > 0 ? colors[i - 1] : color);
            gradient.addColorStop(0.2, color);
            gradient.addColorStop(0.8, color);
            gradient.addColorStop(1, i < colors.length - 1 ? colors[i + 1] : color);

            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = rippleOpacity;

            // Aplicar blur para suavizar bordes
            this.ctx.filter = 'blur(8px)';
            this.ctx.fillRect(0, i * barHeight, this.canvas.width, barHeight);
            this.ctx.filter = 'none';

            // Segunda capa sin blur para mantener definición
            this.ctx.globalAlpha = rippleOpacity * 0.6;
            this.ctx.fillRect(0, i * barHeight, this.canvas.width, barHeight);

            this.ctx.globalAlpha = 1;
        });

        // Capa de brillo ondulante sobre todo el arcoíris
        const shimmer = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        const shimmerPos = (Math.sin(time * 2) + 1) / 2;
        shimmer.addColorStop(0, 'rgba(255, 255, 255, 0)');
        shimmer.addColorStop(shimmerPos - 0.1, 'rgba(255, 255, 255, 0)');
        shimmer.addColorStop(shimmerPos, 'rgba(255, 255, 255, 0.2)');
        shimmer.addColorStop(shimmerPos + 0.1, 'rgba(255, 255, 255, 0)');
        shimmer.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = shimmer;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Renderizar estrellas
     */
    renderStars() {
        this.particles.forEach(star => {
            if (this.config.twinkle) {
                star.brightness += star.twinkleSpeed * (star.growing ? 1 : -1);
                if (star.brightness >= 1 || star.brightness <= 0.2) {
                    star.growing = !star.growing;
                }
            }

            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    /**
     * Renderizar ondas
     */
    renderWaves() {
        this.waveOffset += this.config.speed;
        const amplitude = this.config.amplitude;
        const frequency = 0.01;

        this.config.colors.forEach((color, layerIndex) => {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.canvas.height);

            for (let x = 0; x <= this.canvas.width; x++) {
                const y = this.canvas.height * 0.5 +
                    Math.sin(x * frequency + this.waveOffset + layerIndex) * amplitude +
                    layerIndex * 20;
                this.ctx.lineTo(x, y);
            }

            this.ctx.lineTo(this.canvas.width, this.canvas.height);
            this.ctx.closePath();

            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    /**
     * Renderizar partículas genéricas
     */
    renderParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Rebote en bordes
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Renderizar bokeh
     */
    renderBokeh() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -100) p.x = this.canvas.width + 100;
            if (p.x > this.canvas.width + 100) p.x = -100;
            if (p.y < -100) p.y = this.canvas.height + 100;
            if (p.y > this.canvas.height + 100) p.y = -100;

            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.filter = 'blur(20px)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.filter = 'none';
            this.ctx.globalAlpha = 1;
        });
    }

    /**
     * Renderizar confetti
     */
    renderConfetti() {
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotationSpeed;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            this.ctx.restore();

            if (p.y > this.canvas.height + 50) {
                this.particles[i] = this.createConfettiPiece();
            }
        });
    }

    /**
     * Renderizar nieve
     */
    renderSnow() {
        this.particles.forEach((p, i) => {
            p.y += p.speed;
            p.wobble += p.wobbleSpeed;
            const wobbleX = Math.sin(p.wobble) * 30;

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(p.x + wobbleX, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            if (p.y > this.canvas.height) {
                this.particles[i] = this.createSnowflake();
                this.particles[i].y = -10;
            }
        });
    }

    /**
     * Ajustar brillo de color
     */
    adjustColorBrightness(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedEffects;
}
