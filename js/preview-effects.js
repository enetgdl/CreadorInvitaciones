/**
 * PREVIEW-EFFECTS.js - Efectos de Fondo y Scripts
 * Métodos para efectos visuales y scripts de la invitación
 */

if (typeof InvitationPreview !== 'undefined') {
    
    /**
     * Generar efecto de fondo
     */
    InvitationPreview.prototype.generateBackgroundEffect = function(effect) {
        if (effect === 'particles') {
            return '<canvas class="particles-canvas" id="particles"></canvas>';
        } else if (effect === 'confetti') {
            return '<canvas class="confetti-canvas" id="confetti"></canvas>';
        } else if (effect === 'bokeh') {
            let html = '';
            for (let i = 0; i < 10; i++) {
                const size = 50 + Math.random() * 150;
                const top = Math.random() * 100;
                const left = Math.random() * 100;
                const color = i % 2 === 0 ? this.currentData.primaryColor : this.currentData.secondaryColor;
                html += `<div class="bokeh-circle" style="width:${size}px; height:${size}px; top:${top}%; left:${left}%; background:${color};"></div>`;
            }
            return html;
        }
        return '';
    };

    /**
     * Obtener script de partículas
     */
    InvitationPreview.prototype.getParticlesScript = function() {
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
    };

    /**
     * Obtener script de confetti
     */
    InvitationPreview.prototype.getConfettiScript = function() {
        return `
        window.addEventListener('load', () => {
            const canvas = document.getElementById('confetti');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const confetti = [];
            const colors = ['${this.currentData.primaryColor}', '${this.currentData.secondaryColor}', '#FFD700', '#FF69B4'];
            
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
    };

    /**
     * Obtener script de countdown
     */
    InvitationPreview.prototype.getCountdownScript = function() {
        return `
            // Countdown Script
            (function() {
                const countdownEl = document.getElementById('countdown');
                if (!countdownEl) return;
                
                const eventDate = '${this.currentData.eventDate}';
                const eventTime = '${this.currentData.eventTime || '12:00'}';
                
                if (!eventDate) {
                    countdownEl.innerHTML = '<div class="countdown-error">Fecha no configurada</div>';
                    return;
                }
                
                function updateCountdown() {
                    try {
                        const target = new Date(eventDate + 'T' + eventTime);
                        const now = new Date();
                        const diff = target - now;
                        
                        if (diff <= 0) {
                            countdownEl.innerHTML = '<div class="countdown-finished">¡Es el gran día!</div>';
                            return;
                        }
                        
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        
                        countdownEl.innerHTML = \`
                            <div class="countdown-values">
                                <div class="countdown-item">
                                    <span class="countdown-number">\${days}</span>
                                    <span class="countdown-label">Días</span>
                                </div>
                                <div class="countdown-item">
                                    <span class="countdown-number">\${hours}</span>
                                    <span class="countdown-label">Horas</span>
                                </div>
                                <div class="countdown-item">
                                    <span class="countdown-number">\${minutes}</span>
                                    <span class="countdown-label">Min</span>
                                </div>
                                <div class="countdown-item">
                                    <span class="countdown-number">\${seconds}</span>
                                    <span class="countdown-label">Seg</span>
                                </div>
                            </div>
                        \`;
                    } catch (e) {
                        countdownEl.innerHTML = '<div class="countdown-error">Error en fecha</div>';
                    }
                }
                
                updateCountdown();
                setInterval(updateCountdown, 1000);
            })();
        `;
    };

    console.log('✅ preview-effects.js cargado correctamente');
}
