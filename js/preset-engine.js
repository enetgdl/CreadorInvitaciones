/**
 * PRESET-ENGINE.JS — Motor de Plantillas Prediseñadas (Fase 2)
 *
 * Aplica plantillas vía CSS Custom Properties inyectadas en el iframe.
 * No destruye el DOM: solo actualiza variables CSS en :root → el navegador
 * aplica el cambio visual a 60 fps sin parpadeo ni re-render.
 *
 * Flujo:
 *   1. Usuario hace clic en un preset del Dock inferior.
 *   2. PresetEngine.applyPreset(id, editor) se llama.
 *   3. Se carga el JSON del preset (con caché en memoria).
 *   4. Solo se reemplaza la capa `theme` del editor.data.
 *   5. Se inyectan las CSS vars en el iframe (patchStyles()).
 *   6. Si algún campo es estructural (fuentes, layout), se fuerza un render completo.
 */

class PresetEngine {
    constructor() {
        this._cache = new Map();
        this.catalogUrl = 'resources/presets/catalog.json';
        this._catalog = null;
        this._catalogPromise = null;
    }

    /** ─── Carga el catálogo una sola vez ─── */
    async loadCatalog() {
        if (this._catalog) return this._catalog;
        if (this._catalogPromise) return this._catalogPromise;

        this._catalogPromise = fetch(this.catalogUrl, { cache: 'default' })
            .then(r => r.ok ? r.json() : { presets: [] })
            .then(catalog => {
                this._catalog = catalog;
                this._catalogPromise = null;
                return catalog;
            })
            .catch(() => {
                this._catalogPromise = null;
                return { presets: [] };
            });

        return this._catalogPromise;
    }

    /** ─── Carga un preset individual (JSON) con caché ─── */
    async loadPreset(id) {
        if (this._cache.has(id)) return this._cache.get(id);

        const catalog = await this.loadCatalog();
        const entry = catalog.presets?.find(p => p.id === id);
        if (!entry?.file) return null;

        try {
            const res = await fetch(entry.file, { cache: 'default' });
            if (!res.ok) return null;
            const preset = await res.json();
            this._cache.set(id, preset);
            return preset;
        } catch {
            return null;
        }
    }

    /**
     * Aplica un preset al editor. Solo reemplaza la capa `theme`,
     * respetando el contenido existente del usuario.
     *
     * @param {string} presetId
     * @param {Object} editor  — instancia de InvitationEditor
     */
    async applyPreset(presetId, editor) {
        const preset = await this.loadPreset(presetId);
        if (!preset?.theme) {
            console.warn(`[PresetEngine] No se encontró el preset: ${presetId}`);
            return false;
        }

        // 1. Guardar estado en historial antes de aplicar
        if (editor.historyManager) {
            editor.historyManager.saveState(editor.data, `Aplicar Preset: ${preset.theme.name || presetId}`);
        }

        const tokens = preset.theme.tokens || {};

        // 2. Solo reemplazar propiedades del tema en el data actual
        if (tokens.colors) {
            if (tokens.colors.primary)   editor.data.primaryColor   = tokens.colors.primary;
            if (tokens.colors.secondary) editor.data.secondaryColor = tokens.colors.secondary;
            if (tokens.colors.text)      editor.data.textColor      = tokens.colors.text;
        }
        if (tokens.fonts) {
            if (tokens.fonts.heading) editor.data.titleFont = tokens.fonts.heading;
            if (tokens.fonts.body)    editor.data.bodyFont  = tokens.fonts.body;
        }
        if (tokens.effects) {
            if (tokens.effects.backgroundEffect !== undefined) editor.data.backgroundEffect = tokens.effects.backgroundEffect;
            if (tokens.effects.overlayOpacity   !== undefined) editor.data.overlayOpacity   = tokens.effects.overlayOpacity;
        }
        if (preset.theme.layout?.backgroundFill) {
            editor.data.designElements = editor.data.designElements || {};
            editor.data.designElements.background = {
                ...(editor.data.designElements.background || {}),
                ...preset.theme.layout.backgroundFill
            };
        }

        editor.data._themeId = preset.theme.id;
        editor.data.templateMeta = {
            id: preset.theme.id,
            name: preset.theme.name
        };

        // 3. Sincronizar formularios del panel izquierdo
        if (editor.loadFormValues) editor.loadFormValues();

        // 4. Actualizar preview: forzar render completo (cambio de fuentes/layout)
        if (editor.preview) {
            editor.preview.currentData = editor.data;
            editor.preview.forceRender();
        }

        // 5. Persistir
        editor.isDirty = true;
        editor.storage.saveData(editor.data);

        // 6. Notificar al usuario
        editor.storage.showNotification(`Plantilla aplicada: ${preset.theme.name}`, 'success');

        return true;
    }

    /**
     * Devuelve el listado de presets del catálogo para renderizar el dock.
     * @returns {Promise<Array>}
     */
    async getPresetList() {
        const catalog = await this.loadCatalog();
        return catalog.presets || [];
    }
}

window.PresetEngine = PresetEngine;
window.presetEngine = new PresetEngine();
