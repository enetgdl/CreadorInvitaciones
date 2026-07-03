/**
 * HISTORY DROPDOWN - DIAGNOSTIC & TEST SUITE
 * Ejecutar en la consola del navegador para diagnosticar problemas
 */

const HistoryDropdownDiagnostics = {

    /**
     * Test 1: Verificar exportación de clase
     */
    testClassExport() {
        console.group('✓ Test 1: Exportación de Clase');
        const result = {
            passed: typeof window.HistoryDropdown === 'function',
            details: typeof window.HistoryDropdown
        };
        console.log(result.passed ? '✅ PASS' : '❌ FAIL', 'HistoryDropdown está disponible:', result.details);
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 2: Verificar inicialización del HistoryManager
     */
    testManagerInit() {
        console.group('✓ Test 2: HistoryManager Inicializado');
        const editor = window.invitationEditor;
        const manager = editor?.historyManager;
        const result = {
            passed: !!manager,
            hasUndoBtn: !!manager?.undoBtn,
            hasRedoBtn: !!manager?.redoBtn,
            undoStackLength: manager?.undoStack?.length || 0,
            redoStackLength: manager?.redoStack?.length || 0
        };
        console.log(result.passed ? '✅ PASS' : '❌ FAIL', 'Manager existe:', result);
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 3: Verificar renderizado del Split Button
     */
    testSplitButtonUI() {
        console.group('✓ Test 3: Split Button UI');
        const undoGroup = document.querySelector('.history-split-group');
        const arrows = document.querySelectorAll('.tool-btn-arrow');
        const result = {
            passed: undoGroup !== null && arrows.length >= 1,
            groupExists: !!undoGroup,
            arrowCount: arrows.length,
            arrowsDisabled: Array.from(arrows).map(a => a.disabled)
        };
        console.log(result.passed ? '✅ PASS' : '❌ FAIL', 'Split button renderizado:', result);
        if (!result.passed) {
            console.warn('⚠️ El split button no se renderizó. Ejecutar: testForceInit()');
        }
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 4: Verificar existencia de menú dropdown
     */
    testDropdownMenuDOM() {
        console.group('✓ Test 4: Dropdown Menu DOM');
        const undoMenu = document.getElementById('history-menu-undo');
        const redoMenu = document.getElementById('history-menu-redo');
        const result = {
            passed: undoMenu !== null || redoMenu !== null,
            undoMenuExists: !!undoMenu,
            redoMenuExists: !!redoMenu,
            undoMenuVisible: undoMenu?.classList.contains('active'),
            redoMenuVisible: redoMenu?.classList.contains('active')
        };
        console.log(result.passed ? '✅ PASS' : '❌ FAIL', 'Menús dropdown existen:', result);
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 5: Verificar mapeo de acciones
     */
    testActionMapping() {
        console.group('✓ Test 5: Mapeo de Acciones');
        const manager = window.invitationEditor?.historyManager;
        const stack = manager?.undoStack || [];
        const actions = stack.map(entry => entry.meta?.name || 'SIN META');
        const hasGeneric = actions.filter(a => a === 'Modificación').length;
        const hasSpecific = actions.filter(a => a !== 'Modificación' && a !== 'SIN META').length;

        const result = {
            passed: hasSpecific > 0 || stack.length === 0,
            totalActions: actions.length,
            genericCount: hasGeneric,
            specificCount: hasSpecific,
            sampleActions: actions.slice(0, 5)
        };

        console.log(result.passed ? '✅ PASS' : '⚠️  WARN', 'Mapeo de acciones:', result);
        if (hasGeneric > 0 && hasSpecific === 0) {
            console.warn('⚠️ Todas las acciones son genéricas "Modificación"');
            console.log('Sample stack entry:', stack[0]);
        }
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 6: Verificar estilos CSS
     */
    testCSSStyles() {
        console.group('✓ Test 6: Estilos CSS');
        const testDiv = document.createElement('div');
        testDiv.className = 'history-dropdown-menu';
        document.body.appendChild(testDiv);
        const styles = window.getComputedStyle(testDiv);
        const result = {
            passed: styles.position === 'absolute',
            position: styles.position,
            opacity: styles.opacity,
            visibility: styles.visibility,
            display: styles.display
        };
        document.body.removeChild(testDiv);
        console.log(result.passed ? '✅ PASS' : '❌ FAIL', 'CSS aplicado:', result);
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 7: Simular apertura de dropdown
     */
    async testDropdownOpenClose() {
        console.group('✓ Test 7: Apertura/Cierre del Dropdown');
        const arrow = document.querySelector('.tool-btn-arrow');
        if (!arrow) {
            console.error('❌ FAIL: No se encontró el botón flecha');
            console.groupEnd();
            return false;
        }

        arrow.click();
        await new Promise(r => setTimeout(r, 300));

        const menu = document.querySelector('.history-dropdown-menu.active');
        const isOpen = !!menu;

        if (isOpen) {
            console.log('✅ PASS: Menú abierto correctamente');
            const items = menu.querySelectorAll('.history-item');
            console.log('Items en menú:', items.length);
            console.log('Primer item:', items[0]?.textContent.trim());

            // Cerrar
            arrow.click();
            await new Promise(r => setTimeout(r, 300));
        } else {
            console.error('❌ FAIL: Menú no se abrió');
        }

        console.groupEnd();
        return isOpen;
    },

    /**
     * Test 8: Validar persistencia
     */
    testPersistence() {
        console.group('✓ Test 8: Persistencia en localStorage');
        const undoData = localStorage.getItem('invitacion_history_undo');
        const redoData = localStorage.getItem('invitacion_history_redo');

        const result = {
            passed: undoData !== null,
            undoExists: !!undoData,
            redoExists: !!redoData,
            undoSize: undoData?.length || 0,
            redoSize: redoData?.length || 0
        };

        if (undoData) {
            try {
                const parsed = JSON.parse(undoData);
                result.undoCount = parsed.length;
                result.sampleUndo = parsed[0]?.meta;
            } catch (e) {
                result.parseError = e.message;
            }
        }

        console.log(result.passed ? '✅ PASS' : '⚠️  WARN', 'Persistencia:', result);
        console.groupEnd();
        return result.passed;
    },

    /**
     * Test 9: Validar limpieza de historial
     */
    testClearHistory() {
        console.group('✓ Test 9: Limpieza de Historial');
        const manager = window.invitationEditor?.historyManager;

        if (!manager) {
            console.error('❌ FAIL: HistoryManager no encontrado');
            console.groupEnd();
            return false;
        }

        // Guardar estado actual
        const initialUndoCount = manager.undoStack.length;
        const initialRedoCount = manager.redoStack.length;

        // Agregar una acción de prueba
        manager.saveState({ test: 'data' }, 'Test action');
        const afterSaveUndo = manager.undoStack.length;

        // Ejecutar clearHistory
        manager.clearHistory();

        const result = {
            passed: manager.undoStack.length === 0 && manager.redoStack.length === 0,
            initialUndo: initialUndoCount,
            initialRedo: initialRedoCount,
            afterSave: afterSaveUndo,
            afterClear: manager.undoStack.length,
            storageCleared: !localStorage.getItem('invitacion_history_undo') && !localStorage.getItem('invitacion_history_redo')
        };

        console.log(result.passed ? '✅ PASS' : '❌ FAIL', 'Limpieza de historial:', result);

        if (!result.passed) {
            console.error('⚠️ El historial no se limpió completamente');
            console.log('Undo stack:', manager.undoStack);
            console.log('Redo stack:', manager.redoStack);
        }

        console.groupEnd();
        return result.passed;
    },

    /**
     * Forzar reinicialización (útil para debugging)
     */
    testForceInit() {
        console.group('🔧 Forzar Reinicialización');
        const manager = window.invitationEditor?.historyManager;
        if (!manager) {
            console.error('❌ HistoryManager no encontrado');
            console.groupEnd();
            return;
        }

        // Remover grupos existentes
        document.querySelectorAll('.history-split-group').forEach(g => {
            const btn = g.querySelector('.tool-btn');
            if (btn) g.parentNode.insertBefore(btn, g);
            g.remove();
        });

        // Remover menús
        document.querySelectorAll('.history-dropdown-menu').forEach(m => m.remove());

        // Reinicializar
        if (window.HistoryDropdown) {
            new HistoryDropdown(manager, 'undo').init();
            new HistoryDropdown(manager, 'redo').init();
            console.log('✅ Dropdowns reinicializados');
        }

        console.groupEnd();
    },

    /**
     * Ejecutar todos los tests
     */
    async runAll() {
        console.clear();
        console.log('%c🧪 HISTORY DROPDOWN DIAGNOSTIC SUITE', 'font-size: 16px; font-weight: bold; color: #8B5CF6');
        console.log('═'.repeat(60));

        const results = {
            classExport: this.testClassExport(),
            managerInit: this.testManagerInit(),
            splitButton: this.testSplitButtonUI(),
            dropdownDOM: this.testDropdownMenuDOM(),
            actionMapping: this.testActionMapping(),
            cssStyles: this.testCSSStyles(),
            persistence: this.testPersistence(),
            clearHistory: this.testClearHistory()
        };

        const passed = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;

        console.log('═'.repeat(60));
        console.log(`%c📊 RESULTADO: ${passed}/${total} tests pasados`,
            `font-size: 14px; font-weight: bold; color: ${passed === total ? '#10B981' : '#F59E0B'}`);

        if (passed < total) {
            console.log('\n%c⚠️  RECOMENDACIONES:', 'font-weight: bold; color: #F59E0B');
            if (!results.splitButton) console.log('• Ejecutar: HistoryDropdownDiagnostics.testForceInit()');
            if (!results.actionMapping) console.log('• Verificar que editor.js esté pasando actionName a saveState()');
            if (!results.dropdownDOM) console.log('• Verificar que history-dropdown.js esté cargado');
        }

        console.log('\n%c💡 TEST INTERACTIVO:', 'font-weight: bold; color: #3B82F6');
        console.log('• Ejecutar: HistoryDropdownDiagnostics.testDropdownOpenClose()');

        return results;
    }
};

// Auto-exportar
window.HistoryDropdownDiagnostics = HistoryDropdownDiagnostics;

console.log('%c✅ Diagnósticos cargados', 'color: #10B981; font-weight: bold');
console.log('Ejecutar: HistoryDropdownDiagnostics.runAll()');
