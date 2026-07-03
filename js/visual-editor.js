class VisualEditorHost {
    constructor(editor, iframe) {
        this.editor = editor;
        this.iframe = iframe;
        this.selectedId = null;
        this.lastHistoryAt = 0;
        this.lastHistoryKey = '';

        this.ui = {};
        this.layersSnapshot = [];
        this.lastElementInfo = null;
        this.layersReqRaf = 0;
        this.layersSelectedIds = new Set();
        this.layersDragState = { draggingId: null, overId: null, position: null };
        this.elementInfoReqRaf = 0;
    }

    init() {
        this.bindUI();
        this.bindMessaging();
        this.bindShortcuts();
        this.refreshSnappingUI();
        this.bindOutsideDeselect();
        this.applyRightSidebarTooltips();
        this.updateRightSidebarMode();
    }

    bindUI() {
        const byId = (id) => document.getElementById(id);

        this.ui.noSelection = byId('veNoSelection');
        this.ui.controls = byId('veControls');
        this.ui.selectedId = byId('veSelectedId');

        this.ui.snapping = byId('veSnappingEnabled');

        this.ui.posX = byId('vePosX');
        this.ui.posY = byId('vePosY');
        this.ui.sizeW = byId('veSizeW');
        this.ui.sizeH = byId('veSizeH');
        this.ui.zIndex = byId('veZIndex');
        this.ui.zUp = byId('veZUp');
        this.ui.zDown = byId('veZDown');
        this.ui.opacity = byId('veOpacity');

        this.ui.fillType = byId('veFillType');
        this.ui.fillSolidRow = byId('veFillSolidRow');
        this.ui.fillGradientRow = byId('veFillGradientRow');
        this.ui.fillTextureRow = byId('veFillTextureRow');
        this.ui.fillColor = byId('veFillColor');
        this.ui.fillGradient = byId('veFillGradient');
        this.ui.useAdvancedGradient = byId('veUseAdvancedGradient');
        this.ui.clearFill = byId('veClearFill');
        this.ui.texturePreset = byId('veTexturePreset');
        this.ui.textureScale = byId('veTextureScale');
        this.ui.textureRepeat = byId('veTextureRepeat');
        this.ui.fillModeSolid = byId('veFillModeSolid');
        this.ui.fillModeGradient = byId('veFillModeGradient');
        this.ui.fillModeTexture = byId('veFillModeTexture');
        this.ui.fillModeNone = byId('veFillModeNone');

        this.ui.textColor = byId('veTextColor');
        this.ui.textGradient = byId('veTextGradient');
        this.ui.useAdvancedTextGradient = byId('veUseAdvancedTextGradient');

        this.ui.borderWidth = byId('veBorderWidth');
        this.ui.borderColor = byId('veBorderColor');
        this.ui.borderStyle = byId('veBorderStyle');
        this.ui.borderRadius = byId('veBorderRadius');

        this.ui.shadowEnabled = byId('veShadowEnabled');
        this.ui.shadowControls = byId('veShadowControls');
        this.ui.shadowX = byId('veShadowX');
        this.ui.shadowY = byId('veShadowY');
        this.ui.shadowBlur = byId('veShadowBlur');
        this.ui.shadowSpread = byId('veShadowSpread');
        this.ui.shadowColor = byId('veShadowColor');
        this.ui.shadowOpacity = byId('veShadowOpacity');

        this.ui.filterBlur = byId('veFilterBlur');
        this.ui.filterGrayscale = byId('veFilterGrayscale');
        this.ui.mixBlendMode = byId('veMixBlendMode');

        this.ui.hide = byId('veHide');
        this.ui.show = byId('veShow');

        this.ui.layersToggle = byId('layersToggle');
        this.ui.layersBody = byId('layersBody');
        this.ui.layersList = byId('layersList');
        this.ui.contextPanel = byId('veContextPanel');

        if (this.ui.layersBody) this.ui.layersBody.style.display = 'block';

        this.ui.snapping?.addEventListener('change', () => {
            this.ensureEditorSettings();
            this.editor.data.editorSettings.snappingEnabled = !!this.ui.snapping.checked;
            this.editor.isDirty = true;
            this.postToIframe({ type: 'setSnapping', enabled: this.editor.data.editorSettings.snappingEnabled });
        });

        const numberInput = (el, cb) => {
            if (!el) return;
            el.addEventListener('change', () => cb());
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') cb();
            });
        };

        numberInput(this.ui.posX, () => this.applyFromUI(['tx']));
        numberInput(this.ui.posY, () => this.applyFromUI(['ty']));
        numberInput(this.ui.sizeW, () => this.applyFromUI(['width']));
        numberInput(this.ui.sizeH, () => this.applyFromUI(['height']));
        numberInput(this.ui.zIndex, () => this.applyFromUI(['zIndex']));

        this.ui.zUp?.addEventListener('click', () => this.bumpZ(1));
        this.ui.zDown?.addEventListener('click', () => this.bumpZ(-1));

        this.ui.opacity?.addEventListener('input', () => {
            if (!this.selectedId) return;
            this.updateDesignElement(this.selectedId, { opacity: parseInt(this.ui.opacity.value, 10) / 100 }, { sendToIframe: true, historyKey: 'opacity' });
        });

        const setFillMode = (mode) => {
            if (!this.ui.fillType) return;
            this.ui.fillType.value = mode;
            this.updateFillVisibility();
        };

        this.ui.fillModeSolid?.addEventListener('click', () => setFillMode('solid'));
        this.ui.fillModeGradient?.addEventListener('click', () => setFillMode('gradient'));
        this.ui.fillModeTexture?.addEventListener('click', () => setFillMode('texture'));
        this.ui.fillModeNone?.addEventListener('click', () => setFillMode('none'));

        this.ui.fillType?.addEventListener('change', () => {
            this.updateFillVisibility();
            if (!this.selectedId) return;
            const fillType = this.ui.fillType.value;
            const patch = { fillType };
            if (fillType === 'solid') patch.fillColor = this.ui.fillColor.value;
            if (fillType === 'gradient') patch.fillGradient = this.ui.fillGradient.value;
            if (fillType === 'texture') {
                const preset = this.ui.texturePreset.value;
                const textureDataUrl = this.getTextureDataUrl(preset);
                patch.textureDataUrl = textureDataUrl;
                patch.textureScale = parseFloat(this.ui.textureScale.value || '1');
                patch.textureRepeat = this.ui.textureRepeat.value;
            }
            this.updateDesignElement(this.selectedId, patch, { sendToIframe: true, historyKey: 'fill' });
        });

        this.ui.fillColor?.addEventListener('input', () => {
            if (!this.selectedId) return;
            if (this.ui.fillType.value !== 'solid') setFillMode('solid');
            this.updateDesignElement(this.selectedId, { fillType: 'solid', fillColor: this.ui.fillColor.value }, { sendToIframe: true, historyKey: 'fillColor' });
        });

        this.ui.fillGradient?.addEventListener('change', () => {
            if (!this.selectedId) return;
            if (this.ui.fillType.value !== 'gradient') setFillMode('gradient');
            this.updateDesignElement(this.selectedId, { fillType: 'gradient', fillGradient: this.ui.fillGradient.value }, { sendToIframe: true, historyKey: 'fillGradient' });
        });

        this.ui.useAdvancedGradient?.addEventListener('click', () => {
            if (!this.selectedId) return;
            const css = window.designAdvancedIntegrator?.gradientEditor?.generateCSS?.();
            if (!css) return;
            this.ui.fillGradient.value = css;
            setFillMode('gradient');
            this.updateDesignElement(this.selectedId, { fillType: 'gradient', fillGradient: css }, { sendToIframe: true, historyKey: 'fillGradient' });
        });

        this.ui.clearFill?.addEventListener('click', () => {
            if (!this.selectedId) return;
            setFillMode('none');
            this.updateDesignElement(this.selectedId, { fillType: 'none' }, { sendToIframe: true, historyKey: 'fill' });
        });

        this.ui.texturePreset?.addEventListener('change', () => {
            if (!this.selectedId) return;
            if (this.ui.fillType.value !== 'texture') setFillMode('texture');
            const textureDataUrl = this.getTextureDataUrl(this.ui.texturePreset.value);
            this.updateDesignElement(this.selectedId, { fillType: 'texture', textureDataUrl }, { sendToIframe: true, historyKey: 'texture' });
        });

        numberInput(this.ui.textureScale, () => {
            if (!this.selectedId) return;
            if (this.ui.fillType.value !== 'texture') setFillMode('texture');
            this.updateDesignElement(this.selectedId, { fillType: 'texture', textureScale: parseFloat(this.ui.textureScale.value || '1') }, { sendToIframe: true, historyKey: 'texture' });
        });

        this.ui.textureRepeat?.addEventListener('change', () => {
            if (!this.selectedId) return;
            if (this.ui.fillType.value !== 'texture') setFillMode('texture');
            this.updateDesignElement(this.selectedId, { fillType: 'texture', textureRepeat: this.ui.textureRepeat.value }, { sendToIframe: true, historyKey: 'texture' });
        });

        this.ui.textColor?.addEventListener('input', () => {
            if (!this.selectedId) return;
            this.updateDesignElement(this.selectedId, { textColor: this.ui.textColor.value }, { sendToIframe: true, historyKey: 'textColor' });
        });

        this.ui.textGradient?.addEventListener('change', () => {
            if (!this.selectedId) return;
            const v = this.ui.textGradient.value.trim();
            if (!v) return;
            this.updateDesignElement(this.selectedId, { textGradient: v }, { sendToIframe: true, historyKey: 'textGradient' });
        });

        this.ui.useAdvancedTextGradient?.addEventListener('click', () => {
            if (!this.selectedId) return;
            const css = window.designAdvancedIntegrator?.gradientEditor?.generateCSS?.();
            if (!css) return;
            this.ui.textGradient.value = css;
            this.updateDesignElement(this.selectedId, { textGradient: css }, { sendToIframe: true, historyKey: 'textGradient' });
        });

        this.ui.borderWidth?.addEventListener('input', () => this.applyFromUI(['border']));
        this.ui.borderColor?.addEventListener('input', () => this.applyFromUI(['border']));
        this.ui.borderStyle?.addEventListener('change', () => this.applyFromUI(['border']));
        this.ui.borderRadius?.addEventListener('input', () => this.applyFromUI(['borderRadius']));

        this.ui.shadowEnabled?.addEventListener('change', () => {
            if (!this.selectedId) return;
            const enabled = !!this.ui.shadowEnabled.checked;
            this.ui.shadowControls.style.display = enabled ? 'block' : 'none';
            this.updateDesignElement(this.selectedId, { shadowEnabled: enabled }, { sendToIframe: true, historyKey: 'shadow' });
        });

        const shadowInput = () => {
            if (!this.selectedId) return;
            if (!this.ui.shadowEnabled.checked) return;
            this.updateDesignElement(this.selectedId, {
                shadowEnabled: true,
                shadowX: parseFloat(this.ui.shadowX.value || '0'),
                shadowY: parseFloat(this.ui.shadowY.value || '0'),
                shadowBlur: parseFloat(this.ui.shadowBlur.value || '0'),
                shadowSpread: parseFloat(this.ui.shadowSpread.value || '0'),
                shadowColor: this.ui.shadowColor.value,
                shadowOpacity: parseFloat(this.ui.shadowOpacity.value || '0')
            }, { sendToIframe: true, historyKey: 'shadow' });
        };

        ['input', 'change'].forEach((evt) => {
            this.ui.shadowX?.addEventListener(evt, shadowInput);
            this.ui.shadowY?.addEventListener(evt, shadowInput);
            this.ui.shadowBlur?.addEventListener(evt, shadowInput);
            this.ui.shadowSpread?.addEventListener(evt, shadowInput);
            this.ui.shadowColor?.addEventListener(evt, shadowInput);
            this.ui.shadowOpacity?.addEventListener(evt, shadowInput);
        });

        const effectsInput = () => {
            if (!this.selectedId) return;
            this.updateDesignElement(this.selectedId, {
                filterBlur: parseFloat(this.ui.filterBlur.value || '0'),
                filterGrayscale: parseFloat(this.ui.filterGrayscale.value || '0'),
                mixBlendMode: this.ui.mixBlendMode.value
            }, { sendToIframe: true, historyKey: 'effects' });
        };

        this.ui.filterBlur?.addEventListener('input', effectsInput);
        this.ui.filterGrayscale?.addEventListener('input', effectsInput);
        this.ui.mixBlendMode?.addEventListener('change', effectsInput);

        this.ui.hide?.addEventListener('click', () => {
            if (!this.selectedId) return;
            this.updateDesignElement(this.selectedId, { hidden: true }, { sendToIframe: true, historyKey: 'hide' });
        });
        this.ui.show?.addEventListener('click', () => {
            if (!this.selectedId) return;
            this.updateDesignElement(this.selectedId, { hidden: false }, { sendToIframe: true, historyKey: 'hide' });
        });

        this.populateTexturePresets();
        this.mountAdvancedVisualTools();
        setTimeout(() => this.mountAdvancedVisualTools(), 400);
        this.updateFillVisibility();
        this.requestLayers();
        this.refreshLayersList();

        // Toolbar Actions
        const insertImgBtn = document.getElementById('insertImageBtn');
        if (insertImgBtn) {
            insertImgBtn.addEventListener('click', () => {
                // Crear input de archivo temporal
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/png, image/jpeg, image/gif, image/svg+xml';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            const elementId = `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

                            // Add to dynamic elements manager
                            if (this.editor.dynamicElementsManager) {
                                this.editor.dynamicElementsManager.addElement({
                                    id: elementId,
                                    type: 'image',
                                    src: evt.target.result,
                                    x: 0, // Will be centered by iframe
                                    y: 0,
                                    width: 300,
                                    height: 200,
                                    name: file.name
                                });
                            }

                            // Send to iframe
                            this.postToIframe({
                                type: 'addElement',
                                elementType: 'image',
                                elementId: elementId,
                                src: evt.target.result
                            });

                            // Save to history
                            this.editor.historyManager?.saveState?.(this.editor.data, `Insertar imagen: ${file.name}`);
                        };
                        reader.readAsDataURL(file);
                    }
                    document.body.removeChild(fileInput);
                });
                fileInput.click();
            });
        }

        const insertTxtBtn = document.getElementById('insertTextBtn');
        if (insertTxtBtn) {
            insertTxtBtn.addEventListener('click', () => {
                const elementId = `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                const defaultText = 'Nuevo Texto';

                // Add to dynamic elements manager
                if (this.editor.dynamicElementsManager) {
                    this.editor.dynamicElementsManager.addElement({
                        id: elementId,
                        type: 'text',
                        content: defaultText,
                        x: 0, // Will be centered by iframe
                        y: 0,
                        width: 200,
                        height: 30,
                        fontSize: '24px',
                        fontFamily: 'Inter, sans-serif',
                        color: '#1e293b'
                    });
                }

                // Send to iframe
                this.postToIframe({
                    type: 'addElement',
                    elementType: 'text',
                    elementId: elementId,
                    content: defaultText
                });

                // Save to history
                this.editor.historyManager?.saveState?.(this.editor.data, 'Insertar texto');
            });
        }
    }


    bindOutsideDeselect() {
        const previewArea = document.querySelector('.preview-area');
        if (!previewArea) return;

        previewArea.addEventListener('pointerdown', (e) => {
            if (!this.selectedId) return;
            const deviceScreen = document.getElementById('deviceScreen');
            if (!deviceScreen) return;
            if (e.target && e.target.closest && e.target.closest('#deviceScreen')) return;
            this.clearSelection();
        }, true);
    }

    bindMessaging() {
        // Debug: log all incoming postMessages to diagnose communication
        window.addEventListener('message', (event) => {
            if (event.data && typeof event.data === 'object') {
                console.log('🔍 [VE] postMessage received:', event.data?.source, event.data?.type);
            }
        });

        window.addEventListener('message', (event) => {
            const msg = event?.data;
            if (!msg || msg.source !== 'invitation-editor') return;

            // Removing strict event.source check because Blob URLs can cause window reference mismatches 
            // in some browser contexts.
            if (msg.type === 'ready') {
                console.log('✅ Visual Editor: iframe ready signal received');
                this.postToIframe({ type: 'setSnapping', enabled: this.getSnappingEnabled() });
                this.postToIframe({ type: 'syncStyles', styles: this.editor.data.designElements || {} });

                // Restore dynamic elements from manager
                if (this.editor.dynamicElementsManager) {
                    const elements = this.editor.dynamicElementsManager.getAllElements();
                    if (elements.length > 0) {
                        this.postToIframe({
                            type: 'restoreElements',
                            elements: elements
                        });
                        console.log(`📤 Syncing ${elements.length} elements to iframe`);
                    }
                }

                if (this.selectedId) this.postToIframe({ type: 'setSelection', id: this.selectedId });
                // Request layers list from the iframe
                this.requestLayers();
            }

            if (msg.type === 'select' && msg.id) {
                this.setSelection(msg.id);
            }

            if (msg.type === 'clearSelection') {
                this.clearSelection();
            }

            if (msg.type === 'commitTransform' && msg.id && msg.patch) {
                // Log transform event before updating
                if (this.editor.dynamicElementsManager && msg.oldPatch) {
                    this.editor.dynamicElementsManager.logTransformEvent(
                        msg.id,
                        msg.oldPatch,
                        msg.patch
                    );
                }

                this.updateDesignElement(msg.id, msg.patch, { sendToIframe: false, historyKey: 'transform' });
                this.syncUIFromState();
            }

            if (msg.type === 'elementInfo' && msg.id && msg.info) {
                this.lastElementInfo = msg.info;
                this.renderContextPanel();
                this.updateRightSidebarMode();
            }

            if (msg.type === 'layers' && Array.isArray(msg.layers)) {
                this.layersSnapshot = msg.layers;
                this.refreshLayersList();
            }

            if (msg.type === 'elementAdded' && msg.id) {
                // Element was successfully added in iframe, confirm in manager
                console.log(`✅ Element added confirmation: ${msg.id}`);
            }

            if (msg.type === 'textEdited' && msg.id && msg.text !== undefined) {
                // Update dynamic element content
                if (this.editor.dynamicElementsManager) {
                    this.editor.dynamicElementsManager.updateElement(msg.id, {
                        content: msg.text
                    });
                }

                // Save text edit to history
                this.editor.historyManager?.saveState?.(this.editor.data, `Editar texto: "${msg.text.substring(0, 20)}..."`);
            }

            if (msg.type === 'autoLayoutPatches' && msg.patches) {
                this.applyBatchPatches(msg.patches);
            }
        });
    }

    triggerAutoLayout() {
        this.postToIframe({ type: 'executeAutoLayout', gap: 24 });
    }

    applyBatchPatches(patches) {
        if (!patches) return;
        let changed = false;
        Object.keys(patches).forEach(id => {
            this.ensureDesignElement(id);
            const current = this.editor.data.designElements[id];
            const patch = patches[id];

            // Solo aplicar si es diferente
            if (current.tx !== patch.tx || current.ty !== patch.ty) {
                this.updateDesignElement(id, patch, { sendToIframe: false, historyKey: null });
                changed = true;
            }
        });

        if (changed) {
            this.postToIframe({ type: 'syncStyles', styles: this.editor.data.designElements });
            this.editor.isDirty = true;
        }
    }

    bindShortcuts() {
        document.addEventListener('keydown', (e) => {
            const tag = document.activeElement?.tagName;
            const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
            if (isTyping) return;
            if (!this.selectedId) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSelection();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.updateDesignElement(this.selectedId, { hidden: true }, { sendToIframe: true, historyKey: 'hide' });
                this.syncUIFromState();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === ']') {
                e.preventDefault();
                this.bumpZ(1);
            }

            if ((e.ctrlKey || e.metaKey) && e.key === '[') {
                e.preventDefault();
                this.bumpZ(-1);
            }
        });
    }

    postToIframe(payload) {
        try {
            this.iframe?.contentWindow?.postMessage({ source: 'invitation-editor-host', ...payload }, '*');
        } catch (_) { }
    }

    ensureEditorSettings() {
        if (!this.editor.data.editorSettings) this.editor.data.editorSettings = {};
        if (!('snappingEnabled' in this.editor.data.editorSettings)) this.editor.data.editorSettings.snappingEnabled = true;
        if (!this.editor.data.editorSettings.layerPanel) {
            this.editor.data.editorSettings.layerPanel = { groups: [], collapsedGroupIds: [] };
        }
    }

    getSnappingEnabled() {
        this.ensureEditorSettings();
        return this.editor.data.editorSettings.snappingEnabled !== false;
    }

    refreshSnappingUI() {
        if (!this.ui.snapping) return;
        this.ui.snapping.checked = this.getSnappingEnabled();
    }

    ensureDesignMap() {
        if (!this.editor.data.designElements) this.editor.data.designElements = {};
    }

    ensureDesignElement(id) {
        this.ensureDesignMap();
        if (!this.editor.data.designElements[id]) this.editor.data.designElements[id] = {};
        return this.editor.data.designElements[id];
    }

    maybeSaveHistory(historyKey) {
        const now = moment().valueOf();
        const key = `${this.selectedId || ''}:${historyKey || ''}`;
        if (!this.editor.historyManager || this.editor.historyManager.isNavigating) return;
        if (this.lastHistoryKey !== key || (now - this.lastHistoryAt > 900)) {

            const actionMap = {
                'move': 'Desplazamiento', 'resize': 'Redimensionamiento', 'rotate': 'Rotación',
                'zIndex': 'Cambio de orden', 'update': 'Modificación visual',
                'color': 'Cambio de color', 'textAlign': 'Alineación de texto',
                'font': 'Cambio de fuente', 'opacity': 'Cambio de opacidad',
                'text': 'Cambio de texto', 'duplicate': 'Duplicar elemento',
                'delete': 'Eliminar elemento', 'reorder': 'Reordenar capas',
                'gradient': 'Aplicar degradado', 'gradientAuto': 'Ajuste de degradado',
                'fillSolid': 'Relleno sólido', 'fillGradient': 'Relleno degradado',
                'fillTexture': 'Relleno de textura', 'textureAuto': 'Ajuste de textura'
            };
            const actionName = actionMap[historyKey] || 'Modificación';

            this.editor.historyManager.saveState(this.editor.data, actionName);
            this.lastHistoryKey = key;
            this.lastHistoryAt = now;
        }
    }

    updateDesignElement(id, patch, options = {}) {
        if (!id || !patch) return;

        const { sendToIframe = true, historyKey = 'update' } = options;
        this.maybeSaveHistory(historyKey);

        const cur = this.ensureDesignElement(id);
        const normalized = { ...patch };

        if ('tx' in normalized) normalized.tx = Number.isFinite(parseFloat(normalized.tx)) ? parseFloat(normalized.tx) : 0;
        if ('ty' in normalized) normalized.ty = Number.isFinite(parseFloat(normalized.ty)) ? parseFloat(normalized.ty) : 0;
        if ('width' in normalized) normalized.width = Math.max(1, Number.isFinite(parseFloat(normalized.width)) ? parseFloat(normalized.width) : 1);
        if ('height' in normalized) normalized.height = Math.max(1, Number.isFinite(parseFloat(normalized.height)) ? parseFloat(normalized.height) : 1);
        if ('zIndex' in normalized) normalized.zIndex = Number.isFinite(parseInt(normalized.zIndex)) ? parseInt(normalized.zIndex) : 0;
        if ('opacity' in normalized) normalized.opacity = Math.min(1, Math.max(0, Number.isFinite(parseFloat(normalized.opacity)) ? parseFloat(normalized.opacity) : 1));
        if ('borderWidth' in normalized) normalized.borderWidth = Math.max(0, Number.isFinite(parseFloat(normalized.borderWidth)) ? parseFloat(normalized.borderWidth) : 0);
        if ('borderRadius' in normalized) normalized.borderRadius = Math.max(0, Number.isFinite(parseFloat(normalized.borderRadius)) ? parseFloat(normalized.borderRadius) : 0);
        if ('shadowOpacity' in normalized) normalized.shadowOpacity = Math.min(100, Math.max(0, Number.isFinite(parseFloat(normalized.shadowOpacity)) ? parseFloat(normalized.shadowOpacity) : 0));
        if ('filterBlur' in normalized) normalized.filterBlur = Math.max(0, Number.isFinite(parseFloat(normalized.filterBlur)) ? parseFloat(normalized.filterBlur) : 0);
        if ('filterGrayscale' in normalized) normalized.filterGrayscale = Math.min(100, Math.max(0, Number.isFinite(parseFloat(normalized.filterGrayscale)) ? parseFloat(normalized.filterGrayscale) : 0));

        Object.assign(cur, normalized);

        this.editor.isDirty = true;

        if (sendToIframe) this.postToIframe({ type: 'applyPatch', id, patch: normalized });
        if (id === this.selectedId) this.requestElementInfo(id);
        this.refreshLayersList();
    }

    bumpZ(delta) {
        if (!this.selectedId) return;
        const cur = this.ensureDesignElement(this.selectedId);
        const z = Number.isFinite(parseInt(cur.zIndex)) ? parseInt(cur.zIndex) : 0;
        const next = z + delta;
        this.updateDesignElement(this.selectedId, { zIndex: next }, { sendToIframe: true, historyKey: 'zIndex' });
        this.ui.zIndex.value = String(next);
    }

    setSelection(id) {
        this.selectedId = id;
        if (this.ui.selectedId) this.ui.selectedId.value = id;
        if (this.ui.noSelection) this.ui.noSelection.style.display = 'none';
        if (this.ui.controls) this.ui.controls.style.display = 'block';
        this.syncUIFromState();
        this.applyRightSidebarTooltips();
        this.requestElementInfo(id);
        this.updateRightSidebarMode();
        this.requestLayers();
        this.refreshLayersList();
    }

    clearSelection() {
        this.selectedId = null;
        if (this.ui.noSelection) this.ui.noSelection.style.display = '';
        if (this.ui.controls) this.ui.controls.style.display = 'none';
        this.postToIframe({ type: 'clearSelection' });
        this.applyRightSidebarTooltips();
        this.lastElementInfo = null;
        this.renderContextPanel();
        this.updateRightSidebarMode();
        this.requestLayers();
        this.refreshLayersList();
    }

    requestElementInfo(id) {
        if (!id) return;
        if (this.elementInfoReqRaf) return;
        this.elementInfoReqRaf = requestAnimationFrame(() => {
            this.elementInfoReqRaf = 0;
            this.postToIframe({ type: 'getElementInfo', id });
        });
    }

    updateRightSidebarMode() {
        const panel = document.getElementById('visualEditorPanel');
        if (!panel) return;
        const hasSelection = !!this.selectedId;
        panel.classList.toggle('is-minimal', !hasSelection);
        this.updateGlobalStyleVisibility();
    }

    updateGlobalStyleVisibility() {
        const mount = document.getElementById('globalStylePanel');
        if (!mount) return;
        if (!this.selectedId) {
            mount.style.display = 'none';
            return;
        }
        mount.style.display = '';

        const info = this.lastElementInfo;
        const tag = String(info?.tag || '').toLowerCase();
        const hasText = (info?.text || '').trim().length > 0;
        const isText = hasText || this.isProbablyText(this.selectedId);
        const isImage = tag === 'img' || tag === 'video' || tag === 'svg' || tag === 'canvas';

        const findSection = (controlId) => mount.querySelector(`#${controlId}`)?.closest?.('.design-section');
        const colorsSection = findSection('primaryColor');
        const typographySection = findSection('titleFont');
        const contentStylesSection = findSection('showMainContainer') || findSection('overlayOpacity');

        const setDisplay = (section, show) => {
            if (!section) return;
            section.style.display = show ? '' : 'none';
        };

        setDisplay(typographySection, isText);
        setDisplay(colorsSection, !isText && !isImage);
        setDisplay(contentStylesSection, !isText);
    }

    requestLayers() {
        if (this.layersReqRaf) return;
        this.layersReqRaf = requestAnimationFrame(() => {
            this.layersReqRaf = 0;
            this.postToIframe({ type: 'getLayers' });
        });
    }

    renderContextPanel() {
        if (!this.ui.contextPanel) return;
        const mount = this.ui.contextPanel;
        mount.innerHTML = '';
        if (!this.selectedId || !this.lastElementInfo) return;

        const info = this.lastElementInfo;
        const s = info.styles || {};
        const tag = String(info.tag || '');
        const hasText = (info.text || '').trim().length > 0;
        const isImage = tag === 'img' || tag === 'video' || tag === 'svg' || tag === 'canvas';
        const isButton = tag === 'button' || tag === 'a';
        const type = isImage ? 'image' : (hasText ? 'text' : (isButton ? 'button' : 'box'));

        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'sidebar-subtitle';
        sectionTitle.textContent = type === 'text' ? 'Texto' : type === 'image' ? 'Imagen' : type === 'button' ? 'Botón' : 'Contenedor';
        mount.appendChild(sectionTitle);

        const makeGroup = (label) => {
            const g = document.createElement('div');
            g.className = 'control-group';
            const l = document.createElement('label');
            l.className = 'control-label';
            l.textContent = label;
            g.appendChild(l);
            mount.appendChild(g);
            return g;
        };

        const clampNumber = (v, min, max) => Math.min(max, Math.max(min, v));
        const parsePx = (v) => {
            const n = parseFloat(String(v || '').replace('px', ''));
            return Number.isFinite(n) ? n : null;
        };
        const normalizeFontFamily = (ff) => {
            const raw = String(ff || '').trim();
            if (!raw) return '';
            const first = raw.split(',')[0] || raw;
            return first.replace(/["']/g, '').trim();
        };
        const rgbToHex = (rgb) => {
            const s = String(rgb || '').trim();
            const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
            if (!m) return '';
            const r = Math.min(255, Math.max(0, parseInt(m[1], 10)));
            const g = Math.min(255, Math.max(0, parseInt(m[2], 10)));
            const b = Math.min(255, Math.max(0, parseInt(m[3], 10)));
            const toHex = (n) => n.toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        };

        if (type === 'text') {
            const gFont = makeGroup('Fuente');
            const row = document.createElement('div');
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 100px';
            row.style.gap = '10px';
            gFont.appendChild(row);

            const fontSelect = document.createElement('select');
            fontSelect.className = 'control-input';
            fontSelect.id = 'veFontFamily';
            fontSelect.title = 'Familia tipográfica';
            row.appendChild(fontSelect);

            const sizeInput = document.createElement('input');
            sizeInput.type = 'number';
            sizeInput.className = 'control-input';
            sizeInput.min = '6';
            sizeInput.max = '200';
            sizeInput.step = '1';
            sizeInput.title = 'Tamaño de fuente';
            row.appendChild(sizeInput);

            const fs = parsePx(s.fontSize) || 24;
            sizeInput.value = String(Math.round(fs));

            if (Array.isArray(window.ALL_FONTS) && window.ALL_FONTS.length) {
                const fonts = window.ALL_FONTS.slice();
                const groups = new Map();
                for (const f of fonts) {
                    const cat = String(f.category || 'Fuentes');
                    if (!groups.has(cat)) groups.set(cat, []);
                    groups.get(cat).push(f);
                }
                fontSelect.innerHTML = '';
                for (const [cat, list] of groups.entries()) {
                    const og = document.createElement('optgroup');
                    og.label = cat;
                    for (const f of list) {
                        const opt = document.createElement('option');
                        opt.value = f.value || f.name;
                        opt.textContent = f.name;
                        opt.style.fontFamily = f.value || f.name;
                        og.appendChild(opt);
                    }
                    fontSelect.appendChild(og);
                }
                const currentName = normalizeFontFamily(s.fontFamily);
                const match = fonts.find((f) => normalizeFontFamily(f.value || f.name) === currentName);
                fontSelect.value = (match?.value || match?.name) || (fonts[0]?.value || fonts[0]?.name) || '';
            } else {
                [
                    { name: 'Montserrat', value: "'Montserrat', sans-serif" },
                    { name: 'Poppins', value: "'Poppins', sans-serif" },
                    { name: 'Raleway', value: "'Raleway', sans-serif" },
                    { name: 'Playfair Display', value: "'Playfair Display', serif" },
                    { name: 'Lora', value: "'Lora', serif" }
                ].forEach((f) => {
                    const opt = document.createElement('option');
                    opt.value = f.value;
                    opt.textContent = f.name;
                    opt.style.fontFamily = f.value;
                    fontSelect.appendChild(opt);
                });
                const currentName = normalizeFontFamily(s.fontFamily);
                const opts = Array.from(fontSelect.querySelectorAll('option'));
                const best = opts.find((o) => normalizeFontFamily(o.value) === currentName);
                fontSelect.value = best?.value || "'Montserrat', sans-serif";
            }

            const gStyle = makeGroup('Estilo');
            const styleRow = document.createElement('div');
            styleRow.style.display = 'grid';
            styleRow.style.gridTemplateColumns = '1fr 1fr';
            styleRow.style.gap = '10px';
            gStyle.appendChild(styleRow);

            const weight = document.createElement('select');
            weight.className = 'control-input';
            [['100', 'Thin'], ['300', 'Light'], ['400', 'Normal'], ['600', 'Semi'], ['700', 'Bold'], ['800', 'Extra']].forEach(([v, t]) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = t;
                weight.appendChild(opt);
            });
            weight.value = String(parseInt(s.fontWeight) || 400);
            styleRow.appendChild(weight);

            const fontStyle = document.createElement('select');
            fontStyle.className = 'control-input';
            [['normal', 'Normal'], ['italic', 'Italic'], ['oblique', 'Oblique']].forEach(([v, t]) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = t;
                fontStyle.appendChild(opt);
            });
            fontStyle.value = s.fontStyle || 'normal';
            styleRow.appendChild(fontStyle);

            const gColor = makeGroup('Color');
            const colorRow = document.createElement('div');
            colorRow.style.display = 'grid';
            colorRow.style.gridTemplateColumns = '1fr 1fr';
            colorRow.style.gap = '10px';
            gColor.appendChild(colorRow);

            const color = document.createElement('input');
            color.type = 'color';
            color.className = 'control-input';
            colorRow.appendChild(color);
            color.value = rgbToHex(s.color) || '#FFFFFF';

            const opacity = document.createElement('input');
            opacity.type = 'range';
            opacity.className = 'control-range';
            opacity.min = '0';
            opacity.max = '100';
            opacity.value = String(Math.round(clampNumber(parseFloat(s.opacity) || 1, 0, 1) * 100));
            colorRow.appendChild(opacity);

            const gAlign = makeGroup('Alineación');
            const alignRow = document.createElement('div');
            alignRow.className = 'segmented';
            alignRow.setAttribute('role', 'group');
            alignRow.setAttribute('aria-label', 'Alineación de texto');
            gAlign.appendChild(alignRow);

            const alignValue = (s.textAlign || 'left').toLowerCase();
            const alignOptions = ['left', 'center', 'right', 'justify'];
            const alignButtons = new Map();
            alignOptions.forEach((a) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'segmented-btn';
                b.textContent = a === 'left' ? 'Izq' : a === 'center' ? 'Centro' : a === 'right' ? 'Der' : 'Just';
                if (a === alignValue) b.classList.add('active');
                b.addEventListener('click', () => {
                    alignButtons.forEach((x) => x.classList.remove('active'));
                    b.classList.add('active');
                    this.updateDesignElement(this.selectedId, { textAlign: a }, { sendToIframe: true, historyKey: 'textAlign' });
                });
                alignRow.appendChild(b);
                alignButtons.set(a, b);
            });

            const gSpacing = makeGroup('Espaciado');
            const spacingGrid = document.createElement('div');
            spacingGrid.style.display = 'grid';
            spacingGrid.style.gridTemplateColumns = '1fr 1fr';
            spacingGrid.style.gap = '10px';
            gSpacing.appendChild(spacingGrid);

            const lineHeight = document.createElement('input');
            lineHeight.type = 'number';
            lineHeight.className = 'control-input';
            lineHeight.step = '0.05';
            lineHeight.min = '0.5';
            lineHeight.max = '3';
            lineHeight.value = String(parseFloat(s.lineHeight) || 1.2);
            lineHeight.title = 'Interlineado';
            spacingGrid.appendChild(lineHeight);

            const letterSpacing = document.createElement('input');
            letterSpacing.type = 'number';
            letterSpacing.className = 'control-input';
            letterSpacing.step = '0.5';
            letterSpacing.min = '-5';
            letterSpacing.max = '50';
            letterSpacing.value = String(parsePx(s.letterSpacing) || 0);
            letterSpacing.title = 'Espaciado entre letras';
            spacingGrid.appendChild(letterSpacing);

            const gTransform = makeGroup('Transformación');
            const transformSelect = document.createElement('select');
            transformSelect.className = 'control-input';
            [['none', 'Ninguna'], ['uppercase', 'MAYÚSCULAS'], ['lowercase', 'minúsculas'], ['capitalize', 'Capitalizar']].forEach(([v, t]) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = t;
                transformSelect.appendChild(opt);
            });
            transformSelect.value = s.textTransform || 'none';
            gTransform.appendChild(transformSelect);

            const gDecoration = makeGroup('Decoración');
            const deco = document.createElement('select');
            deco.className = 'control-input';
            [['none', 'Ninguna'], ['underline', 'Subrayado'], ['line-through', 'Tachado'], ['overline', 'Overline']].forEach(([v, t]) => {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = t;
                deco.appendChild(opt);
            });
            deco.value = s.textDecoration || 'none';
            gDecoration.appendChild(deco);

            const gEffects = makeGroup('Efectos');
            const effGrid = document.createElement('div');
            effGrid.style.display = 'grid';
            effGrid.style.gridTemplateColumns = '1fr 1fr';
            effGrid.style.gap = '10px';
            gEffects.appendChild(effGrid);

            const strokeW = document.createElement('input');
            strokeW.type = 'number';
            strokeW.className = 'control-input';
            strokeW.min = '0';
            strokeW.max = '24';
            strokeW.step = '1';
            strokeW.title = 'Outline (px)';
            effGrid.appendChild(strokeW);
            strokeW.value = '0';

            const strokeC = document.createElement('input');
            strokeC.type = 'color';
            strokeC.className = 'control-input';
            strokeC.title = 'Color de outline';
            effGrid.appendChild(strokeC);
            strokeC.value = '#000000';

            const shadowToggleGroup = makeGroup('Sombra');
            const shadowToggle = document.createElement('label');
            shadowToggle.className = 'control-label checkbox-label';
            shadowToggle.innerHTML = '<input type="checkbox" id="veCtxShadowEnabled"><span>Activar sombra</span>';
            shadowToggleGroup.appendChild(shadowToggle);
            const shadowEnabled = shadowToggle.querySelector('input');

            const shadowBox = document.createElement('div');
            shadowBox.style.display = 'none';
            shadowBox.style.marginTop = '10px';
            shadowBox.style.display = 'grid';
            shadowBox.style.gridTemplateColumns = '1fr 1fr';
            shadowBox.style.gap = '10px';
            shadowToggleGroup.appendChild(shadowBox);

            const shX = document.createElement('input');
            shX.type = 'number';
            shX.className = 'control-input';
            shX.step = '1';
            shX.value = '0';
            shX.title = 'Sombra X';
            shadowBox.appendChild(shX);

            const shY = document.createElement('input');
            shY.type = 'number';
            shY.className = 'control-input';
            shY.step = '1';
            shY.value = '6';
            shY.title = 'Sombra Y';
            shadowBox.appendChild(shY);

            const shBlur = document.createElement('input');
            shBlur.type = 'number';
            shBlur.className = 'control-input';
            shBlur.step = '1';
            shBlur.min = '0';
            shBlur.value = '16';
            shBlur.title = 'Blur';
            shadowBox.appendChild(shBlur);

            const shColor = document.createElement('input');
            shColor.type = 'color';
            shColor.className = 'control-input';
            shColor.value = '#000000';
            shColor.title = 'Color sombra';
            shadowBox.appendChild(shColor);

            const applyShadow = () => {
                if (!shadowEnabled.checked) {
                    this.updateDesignElement(this.selectedId, { textShadow: '' }, { sendToIframe: true, historyKey: 'textShadow' });
                    return;
                }
                const x = Number.isFinite(parseFloat(shX.value)) ? parseFloat(shX.value) : 0;
                const y = Number.isFinite(parseFloat(shY.value)) ? parseFloat(shY.value) : 6;
                const b = Number.isFinite(parseFloat(shBlur.value)) ? Math.max(0, parseFloat(shBlur.value)) : 16;
                this.updateDesignElement(this.selectedId, { textShadow: `${x}px ${y}px ${b}px ${shColor.value}` }, { sendToIframe: true, historyKey: 'textShadow' });
            };

            const saveStart = () => {
                if (this.editor.historyManager && !this.editor.historyManager.isNavigating) {
                    this.editor.historyManager.saveState(this.editor.data, 'Ajuste de sombra de texto');
                }
            };

            fontSelect.addEventListener('change', () => {
                saveStart();
                const v = fontSelect.value;
                if (window.loadGoogleFonts) window.loadGoogleFonts();
                this.updateDesignElement(this.selectedId, { fontFamily: v }, { sendToIframe: true, historyKey: 'fontFamily' });
            });
            sizeInput.addEventListener('focus', saveStart);
            sizeInput.addEventListener('change', () => {
                const v = clampNumber(parseFloat(sizeInput.value) || fs, 6, 200);
                this.updateDesignElement(this.selectedId, { fontSize: v }, { sendToIframe: true, historyKey: 'fontSize' });
            });
            weight.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { fontWeight: weight.value }, { sendToIframe: true, historyKey: 'fontWeight' });
            });
            fontStyle.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { fontStyle: fontStyle.value }, { sendToIframe: true, historyKey: 'fontStyle' });
            });
            color.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { textColor: color.value }, { sendToIframe: true, historyKey: 'textColor' });
            });
            opacity.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { opacity: parseInt(opacity.value, 10) / 100 }, { sendToIframe: true, historyKey: 'opacity' });
            });
            lineHeight.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { lineHeight: clampNumber(parseFloat(lineHeight.value) || 1.2, 0.5, 3) }, { sendToIframe: true, historyKey: 'lineHeight' });
            });
            letterSpacing.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { letterSpacing: clampNumber(parseFloat(letterSpacing.value) || 0, -5, 50) }, { sendToIframe: true, historyKey: 'letterSpacing' });
            });
            transformSelect.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { textTransform: transformSelect.value }, { sendToIframe: true, historyKey: 'textTransform' });
            });

            deco.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { textDecoration: deco.value }, { sendToIframe: true, historyKey: 'textDecoration' });
            });
            strokeW.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { textStrokeWidth: clampNumber(parseFloat(strokeW.value) || 0, 0, 24), textStrokeColor: strokeC.value }, { sendToIframe: true, historyKey: 'textStroke' });
            });
            strokeC.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { textStrokeWidth: clampNumber(parseFloat(strokeW.value) || 0, 0, 24), textStrokeColor: strokeC.value }, { sendToIframe: true, historyKey: 'textStroke' });
            });
            shadowEnabled.addEventListener('change', () => {
                saveStart();
                shadowBox.style.display = shadowEnabled.checked ? 'grid' : 'none';
                applyShadow();
            });
            [shX, shY, shBlur].forEach((el) => el.addEventListener('change', () => { saveStart(); applyShadow(); }));
            shColor.addEventListener('input', () => applyShadow());
        }

        if (type === 'image') {
            const g = makeGroup('Filtros');
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr';
            grid.style.gap = '10px';
            g.appendChild(grid);

            const mk = (label, min, max, step, value) => {
                const wrap = document.createElement('div');
                wrap.className = 'control-group';
                wrap.style.marginBottom = '0';
                const l = document.createElement('label');
                l.className = 'control-label';
                l.textContent = label;
                wrap.appendChild(l);
                const r = document.createElement('input');
                r.type = 'range';
                r.className = 'control-range';
                r.min = String(min);
                r.max = String(max);
                r.step = String(step);
                r.value = String(value);
                wrap.appendChild(r);
                grid.appendChild(wrap);
                return r;
            };

            const debounce = (fn, wait = 80) => {
                let t = 0;
                return (...args) => {
                    clearTimeout(t);
                    t = setTimeout(() => fn(...args), wait);
                };
            };

            const apply = (patch) => this.updateDesignElement(this.selectedId, patch, { sendToIframe: true, historyKey: 'filters' });
            const applyDebounced = debounce(apply, 80);

            const blur = mk('Blur', 0, 30, 1, 0);
            const gray = mk('Gris', 0, 100, 1, 0);
            const bright = mk('Brillo', 0, 3, 0.05, 1);
            const contrast = mk('Contraste', 0, 3, 0.05, 1);
            const saturate = mk('Saturación', 0, 3, 0.05, 1);
            const sepia = mk('Sepia', 0, 100, 1, 0);

            const saveStart = () => {
                if (this.editor.historyManager && !this.editor.historyManager.isNavigating) {
                    this.editor.historyManager.saveState(this.editor.data, 'Ajuste de filtros de imagen');
                }
            };

            [blur, gray, bright, contrast, saturate, sepia].forEach((el) => el.addEventListener('pointerdown', saveStart, { passive: true }));

            const onChange = () => applyDebounced({
                filterBlur: parseFloat(blur.value),
                filterGrayscale: parseFloat(gray.value),
                filterBrightness: parseFloat(bright.value),
                filterContrast: parseFloat(contrast.value),
                filterSaturate: parseFloat(saturate.value),
                filterSepia: parseFloat(sepia.value)
            });

            [blur, gray, bright, contrast, saturate, sepia].forEach((el) => el.addEventListener('input', onChange));
        }

        if (type === 'button') {
            const gBg = makeGroup('Fondo');
            const bgRow = document.createElement('div');
            bgRow.style.display = 'grid';
            bgRow.style.gridTemplateColumns = '1fr 1fr';
            bgRow.style.gap = '10px';
            gBg.appendChild(bgRow);

            const bgColor = document.createElement('input');
            bgColor.type = 'color';
            bgColor.className = 'control-input';
            bgColor.value = rgbToHex(s.backgroundColor) || '#5327a0';
            bgColor.title = 'Color de fondo';
            bgRow.appendChild(bgColor);

            const bgOpacity = document.createElement('input');
            bgOpacity.type = 'range';
            bgOpacity.className = 'control-range';
            bgOpacity.min = '0';
            bgOpacity.max = '100';
            bgOpacity.value = String(Math.round(clampNumber(parseFloat(s.opacity) || 1, 0, 1) * 100));
            bgOpacity.title = 'Opacidad';
            bgRow.appendChild(bgOpacity);

            const gBorder = makeGroup('Borde');
            const borderRow = document.createElement('div');
            borderRow.style.display = 'grid';
            borderRow.style.gridTemplateColumns = '1fr 1fr';
            borderRow.style.gap = '10px';
            gBorder.appendChild(borderRow);

            const borderWidth = document.createElement('input');
            borderWidth.type = 'number';
            borderWidth.className = 'control-input';
            borderWidth.min = '0';
            borderWidth.max = '20';
            borderWidth.value = String(parsePx(s.borderWidth) || 0);
            borderWidth.title = 'Grosor del borde';
            borderRow.appendChild(borderWidth);

            const borderColor = document.createElement('input');
            borderColor.type = 'color';
            borderColor.className = 'control-input';
            borderColor.value = rgbToHex(s.borderColor) || '#000000';
            borderColor.title = 'Color del borde';
            borderRow.appendChild(borderColor);

            const gRadius = makeGroup('Radio de Borde');
            const radiusInput = document.createElement('input');
            radiusInput.type = 'range';
            radiusInput.className = 'control-range';
            radiusInput.min = '0';
            radiusInput.max = '50';
            radiusInput.value = String(parsePx(s.borderRadius) || 0);
            radiusInput.title = 'Radio de esquina';
            gRadius.appendChild(radiusInput);

            const gPadding = makeGroup('Relleno');
            const paddingInput = document.createElement('input');
            paddingInput.type = 'number';
            paddingInput.className = 'control-input';
            paddingInput.min = '0';
            paddingInput.max = '100';
            paddingInput.value = String(parsePx(s.padding) || 12);
            paddingInput.title = 'Relleno (px)';
            gPadding.appendChild(paddingInput);

            const saveStart = () => {
                if (this.editor.historyManager && !this.editor.historyManager.isNavigating) {
                    this.editor.historyManager.saveState(this.editor.data, 'Ajuste de botón');
                }
            };

            bgColor.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { backgroundColor: bgColor.value }, { sendToIframe: true, historyKey: 'bgColor' });
            });
            bgOpacity.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { opacity: parseInt(bgOpacity.value, 10) / 100 }, { sendToIframe: true, historyKey: 'opacity' });
            });
            borderWidth.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { borderWidth: clampNumber(parseInt(borderWidth.value) || 0, 0, 20) }, { sendToIframe: true, historyKey: 'borderWidth' });
            });
            borderColor.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { borderColor: borderColor.value }, { sendToIframe: true, historyKey: 'borderColor' });
            });
            radiusInput.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { borderRadius: clampNumber(parseInt(radiusInput.value) || 0, 0, 50) }, { sendToIframe: true, historyKey: 'borderRadius' });
            });
            paddingInput.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { padding: clampNumber(parseInt(paddingInput.value) || 12, 0, 100) }, { sendToIframe: true, historyKey: 'padding' });
            });
        }

        if (type === 'box') {
            const gBg = makeGroup('Fondo');
            const bgRow = document.createElement('div');
            bgRow.style.display = 'grid';
            bgRow.style.gridTemplateColumns = '1fr 1fr';
            bgRow.style.gap = '10px';
            gBg.appendChild(bgRow);

            const bgColor = document.createElement('input');
            bgColor.type = 'color';
            bgColor.className = 'control-input';
            bgColor.value = rgbToHex(s.backgroundColor) || '#ffffff';
            bgColor.title = 'Color de fondo';
            bgRow.appendChild(bgColor);

            const bgOpacity = document.createElement('input');
            bgOpacity.type = 'range';
            bgOpacity.className = 'control-range';
            bgOpacity.min = '0';
            bgOpacity.max = '100';
            bgOpacity.value = String(Math.round(clampNumber(parseFloat(s.opacity) || 1, 0, 1) * 100));
            bgOpacity.title = 'Opacidad';
            bgRow.appendChild(bgOpacity);

            const gBorder = makeGroup('Borde');
            const borderRow = document.createElement('div');
            borderRow.style.display = 'grid';
            borderRow.style.gridTemplateColumns = '1fr 1fr';
            borderRow.style.gap = '10px';
            gBorder.appendChild(borderRow);

            const borderWidth = document.createElement('input');
            borderWidth.type = 'number';
            borderWidth.className = 'control-input';
            borderWidth.min = '0';
            borderWidth.max = '20';
            borderWidth.value = String(parsePx(s.borderWidth) || 0);
            borderWidth.title = 'Grosor del borde';
            borderRow.appendChild(borderWidth);

            const borderColor = document.createElement('input');
            borderColor.type = 'color';
            borderColor.className = 'control-input';
            borderColor.value = rgbToHex(s.borderColor) || '#000000';
            borderColor.title = 'Color del borde';
            borderRow.appendChild(borderColor);

            const gRadius = makeGroup('Radio de Borde');
            const radiusInput = document.createElement('input');
            radiusInput.type = 'range';
            radiusInput.className = 'control-range';
            radiusInput.min = '0';
            radiusInput.max = '50';
            radiusInput.value = String(parsePx(s.borderRadius) || 0);
            radiusInput.title = 'Radio de esquina';
            gRadius.appendChild(radiusInput);

            const gPadding = makeGroup('Relleno');
            const paddingInput = document.createElement('input');
            paddingInput.type = 'number';
            paddingInput.className = 'control-input';
            paddingInput.min = '0';
            paddingInput.max = '100';
            paddingInput.value = String(parsePx(s.padding) || 0);
            paddingInput.title = 'Relleno (px)';
            gPadding.appendChild(paddingInput);

            const gShadow = makeGroup('Sombra');
            const shadowRow = document.createElement('div');
            shadowRow.style.display = 'grid';
            shadowRow.style.gridTemplateColumns = '1fr 1fr';
            shadowRow.style.gap = '10px';
            gShadow.appendChild(shadowRow);

            const shadowBlur = document.createElement('input');
            shadowBlur.type = 'number';
            shadowBlur.className = 'control-input';
            shadowBlur.min = '0';
            shadowBlur.max = '50';
            shadowBlur.value = String(parsePx(s.boxShadow?.match?.(/(\d+)px/)?.[1]) || 0);
            shadowBlur.title = 'Desenfoque de sombra';
            shadowRow.appendChild(shadowBlur);

            const shadowColor = document.createElement('input');
            shadowColor.type = 'color';
            shadowColor.className = 'control-input';
            shadowColor.value = '#000000';
            shadowColor.title = 'Color de sombra';
            shadowRow.appendChild(shadowColor);

            const saveStart = () => {
                if (this.editor.historyManager && !this.editor.historyManager.isNavigating) {
                    this.editor.historyManager.saveState(this.editor.data, 'Ajuste de contenedor');
                }
            };

            bgColor.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { backgroundColor: bgColor.value }, { sendToIframe: true, historyKey: 'bgColor' });
            });
            bgOpacity.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { opacity: parseInt(bgOpacity.value, 10) / 100 }, { sendToIframe: true, historyKey: 'opacity' });
            });
            borderWidth.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { borderWidth: clampNumber(parseInt(borderWidth.value) || 0, 0, 20) }, { sendToIframe: true, historyKey: 'borderWidth' });
            });
            borderColor.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { borderColor: borderColor.value }, { sendToIframe: true, historyKey: 'borderColor' });
            });
            radiusInput.addEventListener('input', () => {
                this.updateDesignElement(this.selectedId, { borderRadius: clampNumber(parseInt(radiusInput.value) || 0, 0, 50) }, { sendToIframe: true, historyKey: 'borderRadius' });
            });
            paddingInput.addEventListener('change', () => {
                saveStart();
                this.updateDesignElement(this.selectedId, { padding: clampNumber(parseInt(paddingInput.value) || 0, 0, 100) }, { sendToIframe: true, historyKey: 'padding' });
            });
            shadowBlur.addEventListener('change', () => {
                saveStart();
                const blur = clampNumber(parseInt(shadowBlur.value) || 0, 0, 50);
                if (blur > 0) {
                    this.updateDesignElement(this.selectedId, { boxShadow: `0 4px ${blur}px ${shadowColor.value}` }, { sendToIframe: true, historyKey: 'boxShadow' });
                } else {
                    this.updateDesignElement(this.selectedId, { boxShadow: '' }, { sendToIframe: true, historyKey: 'boxShadow' });
                }
            });
            shadowColor.addEventListener('input', () => {
                const blur = clampNumber(parseInt(shadowBlur.value) || 0, 0, 50);
                if (blur > 0) {
                    this.updateDesignElement(this.selectedId, { boxShadow: `0 4px ${blur}px ${shadowColor.value}` }, { sendToIframe: true, historyKey: 'boxShadow' });
                }
            });
        }
    }

    refreshLayersList() {
        if (!this.ui.layersList) return;
        this.ensureEditorSettings();
        const layers = Array.isArray(this.layersSnapshot) ? this.layersSnapshot : [];
        const entries = layers.length ? layers : Object.entries(this.editor.data.designElements || {}).map(([id, s]) => {
            const z = Number.isFinite(parseInt(s?.zIndex)) ? parseInt(s.zIndex) : 0;
            return { id, zIndex: z, tag: '', locked: false, hidden: false, name: '', text: '', src: '', bg: '' };
        });

        const list = this.ui.layersList;
        list.innerHTML = '';

        const panelState = this.editor.data.editorSettings.layerPanel || { groups: [], collapsedGroupIds: [] };
        const groups = Array.isArray(panelState.groups) ? panelState.groups : [];
        const collapsedGroups = new Set(Array.isArray(panelState.collapsedGroupIds) ? panelState.collapsedGroupIds : []);

        const persistPanelState = () => {
            this.ensureEditorSettings();
            this.editor.data.editorSettings.layerPanel = panelState;
            this.editor.isDirty = true;
            this.editor.storage?.saveData?.(this.editor.data);
        };

        const getEffectiveSelection = () => {
            if (this.layersSelectedIds.size) return Array.from(this.layersSelectedIds);
            if (this.selectedId) return [this.selectedId];
            return [];
        };

        const actions = document.createElement('div');
        actions.className = 'layers-actions';
        const mkAction = (label, title, onClick) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'tool-btn';
            b.style.width = '32px';
            b.style.height = '32px';
            b.style.borderRadius = '10px';
            b.textContent = label;
            b.title = title;
            b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); });
            return b;
        };
        actions.appendChild(mkAction('👁', 'Mostrar/Ocultar seleccionadas', () => {
            const ids = getEffectiveSelection();
            if (!ids.length) return;
            this.editor.historyManager?.saveState?.(this.editor.data);
            ids.forEach((id) => {
                const cur = this.layersSnapshot?.find?.((x) => x.id === id);
                const hidden = !!cur?.hidden;
                this.postToIframe({ type: 'setLayerVisibility', id, visible: hidden });
                this.updateDesignElement(id, { hidden: !hidden }, { sendToIframe: false, historyKey: 'hide' });
            });
            this.requestLayers();
        }));
        actions.appendChild(mkAction('🔒', 'Bloquear/Desbloquear seleccionadas', () => {
            const ids = getEffectiveSelection();
            if (!ids.length) return;
            ids.forEach((id) => {
                const cur = this.layersSnapshot?.find?.((x) => x.id === id);
                const locked = !!cur?.locked;
                this.postToIframe({ type: 'setLayerLocked', id, locked: !locked });
            });
            this.requestLayers();
        }));
        actions.appendChild(mkAction('⎘', 'Duplicar seleccionadas', () => {
            const ids = getEffectiveSelection();
            if (!ids.length) return;
            this.editor.historyManager?.saveState?.(this.editor.data);
            ids.forEach((id) => this.postToIframe({ type: 'duplicateLayer', id }));
            this.requestLayers();
        }));
        actions.appendChild(mkAction('🗑', 'Eliminar seleccionadas', () => {
            const ids = getEffectiveSelection();
            if (!ids.length) return;
            this.editor.historyManager?.saveState?.(this.editor.data);
            ids.forEach((id) => this.postToIframe({ type: 'deleteLayer', id }));
            this.layersSelectedIds.clear();
            this.clearSelection();
            this.requestLayers();
        }));
        actions.appendChild(mkAction('🗂', 'Agrupar seleccionadas', () => {
            const ids = getEffectiveSelection();
            if (ids.length < 2) return;
            const name = prompt('Nombre del grupo', 'Grupo');
            if (name == null) return;
            const gid = `g_${moment().valueOf()}`;
            panelState.groups = Array.isArray(panelState.groups) ? panelState.groups : [];
            panelState.groups.push({ id: gid, name: String(name || 'Grupo').trim() || 'Grupo', childIds: ids.slice() });
            persistPanelState();
            this.refreshLayersList();
        }));
        actions.appendChild(mkAction('🧩', 'Desagrupar (si aplica)', () => {
            const ids = getEffectiveSelection();
            if (!ids.length) return;
            const next = [];
            let changed = false;
            for (const g of groups) {
                const childIds = Array.isArray(g.childIds) ? g.childIds : [];
                const matches = ids.every((x) => childIds.includes(x));
                if (matches) {
                    changed = true;
                    continue;
                }
                next.push(g);
            }
            if (!changed) return;
            panelState.groups = next;
            persistPanelState();
            this.refreshLayersList();
        }));
        list.appendChild(actions);

        const renderLayerRow = (it, options = {}) => {
            const { indent = 0 } = options;
            const row = document.createElement('div');
            const selected = this.selectedId === it.id || this.layersSelectedIds.has(it.id);
            row.className = 'layer-item' + (selected ? ' active' : '');
            row.dataset.layerId = it.id;
            row.draggable = true;
            if (indent) row.style.marginLeft = `${indent}px`;

            const left = document.createElement('div');
            left.style.display = 'flex';
            left.style.alignItems = 'center';
            left.style.gap = '8px';
            left.style.minWidth = '0';
            row.appendChild(left);

            const thumb = document.createElement('div');
            thumb.className = 'layer-thumb';
            if (it.src) {
                thumb.style.backgroundImage = `url("${it.src}")`;
                thumb.style.backgroundSize = 'cover';
                thumb.style.backgroundPosition = 'center';
            } else if (it.bg) {
                thumb.style.background = it.bg;
            }
            left.appendChild(thumb);

            const eye = document.createElement('button');
            eye.type = 'button';
            eye.className = 'tool-btn';
            eye.style.width = '32px';
            eye.style.height = '32px';
            eye.style.borderRadius = '10px';
            eye.title = it.hidden ? 'Mostrar' : 'Ocultar';
            eye.textContent = it.hidden ? '🚫' : '👁';
            eye.addEventListener('click', (e) => {
                e.stopPropagation();
                this.postToIframe({ type: 'setLayerVisibility', id: it.id, visible: it.hidden });
                this.updateDesignElement(it.id, { hidden: !it.hidden }, { sendToIframe: false, historyKey: 'hide' });
                this.requestLayers();
            });
            left.appendChild(eye);

            const lock = document.createElement('button');
            lock.type = 'button';
            lock.className = 'tool-btn';
            lock.style.width = '32px';
            lock.style.height = '32px';
            lock.style.borderRadius = '10px';
            lock.title = it.locked ? 'Desbloquear' : 'Bloquear';
            lock.textContent = it.locked ? '🔒' : '🔓';
            lock.addEventListener('click', (e) => {
                e.stopPropagation();
                this.postToIframe({ type: 'setLayerLocked', id: it.id, locked: !it.locked });
                this.requestLayers();
            });
            left.appendChild(lock);

            const label = document.createElement('div');
            label.className = 'layer-name';
            label.textContent = it.name || it.text || it.id;
            left.appendChild(label);

            const right = document.createElement('div');
            right.style.display = 'flex';
            right.style.alignItems = 'center';
            right.style.gap = '6px';

            const meta = document.createElement('div');
            meta.className = 'layer-meta';
            meta.textContent = `z ${it.zIndex ?? it.z ?? 0}`;
            right.appendChild(meta);

            const dup = document.createElement('button');
            dup.type = 'button';
            dup.className = 'tool-btn';
            dup.style.width = '32px';
            dup.style.height = '32px';
            dup.style.borderRadius = '10px';
            dup.title = 'Duplicar';
            dup.textContent = '⎘';
            dup.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editor.historyManager?.saveState?.(this.editor.data, 'Duplicar elemento');
                this.postToIframe({ type: 'duplicateLayer', id: it.id });
                this.requestLayers();
            });
            right.appendChild(dup);

            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'tool-btn';
            del.style.width = '32px';
            del.style.height = '32px';
            del.style.borderRadius = '10px';
            del.title = 'Eliminar';
            del.textContent = '🗑';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editor.historyManager?.saveState?.(this.editor.data, 'Eliminar elemento');
                this.postToIframe({ type: 'deleteLayer', id: it.id });
                if (this.selectedId === it.id) this.clearSelection();
                this.layersSelectedIds.delete(it.id);
                this.requestLayers();
            });
            right.appendChild(del);

            row.appendChild(right);

            row.addEventListener('click', (e) => {
                const multi = !!(e.ctrlKey || e.metaKey);
                if (multi) {
                    if (this.layersSelectedIds.has(it.id)) this.layersSelectedIds.delete(it.id);
                    else this.layersSelectedIds.add(it.id);
                    this.refreshLayersList();
                    return;
                }
                this.layersSelectedIds.clear();
                if (it.locked) {
                    this.refreshLayersList();
                    return;
                }
                this.postToIframe({ type: 'setSelection', id: it.id });
                this.setSelection(it.id);
            });

            row.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const next = prompt('Renombrar capa', it.name || it.id);
                if (next == null) return;
                this.postToIframe({ type: 'renameLayer', id: it.id, name: next });
                this.requestLayers();
            });

            row.addEventListener('dragstart', (e) => {
                this.layersDragState.draggingId = it.id;
                this.layersDragState.overId = null;
                this.layersDragState.position = null;
                try { e.dataTransfer.effectAllowed = 'move'; } catch (_) { }
            });
            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                const rect = row.getBoundingClientRect();
                const before = e.clientY < rect.top + rect.height / 2;
                this.layersDragState.overId = it.id;
                this.layersDragState.position = before ? 'before' : 'after';
                row.style.outline = before ? '2px solid rgba(139, 92, 246, 0.9)' : '';
            });
            row.addEventListener('dragleave', () => { row.style.outline = ''; });
            row.addEventListener('drop', (e) => {
                e.preventDefault();
                row.style.outline = '';
                const dragId = this.layersDragState.draggingId;
                const overId = it.id;
                const pos = this.layersDragState.position || 'after';
                if (!dragId || !overId || dragId === overId) return;
                const ordered = items.slice();
                const fromIdx = ordered.findIndex((x) => x.id === dragId);
                const overIdx = ordered.findIndex((x) => x.id === overId);
                if (fromIdx < 0 || overIdx < 0) return;
                const [moved] = ordered.splice(fromIdx, 1);
                const insertAt = pos === 'before' ? overIdx : overIdx + 1;
                ordered.splice(insertAt > fromIdx ? insertAt - 1 : insertAt, 0, moved);
                this.editor.historyManager?.saveState?.(this.editor.data, 'Reordenar capas');
                const base = ordered.length;
                ordered.forEach((x, i) => {
                    this.updateDesignElement(x.id, { zIndex: base - i }, { sendToIframe: true, historyKey: 'reorder' });
                });
                this.requestLayers();
            });

            return row;
        };

        const items = entries.slice();
        items.sort((a, b) => (b.zIndex ?? b.z ?? 0) - (a.zIndex ?? a.z ?? 0) || a.id.localeCompare(b.id));

        const groupedIds = new Set();
        groups.forEach((g) => (Array.isArray(g.childIds) ? g.childIds : []).forEach((id) => groupedIds.add(id)));

        const renderGroup = (g) => {
            const groupRow = document.createElement('div');
            groupRow.className = 'layer-group';
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'layer-group-toggle';
            toggle.textContent = collapsedGroups.has(g.id) ? '▸' : '▾';
            toggle.title = collapsedGroups.has(g.id) ? 'Expandir grupo' : 'Contraer grupo';
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (collapsedGroups.has(g.id)) collapsedGroups.delete(g.id);
                else collapsedGroups.add(g.id);
                panelState.collapsedGroupIds = Array.from(collapsedGroups);
                persistPanelState();
                this.refreshLayersList();
            });
            groupRow.appendChild(toggle);
            const name = document.createElement('div');
            name.className = 'layer-group-name';
            name.textContent = g.name || 'Grupo';
            groupRow.appendChild(name);
            groupRow.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                const next = prompt('Renombrar grupo', g.name || 'Grupo');
                if (next == null) return;
                g.name = String(next).trim() || 'Grupo';
                persistPanelState();
                this.refreshLayersList();
            });
            list.appendChild(groupRow);
            if (collapsedGroups.has(g.id)) return;
            const childIds = Array.isArray(g.childIds) ? g.childIds : [];
            childIds.forEach((id) => {
                const it = items.find((x) => x.id === id);
                if (it) list.appendChild(renderLayerRow(it, { indent: 18 }));
            });
        };

        if (groups.length) {
            groups.forEach(renderGroup);
        }

        const ungrouped = items.filter((x) => !groupedIds.has(x.id));

        if (!groups.length && ungrouped.length > 50) {
            const scroller = document.createElement('div');
            scroller.style.position = 'relative';
            scroller.style.height = '320px';
            scroller.style.overflow = 'auto';
            scroller.style.borderRadius = '10px';
            scroller.style.border = '1px solid rgba(148, 163, 184, 0.22)';
            const spacer = document.createElement('div');
            const rowH = 46;
            spacer.style.height = `${ungrouped.length * rowH}px`;
            scroller.appendChild(spacer);
            const viewport = document.createElement('div');
            viewport.style.position = 'absolute';
            viewport.style.left = '0';
            viewport.style.right = '0';
            viewport.style.top = '0';
            scroller.appendChild(viewport);
            list.appendChild(scroller);

            const renderWindow = () => {
                const top = scroller.scrollTop;
                const start = Math.max(0, Math.floor(top / rowH) - 4);
                const end = Math.min(ungrouped.length, start + 18);
                viewport.style.transform = `translateY(${start * rowH}px)`;
                viewport.innerHTML = '';
                for (let i = start; i < end; i++) viewport.appendChild(renderLayerRow(ungrouped[i]));
            };
            scroller.addEventListener('scroll', () => requestAnimationFrame(renderWindow), { passive: true });
            renderWindow();
            return;
        }

        for (const it of ungrouped) list.appendChild(renderLayerRow(it));
        if (!ungrouped.length && !groups.length) {
            const empty = document.createElement('div');
            empty.className = 'layer-meta';
            empty.textContent = 'Sin capas';
            list.appendChild(empty);
        }
    }

    syncUIFromState() {
        if (!this.selectedId) return;
        const s = this.ensureDesignElement(this.selectedId);

        const tx = Number.isFinite(parseFloat(s.tx)) ? parseFloat(s.tx) : 0;
        const ty = Number.isFinite(parseFloat(s.ty)) ? parseFloat(s.ty) : 0;
        if (this.ui.posX) this.ui.posX.value = String(Math.round(tx));
        if (this.ui.posY) this.ui.posY.value = String(Math.round(ty));

        if (this.ui.sizeW) this.ui.sizeW.value = s.width != null ? String(Math.round(parseFloat(s.width))) : '';
        if (this.ui.sizeH) this.ui.sizeH.value = s.height != null ? String(Math.round(parseFloat(s.height))) : '';

        if (this.ui.zIndex) this.ui.zIndex.value = s.zIndex != null ? String(parseInt(s.zIndex)) : '';

        if (this.ui.opacity) this.ui.opacity.value = String(Math.round((Number.isFinite(parseFloat(s.opacity)) ? parseFloat(s.opacity) : 1) * 100));

        if (this.ui.fillType) {
            const inferred = s.fillType
                || (s.fillGradient ? 'gradient' : '')
                || (s.textureDataUrl ? 'texture' : '')
                || (s.fillColor ? 'solid' : '')
                || (this.isProbablyText(this.selectedId) ? 'none' : 'solid');
            this.ui.fillType.value = inferred;
        }
        if (this.ui.fillColor && s.fillColor) this.ui.fillColor.value = s.fillColor;
        if (this.ui.fillGradient && s.fillGradient) this.ui.fillGradient.value = s.fillGradient;
        if (this.ui.textureScale && s.textureScale != null) this.ui.textureScale.value = String(s.textureScale);
        if (this.ui.textureRepeat && s.textureRepeat) this.ui.textureRepeat.value = s.textureRepeat;

        if (this.ui.textColor && s.textColor) this.ui.textColor.value = s.textColor;
        if (this.ui.textGradient && s.textGradient) this.ui.textGradient.value = s.textGradient;

        if (this.ui.borderWidth) this.ui.borderWidth.value = s.borderWidth != null ? String(s.borderWidth) : '0';
        if (this.ui.borderColor && s.borderColor) this.ui.borderColor.value = s.borderColor;
        if (this.ui.borderStyle && s.borderStyle) this.ui.borderStyle.value = s.borderStyle;
        if (this.ui.borderRadius) this.ui.borderRadius.value = s.borderRadius != null ? String(s.borderRadius) : '0';

        if (this.ui.shadowEnabled) this.ui.shadowEnabled.checked = !!s.shadowEnabled;
        if (this.ui.shadowControls) this.ui.shadowControls.style.display = s.shadowEnabled ? 'block' : 'none';
        if (this.ui.shadowX && s.shadowX != null) this.ui.shadowX.value = String(s.shadowX);
        if (this.ui.shadowY && s.shadowY != null) this.ui.shadowY.value = String(s.shadowY);
        if (this.ui.shadowBlur && s.shadowBlur != null) this.ui.shadowBlur.value = String(s.shadowBlur);
        if (this.ui.shadowSpread && s.shadowSpread != null) this.ui.shadowSpread.value = String(s.shadowSpread);
        if (this.ui.shadowColor && s.shadowColor) this.ui.shadowColor.value = s.shadowColor;
        if (this.ui.shadowOpacity && s.shadowOpacity != null) this.ui.shadowOpacity.value = String(s.shadowOpacity);

        if (this.ui.filterBlur) this.ui.filterBlur.value = s.filterBlur != null ? String(s.filterBlur) : '0';
        if (this.ui.filterGrayscale) this.ui.filterGrayscale.value = s.filterGrayscale != null ? String(s.filterGrayscale) : '0';
        if (this.ui.mixBlendMode) this.ui.mixBlendMode.value = s.mixBlendMode || 'normal';

        this.updateFillVisibility();

        // Actualizar visibilidad de controles de texto
        const textGroup = document.getElementById('veTextControlsGroup');
        if (textGroup) {
            let isText = this.isProbablyText(this.selectedId);
            // Usar información precisa del DOM si está disponible
            if (this.lastElementInfo) {
                const info = this.lastElementInfo;
                const tag = String(info.tag || '').toLowerCase();
                const hasText = (info.text || '').trim().length > 0;
                const isImage = tag === 'img' || tag === 'video' || tag === 'svg' || tag === 'canvas';
                // Si es imagen, definitivamente no es texto (aunque tenga ID confuso)
                if (isImage) isText = false;
                // Si tiene contenido de texto, es texto
                else if (hasText) isText = true;
            }

            if (isText) {
                textGroup.classList.remove('hidden');
            } else {
                textGroup.classList.add('hidden');
            }
        }

        this.refreshSnappingUI();
    }

    updateFillVisibility() {
        const type = this.ui.fillType?.value || 'none';
        if (this.ui.fillType) this.ui.fillType.style.display = 'none';
        if (this.ui.fillSolidRow) this.ui.fillSolidRow.style.display = type === 'solid' ? 'block' : 'none';
        if (this.ui.fillGradientRow) this.ui.fillGradientRow.style.display = type === 'gradient' ? 'block' : 'none';
        if (this.ui.fillTextureRow) this.ui.fillTextureRow.style.display = type === 'texture' ? 'block' : 'none';

        const setActive = (btn, isActive) => {
            if (!btn) return;
            btn.classList.toggle('active', !!isActive);
        };

        setActive(this.ui.fillModeSolid, type === 'solid');
        setActive(this.ui.fillModeGradient, type === 'gradient');
        setActive(this.ui.fillModeTexture, type === 'texture');
        setActive(this.ui.fillModeNone, type === 'none');
    }

    isProbablyText(id) {
        if (!id) return false;
        const s = String(id);
        if (s === 'rsvpButton') return true;
        if (s.endsWith('Title')) return true;
        if (s.endsWith('Name')) return true;
        if (s.endsWith('Message')) return true;
        if (s.toLowerCase().includes('text')) return true;
        if (s.toLowerCase().includes('hashtag')) return true;
        if (s.toLowerCase().includes('date')) return true;
        if (s.toLowerCase().includes('time')) return true;
        if (s.toLowerCase().includes('location')) return true;
        if (s.toLowerCase().includes('address')) return true;
        return false;
    }

    mountAdvancedVisualTools() {
        const unifiedMount = document.getElementById('veUnifiedVisualMount');
        const globalMount = document.getElementById('globalStylePanel');
        const effectsMount = document.getElementById('effectsTabMount');
        if (!unifiedMount && !globalMount && !effectsMount) return;

        const gradientTarget = document.getElementById('gradientTarget');
        const textureGallery = document.getElementById('texture-gallery');
        const primaryColor = document.getElementById('primaryColor');
        const titleFont = document.getElementById('titleFont');
        const showMainContainer = document.getElementById('showMainContainer');
        const overlayOpacity = document.getElementById('overlayOpacity');
        const typographyBorder = document.getElementById('textBorderEnabled');
        const typographyShadow = document.getElementById('textShadowEnabled');

        const gradientSection = gradientTarget?.closest('.design-section');
        const textureSection = textureGallery?.closest('.design-section');
        const colorsSection = primaryColor?.closest('.design-section');
        const typographySection = titleFont?.closest('.design-section');
        const contentStylesSection = showMainContainer?.closest('.design-section');

        const moveSection = (section, to) => {
            if (!section || !to) return;
            if (!to.contains(section)) to.appendChild(section);
        };

        const moveControlGroup = (el, to) => {
            if (!el || !to) return;
            const group = el.closest('.control-group');
            if (!group) return;
            if (!to.contains(group)) to.appendChild(group);
        };

        if (globalMount) {
            moveSection(colorsSection, globalMount);
            moveSection(contentStylesSection, globalMount);
            if (this.editor && typeof this.editor.setupInputListeners === 'function') {
                this.editor.setupInputListeners('globalStylePanel');
            }
        }

        if (unifiedMount) {
            if (gradientSection) {
                const targetGroup = gradientTarget?.closest('.control-group');
                if (targetGroup) targetGroup.style.display = 'none';
                moveSection(gradientSection, unifiedMount);
            }
            moveSection(textureSection, unifiedMount);
        }

        if (effectsMount) {
            moveControlGroup(overlayOpacity, effectsMount);
            moveControlGroup(typographyBorder, effectsMount);
            moveControlGroup(typographyShadow, effectsMount);

            const veOpacity = document.getElementById('veOpacity');
            const veShadowEnabled = document.getElementById('veShadowEnabled');
            const veFilterBlur = document.getElementById('veFilterBlur');
            const typographyTarget = document.getElementById('typographyTarget');

            moveControlGroup(veOpacity, effectsMount);
            moveControlGroup(veShadowEnabled, effectsMount);
            moveControlGroup(veFilterBlur, effectsMount);

            const typographyTargetGroup = typographyTarget?.closest('.control-group');
            if (typographyTargetGroup) typographyTargetGroup.style.display = 'none';
        }

        this.applyRightSidebarTooltips();
    }

    applyRightSidebarTooltips() {
        const panel = document.getElementById('visualEditorPanel');
        if (!panel) return;

        const help = {
            veSelectedId: 'Identificador del elemento actualmente seleccionado (solo lectura).',
            veSnappingEnabled: 'Ajusta el arrastre a una cuadrícula. Mantén Alt para desactivar temporalmente.',
            vePosX: 'Posición horizontal del elemento (px).',
            vePosY: 'Posición vertical del elemento (px).',
            veSizeW: 'Ancho del elemento (px).',
            veSizeH: 'Alto del elemento (px).',
            veZIndex: 'Orden de apilado: valores mayores se muestran por encima.',
            veZUp: 'Sube el elemento una capa (aumenta z-index).',
            veZDown: 'Baja el elemento una capa (disminuye z-index).',
            veOpacity: 'Transparencia del elemento.',
            veFillModeSolid: 'Aplica un color sólido como fondo del elemento seleccionado.',
            veFillModeGradient: 'Aplica un degradado como fondo del elemento seleccionado.',
            veFillModeTexture: 'Aplica una textura como fondo del elemento seleccionado.',
            veFillModeNone: 'Quita el relleno/fondo del elemento seleccionado.',
            veFillColor: 'Color de relleno del elemento seleccionado.',
            veFillGradient: 'CSS del degradado (ej. linear-gradient(...)).',
            veUseAdvancedGradient: 'Usa el editor avanzado de degradados y aplica el resultado.',
            veClearFill: 'Elimina el relleno configurado del elemento.',
            veTexturePreset: 'Elige una textura predefinida para el fondo del elemento.',
            veTextureScale: 'Escala de la textura (tamaño del patrón).',
            veTextureRepeat: 'Modo de repetición de la textura.',
            veTextColor: 'Color del texto del elemento seleccionado.',
            veTextGradient: 'Degradado del texto (CSS).',
            veUseAdvancedTextGradient: 'Genera un degradado de texto usando el editor avanzado.',
            veBorderWidth: 'Grosor del borde (px).',
            veBorderColor: 'Color del borde.',
            veBorderStyle: 'Estilo del borde.',
            veBorderRadius: 'Radio de borde (px).',
            veShadowEnabled: 'Activa/desactiva la sombra del elemento.',
            veShadowX: 'Desplazamiento horizontal de la sombra (px).',
            veShadowY: 'Desplazamiento vertical de la sombra (px).',
            veShadowBlur: 'Desenfoque de la sombra (px).',
            veShadowSpread: 'Expansión/contracción de la sombra (px).',
            veShadowColor: 'Color de la sombra.',
            veShadowOpacity: 'Opacidad de la sombra.',
            veFilterBlur: 'Desenfoque del elemento (px).',
            veFilterGrayscale: 'Escala de grises del elemento (%).',
            veHide: 'Oculta el elemento (no se elimina, solo se oculta).',
            veShow: 'Vuelve a mostrar un elemento oculto.'
        };

        const setIfEmpty = (el, value) => {
            if (!el) return;
            const cur = (el.getAttribute('title') || '').trim();
            if (cur) return;
            if (!value) return;
            el.setAttribute('title', value);
        };

        setIfEmpty(document.getElementById('veNoSelection'), 'Selecciona un elemento en la invitación para editar su estilo.');

        const interactive = panel.querySelectorAll('input, select, textarea, button');
        for (const el of interactive) {
            const id = el.id;
            if (id && help[id]) {
                setIfEmpty(el, help[id]);
                continue;
            }

            const group = el.closest('.control-group');
            const label = group?.querySelector('.control-label');
            const labelText = (label?.textContent || '').replace(/\s+/g, ' ').trim();
            if (labelText) {
                setIfEmpty(el, labelText);
            }
        }

        const colorPresets = panel.querySelectorAll('.color-preset');
        for (const el of colorPresets) {
            setIfEmpty(el, 'Aplica este tema de color (principal y secundario).');
        }

        const gradientPresets = panel.querySelectorAll('.gradient-preset-item');
        for (const el of gradientPresets) {
            const name = el.querySelector('.gradient-preset-name')?.textContent?.trim();
            setIfEmpty(el, name ? `Cargar preset de degradado: ${name}` : 'Cargar preset de degradado.');
        }

        const textureItems = panel.querySelectorAll('.texture-item');
        for (const el of textureItems) {
            const name = el.querySelector('.texture-item-name')?.textContent?.trim();
            setIfEmpty(el, name ? `Aplicar textura: ${name}` : 'Aplicar textura.');
        }

        const effectCards = panel.querySelectorAll('.effect-card');
        for (const el of effectCards) {
            const name = el.querySelector('.effect-card-name')?.textContent?.trim();
            setIfEmpty(el, name ? `Activar efecto: ${name}` : 'Activar efecto.');
        }

        const uploadAreas = panel.querySelectorAll('.upload-area');
        for (const el of uploadAreas) {
            setIfEmpty(el, 'Subir textura personalizada.');
        }
    }

    applyFromUI(keys) {
        if (!this.selectedId) return;

        const patch = {};
        if (keys.includes('tx')) patch.tx = parseFloat(this.ui.posX.value || '0');
        if (keys.includes('ty')) patch.ty = parseFloat(this.ui.posY.value || '0');
        if (keys.includes('width')) patch.width = parseFloat(this.ui.sizeW.value || '0');
        if (keys.includes('height')) patch.height = parseFloat(this.ui.sizeH.value || '0');
        if (keys.includes('zIndex')) patch.zIndex = parseInt(this.ui.zIndex.value || '0', 10);

        if (keys.includes('border')) {
            patch.borderWidth = parseFloat(this.ui.borderWidth.value || '0');
            patch.borderColor = this.ui.borderColor.value;
            patch.borderStyle = this.ui.borderStyle.value;
        }

        if (keys.includes('borderRadius')) patch.borderRadius = parseFloat(this.ui.borderRadius.value || '0');

        this.updateDesignElement(this.selectedId, patch, { sendToIframe: true, historyKey: keys.join(',') });
    }

    populateTexturePresets() {
        if (!this.ui.texturePreset) return;
        const presets = window.designAdvancedIntegrator?.textureManager?.presetTextures || {};
        const keys = Object.keys(presets);
        this.ui.texturePreset.innerHTML = '';
        if (!keys.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Sin texturas';
            this.ui.texturePreset.appendChild(opt);
            return;
        }
        keys.forEach((k) => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = presets[k]?.name || k;
            this.ui.texturePreset.appendChild(opt);
        });
    }

    getTextureDataUrl(key) {
        const presets = window.designAdvancedIntegrator?.textureManager?.presetTextures || {};
        const preset = presets[key];
        return preset?.pattern || '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tryInit = () => {
        const editor = window.invitationEditor;
        const iframe = document.getElementById('previewFrame');
        if (!editor || !editor.data || !iframe) return false;

        if (!editor.data.designElements) editor.data.designElements = {};
        if (!editor.data.editorSettings) editor.data.editorSettings = { snappingEnabled: true };

        window.visualEditorHost = new VisualEditorHost(editor, iframe);
        window.visualEditorHost.init();

        const originalLoadData = editor.loadData.bind(editor);
        editor.loadData = (newData) => {
            originalLoadData(newData);
            window.visualEditorHost.refreshSnappingUI();
            window.visualEditorHost.syncUIFromState();
            window.visualEditorHost.refreshLayersList();
        };
        return true;
    };

    if (tryInit()) return;
    let attempts = 0;
    const t = setInterval(() => {
        attempts += 1;
        if (tryInit() || attempts > 30) clearInterval(t);
    }, 100);
});

