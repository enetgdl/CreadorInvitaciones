(() => {
    const byId = (id) => document.getElementById(id);

    const helpModal = byId('helpModal');
    const helpModalTitle = byId('helpModalTitle');
    const helpModalBody = byId('helpModalBody');
    const helpModalClose = byId('helpModalClose');
    const helpModalOk = byId('helpModalOk');

    const openHelpModal = (title, html) => {
        if (!helpModal) return;
        if (helpModalTitle) helpModalTitle.textContent = title;
        if (helpModalBody) helpModalBody.innerHTML = html;
        helpModal.classList.add('active');
    };

    const closeHelpModal = () => {
        helpModal?.classList.remove('active');
    };

    helpModalClose?.addEventListener('click', closeHelpModal);
    helpModalOk?.addEventListener('click', closeHelpModal);
    helpModal?.addEventListener('click', (e) => {
        if (e.target === helpModal) closeHelpModal();
    });

    byId('helpDocsBtn')?.addEventListener('click', () => {
        openHelpModal('Documentación', `
            <div class="preview-info-card">
                <span class="info-icon">📘</span>
                <p>Guías disponibles en este proyecto:</p>
            </div>
            <div class="preview-actions-stack" style="margin-top: 12px;">
                <a class="btn btn-secondary btn-block" href="docs/INICIO-RAPIDO.md" target="_blank" rel="noopener">📄 Inicio rápido</a>
                <a class="btn btn-secondary btn-block" href="docs/GUIA-INTEGRACION-DESIGN.md" target="_blank" rel="noopener">🎨 Guía de diseño avanzado</a>
            </div>
            <div class="preview-info-card" style="margin-top: 12px;">
                <span class="info-icon">⌨️</span>
                <p>Atajos: Ctrl+N nuevo, Ctrl+O abrir, Ctrl+S guardar plantilla, Ctrl+Z deshacer, Ctrl+Y rehacer.</p>
            </div>
            <div class="preview-info-card" style="margin-top: 12px;">
                <span class="info-icon">💾</span>
                <p>Formato de datos en localStorage (borradores):</p>
                <ul style="margin-top: 8px; font-size: 0.9rem;">
                    <li>Clave: invitation_draft_[timestamp]</li>
                    <li>Contenido: JSON con todos los campos editables, configuraciones y preferencias</li>
                    <li>Estructura: Compatible con editor.data</li>
                </ul>
            </div>
        `);
    });

    byId('helpAboutBtn')?.addEventListener('click', () => {
        const editor = window.invitationEditor;
        const data = editor?.data || {};
        const tpl = data.templateMeta || {};
        openHelpModal('Acerca de', `
            <div class="preview-info-card">
                <span class="info-icon">ℹ️</span>
                <p><strong>Editor de Invitaciones Digitales</strong></p>
            </div>
            <div class="export-list" style="margin-top: 12px;">
                <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.5;">
                    <div><strong>Versión de datos:</strong> ${String(data.version || 'N/D')}</div>
                    <div><strong>Plantilla actual:</strong> ${tpl.name ? String(tpl.name) : 'Sin plantilla'}</div>
                    <div><strong>Navegador:</strong> ${navigator.userAgent}</div>
                </div>
            </div>
        `);
    });

    byId('helpReportBtn')?.addEventListener('click', async () => {
        const editor = window.invitationEditor;
        const data = editor?.data || {};
        const storage = editor?.storage;
        const size = storage?.getStorageSize ? storage.getStorageSize() : null;
        const payload = {
            app: 'invitation-editor',
            version: data.version || null,
            template: data.templateMeta || null,
            userAgent: navigator.userAgent,
            storageSize: size || null,
            lastModified: data.lastModified || null
        };

        const text = JSON.stringify(payload, null, 2);

        openHelpModal('Reportar problemas', `
            <div class="preview-info-card">
                <span class="info-icon">🐞</span>
                <p>Incluye esta información en tu reporte. Puedes copiarla con un clic.</p>
            </div>
            <div class="control-group" style="margin-top: 12px;">
                <label class="control-label">Diagnóstico</label>
                <textarea id="helpReportText" class="control-input" rows="8" spellcheck="false">${text}</textarea>
            </div>
            <div class="preview-actions-stack" style="margin-top: 12px;">
                <button type="button" id="helpCopyReport" class="btn btn-accent btn-block">Copiar diagnóstico</button>
            </div>
        `);

        setTimeout(() => {
            byId('helpCopyReport')?.addEventListener('click', async () => {
                const el = byId('helpReportText');
                const value = el?.value || text;
                try {
                    await navigator.clipboard.writeText(value);
                    storage?.showNotification?.('Diagnóstico copiado', 'success');
                } catch (_) {
                    storage?.showNotification?.('No se pudo copiar (permiso del navegador)', 'error');
                }
            });
        }, 0);
    });

    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement?.tagName;
        const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
        if (isTyping) return;

        if (!(e.ctrlKey || e.metaKey)) return;

        const k = e.key.toLowerCase();
        if (k === 'n') {
            e.preventDefault();
            byId('templateNewBtn')?.click();
        }
        if (k === 'o') {
            e.preventDefault();
            byId('templateOpenBtn')?.click();
        }
        if (k === 's') {
            e.preventDefault();
            byId('templateSaveBtn')?.click();
        }
    });
})();
