/**
 * TEST UNITARIO SIMULADO: Lógica de Visibilidad de Controles de Texto
 * 
 * Este script simula el comportamiento de la validación implementada en visual-editor.js
 * para asegurar que los paneles se ocultan/muestran correctamente según el tipo de elemento.
 */

const assert = (condition, message) => {
    if (!condition) {
        console.error(`❌ FALLÓ: ${message}`);
        return false;
    }
    console.log(`✅ PASÓ: ${message}`);
    return true;
};

// Mock del entorno DOM y Editor
class MockDOMTokenList {
    constructor() { this.active = new Set(); }
    add(cls) { this.active.add(cls); }
    remove(cls) { this.active.delete(cls); }
    contains(cls) { return this.active.has(cls); }
}

const mockEditor = {
    selectedId: null,
    lastElementInfo: null,
    textGroupList: new MockDOMTokenList(),

    // Lógica copiada de visual-editor.js para validación
    updateVisibility() {
        let isText = (this.selectedId || '').toLowerCase().includes('text'); // isProbablyText simplificado

        if (this.lastElementInfo) {
            const info = this.lastElementInfo;
            const tag = String(info.tag || '').toLowerCase();
            const hasText = (info.text || '').trim().length > 0;
            const isImage = tag === 'img' || tag === 'video' || tag === 'svg' || tag === 'canvas';

            if (isImage) isText = false;
            else if (hasText) isText = true;
        }

        if (isText) {
            this.textGroupList.remove('hidden');
        } else {
            this.textGroupList.add('hidden');
        }
    }
};

console.log("=== INICIANDO PRUEBAS DE VISIBILIDAD DE PANELES ===\n");

// CASO 1: Elemento de texto estándar
mockEditor.selectedId = 'mainTitle';
mockEditor.lastElementInfo = { tag: 'h1', text: 'Bienvenidos' };
mockEditor.updateVisibility();
assert(
    !mockEditor.textGroupList.contains('hidden'),
    "El panel debe mostrarse para un H1 con texto"
);

// CASO 2: Imagen
mockEditor.selectedId = 'logoImage';
mockEditor.lastElementInfo = { tag: 'img', text: '' };
mockEditor.updateVisibility();
assert(
    mockEditor.textGroupList.contains('hidden'),
    "El panel debe ocultarse para una imagen (IMG)"
);

// CASO 3: Contenedor vacío (No texto)
mockEditor.selectedId = 'sectionBox';
mockEditor.lastElementInfo = { tag: 'div', text: '   ' };
mockEditor.updateVisibility();
assert(
    mockEditor.textGroupList.contains('hidden'),
    "El panel debe ocultarse para un contenedor sin texto visible"
);

// CASO 4: Div con texto (Debe ser tratado como texto)
mockEditor.selectedId = 'contentBox';
mockEditor.lastElementInfo = { tag: 'div', text: 'Lorem ipsum' };
mockEditor.updateVisibility();
assert(
    !mockEditor.textGroupList.contains('hidden'),
    "El panel debe mostrarse para un DIV que contiene texto"
);

// CASO 5: Imagen con ID conflictivo (ej. 'textImage')
mockEditor.selectedId = 'textImage';
mockEditor.lastElementInfo = { tag: 'img', text: '' };
mockEditor.updateVisibility();
assert(
    mockEditor.textGroupList.contains('hidden'),
    "El panel debe ocultarse para una imagen incluso si su ID contiene 'text'"
);

console.log("\n=== PRUEBAS COMPLETADAS ===");
