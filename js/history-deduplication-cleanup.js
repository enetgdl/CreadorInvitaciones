/**
 * HISTORY-DEDUPLICATION-CLEANUP.JS
 * Script de migración para limpiar registros duplicados existentes en localStorage
 */

class HistoryCleanupUtility {
    constructor() {
        this.storageKeyUndo = 'invitacion_history_undo';
        this.storageKeyRedo = 'invitacion_history_redo';
        this.report = {
            undoOriginalCount: 0,
            undoFinalCount: 0,
            undoDuplicatesRemoved: 0,
            redoOriginalCount: 0,
            redoFinalCount: 0,
            redoDuplicatesRemoved: 0
        };
    }

    /**
     * Ejecuta la limpieza completa del historial
     */
    run() {
        console.log('🧹 Iniciando limpieza de duplicados en historial...');

        this.cleanupStack(this.storageKeyUndo, 'Undo');
        this.cleanupStack(this.storageKeyRedo, 'Redo');

        this.printReport();
    }

    /**
     * Limpia un stack específico (undo o redo)
     * @param {string} storageKey 
     * @param {string} stackName 
     */
    cleanupStack(storageKey, stackName) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                console.log(`  ℹ️ ${stackName} stack vacío, nada que limpiar`);
                return;
            }

            const stack = JSON.parse(raw);
            if (!Array.isArray(stack)) {
                console.warn(`  ⚠️ ${stackName} stack inválido, omitiendo`);
                return;
            }

            const originalCount = stack.length;
            const countKey = `${stackName.toLowerCase()}OriginalCount`;
            this.report[countKey] = originalCount;

            console.log(`  📊 ${stackName} stack: ${originalCount} entradas originales`);

            // Eliminar duplicados consecutivos exactos
            const deduplicated = this.removeDuplicates(stack);

            // Eliminar registros genéricos si existe uno más específico para el mismo estado
            const prioritized = this.prioritizeSpecificActions(deduplicated);

            const finalCount = prioritized.length;
            const removedCount = originalCount - finalCount;

            this.report[`${stackName.toLowerCase()}FinalCount`] = finalCount;
            this.report[`${stackName.toLowerCase()}DuplicatesRemoved`] = removedCount;

            // Guardar stack limpio
            localStorage.setItem(storageKey, JSON.stringify(prioritized));

            console.log(`  ✅ ${stackName} stack limpiado: ${removedCount} duplicados eliminados`);

        } catch (e) {
            console.error(`  ❌ Error limpiando ${stackName} stack:`, e);
        }
    }

    /**
     * Elimina entradas duplicadas consecutivas
     * @param {Array} stack 
     * @returns {Array}
     */
    removeDuplicates(stack) {
        if (stack.length <= 1) return stack;

        const result = [stack[0]];

        for (let i = 1; i < stack.length; i++) {
            const current = stack[i];
            const previous = result[result.length - 1];

            const currentState = current.meta ? current.state : current;
            const previousState = previous.meta ? previous.state : previous;

            // Comparar estados
            if (JSON.stringify(currentState) !== JSON.stringify(previousState)) {
                result.push(current);
            } else {
                console.log(`    🗑️ Eliminando duplicado: "${current.meta?.name || 'Sin nombre'}"`);
            }
        }

        return result;
    }

    /**
     * Prioriza acciones específicas sobre genéricas
     * @param {Array} stack 
     * @returns {Array}
     */
    prioritizeSpecificActions(stack) {
        const actionPriority = {
            'Modificación': 0,
            'Editar': 1,
            'Cambio': 2,
            'Ajuste': 2,
            'Aplicar': 3,
            'Crear': 3,
            'Eliminar': 3
        };

        const getActionPriority = (actionName) => {
            for (const [key, priority] of Object.entries(actionPriority)) {
                if (actionName.includes(key)) {
                    return priority;
                }
            }
            return 2;
        };

        // Agrupar por estado similar dentro de ventanas de tiempo
        const grouped = [];
        let currentGroup = [];
        const windowMs = 1000; // 1 segundo

        for (let i = 0; i < stack.length; i++) {
            const entry = stack[i];

            if (currentGroup.length === 0) {
                currentGroup.push(entry);
            } else {
                const lastInGroup = currentGroup[currentGroup.length - 1];
                const timeDiff = Math.abs((entry.meta?.timestamp || 0) - (lastInGroup.meta?.timestamp || 0));

                if (timeDiff < windowMs) {
                    currentGroup.push(entry);
                } else {
                    // Procesar grupo actual
                    grouped.push(this.selectBestFromGroup(currentGroup, getActionPriority));
                    currentGroup = [entry];
                }
            }
        }

        // Procesar último grupo
        if (currentGroup.length > 0) {
            grouped.push(this.selectBestFromGroup(currentGroup, getActionPriority));
        }

        return grouped;
    }

    /**
     * Selecciona la mejor entrada de un grupo (mayor prioridad)
     * @param {Array} group 
     * @param {Function} getPriority 
     * @returns {Object}
     */
    selectBestFromGroup(group, getPriority) {
        if (group.length === 1) return group[0];

        // Seleccionar el de mayor prioridad
        let best = group[0];
        let bestPriority = getPriority(best.meta?.name || 'Modificación');

        for (let i = 1; i < group.length; i++) {
            const current = group[i];
            const currentPriority = getPriority(current.meta?.name || 'Modificación');

            if (currentPriority > bestPriority) {
                best = current;
                bestPriority = currentPriority;
            }
        }

        if (group.length > 1) {
            console.log(`    🎯 Seleccionando "${best.meta?.name}" de ${group.length} opciones (prioridad: ${bestPriority})`);
        }

        return best;
    }

    /**
     * Imprime reporte de limpieza
     */
    printReport() {
        console.log('\n📋 REPORTE DE LIMPIEZA:');
        console.log('═'.repeat(50));
        console.log(`  Undo Stack:`);
        console.log(`    Original:  ${this.report.undoOriginalCount} entradas`);
        console.log(`    Final:     ${this.report.undoFinalCount} entradas`);
        console.log(`    Eliminado: ${this.report.undoDuplicatesRemoved} duplicados`);
        console.log('');
        console.log(`  Redo Stack:`);
        console.log(`    Original:  ${this.report.redoOriginalCount} entradas`);
        console.log(`    Final:     ${this.report.redoFinalCount} entradas`);
        console.log(`    Eliminado: ${this.report.redoDuplicatesRemoved} duplicados`);
        console.log('═'.repeat(50));
        console.log(`  TOTAL ELIMINADO: ${this.report.undoDuplicatesRemoved + this.report.redoDuplicatesRemoved} duplicados`);
        console.log('✅ Limpieza completada.\n');
    }

    /**
     * Crea backup antes de limpiar
     */
    createBackup() {
        const backup = {
            undo: localStorage.getItem(this.storageKeyUndo),
            redo: localStorage.getItem(this.storageKeyRedo),
            timestamp: Date.now()
        };

        const backupKey = `invitacion_history_backup_${backup.timestamp}`;
        localStorage.setItem(backupKey, JSON.stringify(backup));

        console.log(`💾 Backup creado: ${backupKey}`);
        return backupKey;
    }

    /**
     * Restaura desde un backup
     * @param {string} backupKey 
     */
    restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                console.error('❌ Backup no encontrado');
                return false;
            }

            const backup = JSON.parse(backupData);

            if (backup.undo) {
                localStorage.setItem(this.storageKeyUndo, backup.undo);
            }
            if (backup.redo) {
                localStorage.setItem(this.storageKeyRedo, backup.redo);
            }

            console.log('✅ Historial restaurado desde backup');
            return true;

        } catch (e) {
            console.error('❌ Error restaurando backup:', e);
            return false;
        }
    }
}

// Auto-exportar
window.HistoryCleanupUtility = HistoryCleanupUtility;

// Helper global para ejecución rápida
window.cleanupHistoryDuplicates = () => {
    const cleanup = new HistoryCleanupUtility();
    const backupKey = cleanup.createBackup();
    console.log(`ℹ️ Para restaurar: historyCleanup.restoreFromBackup('${backupKey}')`);
    cleanup.run();
    return cleanup;
};

console.log('🧹 Utilidad de limpieza de historial cargada.');
console.log('   Ejecutar: cleanupHistoryDuplicates()');
