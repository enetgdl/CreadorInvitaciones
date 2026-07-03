# 📄 Corrección de Espaciado y Recorte en Exportación

## 📋 Diagnóstico

Se identificó que la versión anterior utilizaba **unidades de viewport (`vh`) excesivas** (`15vh` ~ `18vh`) para el padding superior como solución temporal para centrar el contenido, y carecía de una hoja de estilos específica para impresión (`@media print`).

Esto causaba:
1. **Recortes en Exportación PDF/Impresión**: El navegador cortaba el contenido (ej. foto de festejados) porque el contenedor tenía alturas fijas visuales o `position: fixed` que impide la paginación correcta.
2. **Espaciado Inconsistente**: El padding dependía de la altura del dispositivo, creando espacios enormes en móviles.

---

## ✅ Solución Implementada

Se ha reescrito la generación de CSS en `js/export.js` para eliminar los parches y usar una arquitectura robusta para exportación.

### 1. Eliminación de Espaciado "Parche"
- **ANTES**: `padding-top: 15vh` (variable).
- **AHORA**: `padding: 2rem 1.5rem` (fijo y consistente).

### 2. Soporte Nativo de Impresión (`@media print`)
Se han añadido reglas específicas que se activan *solo* al imprimir o exportar a PDF:

```css
@media print {
    /* Permitir paginación natural */
    html, body, .invitation-container {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        display: block !important;
    }

    /* Fondo correcto en todas las páginas */
    .invitation-background {
        position: absolute !important; /* Cubre todo el scroll height */
        height: 100% !important;
        z-index: -1;
    }

    /* Evitar cortes a mitad de elementos importantes */
    section, .hero-section, img, .detail-item {
        break-inside: avoid;
        page-break-inside: avoid;
    }

    /* Forzar impresión de colores/fondos */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
}
```

### 3. Valores de Espaciado Finales (Documentación)

| Propiedad | Valor Web (Pantalla) | Valor Print (PDF/Impresión) | Razón |
|-----------|----------------------|-----------------------------|-------|
| `html, body` | `min-height: 100vh` | `height: auto` | Permite scroll/paginación |
| `background` | `position: fixed` | `position: absolute` | `fixed` solo sale en pág 1 |
| Content Padding | `2rem 1.5rem` | `1rem` | Optimiza espacio en papel |
| Page Break | N/A | `avoid` en componentes | Evita cortar fotos/textos |

---

## 🧪 Verificación Realizada

### Pruebas de Exportación
1. **Exportar HTML > Imprimir a PDF (Chrome/Edge)**
   - ✅ La foto de festejados NO se corta.
   - ✅ El fondo aparece en todas las páginas.
   - ✅ No hay espacios en blanco gigantes al inicio.

2. **Resoluciones Móviles (iPhone/Android)**
   - ✅ El archivo HTML exportado se ve correctamente sin padding excesivo superior.
   - ✅ El scroll funciona fluidamente.

3. **Compatibilidad**
   - Funciona en navegadores basados en Chromium (Chrome, Edge, Brave).
   - Funciona en Firefox y Safari (gracias a `print-color-adjust`).

---

## 🚀 Cómo Probar
1. Abrir una invitación.
2. Click en **Exportar** > **Descargar HTML**.
3. Abrir el HTML descargado.
4. Presionar `Ctrl + P` (Imprimir).
5. Verificar en la vista previa que todas las páginas tienen fondo y nada está cortado a la mitad.

---

**Estado**: ✅ **CORREGIDO**
Se eliminaron los hacks temporales y se implementó un estándar de impresión web robusto.
