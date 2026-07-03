class CanvasControls {
    constructor() {
        this.zoom = 1;
        this.minZoom = 0.25;
        this.maxZoom = 2;
        this.isPanning = false;
        this.panStart = null;
        this.touch = { pointers: new Map(), startDist: 0, startZoom: 1 };
    }

    init() {
        this.previewArea = document.querySelector('.preview-area');
        this.deviceScreen = document.getElementById('deviceScreen');
        this.zoomRange = document.getElementById('zoomRange');
        this.zoomValue = document.getElementById('zoomValue');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');

        if (!this.previewArea || !this.deviceScreen) return;

        this.applyZoom(1);

        this.zoomRange?.addEventListener('input', () => {
            const pct = parseInt(this.zoomRange.value || '100', 10);
            this.applyZoom(pct / 100);
        });

        this.zoomInBtn?.addEventListener('click', () => this.stepZoom(+0.1));
        this.zoomOutBtn?.addEventListener('click', () => this.stepZoom(-0.1));

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isTyping()) {
                document.body.classList.add('canvas-pan-mode');
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') document.body.classList.remove('canvas-pan-mode');
        });

        this.previewArea.addEventListener('wheel', (e) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            this.stepZoom(delta);
        }, { passive: false });

        this.previewArea.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.previewArea.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.previewArea.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.previewArea.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    }

    isTyping() {
        const a = document.activeElement;
        if (!a) return false;
        if (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') return true;
        return a.getAttribute('contenteditable') === 'true';
    }

    applyZoom(value) {
        const clamped = Math.min(this.maxZoom, Math.max(this.minZoom, value));
        this.zoom = clamped;
        this.deviceScreen.style.transform = `scale(${clamped})`;
        this.deviceScreen.style.transformOrigin = '50% 0';
        const pct = Math.round(clamped * 100);
        if (this.zoomRange) this.zoomRange.value = String(pct);
        if (this.zoomValue) this.zoomValue.textContent = `${pct}%`;
    }

    stepZoom(delta) {
        const next = this.zoom + delta;
        this.applyZoom(next);
    }

    onPointerDown(e) {
        if (e.pointerType === 'touch') {
            this.touch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.touch.pointers.size === 2) {
                const pts = Array.from(this.touch.pointers.values());
                this.touch.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                this.touch.startZoom = this.zoom;
            }
            return;
        }

        const inCanvas = e.target && e.target.closest && e.target.closest('#deviceScreen');
        if (inCanvas) return;

        const allowPan = document.body.classList.contains('canvas-pan-mode') || e.button === 1;
        if (!allowPan) return;

        this.isPanning = true;
        this.panStart = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: this.previewArea.scrollLeft,
            scrollTop: this.previewArea.scrollTop
        };
        this.previewArea.classList.add('is-panning');
        try { this.previewArea.setPointerCapture(e.pointerId); } catch (_) { }
        e.preventDefault();
    }

    onPointerMove(e) {
        if (e.pointerType === 'touch') {
            if (!this.touch.pointers.has(e.pointerId)) return;
            this.touch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (this.touch.pointers.size === 2) {
                const pts = Array.from(this.touch.pointers.values());
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                if (this.touch.startDist > 0) {
                    const ratio = dist / this.touch.startDist;
                    this.applyZoom(this.touch.startZoom * ratio);
                }
            }
            return;
        }

        if (!this.isPanning || !this.panStart) return;
        const dx = e.clientX - this.panStart.x;
        const dy = e.clientY - this.panStart.y;
        this.previewArea.scrollLeft = this.panStart.scrollLeft - dx;
        this.previewArea.scrollTop = this.panStart.scrollTop - dy;
    }

    onPointerUp(e) {
        if (e.pointerType === 'touch') {
            this.touch.pointers.delete(e.pointerId);
            if (this.touch.pointers.size < 2) {
                this.touch.startDist = 0;
                this.touch.startZoom = this.zoom;
            }
            return;
        }

        if (!this.isPanning) return;
        this.isPanning = false;
        this.panStart = null;
        this.previewArea.classList.remove('is-panning');
        try { this.previewArea.releasePointerCapture(e.pointerId); } catch (_) { }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const c = new CanvasControls();
    c.init();
    window.canvasControls = c;
});

