/**
 * PRESET-DOCK.JS - Renderiza y gestiona las Plantillas Rápidas en el panel izquierdo
 */
document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('templatesGrid');
    if (!gridContainer || !window.presetEngine) return;

    const presets = await window.presetEngine.getPresetList();
    if (!presets || presets.length === 0) {
        console.warn('No se encontraron presets en el catálogo.');
        return;
    }

    gridContainer.innerHTML = '';

    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-item-panel';
        btn.title = preset.name;
        btn.setAttribute('aria-label', `Aplicar plantilla ${preset.name}`);

        const colors = preset.preview_colors || ['#ccc', '#ddd', '#eee'];

        btn.innerHTML = `
            <div class="preset-preview-panel" style="background: linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)">
                <span class="preset-icon-panel">✨</span>
            </div>
            <div class="preset-label-panel">${preset.name}</div>
        `;

        btn.addEventListener('click', async () => {
            btn.classList.add('loading');

            const editor = window.invitationEditor;
            if (!editor) return;

            const success = await window.presetEngine.applyPreset(preset.id, editor);

            btn.classList.remove('loading');

            if (success) {
                document.querySelectorAll('.preset-item-panel').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
            }
        });

        gridContainer.appendChild(btn);
    });
});
