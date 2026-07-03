/**
 * CANVAS-RENDERER.JS - Motor de Renderizado Canvas2D
 * Proporciona un entorno Canvas interactivo con sistema de capas
 */

class CanvasRenderer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container ${containerId} not found`);

        this.options = {
            width: options.width || 400,
            height: options.height || 700,
            backgroundColor: options.backgroundColor || '#ffffff',
            gridSnap: options.gridSnap || 10,
            showGrid: options.showGrid || false,
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.layers = [];
        this.selectedLayer = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.render();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.canvas.style.cssText = `
            display: block;
            margin: 0 auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            cursor: crosshair;
        `;

        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => this.onMouseUp());
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom - this.pan.x,
            y: (e.clientY - rect.top) / this.zoom - this.pan.y
        };
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);

        // Check resize handles first
        if (this.selectedLayer) {
            const handle = this.getResizeHandleAtPoint(pos, this.selectedLayer);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.resizeStart = {
                    x: pos.x,
                    y: pos.y,
                    layerX: this.selectedLayer.x,
                    layerY: this.selectedLayer.y,
                    layerWidth: this.selectedLayer.width,
                    layerHeight: this.selectedLayer.height
                };
                this.canvas.style.cursor = handle.cursor;
                return;
            }
        }

        // Check if clicking on a layer (reverse order for z-index)
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            if (layer.locked || layer.hidden) continue;

            if (this.isPointInLayer(pos, layer)) {
                this.selectedLayer = layer;
                this.isDragging = true;
                this.dragOffset = {
                    x: pos.x - layer.x,
                    y: pos.y - layer.y
                };
                this.canvas.style.cursor = 'grabbing';
                this.emit('select', { layer });
                this.render();
                return;
            }
        }

        this.selectedLayer = null;
        this.emit('deselect');
        this.render();
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.isResizing && this.selectedLayer) {
            this.handleResize(pos);
            return;
        }

        if (!this.isDragging || !this.selectedLayer) return;

        let newX = pos.x - this.dragOffset.x;
        let newY = pos.y - this.dragOffset.y;

        // Snap to grid
        if (this.options.gridSnap > 0) {
            newX = Math.round(newX / this.options.gridSnap) * this.options.gridSnap;
            newY = Math.round(newY / this.options.gridSnap) * this.options.gridSnap;
        }

        this.selectedLayer.x = newX;
        this.selectedLayer.y = newY;
        this.emit('move', { layer: this.selectedLayer });
        this.render();
    }

    onMouseUp() {
        if (this.isResizing) {
            this.isResizing = false;
            this.resizeHandle = null;
            this.emit('resize', { layer: this.selectedLayer });
        }
        this.isDragging = false;
        this.canvas.style.cursor = 'crosshair';
    }

    getResizeHandleAtPoint(pos, layer) {
        const handles = this.getResizeHandles(layer);
        const handleSize = 10;

        for (const handle of handles) {
            if (Math.abs(pos.x - handle.x) < handleSize &&
                Math.abs(pos.y - handle.y) < handleSize) {
                return handle;
            }
        }
        return null;
    }

    handleResize(pos) {
        if (!this.resizeHandle || !this.selectedLayer) return;

        const layer = this.selectedLayer;
        const start = this.resizeStart;
        const dx = pos.x - start.x;
        const dy = pos.y - start.y;

        let newX = start.layerX;
        let newY = start.layerY;
        let newWidth = start.layerWidth;
        let newHeight = start.layerHeight;

        switch (this.resizeHandle.type) {
            case 'nw':
                newX = start.layerX + dx;
                newY = start.layerY + dy;
                newWidth = start.layerWidth - dx;
                newHeight = start.layerHeight - dy;
                break;
            case 'ne':
                newY = start.layerY + dy;
                newWidth = start.layerWidth + dx;
                newHeight = start.layerHeight - dy;
                break;
            case 'se':
                newWidth = start.layerWidth + dx;
                newHeight = start.layerHeight + dy;
                break;
            case 'sw':
                newX = start.layerX + dx;
                newWidth = start.layerWidth - dx;
                newHeight = start.layerHeight + dy;
                break;
        }

        // Enforce minimum size
        if (newWidth >= 20 && newHeight >= 20) {
            layer.x = newX;
            layer.y = newY;
            layer.width = newWidth;
            layer.height = newHeight;
            this.render();
        }
    }

    rotateLayer(angle) {
        if (!this.selectedLayer) return;
        this.selectedLayer.rotation = angle;
        this.emit('rotate', { layer: this.selectedLayer, angle });
        this.render();
    }

    flipLayer(direction) {
        if (!this.selectedLayer) return;
        const layer = this.selectedLayer;

        if (direction === 'horizontal') {
            layer.scaleX = (layer.scaleX || 1) * -1;
        } else {
            layer.scaleY = (layer.scaleY || 1) * -1;
        }

        this.emit('flip', { layer, direction });
        this.render();
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.zoom = Math.max(0.25, Math.min(4, this.zoom + delta));
        this.applyTransform();
        this.render();
    }

    applyTransform() {
        this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.pan.x * this.zoom, this.pan.y * this.zoom);
    }

    isPointInLayer(pos, layer) {
        return pos.x >= layer.x &&
               pos.x <= layer.x + layer.width &&
               pos.y >= layer.y &&
               pos.y <= layer.y + layer.height;
    }

    // === Layer Management ===

    addLayer(layer) {
        const newLayer = {
            id: layer.id || `layer_${Date.now()}`,
            type: layer.type || 'rect',
            x: layer.x || 0,
            y: layer.y || 0,
            width: layer.width || 100,
            height: layer.height || 100,
            fill: layer.fill || '#5327a0',
            stroke: layer.stroke || 'transparent',
            strokeWidth: layer.strokeWidth || 0,
            opacity: layer.opacity || 1,
            rotation: layer.rotation || 0,
            zIndex: layer.zIndex || this.layers.length,
            locked: false,
            hidden: false,
            name: layer.name || layer.id || `Layer ${this.layers.length + 1}`,
            data: layer.data || {},
            ...layer
        };

        this.layers.push(newLayer);
        this.sortLayers();
        this.emit('addLayer', { layer: newLayer });
        this.render();
        return newLayer;
    }

    removeLayer(id) {
        const index = this.layers.findIndex(l => l.id === id);
        if (index !== -1) {
            const removed = this.layers.splice(index, 1)[0];
            if (this.selectedLayer?.id === id) {
                this.selectedLayer = null;
                this.emit('deselect');
            }
            this.emit('removeLayer', { layer: removed });
            this.render();
            return removed;
        }
        return null;
    }

    getLayer(id) {
        return this.layers.find(l => l.id === id);
    }

    updateLayer(id, updates) {
        const layer = this.getLayer(id);
        if (layer) {
            Object.assign(layer, updates);
            this.sortLayers();
            this.emit('updateLayer', { layer });
            this.render();
        }
    }

    moveLayer(id, direction) {
        const index = this.layers.findIndex(l => l.id === id);
        if (index === -1) return;

        if (direction === 'up' && index < this.layers.length - 1) {
            [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
        } else if (direction === 'down' && index > 0) {
            [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
        }

        this.sortLayers();
        this.emit('reorderLayers');
        this.render();
    }

    sortLayers() {
        this.layers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    }

    duplicateLayer(id) {
        const original = this.getLayer(id);
        if (!original) return null;

        return this.addLayer({
            ...JSON.parse(JSON.stringify(original)),
            id: `${original.id}_copy_${Date.now()}`,
            x: original.x + 20,
            y: original.y + 20,
            name: `${original.name} (Copia)`
        });
    }

    // === Rendering ===

    render() {
        const ctx = this.ctx;
        const { width, height } = this.options;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.fillStyle = this.options.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw grid if enabled
        if (this.options.showGrid) {
            this.drawGrid();
        }

        // Draw layers
        for (const layer of this.layers) {
            if (layer.hidden) continue;
            this.drawLayer(layer);
        }

        // Draw selection
        if (this.selectedLayer && !this.selectedLayer.hidden) {
            this.drawSelection(this.selectedLayer);
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const { width, height } = this.options;
        const gridSize = this.options.gridSnap;

        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawLayer(layer) {
        const ctx = this.ctx;

        ctx.save();
        ctx.globalAlpha = layer.opacity;

        // Apply transformations
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;

        ctx.translate(centerX, centerY);

        // Apply rotation
        if (layer.rotation) {
            ctx.rotate((layer.rotation * Math.PI) / 180);
        }

        // Apply scale (for flip)
        const scaleX = layer.scaleX || 1;
        const scaleY = layer.scaleY || 1;
        ctx.scale(scaleX, scaleY);

        ctx.translate(-centerX, -centerY);

        // Draw based on type
        switch (layer.type) {
            case 'rect':
                this.drawRect(layer);
                break;
            case 'circle':
                this.drawCircle(layer);
                break;
            case 'text':
                this.drawText(layer);
                break;
            case 'image':
                this.drawImage(layer);
                break;
            default:
                this.drawRect(layer);
        }

        ctx.restore();
    }

    drawRect(layer) {
        const ctx = this.ctx;

        ctx.fillStyle = layer.fill;
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);

        if (layer.strokeWidth > 0) {
            ctx.strokeStyle = layer.stroke;
            ctx.lineWidth = layer.strokeWidth;
            ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
        }
    }

    drawCircle(layer) {
        const ctx = this.ctx;
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        const radius = Math.min(layer.width, layer.height) / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = layer.fill;
        ctx.fill();

        if (layer.strokeWidth > 0) {
            ctx.strokeStyle = layer.stroke;
            ctx.lineWidth = layer.strokeWidth;
            ctx.stroke();
        }
    }

    drawText(layer) {
        const ctx = this.ctx;
        const fontSize = layer.data.fontSize || 24;
        const fontFamily = layer.data.fontFamily || 'Montserrat, sans-serif';

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = layer.fill;
        ctx.textBaseline = 'top';

        // Word wrap
        const words = (layer.data.text || 'Text').split(' ');
        let line = '';
        let y = layer.y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > layer.width && line) {
                ctx.fillText(line, layer.x, y);
                line = word + ' ';
                y += fontSize * 1.2;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, layer.x, y);
    }

    drawImage(layer) {
        if (!layer.data.imageElement) return;

        const ctx = this.ctx;
        try {
            ctx.drawImage(layer.data.imageElement, layer.x, layer.y, layer.width, layer.height);
        } catch (e) {
            // Draw placeholder
            ctx.fillStyle = '#ccc';
            ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
            ctx.fillStyle = '#666';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Image', layer.x + layer.width / 2, layer.y + layer.height / 2);
        }
    }

    drawSelection(layer) {
        const ctx = this.ctx;
        const padding = 4;

        ctx.strokeStyle = '#5327a0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);

        ctx.strokeRect(
            layer.x - padding,
            layer.y - padding,
            layer.width + padding * 2,
            layer.height + padding * 2
        );

        ctx.setLineDash([]);

        // Draw resize handles
        const handleSize = 8;
        const handles = this.getResizeHandles(layer);

        ctx.fillStyle = '#5327a0';
        for (const handle of handles) {
            ctx.fillRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
        }
    }

    getResizeHandles(layer) {
        return [
            { x: layer.x, y: layer.y, cursor: 'nw-resize', type: 'nw' },
            { x: layer.x + layer.width, y: layer.y, cursor: 'ne-resize', type: 'ne' },
            { x: layer.x + layer.width, y: layer.y + layer.height, cursor: 'se-resize', type: 'se' },
            { x: layer.x, y: layer.y + layer.height, cursor: 'sw-resize', type: 'sw' }
        ];
    }

    // === Export ===

    toDataURL(type = 'image/png', quality = 1) {
        return this.canvas.toDataURL(type, quality);
    }

    toBlob(type = 'image/png', quality = 1) {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, type, quality);
        });
    }

    toHTML(options = {}) {
        const {
            title = 'Invitación Digital',
            width = this.options.width,
            height = this.options.height,
            includeStyles = true
        } = options;

        const canvasDataUrl = this.toDataURL('image/png', 0.9);
        const layersJson = JSON.stringify(this.layers.map(l => ({
            id: l.id,
            type: l.type,
            x: l.x,
            y: l.y,
            width: l.width,
            height: l.height,
            fill: l.fill,
            opacity: l.opacity,
            rotation: l.rotation,
            name: l.name,
            data: l.data
        })));

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    ${includeStyles ? `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .invitation-wrapper {
            max-width: ${width}px;
            width: 100%;
        }
        .invitation-canvas {
            width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .layers-info {
            margin-top: 16px;
            padding: 12px;
            background: #1e293b;
            border-radius: 8px;
            color: #94a3b8;
            font-size: 12px;
        }
        @media (max-width: 480px) {
            body { padding: 10px; }
            .invitation-canvas { border-radius: 8px; }
        }
    </style>` : ''}
</head>
<body>
    <div class="invitation-wrapper">
        <img class="invitation-canvas" src="${canvasDataUrl}" alt="${this.escapeHtml(title)}" width="${width}" height="${height}">
        <div class="layers-info" id="layersInfo" style="display:none;">
            <strong>Capas:</strong> <span id="layerCount">${this.layers.length}</span>
        </div>
    </div>
    <script>
        // Canvas data for reference
        const canvasData = {
            width: ${width},
            height: ${height},
            layers: ${layersJson}
        };
        
        // Expose for external access
        window.invitationCanvas = canvasData;
    <\/script>
</body>
</html>`;
    }

    escapeHtml(str) {
        return Utils.escapeHtml(str);
    }

    downloadHTML(filename = 'invitacion.html') {
        const html = this.toHTML();
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadImage(filename = 'invitacion.png', type = 'image/png', quality = 1) {
        const dataUrl = this.toDataURL(type, quality);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // === Event Emitter ===

    _events = {};

    on(event, callback) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
    }

    off(event, callback) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this._events[event]) return;
        this._events[event].forEach(cb => cb(data));
    }

    // === Cleanup ===

    destroy() {
        this.layers = [];
        this.selectedLayer = null;
        if (this.canvas) {
            this.canvas.remove();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer;
}
