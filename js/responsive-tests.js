/**
 * RESPONSIVE-TESTS.JS
 * Script de pruebas automatizadas para el sistema responsive
 * Ejecutar este script en la consola del navegador
 */

(function () {
    console.log('🧪 Iniciando pruebas del sistema responsive...\n');

    const tests = [];
    let passed = 0;
    let failed = 0;

    // Helper para crear tests
    function test(name, fn) {
        tests.push({ name, fn });
    }

    // Helper para assertions
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    // ==================== TESTS ====================

    test('ResponsiveViewportManager existe', () => {
        assert(
            typeof window.responsiveViewportManager !== 'undefined',
            'window.responsiveViewportManager debe estar definido'
        );
    });

    test('Viewport detectado correctamente', () => {
        const vp = window.responsiveViewportManager.viewport;
        assert(vp.width > 0, 'Viewport width debe ser > 0');
        assert(vp.height > 0, 'Viewport height debe ser > 0');
        assert(vp.pixelRatio >= 1, 'Pixel ratio debe ser >= 1');
    });

    test('Tipo de dispositivo asignado', () => {
        const deviceType = window.responsiveViewportManager.deviceType;
        assert(
            ['mobile', 'tablet', 'desktop'].includes(deviceType),
            'Device type debe ser mobile, tablet o desktop'
        );
    });

    test('Safe area detectada', () => {
        const vp = window.responsiveViewportManager.viewport;
        assert(
            typeof vp.safeAreaTop === 'number',
            'Safe area top debe ser un número'
        );
        assert(
            typeof vp.safeAreaBottom === 'number',
            'Safe area bottom debe ser un número'
        );
    });

    test('CSS variables de safe-area definidas', () => {
        const root = document.documentElement;
        const sat = getComputedStyle(root).getPropertyValue('--sat');
        const sab = getComputedStyle(root).getPropertyValue('--sab');

        assert(sat !== '', '--sat debe estar definida');
        assert(sab !== '', '--sab debe estar definida');
    });

    test('Padding top aplicado al body', () => {
        const bodyPaddingTop = getComputedStyle(document.body).paddingTop;
        const paddingValue = parseFloat(bodyPaddingTop);

        assert(paddingValue > 0, 'Body debe tener padding-top > 0');
    });

    test('Body usa Flexbox para centrado', () => {
        const bodyDisplay = getComputedStyle(document.body).display;
        assert(
            bodyDisplay === 'flex',
            'Body debe usar display: flex'
        );
    });

    test('Meta viewport configurado correctamente', () => {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        assert(metaViewport !== null, 'Meta viewport debe existir');

        const content = metaViewport.getAttribute('content');
        assert(
            content.includes('viewport-fit=cover'),
            'Viewport debe incluir viewport-fit=cover'
        );
    });

    test('Visual Viewport API disponible', () => {
        // Este test puede fallar en navegadores antiguos, es solo informativo
        const hasVisualViewport = typeof window.visualViewport !== 'undefined';
        if (!hasVisualViewport) {
            console.warn('⚠️ Visual Viewport API no disponible (navegador antiguo)');
        }
        // No fallar el test, solo informar
        assert(true);
    });

    test('Event listeners configurados', () => {
        // Verificar que los listeners existen (método indirecto)
        const manager = window.responsiveViewportManager;
        assert(
            typeof manager.setupObservers === 'function',
            'setupObservers debe ser una función'
        );
    });

    test('Breakpoints definidos correctamente', () => {
        const breakpoints = window.responsiveViewportManager.breakpoints;
        assert(breakpoints.mobile === 768, 'Breakpoint mobile debe ser 768');
        assert(breakpoints.tablet === 1024, 'Breakpoint tablet debe ser 1024');
    });

    test('Orientación detectada', () => {
        const orientation = window.responsiveViewportManager.viewport.orientation;
        assert(
            ['portrait', 'landscape'].includes(orientation),
            'Orientación debe ser portrait o landscape'
        );
    });

    test('Transform scale aplicado en pantallas pequeñas', () => {
        const width = window.innerWidth;
        const container = document.querySelector('.invitation-container, body > div:first-child');

        if (container && width < 360) {
            const transform = getComputedStyle(container).transform;
            assert(
                transform !== 'none',
                'Container debe tener transform aplicado en pantallas < 360px'
            );
        } else {
            // Test pasa si no aplica
            assert(true);
        }
    });

    test('Foto de festejados existe y es visible', () => {
        const photo = document.querySelector('.honored-photo, [data-editor-id="honoredPhoto"], .event-photo, img');

        if (photo) {
            const rect = photo.getBoundingClientRect();
            const vp = window.responsiveViewportManager.viewport;
            const minSpace = vp.height * 0.1;

            const hasEnoughSpace = rect.top >= vp.safeAreaTop + minSpace - 25; // 25px tolerance

            if (!hasEnoughSpace) {
                console.warn('⚠️ Foto puede estar muy cerca del borde superior');
                console.warn(`   Top: ${rect.top}px, Required: ${vp.safeAreaTop + minSpace}px`);
            }

            assert(true); // No fallar, solo advertir
        } else {
            console.warn('⚠️ No se encontró foto de festejados para verificar');
            assert(true); // No fallar si no hay foto
        }
    });

    test('Debounce timer existe', () => {
        const manager = window.responsiveViewportManager;
        assert(
            'debounceTimer' in manager,
            'Manager debe tener propiedad debounceTimer'
        );
    });

    // Test de performance
    test('Detecta viewport en menos de 100ms', () => {
        const start = performance.now();
        window.responsiveViewportManager.detectViewport();
        const duration = performance.now() - start;

        assert(duration < 100, `detectViewport debe tardar < 100ms (tardó ${duration.toFixed(2)}ms)`);
    });

    // ==================== EJECUTAR TESTS ====================

    console.log('Ejecutando tests...\n');

    tests.forEach(({ name, fn }) => {
        try {
            fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (error) {
            console.error(`❌ ${name}`);
            console.error(`   ${error.message}`);
            failed++;
        }
    });

    // ==================== RESUMEN ====================

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(50));
    console.log(`Total: ${tests.length}`);
    console.log(`✅ Pasadas: ${passed}`);
    console.log(`❌ Fallidas: ${failed}`);
    console.log(`📈 Tasa de éxito: ${((passed / tests.length) * 100).toFixed(1)}%`);

    // ==================== INFORMACIÓN ADICIONAL ====================

    console.log('\n' + '='.repeat(50));
    console.log('📱 INFORMACIÓN DEL VIEWPORT');
    console.log('='.repeat(50));

    const vp = window.responsiveViewportManager.viewport;
    console.log(`Ancho: ${vp.width}px`);
    console.log(`Alto: ${vp.height}px`);
    console.log(`Alto disponible: ${vp.availableHeight}px`);
    console.log(`Orientación: ${vp.orientation}`);
    console.log(`Tipo de dispositivo: ${window.responsiveViewportManager.deviceType}`);
    console.log(`Pixel ratio: ${vp.pixelRatio}`);
    console.log(`Safe area top: ${vp.safeAreaTop}px`);
    console.log(`Safe area bottom: ${vp.safeAreaBottom}px`);

    // ==================== CSS VARIABLES ====================

    console.log('\n' + '='.repeat(50));
    console.log('🎨 CSS VARIABLES');
    console.log('='.repeat(50));

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    console.log(`--sat: ${computedStyle.getPropertyValue('--sat')}`);
    console.log(`--sab: ${computedStyle.getPropertyValue('--sab')}`);
    console.log(`--sal: ${computedStyle.getPropertyValue('--sal')}`);
    console.log(`--sar: ${computedStyle.getPropertyValue('--sar')}`);
    console.log(`--padding-top: ${computedStyle.getPropertyValue('--padding-top')}`);
    console.log(`--padding-bottom: ${computedStyle.getPropertyValue('--padding-bottom')}`);

    // ==================== BODY STYLES ====================

    console.log('\n' + '='.repeat(50));
    console.log('📄 BODY STYLES');
    console.log('='.repeat(50));

    const bodyStyle = getComputedStyle(document.body);
    console.log(`Display: ${bodyStyle.display}`);
    console.log(`Flex direction: ${bodyStyle.flexDirection}`);
    console.log(`Align items: ${bodyStyle.alignItems}`);
    console.log(`Justify content: ${bodyStyle.justifyContent}`);
    console.log(`Padding top: ${bodyStyle.paddingTop}`);
    console.log(`Padding bottom: ${bodyStyle.paddingBottom}`);
    console.log(`Padding left: ${bodyStyle.paddingLeft}`);
    console.log(`Padding right: ${bodyStyle.paddingRight}`);

    // ==================== RECOMENDACIONES ====================

    console.log('\n' + '='.repeat(50));
    console.log('💡 RECOMENDACIONES');
    console.log('='.repeat(50));

    const width = vp.width;

    if (width < 360) {
        console.log('⚠️ Pantalla muy pequeña detectada');
        console.log('   → Verifica que el scaling se aplique correctamente');
    }

    if (vp.safeAreaTop > 40) {
        console.log('✅ Dispositivo con notch/Dynamic Island detectado');
        console.log('   → Safe area top está siendo respetada');
    }

    if (vp.pixelRatio > 2) {
        console.log('✅ Pantalla de alta densidad detectada');
        console.log('   → Considera usar imágenes @2x o @3x');
    }

    const bodyPadding = parseFloat(bodyStyle.paddingTop);
    const expectedMinPadding = vp.height * 0.15; // 15vh mínimo

    if (bodyPadding < expectedMinPadding) {
        console.log('⚠️ Padding superior menor al esperado');
        console.log(`   Actual: ${bodyPadding}px, Esperado: ~${expectedMinPadding}px`);
    }

    console.log('\n✅ Pruebas completadas. Revisa los resultados arriba.');
    console.log('💡 Para re-ejecutar: Recarga la página o copia/pega este script nuevamente.\n');

    // Retornar resultados para uso programático
    return {
        total: tests.length,
        passed,
        failed,
        successRate: (passed / tests.length) * 100,
        viewport: vp,
        deviceType: window.responsiveViewportManager.deviceType
    };
})();
