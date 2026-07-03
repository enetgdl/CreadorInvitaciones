(() => {
    console.log('[RUNTIME] Script executing. __INVITATION_EDITOR__:', !!window.__INVITATION_EDITOR__, 'has parent:', window.parent !== window);
    if (!window.__INVITATION_EDITOR__) {
        console.warn('[RUNTIME] Not in editor mode, aborting');
        return;
    }
    if (!window.parent || window.parent === window) {
        console.warn('[RUNTIME] No parent window, aborting');
        return;
    }

    const cssEscape = (value) => {
        if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
        return String(value).replace(/["\\]/g, '\\$&');
    };

    const STATE = {
        selectedId: null,
        selectedEl: null,
        overlay: null,
        box: null,
        handles: new Map(),
        raf: 0,
        snappingEnabled: true,
        drag: null,
        guides: { v: null, h: null },
        lastRect: null,
        resizeObserver: null,
        mutationObserver: null,
        elementMutationObserver: null, // Observer for selected element's attributes
        // Text editing state
        editingElement: null,
        editingInput: null
    };

    const postToParent = (payload) => {
        try {
            window.parent.postMessage({ source: 'invitation-editor', ...payload }, '*');
        } catch (_) { }
    };

    const createOverlay = () => {
        const overlay = document.createElement('div');
        overlay.className = 'editor-selection-overlay';

        const box = document.createElement('div');
        box.className = 'editor-selection-box';
        overlay.appendChild(box);

        const guideV = document.createElement('div');
        guideV.style.position = 'absolute';
        guideV.style.top = '0';
        guideV.style.bottom = '0';
        guideV.style.width = '1px';
        guideV.style.background = 'rgba(139, 92, 246, 0.9)';
        guideV.style.display = 'none';
        overlay.appendChild(guideV);

        const guideH = document.createElement('div');
        guideH.style.position = 'absolute';
        guideH.style.left = '0';
        guideH.style.right = '0';
        guideH.style.height = '1px';
        guideH.style.background = 'rgba(139, 92, 246, 0.9)';
        guideH.style.display = 'none';
        overlay.appendChild(guideH);

        const handleNames = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        handleNames.forEach((name) => {
            const h = document.createElement('div');
            h.className = 'editor-selection-handle';
            h.dataset.handle = name;
            box.appendChild(h);
            STATE.handles.set(name, h);
        });

        document.body.appendChild(overlay);
        STATE.overlay = overlay;
        STATE.box = box;
        STATE.guides.v = guideV;
        STATE.guides.h = guideH;
        hideSelection();
    };

    const hideSelection = () => {
        if (!STATE.box) return;
        STATE.box.style.display = 'none';
        STATE.selectedEl = null;
        STATE.selectedId = null;
        STATE.lastRect = null;
        if (STATE.resizeObserver) {
            try { STATE.resizeObserver.disconnect(); } catch (_) { }
            STATE.resizeObserver = null;
        }
        if (STATE.elementMutationObserver) {
            try { STATE.elementMutationObserver.disconnect(); } catch (_) { }
            STATE.elementMutationObserver = null;
        }
        hideGuides();
    };

    const hideGuides = () => {
        if (STATE.guides.v) STATE.guides.v.style.display = 'none';
        if (STATE.guides.h) STATE.guides.h.style.display = 'none';
    };

    const scheduleUpdate = () => {
        if (STATE.raf) return;
        STATE.raf = window.requestAnimationFrame(() => {
            STATE.raf = 0;
            updateSelectionBox();
        });
    };

    const parseTranslateFromTransform = (transform) => {
        if (!transform || transform === 'none') return { tx: 0, ty: 0 };
        const m3 = transform.match(/^matrix3d\((.+)\)$/);
        if (m3) {
            const parts = m3[1].split(',').map(v => parseFloat(v.trim()));
            const tx = Number.isFinite(parts[12]) ? parts[12] : 0;
            const ty = Number.isFinite(parts[13]) ? parts[13] : 0;
            return { tx, ty };
        }
        const m2 = transform.match(/^matrix\((.+)\)$/);
        if (m2) {
            const parts = m2[1].split(',').map(v => parseFloat(v.trim()));
            const tx = Number.isFinite(parts[4]) ? parts[4] : 0;
            const ty = Number.isFinite(parts[5]) ? parts[5] : 0;
            return { tx, ty };
        }
        return { tx: 0, ty: 0 };
    };

    const ensureSelectedElement = () => {
        if (STATE.selectedEl && STATE.selectedEl.isConnected) return true;
        if (!STATE.selectedId) return false;
        const el = document.querySelector(`[data-editor-id="${cssEscape(STATE.selectedId)}"]`);
        if (!el) return false;
        STATE.selectedEl = el;
        attachObserversToSelection();
        return true;
    };

    const pointToRectEdgeDistance = (x, y, rect) => {
        if (!rect) return Infinity;
        const left = rect.left;
        const right = rect.right;
        const top = rect.top;
        const bottom = rect.bottom;
        const insideX = x >= left && x <= right;
        const insideY = y >= top && y <= bottom;
        if (!insideX || !insideY) {
            const dx = x < left ? (left - x) : (x > right ? (x - right) : 0);
            const dy = y < top ? (top - y) : (y > bottom ? (y - bottom) : 0);
            return Math.hypot(dx, dy);
        }
        const dLeft = Math.abs(x - left);
        const dRight = Math.abs(right - x);
        const dTop = Math.abs(y - top);
        const dBottom = Math.abs(bottom - y);
        return Math.min(dLeft, dRight, dTop, dBottom);
    };

    const pickElementAtPoint = (clientX, clientY) => {
        const stack = typeof document.elementsFromPoint === 'function'
            ? document.elementsFromPoint(clientX, clientY)
            : [document.elementFromPoint(clientX, clientY)].filter(Boolean);

        const candidates = [];
        for (const node of stack) {
            if (!node || !node.closest) continue;
            if (node.closest('.editor-selection-overlay')) continue;
            const el = node.closest('[data-editor-id]');
            if (!el) continue;
            if (el.getAttribute('data-editor-locked') === 'true') continue;
            candidates.push(el);
        }

        const uniq = Array.from(new Set(candidates));
        if (uniq.length) {
            const edgeThreshold = 10;
            const edgeCandidates = [];

            for (const el of uniq) {
                const r = el.getBoundingClientRect();
                if (!r || r.width < 1 || r.height < 1) continue;
                const d = pointToRectEdgeDistance(clientX, clientY, r);
                if (d <= edgeThreshold) edgeCandidates.push({ el, rect: r });
            }

            const pool = edgeCandidates.length ? edgeCandidates : uniq.map((el) => ({ el, rect: el.getBoundingClientRect() }));
            let best = null;
            let bestArea = Infinity;

            for (const item of pool) {
                const r = item.rect;
                if (!r || r.width < 1 || r.height < 1) continue;
                const area = r.width * r.height;
                if (area < bestArea) {
                    bestArea = area;
                    best = item.el;
                }
            }

            return best;
        }

        const all = Array.from(document.querySelectorAll('[data-editor-id]'));
        let best = null;
        let bestD = Infinity;
        const threshold = 14;
        for (const el of all) {
            if (!el || el.closest('.editor-selection-overlay')) continue;
            if (el.getAttribute('data-editor-locked') === 'true') continue;
            const r = el.getBoundingClientRect();
            if (!r || r.width < 1 || r.height < 1) continue;
            const d = pointToRectEdgeDistance(clientX, clientY, r);
            if (d < bestD) {
                bestD = d;
                best = el;
            }
        }
        if (best && bestD <= threshold) return best;
        return null;
    };

    const attachObserversToSelection = () => {
        if (!STATE.selectedEl) return;

        // Disconnect existing observers
        if (STATE.resizeObserver) {
            try { STATE.resizeObserver.disconnect(); } catch (_) { }
            STATE.resizeObserver = null;
        }
        if (STATE.elementMutationObserver) {
            try { STATE.elementMutationObserver.disconnect(); } catch (_) { }
            STATE.elementMutationObserver = null;
        }

        // Observe size changes
        if (window.ResizeObserver) {
            STATE.resizeObserver = new ResizeObserver(() => scheduleUpdate());
            try { STATE.resizeObserver.observe(STATE.selectedEl); } catch (_) { }
        }

        // Observe attribute changes (style, transform, etc.)
        if (window.MutationObserver) {
            STATE.elementMutationObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes') {
                        // Update on style or transform changes
                        if (mutation.attributeName === 'style' ||
                            mutation.attributeName === 'class' ||
                            mutation.attributeName.startsWith('data-editor')) {
                            scheduleUpdate();
                            break;
                        }
                    }
                }
            });
            try {
                STATE.elementMutationObserver.observe(STATE.selectedEl, {
                    attributes: true,
                    attributeFilter: ['style', 'class', 'data-editor-tx', 'data-editor-ty']
                });
            } catch (_) { }
        }
    };

    const updateSelectionBox = () => {
        if (!STATE.box) return;
        if (!ensureSelectedElement()) {
            if (STATE.lastRect) {
                STATE.box.classList.add('editor-selection-box-lost');
                STATE.box.style.display = 'block';
                STATE.box.style.top = `${STATE.lastRect.top}px`;
                STATE.box.style.left = `${STATE.lastRect.left}px`;
                STATE.box.style.width = `${STATE.lastRect.width}px`;
                STATE.box.style.height = `${STATE.lastRect.height}px`;
            } else {
                STATE.box.style.display = 'none';
            }
            return;
        }

        const rect = STATE.selectedEl.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) {
            if (STATE.lastRect) {
                STATE.box.classList.add('editor-selection-box-lost');
                STATE.box.style.display = 'block';
                STATE.box.style.top = `${STATE.lastRect.top}px`;
                STATE.box.style.left = `${STATE.lastRect.left}px`;
                STATE.box.style.width = `${STATE.lastRect.width}px`;
                STATE.box.style.height = `${STATE.lastRect.height}px`;
            } else {
                STATE.box.style.display = 'none';
            }
            return;
        }

        // Round to prevent sub-pixel rendering issues that cause misalignment
        const top = Math.round(rect.top);
        const left = Math.round(rect.left);
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);

        STATE.lastRect = { top, left, width, height };

        STATE.box.style.display = 'block';
        STATE.box.style.top = `${top}px`;
        STATE.box.style.left = `${left}px`;
        STATE.box.style.width = `${width}px`;
        STATE.box.style.height = `${height}px`;
        STATE.box.classList.remove('editor-selection-box-lost');

        const setHandle = (name, x, y) => {
            const h = STATE.handles.get(name);
            if (!h) return;
            // Round handle positions for crisp rendering
            h.style.left = `${Math.round(x)}px`;
            h.style.top = `${Math.round(y)}px`;
        };

        setHandle('nw', 0, 0);
        setHandle('n', width / 2, 0);
        setHandle('ne', width, 0);
        setHandle('e', width, height / 2);
        setHandle('se', width, height);
        setHandle('s', width / 2, height);
        setHandle('sw', 0, height);
        setHandle('w', 0, height / 2);
    };

    const getTxTy = (el) => {
        const hasTx = Object.prototype.hasOwnProperty.call(el.dataset, 'editorTx');
        const hasTy = Object.prototype.hasOwnProperty.call(el.dataset, 'editorTy');
        if (!hasTx && !hasTy) {
            const computed = window.getComputedStyle(el);
            const { tx, ty } = parseTranslateFromTransform(computed.transform);
            return { tx, ty };
        }
        const tx = parseFloat(el.dataset.editorTx || '0') || 0;
        const ty = parseFloat(el.dataset.editorTy || '0') || 0;
        return { tx, ty };
    };

    const applyTransform = (el, tx, ty) => {
        el.dataset.editorTx = String(tx);
        el.dataset.editorTy = String(ty);
        if ('translate' in el.style) {
            el.style.setProperty('translate', `${tx}px ${ty}px`, 'important');
        } else {
            el.style.setProperty('transform', `translate(${tx}px, ${ty}px)`, 'important');
        }
    };

    const applySize = (el, w, h) => {
        if (typeof w === 'number' && Number.isFinite(w)) el.style.setProperty('width', `${Math.max(1, w)}px`, 'important');
        if (typeof h === 'number' && Number.isFinite(h)) el.style.setProperty('height', `${Math.max(1, h)}px`, 'important');
    };

    const getOtherRects = (selectedEl) => {
        const nodes = Array.from(document.querySelectorAll('[data-editor-id]'));
        return nodes
            .filter((n) => n !== selectedEl && n.offsetParent !== null)
            .map((n) => n.getBoundingClientRect())
            .filter((r) => r.width > 0 && r.height > 0);
    };

    const computeSnap = (rect, otherRects, threshold = 6) => {
        let bestDx = 0;
        let bestDy = 0;
        let bestDxAbs = threshold + 1;
        let bestDyAbs = threshold + 1;
        let guideX = null;
        let guideY = null;

        const rx = [rect.left, rect.left + rect.width / 2, rect.right];
        const ry = [rect.top, rect.top + rect.height / 2, rect.bottom];

        for (const o of otherRects) {
            const ox = [o.left, o.left + o.width / 2, o.right];
            const oy = [o.top, o.top + o.height / 2, o.bottom];

            for (const a of rx) {
                for (const b of ox) {
                    const d = b - a;
                    const ad = Math.abs(d);
                    if (ad < bestDxAbs) {
                        bestDxAbs = ad;
                        bestDx = d;
                        guideX = b;
                    }
                }
            }

            for (const a of ry) {
                for (const b of oy) {
                    const d = b - a;
                    const ad = Math.abs(d);
                    if (ad < bestDyAbs) {
                        bestDyAbs = ad;
                        bestDy = d;
                        guideY = b;
                    }
                }
            }
        }

        if (bestDxAbs > threshold) {
            bestDx = 0;
            guideX = null;
        }
        if (bestDyAbs > threshold) {
            bestDy = 0;
            guideY = null;
        }

        return { dx: bestDx, dy: bestDy, guideX, guideY };
    };

    const showGuides = (guideX, guideY) => {
        if (STATE.guides.v && guideX != null) {
            STATE.guides.v.style.left = `${guideX}px`;
            STATE.guides.v.style.display = 'block';
        } else if (STATE.guides.v) {
            STATE.guides.v.style.display = 'none';
        }

        if (STATE.guides.h && guideY != null) {
            STATE.guides.h.style.top = `${guideY}px`;
            STATE.guides.h.style.display = 'block';
        } else if (STATE.guides.h) {
            STATE.guides.h.style.display = 'none';
        }
    };

    const selectElement = (el) => {
        if (!el) return;
        const id = el.getAttribute('data-editor-id');
        if (!id) return;

        STATE.selectedEl = el;
        STATE.selectedId = id;
        attachObserversToSelection();
        scheduleUpdate();
        postToParent({ type: 'select', id });
    };

    const startMove = (e) => {
        if (!STATE.selectedEl) return;
        const { tx, ty } = getTxTy(STATE.selectedEl);
        const rect = STATE.selectedEl.getBoundingClientRect();
        STATE.drag = {
            mode: 'move',
            pointerId: e.pointerId,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startTx: tx,
            startTy: ty,
            startRect: rect,
            otherRects: STATE.snappingEnabled ? getOtherRects(STATE.selectedEl) : [],
            moved: false
        };

        try { STATE.selectedEl.setPointerCapture(e.pointerId); } catch (_) { }
    };

    const startResize = (e, handle) => {
        if (!STATE.selectedEl) return;
        const { tx, ty } = getTxTy(STATE.selectedEl);
        const rect = STATE.selectedEl.getBoundingClientRect();
        const computed = window.getComputedStyle(STATE.selectedEl);
        STATE.drag = {
            mode: 'resize',
            handle,
            pointerId: e.pointerId,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startTx: tx,
            startTy: ty,
            startRect: rect,
            startWidth: rect.width,
            startHeight: rect.height,
            wasInline: computed.display === 'inline'
        };

        try { STATE.selectedEl.setPointerCapture(e.pointerId); } catch (_) { }
    };

    const onPointerDown = (e) => {
        const target = e.target;
        if (!target) return;

        // If text editing is active, check if click is outside textarea
        if (STATE.editingInput && STATE.editingElement) {
            // Check if the click is on the textarea itself
            if (target === STATE.editingInput) {
                // Allow interaction with textarea
                return;
            }

            // Check if click is on selection box or handles (allow these)
            if (target.closest('.editor-selection-overlay')) {
                // Click on selection box - finish editing first
                finishTextEditing();
                // Then continue with normal selection logic
            } else {
                // Click outside - finish editing
                finishTextEditing();
            }
        }

        const handleEl = target.closest('.editor-selection-handle');
        if (handleEl && STATE.selectedEl) {
            e.preventDefault();
            startResize(e, handleEl.dataset.handle);
            return;
        }

        if (target.closest('.editor-selection-overlay')) return;

        const el = pickElementAtPoint(e.clientX, e.clientY);
        if (!el) {
            if (STATE.selectedId) {
                hideSelection();
                postToParent({ type: 'clearSelection' });
            }
            return;
        }

        selectElement(el);
        e.preventDefault();
        startMove(e);
    };

    const onPointerMove = (e) => {
        if (!STATE.drag || !STATE.selectedEl) return;
        if (e.pointerId !== STATE.drag.pointerId) return;

        const dx = e.clientX - STATE.drag.startClientX;
        const dy = e.clientY - STATE.drag.startClientY;

        if (STATE.drag.mode === 'move') {
            if (!STATE.drag.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
                STATE.drag.moved = true;
            }

            let nextTx = STATE.drag.startTx + dx;
            let nextTy = STATE.drag.startTy + dy;

            if (STATE.snappingEnabled && !e.altKey) {
                const rect = {
                    left: STATE.drag.startRect.left + dx,
                    top: STATE.drag.startRect.top + dy,
                    width: STATE.drag.startRect.width,
                    height: STATE.drag.startRect.height,
                    right: STATE.drag.startRect.left + dx + STATE.drag.startRect.width,
                    bottom: STATE.drag.startRect.top + dy + STATE.drag.startRect.height
                };
                const snap = computeSnap(rect, STATE.drag.otherRects);
                nextTx += snap.dx;
                nextTy += snap.dy;
                showGuides(snap.guideX, snap.guideY);
            } else {
                hideGuides();
            }

            applyTransform(STATE.selectedEl, nextTx, nextTy);
            scheduleUpdate();
        }

        if (STATE.drag.mode === 'resize') {
            hideGuides();

            const start = STATE.drag.startRect;
            let left = start.left;
            let top = start.top;
            let width = start.width;
            let height = start.height;

            const h = STATE.drag.handle;
            const isCorner = h.length === 2;
            const lockAspect = isCorner && !e.shiftKey;

            if (!isCorner) {
                if (h.includes('e')) width = start.width + dx;
                if (h.includes('w')) width = start.width - dx;
                if (h.includes('s')) height = start.height + dy;
                if (h.includes('n')) height = start.height - dy;

                width = Math.max(10, width);
                height = Math.max(10, height);

                if (h.includes('w')) left = start.right - width;
                if (h.includes('n')) top = start.bottom - height;
            } else {
                const sx = h.includes('w') ? -1 : 1;
                const sy = h.includes('n') ? -1 : 1;
                let nextW = start.width + (sx * dx);
                let nextH = start.height + (sy * dy);

                nextW = Math.max(10, nextW);
                nextH = Math.max(10, nextH);

                if (lockAspect) {
                    const ratio = STATE.drag.startWidth / STATE.drag.startHeight || 1;
                    const scaleW = nextW / (STATE.drag.startWidth || 1);
                    const scaleH = nextH / (STATE.drag.startHeight || 1);
                    const scale = Math.max(scaleW, scaleH);
                    nextW = Math.max(10, (STATE.drag.startWidth || 10) * scale);
                    nextH = Math.max(10, nextW / ratio);
                }

                width = nextW;
                height = nextH;

                left = h.includes('w') ? (start.right - width) : start.left;
                top = h.includes('n') ? (start.bottom - height) : start.top;
            }

            const newTx = STATE.drag.startTx + (left - start.left);
            const newTy = STATE.drag.startTy + (top - start.top);

            if (STATE.drag.wasInline) {
                STATE.selectedEl.style.setProperty('display', 'inline-block', 'important');
            }
            applyTransform(STATE.selectedEl, newTx, newTy);
            applySize(STATE.selectedEl, width, height);
            scheduleUpdate();
        }
    };

    const onPointerUp = (e) => {
        if (!STATE.drag || !STATE.selectedEl) return;
        if (e.pointerId !== STATE.drag.pointerId) return;

        const { tx, ty } = getTxTy(STATE.selectedEl);
        const rect = STATE.selectedEl.getBoundingClientRect();

        // Only valid if something actually changed
        if (tx !== STATE.drag.startTx || ty !== STATE.drag.startTy ||
            rect.width !== STATE.drag.startWidth || rect.height !== STATE.drag.startHeight) {

            const patch = { tx, ty, width: rect.width, height: rect.height };
            const oldPatch = {
                tx: STATE.drag.startTx,
                ty: STATE.drag.startTy,
                width: STATE.drag.startWidth,
                height: STATE.drag.startHeight
            };

            postToParent({ type: 'commitTransform', id: STATE.selectedId, patch, oldPatch });
        }

        STATE.drag = null;
        hideGuides();
    };

    const onKeyDown = (e) => {
        // Handle escape during text editing
        if (e.key === 'Escape') {
            if (STATE.editingElement) {
                cancelTextEditing();
                return;
            }
            hideSelection();
            postToParent({ type: 'clearSelection' });
        }
    };

    /**
     * Start inline text editing
     */
    const startTextEditing = (element, selectAll = false) => {
        if (!element) return;

        // Cancel any existing editing session
        if (STATE.editingElement) {
            finishTextEditing();
        }

        // Don't allow editing during drag
        if (STATE.drag) return;

        const currentText = element.textContent || '';
        const computed = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Create input element
        const input = document.createElement('textarea');
        input.value = currentText;
        input.className = 'inline-text-editor';

        // Copy styles from original element to make it seamless
        input.style.position = 'absolute';
        input.style.left = rect.left + 'px';
        input.style.top = rect.top + 'px';
        input.style.width = Math.max(rect.width, 100) + 'px';
        input.style.minHeight = rect.height + 'px';
        input.style.fontSize = computed.fontSize;
        input.style.fontFamily = computed.fontFamily;
        input.style.fontWeight = computed.fontWeight;
        input.style.fontStyle = computed.fontStyle;
        input.style.color = computed.color;
        input.style.textAlign = computed.textAlign;
        input.style.lineHeight = computed.lineHeight;
        input.style.letterSpacing = computed.letterSpacing;
        input.style.textTransform = computed.textTransform;
        input.style.padding = '0';
        input.style.margin = '0';

        // Make completely transparent - no visual elements
        input.style.border = 'none';
        input.style.borderRadius = '0';
        input.style.background = 'transparent';
        input.style.outline = 'none';
        input.style.resize = 'none';
        input.style.zIndex = '9999';
        input.style.boxShadow = 'none';
        input.style.overflow = 'hidden';

        // Hide original element
        element.style.visibility = 'hidden';

        // Add to DOM
        document.body.appendChild(input);

        // Store state
        STATE.editingElement = element;
        STATE.editingInput = input;

        // Focus and select
        input.focus();
        if (selectAll) {
            input.select();
        } else {
            // Move cursor to end
            input.setSelectionRange(input.value.length, input.value.length);
        }

        // Event handlers
        input.addEventListener('keydown', onEditingKeyDown);
        input.addEventListener('blur', onEditingBlur);
        input.addEventListener('input', onEditingInput);

        // Keep selection box visible and update it dynamically
        if (STATE.box) {
            STATE.box.style.display = 'block';
            updateSelectionBoxFromTextarea();
        }

        // Select the element to show selection box
        if (!STATE.selectedEl || STATE.selectedEl !== element) {
            selectElement(element);
        }
    };

    /**
     * Update selection box size based on textarea content
     */
    const updateSelectionBoxFromTextarea = () => {
        if (!STATE.editingInput || !STATE.box) return;

        const input = STATE.editingInput;

        // Create temporary element to measure text size
        const measurer = document.createElement('div');
        measurer.style.position = 'absolute';
        measurer.style.visibility = 'hidden';
        measurer.style.whiteSpace = 'pre-wrap';
        measurer.style.fontSize = input.style.fontSize;
        measurer.style.fontFamily = input.style.fontFamily;
        measurer.style.fontWeight = input.style.fontWeight;
        measurer.style.fontStyle = input.style.fontStyle;
        measurer.style.lineHeight = input.style.lineHeight;
        measurer.style.letterSpacing = input.style.letterSpacing;
        measurer.style.width = input.style.width;
        measurer.textContent = input.value || ' '; // At least one space for empty

        document.body.appendChild(measurer);
        const measuredHeight = measurer.offsetHeight;
        const measuredWidth = measurer.offsetWidth;
        document.body.removeChild(measurer);

        // Update textarea size
        input.style.height = Math.max(measuredHeight, 20) + 'px';
        input.style.width = Math.max(measuredWidth, 100) + 'px';

        // Update selection box to match
        scheduleUpdate();
    };

    /**
     * Handle input during text editing (for dynamic resize)
     */
    const onEditingInput = () => {
        updateSelectionBoxFromTextarea();
    };

    /**
     * Handle keydown during text editing
     */
    const onEditingKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishTextEditing();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelTextEditing();
        }
        // Shift+Enter allows multi-line
    };

    /**
     * Handle blur during text editing
     */
    const onEditingBlur = () => {
        // Small delay to allow clicks on other elements to register
        setTimeout(() => {
            if (STATE.editingElement) {
                finishTextEditing();
            }
        }, 100);
    };

    /**
     * Finish text editing and save changes
     */
    const finishTextEditing = () => {
        if (!STATE.editingElement || !STATE.editingInput) return;

        const newText = STATE.editingInput.value.trim();
        const element = STATE.editingElement;

        // Update element text
        if (newText) {
            element.textContent = newText;
        } else {
            element.textContent = 'Texto'; // Fallback if empty
        }

        // Cleanup
        cleanupTextEditing();

        // Notify parent of change
        const id = element.getAttribute('data-editor-id');
        if (id) {
            postToParent({
                type: 'textEdited',
                id: id,
                text: element.textContent
            });
        }

        // Restore selection box
        if (STATE.selectedEl === element) {
            scheduleUpdate();
        }
    };

    /**
     * Cancel text editing without saving
     */
    const cancelTextEditing = () => {
        if (!STATE.editingElement) return;

        cleanupTextEditing();

        // Restore selection box
        if (STATE.selectedEl) {
            scheduleUpdate();
        }
    };

    /**
     * Cleanup text editing state
     */
    const cleanupTextEditing = () => {
        if (STATE.editingInput) {
            STATE.editingInput.removeEventListener('keydown', onEditingKeyDown);
            STATE.editingInput.removeEventListener('blur', onEditingBlur);
            STATE.editingInput.removeEventListener('input', onEditingInput);
            if (STATE.editingInput.parentNode) {
                STATE.editingInput.parentNode.removeChild(STATE.editingInput);
            }
            STATE.editingInput = null;
        }

        if (STATE.editingElement) {
            STATE.editingElement.style.visibility = '';
            STATE.editingElement = null;
        }
    };

    /**
     * Check if element is a text element that can be edited
     */
    const isTextElement = (el) => {
        if (!el) return false;
        const tagName = el.tagName.toLowerCase();
        return tagName === 'div' || tagName === 'p' || tagName === 'span' ||
            tagName === 'h1' || tagName === 'h2' || tagName === 'h3' ||
            tagName === 'h4' || tagName === 'h5' || tagName === 'h6';
    };

    const hexToRgba = (hex, alpha) => {
        let r = 0, g = 0, b = 0;
        if (hex) {
            const h = String(hex).trim();
            if (h.length === 4) {
                r = parseInt(h[1] + h[1], 16);
                g = parseInt(h[2] + h[2], 16);
                b = parseInt(h[3] + h[3], 16);
            } else if (h.length === 7) {
                r = parseInt(h.substring(1, 3), 16);
                g = parseInt(h.substring(3, 5), 16);
                b = parseInt(h.substring(5, 7), 16);
            }
        }
        const a = Number.isFinite(parseFloat(alpha)) ? parseFloat(alpha) : 1;
        return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, a))})`;
    };

    const applyVisualPatch = (el, patch) => {
        if (!el || !patch) return;

        if ('tx' in patch || 'ty' in patch) {
            const { tx: curTx, ty: curTy } = getTxTy(el);
            const nextTx = Number.isFinite(parseFloat(patch.tx)) ? parseFloat(patch.tx) : curTx;
            const nextTy = Number.isFinite(parseFloat(patch.ty)) ? parseFloat(patch.ty) : curTy;
            applyTransform(el, nextTx, nextTy);
        }

        if ('width' in patch || 'height' in patch) {
            const w = Number.isFinite(parseFloat(patch.width)) ? parseFloat(patch.width) : undefined;
            const h = Number.isFinite(parseFloat(patch.height)) ? parseFloat(patch.height) : undefined;
            applySize(el, w, h);
        }

        if ('hidden' in patch) el.style.setProperty('display', patch.hidden ? 'none' : '', 'important');

        if ('zIndex' in patch && Number.isFinite(parseInt(patch.zIndex))) {
            el.style.setProperty('position', 'relative', 'important');
            el.style.setProperty('z-index', String(parseInt(patch.zIndex)), 'important');
        }

        if ('opacity' in patch && Number.isFinite(parseFloat(patch.opacity))) {
            el.style.setProperty('opacity', String(Math.min(1, Math.max(0, parseFloat(patch.opacity)))), 'important');
        }

        if ('fontFamily' in patch) {
            if (patch.fontFamily) el.style.setProperty('font-family', patch.fontFamily, 'important');
            else el.style.setProperty('font-family', '', 'important');
        }
        if ('fontSize' in patch) {
            const fs = Number.isFinite(parseFloat(patch.fontSize)) ? Math.max(1, parseFloat(patch.fontSize)) : null;
            if (fs != null) el.style.setProperty('font-size', `${fs}px`, 'important');
        }
        if ('fontWeight' in patch && patch.fontWeight != null) el.style.setProperty('font-weight', String(patch.fontWeight), 'important');
        if ('fontStyle' in patch && patch.fontStyle) el.style.setProperty('font-style', patch.fontStyle, 'important');
        if ('textAlign' in patch && patch.textAlign) el.style.setProperty('text-align', patch.textAlign, 'important');
        if ('lineHeight' in patch) {
            const lh = Number.isFinite(parseFloat(patch.lineHeight)) ? Math.max(0.5, parseFloat(patch.lineHeight)) : null;
            if (lh != null) el.style.setProperty('line-height', String(lh), 'important');
        }
        if ('letterSpacing' in patch) {
            const ls = Number.isFinite(parseFloat(patch.letterSpacing)) ? parseFloat(patch.letterSpacing) : null;
            if (ls != null) el.style.setProperty('letter-spacing', `${ls}px`, 'important');
        }
        if ('textTransform' in patch && patch.textTransform) el.style.setProperty('text-transform', patch.textTransform, 'important');
        if ('textDecoration' in patch) el.style.setProperty('text-decoration', patch.textDecoration || 'none', 'important');
        if ('textShadow' in patch) el.style.setProperty('text-shadow', patch.textShadow || '', 'important');
        if ('textStrokeWidth' in patch || 'textStrokeColor' in patch) {
            const w = Number.isFinite(parseFloat(patch.textStrokeWidth)) ? Math.max(0, parseFloat(patch.textStrokeWidth)) : 0;
            const c = patch.textStrokeColor || '#000000';
            if (w > 0) {
                el.style.setProperty('-webkit-text-stroke-width', `${w}px`, 'important');
                el.style.setProperty('-webkit-text-stroke-color', c, 'important');
            } else {
                el.style.setProperty('-webkit-text-stroke-width', '', 'important');
                el.style.setProperty('-webkit-text-stroke-color', '', 'important');
            }
        }

        if ('fillType' in patch) {
            const t = patch.fillType;
            if (t === 'none') {
                el.style.setProperty('background', '', 'important');
                el.style.setProperty('background-image', '', 'important');
            }
            if (t === 'solid' && patch.fillColor) el.style.setProperty('background', patch.fillColor, 'important');
            if (t === 'gradient' && patch.fillGradient) el.style.setProperty('background', patch.fillGradient, 'important');
            if (t === 'texture' && patch.textureDataUrl) {
                el.style.setProperty('background-image', `url("${patch.textureDataUrl}")`, 'important');
                el.style.setProperty('background-repeat', patch.textureRepeat || 'repeat', 'important');
                const scale = Number.isFinite(parseFloat(patch.textureScale)) ? Math.max(0.1, parseFloat(patch.textureScale)) : 1;
                el.style.setProperty('background-size', `${scale * 100}%`, 'important');
            }
        }

        if ('textColor' in patch) {
            const c = patch.textColor;
            if (c) el.style.setProperty('color', c, 'important');
            else el.style.setProperty('color', '', 'important');
            el.style.setProperty('background', '', 'important');
            el.style.setProperty('-webkit-background-clip', '', 'important');
            el.style.setProperty('background-clip', '', 'important');
            el.style.setProperty('-webkit-text-fill-color', '', 'important');
        }
        if ('textGradient' in patch && patch.textGradient) {
            el.style.setProperty('background', patch.textGradient, 'important');
            el.style.setProperty('-webkit-background-clip', 'text', 'important');
            el.style.setProperty('background-clip', 'text', 'important');
            el.style.setProperty('color', 'transparent', 'important');
            el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
        }

        if ('borderWidth' in patch) {
            const bw = Number.isFinite(parseFloat(patch.borderWidth)) ? parseFloat(patch.borderWidth) : 0;
            const bs = patch.borderStyle || 'solid';
            const bc = patch.borderColor || '#000000';
            if (bw > 0) el.style.setProperty('border', `${bw}px ${bs} ${bc}`, 'important');
            else el.style.setProperty('border', '', 'important');
        }

        if ('borderRadius' in patch && Number.isFinite(parseFloat(patch.borderRadius))) {
            el.style.setProperty('border-radius', `${Math.max(0, parseFloat(patch.borderRadius))}px`, 'important');
        }

        if ('shadowEnabled' in patch) {
            if (!patch.shadowEnabled) {
                el.style.setProperty('box-shadow', '', 'important');
            } else {
                const sx = Number.isFinite(parseFloat(patch.shadowX)) ? parseFloat(patch.shadowX) : 0;
                const sy = Number.isFinite(parseFloat(patch.shadowY)) ? parseFloat(patch.shadowY) : 6;
                const sb = Number.isFinite(parseFloat(patch.shadowBlur)) ? parseFloat(patch.shadowBlur) : 16;
                const ss = Number.isFinite(parseFloat(patch.shadowSpread)) ? parseFloat(patch.shadowSpread) : 0;
                const sc = patch.shadowColor || '#000000';
                const so = Number.isFinite(parseFloat(patch.shadowOpacity)) ? parseFloat(patch.shadowOpacity) / 100 : 0.35;
                el.style.setProperty('box-shadow', `${sx}px ${sy}px ${sb}px ${ss}px ${hexToRgba(sc, so)}`, 'important');
            }
        }

        if ('filterBlur' in patch || 'filterGrayscale' in patch || 'filterBrightness' in patch || 'filterContrast' in patch || 'filterSaturate' in patch || 'filterSepia' in patch) {
            const filters = [];
            const blur = Number.isFinite(parseFloat(patch.filterBlur)) ? parseFloat(patch.filterBlur) : 0;
            const gs = Number.isFinite(parseFloat(patch.filterGrayscale)) ? parseFloat(patch.filterGrayscale) : 0;
            const br = Number.isFinite(parseFloat(patch.filterBrightness)) ? Math.max(0, parseFloat(patch.filterBrightness)) : null;
            const ct = Number.isFinite(parseFloat(patch.filterContrast)) ? Math.max(0, parseFloat(patch.filterContrast)) : null;
            const st = Number.isFinite(parseFloat(patch.filterSaturate)) ? Math.max(0, parseFloat(patch.filterSaturate)) : null;
            const sp = Number.isFinite(parseFloat(patch.filterSepia)) ? Math.min(100, Math.max(0, parseFloat(patch.filterSepia))) : null;
            if (blur > 0) filters.push(`blur(${blur}px)`);
            if (gs > 0) filters.push(`grayscale(${Math.min(100, Math.max(0, gs))}%)`);
            if (br != null && br !== 1) filters.push(`brightness(${br})`);
            if (ct != null && ct !== 1) filters.push(`contrast(${ct})`);
            if (st != null && st !== 1) filters.push(`saturate(${st})`);
            if (sp != null && sp > 0) filters.push(`sepia(${sp}%)`);
            el.style.setProperty('filter', filters.join(' '), 'important');
        }

        if ('padding' in patch) el.style.setProperty('padding', patch.padding || '', 'important');
        if ('margin' in patch) el.style.setProperty('margin', patch.margin || '', 'important');
    };

    const getElementInfo = (id) => {
        const el = document.querySelector(`[data-editor-id="${cssEscape(id)}"]`);
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const text = (el.innerText || el.textContent || '').trim();
        const src = el.tagName === 'IMG' ? (el.getAttribute('src') || '') : '';
        const name = el.getAttribute('data-editor-name') || '';
        return {
            id,
            tag: el.tagName.toLowerCase(),
            name,
            locked: el.getAttribute('data-editor-locked') === 'true',
            hidden: cs.display === 'none',
            text: text.slice(0, 80),
            src,
            styles: {
                fontFamily: cs.fontFamily || '',
                fontSize: cs.fontSize || '',
                fontWeight: cs.fontWeight || '',
                fontStyle: cs.fontStyle || '',
                textAlign: cs.textAlign || '',
                lineHeight: cs.lineHeight || '',
                letterSpacing: cs.letterSpacing || '',
                textTransform: cs.textTransform || '',
                textDecoration: cs.textDecorationLine || '',
                color: cs.color || '',
                background: cs.background || '',
                borderRadius: cs.borderRadius || '',
                opacity: cs.opacity || '',
                zIndex: cs.zIndex || '',
                filter: cs.filter || '',
                padding: cs.padding || '',
                margin: cs.margin || ''
            }
        };
    };

    const getLayersSnapshot = () => {
        const nodes = Array.from(document.querySelectorAll('[data-editor-id]'));
        const layers = nodes.map((el) => {
            const id = el.getAttribute('data-editor-id');
            const cs = window.getComputedStyle(el);
            const z = Number.isFinite(parseInt(cs.zIndex)) ? parseInt(cs.zIndex) : 0;
            const tag = el.tagName.toLowerCase();
            const locked = el.getAttribute('data-editor-locked') === 'true';
            const hidden = cs.display === 'none';
            const name = el.getAttribute('data-editor-name') || '';
            const text = (el.innerText || el.textContent || '').trim();
            const src = tag === 'img' ? (el.getAttribute('src') || '') : '';
            const bg = cs.backgroundColor || '';
            return { id, tag, zIndex: z, locked, hidden, name, text: text.slice(0, 40), src, bg };
        });
        layers.sort((a, b) => b.zIndex - a.zIndex || a.id.localeCompare(b.id));
        return layers;
    };

    const onMessage = (e) => {
        const msg = e?.data;
        if (!msg || msg.source !== 'invitation-editor-host') return;

        if (msg.type === 'setSelection') {
            const id = msg.id;
            if (!id) {
                hideSelection();
                return;
            }
            const el = document.querySelector(`[data-editor-id="${cssEscape(id)}"]`);
            if (el) selectElement(el);
        }

        if (msg.type === 'clearSelection') {
            hideSelection();
        }

        if (msg.type === 'setSnapping') {
            STATE.snappingEnabled = !!msg.enabled;
        }

        if (msg.type === 'applyPatch') {
            const id = msg.id;
            const patch = msg.patch;
            if (!id || !patch) return;
            const el = document.querySelector(`[data-editor-id="${cssEscape(id)}"]`);
            if (el) {
                applyVisualPatch(el, patch);
                if (STATE.selectedEl === el) scheduleUpdate();
            }
        }

        if (msg.type === 'syncStyles') {
            const styles = msg.styles || {};
            Object.keys(styles).forEach((id) => {
                const el = document.querySelector(`[data-editor-id="${cssEscape(id)}"]`);
                if (el) applyVisualPatch(el, styles[id]);
            });
            if (STATE.selectedEl) scheduleUpdate();
        }

        if (msg.type === 'getElementInfo' && msg.id) {
            const info = getElementInfo(msg.id);
            if (info) postToParent({ type: 'elementInfo', id: msg.id, info });
        }

        if (msg.type === 'getLayers') {
            postToParent({ type: 'layers', layers: getLayersSnapshot() });
        }

        if (msg.type === 'setLayerVisibility' && msg.id) {
            const el = document.querySelector(`[data-editor-id="${cssEscape(msg.id)}"]`);
            if (el) {
                const visible = msg.visible !== false;
                if (!visible) {
                    if (!el.dataset.prevDisplay) el.dataset.prevDisplay = el.style.display || '';
                    el.style.setProperty('display', 'none', 'important');
                } else {
                    const prev = el.dataset.prevDisplay || '';
                    el.style.setProperty('display', prev, 'important');
                }
            }
            postToParent({ type: 'layers', layers: getLayersSnapshot() });
        }

        if (msg.type === 'setLayerLocked' && msg.id) {
            const el = document.querySelector(`[data-editor-id="${cssEscape(msg.id)}"]`);
            if (el) {
                const locked = !!msg.locked;
                el.setAttribute('data-editor-locked', locked ? 'true' : 'false');
            }
            postToParent({ type: 'layers', layers: getLayersSnapshot() });
        }

        if (msg.type === 'renameLayer' && msg.id) {
            const el = document.querySelector(`[data-editor-id="${cssEscape(msg.id)}"]`);
            if (el) {
                const name = String(msg.name || '').trim();
                if (name) el.setAttribute('data-editor-name', name);
                else el.removeAttribute('data-editor-name');
            }
            postToParent({ type: 'layers', layers: getLayersSnapshot() });
        }

        if (msg.type === 'duplicateLayer' && msg.id) {
            const el = document.querySelector(`[data-editor-id="${cssEscape(msg.id)}"]`);
            if (el) {
                const clone = el.cloneNode(true);
                const base = msg.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'layer';
                const newId = `${base}_copy_${moment().valueOf()}`;
                clone.setAttribute('data-editor-id', newId);
                const cs = window.getComputedStyle(el);
                const z = Number.isFinite(parseInt(cs.zIndex)) ? parseInt(cs.zIndex) : 0;
                clone.style.setProperty('position', 'relative', 'important');
                clone.style.setProperty('z-index', String(z + 1), 'important');
                el.insertAdjacentElement('afterend', clone);
            }
            postToParent({ type: 'layers', layers: getLayersSnapshot() });
        }

        if (msg.type === 'deleteLayer' && msg.id) {
            const el = document.querySelector(`[data-editor-id="${cssEscape(msg.id)}"]`);
            if (el) el.remove();
            postToParent({ type: 'layers', layers: getLayersSnapshot() });
        }

        if (msg.type === 'addElement') {
            const elementType = msg.elementType; // 'text' or 'image'
            const container = document.querySelector('.invitation-content') || document.body;
            const newId = msg.elementId || `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            let newEl;

            if (elementType === 'image' && msg.src) {
                newEl = document.createElement('img');
                newEl.src = msg.src;
                newEl.style.position = 'absolute';
                newEl.style.left = '50%';
                newEl.style.top = '50%';
                newEl.style.transform = 'translate(-50%, -50%)'; // Center initially
                newEl.style.maxWidth = '300px';
                newEl.style.height = 'auto';
                newEl.setAttribute('data-editor-name', 'Imagen');
            } else if (elementType === 'text') {
                newEl = document.createElement('div');
                newEl.textContent = msg.content || 'Nuevo Texto'; // Default text for new elements
                newEl.style.position = 'absolute';
                newEl.style.left = '50%';
                newEl.style.top = '50%';
                newEl.style.transform = 'translate(-50%, -50%)';
                newEl.style.fontSize = '24px';
                newEl.style.fontFamily = 'Inter, sans-serif';
                newEl.style.color = '#1e293b';
                newEl.style.userSelect = 'none'; // Prevent selection of text during drag
                newEl.setAttribute('data-editor-name', 'Texto');
            }

            if (newEl) {
                newEl.setAttribute('data-editor-id', newId);
                newEl.style.zIndex = '10';
                container.appendChild(newEl);

                // Refresh layers and select the new element
                postToParent({ type: 'layers', layers: getLayersSnapshot() });
                selectElement(newEl);
                postToParent({ type: 'select', id: newId });

                // Notify parent that element was added
                postToParent({
                    type: 'elementAdded',
                    id: newId,
                    elementType: elementType,
                    content: elementType === 'text' ? newEl.textContent : null,
                    src: elementType === 'image' ? newEl.src : null
                });

                // For text elements, start editing immediately with text selected
                if (elementType === 'text') {
                    setTimeout(() => {
                        startTextEditing(newEl, true); // true = select all text
                    }, 100);
                }
            }
        }

        if (msg.type === 'restoreElements') {
            const elements = msg.elements; // Array of element objects
            const container = document.querySelector('.invitation-content') || document.body;

            if (Array.isArray(elements)) {
                console.log(`♻️ Restoring ${elements.length} dynamic elements`);

                elements.forEach(data => {
                    // Check if element already exists (to avoid duplicates)
                    if (document.querySelector(`[data-editor-id="${data.id}"]`)) return;

                    let newEl;
                    if (data.type === 'image' && data.src) {
                        newEl = document.createElement('img');
                        newEl.src = data.src;
                        newEl.setAttribute('data-editor-name', data.name || 'Imagen');
                    } else if (data.type === 'text') {
                        newEl = document.createElement('div');
                        // Use textContent for safety
                        newEl.textContent = data.content || 'Texto restaurado';
                        newEl.setAttribute('data-editor-name', data.name || 'Texto');
                    }

                    if (newEl) {
                        newEl.setAttribute('data-editor-id', data.id);
                        newEl.style.position = 'absolute';

                        // Apply position and size
                        if (data.position) {
                            newEl.style.left = typeof data.position.x === 'number' ? data.position.x + 'px' : data.position.x;
                            newEl.style.top = typeof data.position.y === 'number' ? data.position.y + 'px' : data.position.y;
                        }

                        if (data.size) {
                            newEl.style.width = typeof data.size.width === 'number' ? data.size.width + 'px' : data.size.width;
                            newEl.style.height = typeof data.size.height === 'number' ? data.size.height + 'px' : data.size.height;
                        }

                        // Apply stored styles
                        if (data.styles) {
                            Object.assign(newEl.style, data.styles);
                        }

                        // Ensure essential styles
                        newEl.style.zIndex = data.styles?.zIndex || '10';
                        if (data.type === 'image') {
                            newEl.style.maxWidth = 'none'; // Allow resizing
                        }

                        container.appendChild(newEl);
                    }
                });

                postToParent({ type: 'layers', layers: getLayersSnapshot() });
            }
        }

        if (msg.type === 'executeAutoLayout') {
            const gap = typeof msg.gap === 'number' ? msg.gap : 24;
            const content = document.querySelector('.invitation-content');
            if (content) {
                // Seleccionar secciones visibles directas
                const sections = Array.from(content.querySelectorAll(':scope > section'))
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden';
                    });

                // Ordenar visualmente (opcional, pero útil si el DOM se pudiera reordenar)
                // En este caso, el DOM es fijo, así que el reset (tx=0, ty=0) restaura el orden natural.

                const patches = {};
                sections.forEach(el => {
                    const id = el.getAttribute('data-editor-id');
                    if (id) {
                        // Reseteamos a 0,0 para que el CSS Flexbox maneje el layout dinámico
                        patches[id] = { tx: 0, ty: 0 };
                    }
                });

                postToParent({ type: 'autoLayoutPatches', patches });
            }
        }
    };

    const injectSelectionStyles = () => {
        if (document.getElementById('editor-selection-styles')) return;
        const style = document.createElement('style');
        style.id = 'editor-selection-styles';
        style.textContent = `
            .editor-selection-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 999999;
                pointer-events: none;
                overflow: hidden;
            }
            .editor-selection-box {
                position: absolute;
                border: 2px solid rgba(139, 92, 246, 0.9);
                background: rgba(139, 92, 246, 0.05);
                pointer-events: none;
                box-sizing: border-box;
            }
            .editor-selection-box.editor-selection-box-lost {
                border-color: rgba(239, 68, 68, 0.6);
                background: rgba(239, 68, 68, 0.05);
                border-style: dashed;
            }
            .editor-selection-handle {
                position: absolute;
                width: 8px;
                height: 8px;
                background: #ffffff;
                border: 2px solid rgba(139, 92, 246, 0.9);
                border-radius: 2px;
                pointer-events: auto;
                box-sizing: border-box;
                transform: translate(-50%, -50%);
                z-index: 1;
            }
            .editor-selection-handle[data-handle="nw"] { cursor: nw-resize; }
            .editor-selection-handle[data-handle="n"]  { cursor: n-resize; }
            .editor-selection-handle[data-handle="ne"] { cursor: ne-resize; }
            .editor-selection-handle[data-handle="e"]  { cursor: e-resize; }
            .editor-selection-handle[data-handle="se"] { cursor: se-resize; }
            .editor-selection-handle[data-handle="s"]  { cursor: s-resize; }
            .editor-selection-handle[data-handle="sw"] { cursor: sw-resize; }
            .editor-selection-handle[data-handle="w"]  { cursor: w-resize; }
            .editor-selection-handle:hover {
                background: rgba(139, 92, 246, 0.3);
                border-color: rgba(139, 92, 246, 1);
            }
        `;
        document.head.appendChild(style);
    };

    const init = () => {
        injectSelectionStyles();
        createOverlay();

        if (window.MutationObserver) {
            STATE.mutationObserver = new MutationObserver(() => scheduleUpdate());
            try { STATE.mutationObserver.observe(document.body, { childList: true, subtree: true }); } catch (_) { }
        }

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('pointerup', onPointerUp, true);
        document.addEventListener('pointercancel', onPointerUp, true);
        document.addEventListener('keydown', onKeyDown, true);

        // Double-click to edit text elements
        document.addEventListener('dblclick', (e) => {
            // Don't interfere with existing editing
            if (STATE.editingElement) return;

            const target = e.target;
            if (!target) return;

            // Find the editable element
            const editableEl = target.closest('[data-editor-id]');
            if (!editableEl) return;

            // Check if it's a text element
            if (isTextElement(editableEl)) {
                e.preventDefault();
                e.stopPropagation();
                startTextEditing(editableEl, false);
            }
        }, true);

        document.addEventListener('scroll', scheduleUpdate, true);
        window.addEventListener('scroll', scheduleUpdate, true);
        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('message', onMessage);

        console.log('[RUNTIME] init() complete, sending ready signal. Elements with data-editor-id:', document.querySelectorAll('[data-editor-id]').length);
        postToParent({ type: 'ready' });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();

