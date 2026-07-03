class InvitationTemplateManager {
    constructor() {
        this.editor = null;
        this.storageKey = 'invitation_templates_v1';

        this.ui = {};
        this.pendingSaveName = '';
        this.draftSaveTimer = 0;
        this.draftSaveDelay = 500;
        this._templatesCache = null; // Cache en memoria para lectura síncrona
    }

    async init(editor) {
        this.editor = editor;
        await this.loadTemplatesAsync(); // Cargar plantillas desde IndexedDB
        this.bindUI();
        this.bindModalEvents();
        this.renderTemplates();
    }

    bindUI() {
        const byId = (id) => document.getElementById(id);

        this.ui.newBtn = byId('templateNewBtn');
        this.ui.openBtn = byId('templateOpenBtn');
        this.ui.saveBtn = byId('templateSaveBtn');
        this.ui.draftSaveBtn = byId('draftSaveBtn');

        this.ui.templatesModal = byId('templatesModal');
        this.ui.templatesModalClose = byId('templatesModalClose');
        this.ui.templatesModalCancel = byId('templatesModalCancel');
        this.ui.templatesSearch = byId('templatesSearch');
        this.ui.templatesList = byId('templatesList');

        this.ui.saveModal = byId('templateSaveModal');
        this.ui.saveModalClose = byId('templateSaveModalClose');
        this.ui.saveCancel = byId('templateSaveCancel');
        this.ui.saveConfirm = byId('templateSaveConfirm');
        this.ui.saveName = byId('templateSaveName');

        this.ui.newBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.createNewInvitation();
        });

        this.ui.openBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openTemplatesModal();
        });

        this.ui.saveBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSave();
        });
        this.ui.draftSaveBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.scheduleDraftSave();
        });

        this.ui.templatesSearch?.addEventListener('input', () => {
            this.renderTemplates(this.ui.templatesSearch.value);
        });

        this.ui.saveName?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmSaveNew();
            }
        });
    }

    bindModalEvents() {
        const close = (modal) => modal?.classList.remove('active');

        this.ui.templatesModalClose?.addEventListener('click', () => close(this.ui.templatesModal));
        this.ui.templatesModalCancel?.addEventListener('click', () => close(this.ui.templatesModal));
        this.ui.saveModalClose?.addEventListener('click', () => close(this.ui.saveModal));
        this.ui.saveCancel?.addEventListener('click', () => close(this.ui.saveModal));

        this.ui.saveConfirm?.addEventListener('click', () => this.confirmSaveNew());

        [this.ui.templatesModal, this.ui.saveModal].forEach((modal) => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) close(modal);
            });
        });
    }

    scheduleDraftSave() {
        clearTimeout(this.draftSaveTimer);
        this.draftSaveTimer = setTimeout(() => this.saveDraft(), this.draftSaveDelay);
    }

    flashDraftButton() {
        const btn = this.ui.draftSaveBtn;
        if (!btn) return;
        btn.classList.remove('tool-btn-success');
        void btn.offsetWidth;
        btn.classList.add('tool-btn-success');
        setTimeout(() => btn.classList.remove('tool-btn-success'), 900);
    }

    saveDraft() {
        if (!this.editor?.data) {
            this.notify('No hay datos para guardar', 'error');
            return;
        }
        const key = `invitation_draft_${Date.now()}`;
        const payload = this.editor.data;
        if (window.indexedDBManager) {
            window.indexedDBManager.put(key, payload)
                .then(() => {
                    this.flashDraftButton();
                    this.notify('Borrador guardado', 'success');
                })
                .catch(() => this.notify('Error al guardar borrador', 'error'));
        } else {
            this.notify('IndexedDB no disponible', 'error');
        }
    }

    notify(message, type = 'info') {
        if (this.editor?.storage?.showNotification) this.editor.storage.showNotification(message, type);
    }

    runWithoutStorageNotifications(fn) {
        const storage = this.editor?.storage;
        if (!storage || typeof storage.showNotification !== 'function') return fn();
        const original = storage.showNotification.bind(storage);
        try {
            storage.showNotification = () => { };
            return fn();
        } finally {
            storage.showNotification = original;
        }
    }

    deepClone(data) {
        return JSON.parse(JSON.stringify(data));
    }

    ensureMeta(data) {
        if (!data.templateMeta) data.templateMeta = { id: null, name: null };
        if (!('id' in data.templateMeta)) data.templateMeta.id = null;
        if (!('name' in data.templateMeta)) data.templateMeta.name = null;
        return data;
    }

    loadTemplates() {
        // Retornar desde caché en memoria si existe (sincrónico)
        return this._templatesCache || [];
    }

    /**
     * Carga las plantillas desde IndexedDB y actualiza la caché
     */
    async loadTemplatesAsync() {
        try {
            const data = await window.indexedDBManager.get(this.storageKey);
            this._templatesCache = Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('[TemplateManager] Error cargando plantillas:', e);
            this._templatesCache = [];
        }
        return this._templatesCache;
    }

    getTemplateById(templateId) {
        const templates = this.loadTemplates();
        return templates.find(x => x && x.id === templateId) || null;
    }

    saveTemplates(list) {
        this._templatesCache = Array.isArray(list) ? list : [];
        if (window.indexedDBManager) {
            window.indexedDBManager.put(this.storageKey, this._templatesCache)
                .catch(e => console.error('[TemplateManager] Error guardando plantillas:', e));
        }
        return true;
    }

    upsertTemplate(template) {
        const templates = this.loadTemplates();
        const idx = templates.findIndex(t => t && t.id === template.id);
        if (idx >= 0) templates[idx] = template;
        else templates.unshift(template);
        this.saveTemplates(templates);
        return template;
    }

    deleteTemplate(templateId) {
        const templates = this.loadTemplates();
        const next = templates.filter(t => t && t.id !== templateId);
        this.saveTemplates(next);
    }

    makeCopyName(baseName) {
        const existing = new Set(this.loadTemplates().map(t => String(t?.name || '').trim()).filter(Boolean));
        const base = String(baseName || 'Plantilla').trim() || 'Plantilla';
        const suffix = ' (copia)';
        const first = `${base}${suffix}`;
        if (!existing.has(first)) return first;

        let i = 2;
        while (i < 1000) {
            const candidate = `${base}${suffix} ${i}`;
            if (!existing.has(candidate)) return candidate;
            i += 1;
        }
        return `${base}${suffix} ${Date.now()}`;
    }

    renameTemplate(templateId, newName) {
        const name = String(newName || '').trim();
        if (!name) {
            this.notify('Nombre inválido', 'error');
            return false;
        }

        const templates = this.loadTemplates();
        const idx = templates.findIndex(t => t && t.id === templateId);
        if (idx < 0) return false;

        templates[idx].name = name;
        templates[idx].updatedAt = Date.now();
        this.saveTemplates(templates);

        const meta = this.getCurrentTemplateMeta();
        if (meta.id === templateId) {
            this.editor.data.templateMeta.name = name;
            this.runWithoutStorageNotifications(() => this.editor.storage.saveData(this.editor.data));
        }

        return true;
    }

    duplicateTemplate(templateId) {
        const t = this.getTemplateById(templateId);
        if (!t || !t.data) return null;

        const newId = `tpl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const newName = this.makeCopyName(t.name || 'Plantilla');
        const data = this.ensureMeta(this.deepClone(t.data));
        data.templateMeta.id = newId;
        data.templateMeta.name = newName;

        const record = {
            id: newId,
            name: newName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data
        };

        this.upsertTemplate(record);
        return record;
    }

    getCurrentTemplateMeta() {
        const meta = this.editor?.data?.templateMeta || { id: null, name: null };
        return { id: meta.id || null, name: meta.name || null };
    }

    createNewInvitation() {
        const ok = window.confirm('¿Crear una invitación nueva? Se reemplazará el diseño actual.');
        if (!ok) return;

        const clean = this.editor.storage.getDefaultData();
        this.ensureMeta(clean);
        clean.templateMeta.id = null;
        clean.templateMeta.name = null;

        this.runWithoutStorageNotifications(() => this.editor.loadData(clean));

        if (window.visualEditorHost?.clearSelection) window.visualEditorHost.clearSelection();

        // Limpiar historial de undo/redo
        if (this.editor?.historyManager?.clearHistory) {
            this.editor.historyManager.clearHistory();
        }

        this.notify('Nueva invitación creada', 'success');
    }

    openTemplatesModal() {
        if (!this.ui.templatesModal) return;
        this.ui.templatesModal.classList.add('active');
        if (this.ui.templatesSearch) this.ui.templatesSearch.value = '';
        this.renderTemplates('');
        setTimeout(() => this.ui.templatesSearch?.focus(), 0);
    }

    renderTemplates(filter = '') {
        if (!this.ui.templatesList) return;

        const q = String(filter || '').trim().toLowerCase();
        const list = this.loadTemplates()
            .filter(t => t && t.name && (!q || String(t.name).toLowerCase().includes(q)))
            .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const container = document.createElement('div');
        container.className = 'templates-list';

        if (!list.length) {
            const empty = document.createElement('div');
            empty.className = 'preview-info-card';
            empty.innerHTML = '<span class="info-icon">📄</span><p>No hay plantillas guardadas.</p>';
            this.ui.templatesList.innerHTML = '';
            this.ui.templatesList.appendChild(empty);
            return;
        }

        list.forEach((t) => {
            const item = document.createElement('div');
            item.className = 'template-item';

            const left = document.createElement('div');
            const title = document.createElement('div');
            title.className = 'template-item-title';
            title.textContent = t.name;
            const meta = document.createElement('div');
            meta.className = 'template-item-meta';
            meta.textContent = t.updatedAt ? `Actualizada: ${new Date(t.updatedAt).toLocaleString()}` : 'Sin fecha';
            left.appendChild(title);
            left.appendChild(meta);

            const actions = document.createElement('div');
            actions.className = 'template-item-actions';

            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.className = 'btn btn-secondary';
            openBtn.textContent = '📂 Abrir';
            openBtn.addEventListener('click', () => this.openTemplate(t.id));

            const renameBtn = document.createElement('button');
            renameBtn.type = 'button';
            renameBtn.className = 'btn btn-secondary';
            renameBtn.textContent = '✏️ Renombrar';
            renameBtn.addEventListener('click', () => {
                const nextName = window.prompt('Nuevo nombre de la plantilla:', t.name);
                if (nextName == null) return;
                const ok = this.renameTemplate(t.id, nextName);
                if (ok) {
                    this.notify('Plantilla renombrada', 'success');
                    this.renderTemplates(this.ui.templatesSearch?.value || '');
                } else {
                    this.notify('No se pudo renombrar', 'error');
                }
            });

            const duplicateBtn = document.createElement('button');
            duplicateBtn.type = 'button';
            duplicateBtn.className = 'btn btn-secondary';
            duplicateBtn.textContent = '📄 Duplicar';
            duplicateBtn.addEventListener('click', () => {
                const r = this.duplicateTemplate(t.id);
                if (!r) {
                    this.notify('No se pudo duplicar', 'error');
                    return;
                }
                this.notify(`Plantilla duplicada: ${r.name}`, 'success');
                this.renderTemplates(this.ui.templatesSearch?.value || '');
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-secondary';
            deleteBtn.textContent = '🗑️ Eliminar';
            deleteBtn.addEventListener('click', () => {
                const ok = window.confirm(`¿Eliminar la plantilla "${t.name}"? Esta acción no se puede deshacer.`);
                if (!ok) return;

                const current = this.getCurrentTemplateMeta();
                const wasCurrent = current.id === t.id;

                this.deleteTemplate(t.id);
                if (wasCurrent) {
                    this.editor.data.templateMeta = { id: null, name: null };
                    this.runWithoutStorageNotifications(() => this.editor.storage.saveData(this.editor.data));
                }

                this.notify('Plantilla eliminada', 'success');
                this.renderTemplates(this.ui.templatesSearch?.value || '');
            });

            actions.appendChild(openBtn);
            actions.appendChild(renameBtn);
            actions.appendChild(duplicateBtn);
            actions.appendChild(deleteBtn);
            item.appendChild(left);
            item.appendChild(actions);

            container.appendChild(item);
        });

        this.ui.templatesList.innerHTML = '';
        this.ui.templatesList.appendChild(container);
    }

    openTemplate(templateId) {
        const t = this.getTemplateById(templateId);
        if (!t || !t.data) {
            this.notify('No se pudo abrir la plantilla', 'error');
            return;
        }

        const data = this.ensureMeta(this.deepClone(t.data));
        data.templateMeta.id = t.id;
        data.templateMeta.name = t.name;

        this.runWithoutStorageNotifications(() => this.editor.loadData(data));
        if (window.visualEditorHost?.clearSelection) window.visualEditorHost.clearSelection();

        // Limpiar historial de undo/redo al abrir una plantilla nueva
        if (this.editor?.historyManager?.clearHistory) {
            this.editor.historyManager.clearHistory();
        }

        this.ui.templatesModal?.classList.remove('active');
        this.notify(`Plantilla abierta: ${t.name}`, 'success');
    }

    handleSave() {
        const meta = this.getCurrentTemplateMeta();
        if (meta.id) {
            this.saveOverwrite(meta.id, meta.name);
            return;
        }

        this.openSaveModal();
    }

    openSaveModal() {
        if (!this.ui.saveModal) return;
        this.ui.saveModal.classList.add('active');

        const currentName = this.getCurrentTemplateMeta().name || '';
        this.ui.saveName.value = currentName;
        setTimeout(() => this.ui.saveName?.focus(), 0);
    }

    confirmSaveNew() {
        const name = String(this.ui.saveName?.value || '').trim();
        if (!name) {
            this.notify('Ingresa un nombre para guardar la plantilla', 'error');
            this.ui.saveName?.focus();
            return;
        }

        const id = `tpl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        this.saveAs(id, name);
        this.ui.saveModal?.classList.remove('active');
    }

    saveOverwrite(id, name) {
        const templateName = name || 'Sin nombre';
        this.saveAs(id, templateName);
    }

    saveAs(id, name) {
        const data = this.ensureMeta(this.deepClone(this.editor.data));
        data.templateMeta.id = id;
        data.templateMeta.name = name;

        const record = {
            id,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            data
        };

        const existing = this.loadTemplates().find(t => t && t.id === id);
        if (existing && existing.createdAt) record.createdAt = existing.createdAt;

        const ok = this.upsertTemplate(record);
        if (!ok) {
            this.notify('No se pudo guardar la plantilla', 'error');
            return;
        }

        this.editor.data.templateMeta = { id, name };
        this.editor.isDirty = true;
        this.runWithoutStorageNotifications(() => this.editor.storage.saveData(this.editor.data));

        this.notify(`Plantilla guardada: ${name}`, 'success');
        this.renderTemplates(this.ui.templatesSearch?.value || '');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tryInit = () => {
        const editor = window.invitationEditor;
        if (!editor) return false;
        window.templateManager = new InvitationTemplateManager();
        window.templateManager.init(editor);
        return true;
    };

    if (tryInit()) return;
    let attempts = 0;
    const t = setInterval(() => {
        attempts += 1;
        if (tryInit() || attempts > 30) clearInterval(t);
    }, 100);
});

