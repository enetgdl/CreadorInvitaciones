class DeviceAutoCentering {
    constructor(options = {}) {
        this.options = {
            margin: 24,
            animate: true,
            transitionMs: 220,
            ...options
        };
        this.raf = 0;
        this.observers = [];
        this.lastDelta = 0;
    }

    init() {
        this.leftPanel = document.getElementById('leftPanel') || document.querySelector('.control-panel');
        this.deviceFrame = document.getElementById('canvasFrame') || document.querySelector('.device-frame');
        this.deviceScreen = document.getElementById('deviceScreen');
        this.fillModal = document.getElementById('advancedFillModal');
        this.historyPanel = document.getElementById('historyPanel'); // Panel de Historia

        if (!this.deviceFrame || !this.deviceScreen) return;

        if (this.options.animate) {
            this.deviceFrame.style.transition = `transform ${this.options.transitionMs}ms ease`;
        }

        window.addEventListener('resize', () => this.schedule(), { passive: true });
        window.addEventListener('scroll', () => this.schedule(), { passive: true, capture: true });

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => this.schedule());
            // Observar ambos paneles: Relleno Avanzado e Historia
            [this.leftPanel, this.deviceScreen, this.fillModal, this.historyPanel].filter(Boolean).forEach((el) => {
                try { ro.observe(el); } catch (_) { }
            });
            this.observers.push({ disconnect: () => ro.disconnect() });
        }

        // Observar cambios en ambos paneles laterales
        if (window.MutationObserver) {
            const mo = new MutationObserver(() => this.schedule());

            // Observar panel de Relleno Avanzado
            if (this.fillModal) {
                try { mo.observe(this.fillModal, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] }); } catch (_) { }
            }

            // Observar panel de Historia
            if (this.historyPanel) {
                try { mo.observe(this.historyPanel, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] }); } catch (_) { }
            }

            this.observers.push({ disconnect: () => mo.disconnect() });
        }

        document.addEventListener('DOMContentLoaded', () => this.schedule(), { once: true });
        window.addEventListener('load', () => this.schedule(), { passive: true });
        this.schedule();
    }

    setOptions(next = {}) {
        this.options = { ...this.options, ...next };
        if (this.options.animate) {
            this.deviceFrame.style.transition = `transform ${this.options.transitionMs}ms ease`;
        } else {
            this.deviceFrame.style.transition = '';
        }
        this.schedule();
    }

    /**
     * Verificar si el panel de Relleno Avanzado está adosado y visible
     */
    isFillDocked() {
        if (!this.fillModal) return false;
        if (this.fillModal.hidden) return false;
        return this.fillModal.classList.contains('is-docked');
    }

    /**
     * Verificar si el panel de Historia está adosado y visible
     */
    isHistoryDocked() {
        if (!this.historyPanel) return false;
        if (this.historyPanel.hidden) return false;
        return this.historyPanel.classList.contains('is-docked');
    }

    /**
     * Verificar si algún panel lateral derecho está adosado
     */
    isAnyRightPanelDocked() {
        return this.isFillDocked() || this.isHistoryDocked();
    }

    schedule() {
        if (this.raf) return;
        this.raf = requestAnimationFrame(() => {
            this.raf = 0;
            this.apply();
        });
    }

    clamp(v, min, max) {
        return Math.min(max, Math.max(min, v));
    }

    apply() {
        if (!this.deviceFrame || !this.deviceScreen) return;

        // Si ningún panel derecho está adosado, resetear centrado
        if (!this.isAnyRightPanelDocked()) {
            if (this.lastDelta !== 0) {
                this.deviceFrame.style.transform = '';
                this.lastDelta = 0;
            }
            return;
        }

        const leftRect = this.leftPanel?.getBoundingClientRect?.();
        const deviceRect = this.deviceScreen.getBoundingClientRect();
        if (!deviceRect.width) return;

        // Obtener el borde izquierdo del panel derecho más cercano (el que esté adosado y visible)
        let rightPanelLeft = null;

        // Verificar panel de Relleno Avanzado
        if (this.isFillDocked()) {
            const fillRect = this.fillModal.getBoundingClientRect();
            rightPanelLeft = fillRect.left;
        }

        // Verificar panel de Historia (podría estar solo o junto con Relleno Avanzado)
        if (this.isHistoryDocked()) {
            const historyRect = this.historyPanel.getBoundingClientRect();
            // Si ambos están adosados, ambos deberían estar en el mismo borde lateral
            // Usar el que tenga el borde izquierdo más a la izquierda (más restrictivo)
            if (rightPanelLeft === null || historyRect.left < rightPanelLeft) {
                rightPanelLeft = historyRect.left;
            }
        }

        // Si no hay panel derecho válido, salir
        if (rightPanelLeft === null) {
            if (this.lastDelta !== 0) {
                this.deviceFrame.style.transform = '';
                this.lastDelta = 0;
            }
            return;
        }

        const margin = Number.isFinite(parseFloat(this.options.margin)) ? parseFloat(this.options.margin) : 24;
        const availableLeft = (leftRect?.right || 0) + margin;
        const availableRight = rightPanelLeft - margin;

        // Verificar que hay espacio suficiente
        if (availableRight - availableLeft < 60) return;

        // Calcular centro deseado y actual
        const desiredCenter = (availableLeft + availableRight) / 2;
        const currentCenter = deviceRect.left + deviceRect.width / 2;
        let delta = desiredCenter - currentCenter;

        // Ajustar para mantener el dispositivo dentro de los límites
        const nextLeft = deviceRect.left + delta;
        const nextRight = deviceRect.right + delta;
        if (nextLeft < availableLeft) delta += (availableLeft - nextLeft);
        if (nextRight > availableRight) delta -= (nextRight - availableRight);

        // Limitar delta a valores razonables
        delta = this.clamp(delta, -1200, 1200);
        if (Math.abs(delta) < 0.5) delta = 0;

        // Aplicar transformación si ha cambiado
        if (delta === this.lastDelta) return;
        this.lastDelta = delta;
        this.deviceFrame.style.transform = delta ? `translateX(${Math.round(delta)}px)` : '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const centering = new DeviceAutoCentering({ margin: 24, animate: true, transitionMs: 220 });
    centering.init();
    window.deviceAutoCentering = centering;
});

