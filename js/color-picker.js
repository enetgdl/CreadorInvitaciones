/**
 * COLOR-PICKER.JS - Selector Avanzado de Color HSL/RGB/Hex
 * Proporciona un popup con conversión entre formatos HSL, RGB y Hex
 */

class AdvancedColorPicker {
    constructor() {
        this.currentColor = { h: 0, s: 100, l: 50 };
        this.currentFormat = 'hex';
        this.activeInput = null;
        this.popup = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.createPopup();
            this.setupGlobalListeners();
        });
    }

    createPopup() {
        this.popup = document.createElement('div');
        this.popup.className = 'advanced-color-picker-popup';
        this.popup.setAttribute('role', 'dialog');
        this.popup.setAttribute('aria-label', 'Selector de color avanzado');
        this.popup.innerHTML = `
            <div class="acp-header">
                <div class="acp-preview">
                    <div class="acp-preview-color" id="acpPreviewColor"></div>
                </div>
                <div class="acp-format-tabs">
                    <button class="acp-tab active" data-format="hex">HEX</button>
                    <button class="acp-tab" data-format="rgb">RGB</button>
                    <button class="acp-tab" data-format="hsl">HSL</button>
                </div>
                <button class="acp-close" aria-label="Cerrar">&times;</button>
            </div>
            <div class="acp-body">
                <div class="acp-saturation-lightness">
                    <canvas class="acp-sl-canvas" width="240" height="160"></canvas>
                    <div class="acp-sl-cursor"></div>
                </div>
                <div class="acp-hue">
                    <canvas class="acp-hue-canvas" width="240" height="20"></canvas>
                    <div class="acp-hue-cursor"></div>
                </div>
                <div class="acp-alpha" style="display:none;">
                    <canvas class="acp-alpha-canvas" width="240" height="20"></canvas>
                    <div class="acp-alpha-cursor"></div>
                </div>
                <div class="acp-inputs">
                    <div class="acp-input-group" data-format="hex">
                        <label>HEX</label>
                        <input type="text" class="acp-input acp-hex-input" maxlength="7" spellcheck="false">
                    </div>
                    <div class="acp-input-group" data-format="rgb" style="display:none;">
                        <label>R</label><input type="number" class="acp-input acp-r-input" min="0" max="255">
                        <label>G</label><input type="number" class="acp-input acp-g-input" min="0" max="255">
                        <label>B</label><input type="number" class="acp-input acp-b-input" min="0" max="255">
                    </div>
                    <div class="acp-input-group" data-format="hsl" style="display:none;">
                        <label>H</label><input type="number" class="acp-input acp-h-input" min="0" max="360">
                        <label>S</label><input type="number" class="acp-input acp-s-input" min="0" max="100">
                        <label>L</label><input type="number" class="acp-input acp-l-input" min="0" max="100">
                    </div>
                </div>
                <div class="acp-presets">
                    <div class="acp-preset-row" data-colors="#FFD700,#FFF8DC,#FF69B4,#4169E1,#DC143C,#9370DB,#2E8B57,#FF6347,#1E90FF,#FFA500"></div>
                </div>
            </div>
        `;
        document.body.appendChild(this.popup);
        this.bindPopupEvents();
    }

    bindPopupEvents() {
        const p = this.popup;

        // Close button
        p.querySelector('.acp-close').addEventListener('click', () => this.close());

        // Format tabs
        p.querySelectorAll('.acp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                p.querySelectorAll('.acp-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFormat = tab.dataset.format;
                this.updateInputVisibility();
                this.updateInputs();
            });
        });

        // SL canvas interactions
        const slCanvas = p.querySelector('.acp-sl-canvas');
        const slCursor = p.querySelector('.acp-sl-cursor');
        let slDragging = false;

        const updateSL = (e) => {
            const rect = slCanvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
            this.currentColor.s = Math.round((x / rect.width) * 100);
            this.currentColor.l = Math.round(100 - (y / rect.height) * 100);
            slCursor.style.left = `${(x / rect.width) * 100}%`;
            slCursor.style.top = `${(y / rect.height) * 100}%`;
            this.updatePreview();
            this.updateInputs();
            this.emitChange();
        };

        slCanvas.addEventListener('mousedown', (e) => { slDragging = true; updateSL(e); });
        document.addEventListener('mousemove', (e) => { if (slDragging) updateSL(e); });
        document.addEventListener('mouseup', () => { slDragging = false; });

        // Hue canvas interactions
        const hueCanvas = p.querySelector('.acp-hue-canvas');
        const hueCursor = p.querySelector('.acp-hue-cursor');
        let hueDragging = false;

        const updateHue = (e) => {
            const rect = hueCanvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            this.currentColor.h = Math.round((x / rect.width) * 360);
            hueCursor.style.left = `${(x / rect.width) * 100}%`;
            this.renderSLCanvas();
            this.updatePreview();
            this.updateInputs();
            this.emitChange();
        };

        hueCanvas.addEventListener('mousedown', (e) => { hueDragging = true; updateHue(e); });
        document.addEventListener('mousemove', (e) => { if (hueDragging) updateHue(e); });
        document.addEventListener('mouseup', () => { hueDragging = false; });

        // Touch support
        slCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); slDragging = true; updateSL(e.touches[0]); }, { passive: false });
        document.addEventListener('touchmove', (e) => { if (slDragging) { e.preventDefault(); updateSL(e.touches[0]); } }, { passive: false });
        document.addEventListener('touchend', () => { slDragging = false; });

        hueCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); hueDragging = true; updateHue(e.touches[0]); }, { passive: false });
        document.addEventListener('touchmove', (e) => { if (hueDragging) { e.preventDefault(); updateHue(e.touches[0]); } }, { passive: false });
        document.addEventListener('touchend', () => { hueDragging = false; });

        // Hex input
        p.querySelector('.acp-hex-input').addEventListener('input', (e) => {
            const hex = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                this.currentColor = this.hexToHSL(hex);
                this.renderSLCanvas();
                this.updateCursorPositions();
                this.updatePreview();
                this.emitChange();
            }
        });

        // RGB inputs
        ['r', 'g', 'b'].forEach(ch => {
            p.querySelector(`.acp-${ch}-input`).addEventListener('input', () => {
                const r = parseInt(p.querySelector('.acp-r-input').value) || 0;
                const g = parseInt(p.querySelector('.acp-g-input').value) || 0;
                const b = parseInt(p.querySelector('.acp-b-input').value) || 0;
                this.currentColor = this.rgbToHSL(r, g, b);
                this.renderSLCanvas();
                this.updateCursorPositions();
                this.updatePreview();
                this.emitChange();
            });
        });

        // HSL inputs
        ['h', 's', 'l'].forEach(ch => {
            p.querySelector(`.acp-${ch}-input`).addEventListener('input', () => {
                this.currentColor.h = parseInt(p.querySelector('.acp-h-input').value) || 0;
                this.currentColor.s = parseInt(p.querySelector('.acp-s-input').value) || 0;
                this.currentColor.l = parseInt(p.querySelector('.acp-l-input').value) || 0;
                this.renderSLCanvas();
                this.updateCursorPositions();
                this.updatePreview();
                this.emitChange();
            });
        });

        // Preset colors
        p.querySelectorAll('.acp-preset-row').forEach(row => {
            const colors = row.dataset.colors.split(',');
            colors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'acp-preset-swatch';
                swatch.style.backgroundColor = color;
                swatch.dataset.color = color;
                swatch.addEventListener('click', () => {
                    this.currentColor = this.hexToHSL(color);
                    this.renderSLCanvas();
                    this.updateCursorPositions();
                    this.updatePreview();
                    this.updateInputs();
                    this.emitChange();
                });
                row.appendChild(swatch);
            });
        });
    }

    setupGlobalListeners() {
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });

        // Close on click outside
        document.addEventListener('mousedown', (e) => {
            if (this.isOpen && !this.popup.contains(e.target) && !e.target.classList.contains('acp-trigger')) {
                this.close();
            }
        });
    }

    open(inputElement) {
        this.activeInput = inputElement;
        const currentVal = inputElement.value || '#FFD700';
        this.currentColor = this.hexToHSL(currentVal);
        this.isOpen = true;
        this.popup.hidden = false;
        this.popup.classList.add('open');
        this.renderSLCanvas();
        this.updateCursorPositions();
        this.updatePreview();
        this.updateInputs();
    }

    close() {
        this.isOpen = false;
        this.popup.hidden = true;
        this.popup.classList.remove('open');
        this.activeInput = null;
    }

    renderSLCanvas() {
        const canvas = this.popup.querySelector('.acp-sl-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Base hue color
        const hueColor = `hsl(${this.currentColor.h}, 100%, 50%)`;
        ctx.fillStyle = hueColor;
        ctx.fillRect(0, 0, width, height);

        // White gradient (left to right)
        const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
        whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
        whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = whiteGrad;
        ctx.fillRect(0, 0, width, height);

        // Black gradient (top to bottom)
        const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
        blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
        blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = blackGrad;
        ctx.fillRect(0, 0, width, height);
    }

    updateCursorPositions() {
        const slCursor = this.popup.querySelector('.acp-sl-cursor');
        const hueCursor = this.popup.querySelector('.acp-hue-cursor');

        slCursor.style.left = `${this.currentColor.s}%`;
        slCursor.style.top = `${100 - this.currentColor.l}%`;
        hueCursor.style.left = `${(this.currentColor.h / 360) * 100}%`;
    }

    updatePreview() {
        const preview = this.popup.querySelector('#acpPreviewColor');
        preview.style.backgroundColor = this.hslToHex(this.currentColor.h, this.currentColor.s, this.currentColor.l);
    }

    updateInputVisibility() {
        this.popup.querySelectorAll('.acp-input-group').forEach(g => {
            g.style.display = g.dataset.format === this.currentFormat ? '' : 'none';
        });
    }

    updateInputs() {
        const { h, s, l } = this.currentColor;
        const hex = this.hslToHex(h, s, l);
        const rgb = this.hslToRGB(h, s, l);

        this.popup.querySelector('.acp-hex-input').value = hex;
        this.popup.querySelector('.acp-r-input').value = rgb.r;
        this.popup.querySelector('.acp-g-input').value = rgb.g;
        this.popup.querySelector('.acp-b-input').value = rgb.b;
        this.popup.querySelector('.acp-h-input').value = Math.round(h);
        this.popup.querySelector('.acp-s-input').value = Math.round(s);
        this.popup.querySelector('.acp-l-input').value = Math.round(l);
    }

    emitChange() {
        const hex = this.hslToHex(this.currentColor.h, this.currentColor.s, this.currentColor.l);
        if (this.activeInput) {
            this.activeInput.value = hex;
            this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.activeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // === Color Conversion Utilities ===

    hexToHSL(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToHex(h, s, l) {
        const rgb = this.hslToRGB(h, s, l);
        return '#' + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, '0')).join('');
    }

    hslToRGB(h, s, l) {
        s /= 100;
        l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    rgbToHSL(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }
}

// Initialize globally
window.advancedColorPicker = new AdvancedColorPicker();
