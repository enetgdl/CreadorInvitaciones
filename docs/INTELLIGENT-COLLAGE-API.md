# 📚 API Documentation - Intelligent Collage Generator

**Version**: 2.0.0  
**Author**: AI Assistant  
**Date**: 2026-02-03  
**License**: MIT

---

## 📖 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Instalación](#instalación)
3. [Inicio Rápido](#inicio-rápido)
4. [API Reference](#api-reference)
5. [Configuración](#configuración)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Métricas de Rendimiento](#métricas-de-rendimiento)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

`IntelligentCollageGenerator` es un generador avanzado de collages que combina:

- **Detección automática de orientación** con umbral configurable
- **Redimensionamiento inteligente** que preserva proporciones
- **Interpolación de alta calidad** (bicúbica/Lanczos)
- **Layout vertical optimizado** con márgenes consistentes
- **Procesamiento paralelo** con límites de memoria y timeout
- **Manejo robusto de errores** con reportes detallados

---

## 📦 Instalación

### Opción 1: Incluir directamente en HTML

```html
<script src="js/intelligent-collage-generator.js"></script>
<script>
    const generator = new IntelligentCollageGenerator();
</script>
```

### Opción 2: Import ES6

```javascript
import IntelligentCollageGenerator from './js/intelligent-collage-generator.js';
```

### Opción 3: Node.js/CommonJS

```javascript
const IntelligentCollageGenerator = require('./intelligent-collage-generator');
```

---

## 🚀 Inicio Rápido

### Ejemplo Básico

```javascript
// 1. Crear instancia
const generator = new IntelligentCollageGenerator({
    maxWidth: 1080,
    margin: 15,
    quality: 0.92
});

// 2. Preparar imágenes (pueden ser File, Blob o Data URLs)
const files = document.getElementById('fileInput').files;

// 3. Generar collage
const result = await generator.generateCollage(Array.from(files));

// 4. Usar resultado
if (result.success) {
    document.getElementById('output').src = result.dataURL;
    console.log('Collage generado:', result.metrics);
} else {
    console.error('Error:', result.error);
}
```

---

## 📘 API Reference

### Constructor

```javascript
new IntelligentCollageGenerator(options?)
```

**Parámetros:**

| Nombre | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `options` | `Object` | `{}` | Objeto de configuración |

**Opciones de Configuración:**

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `maxWidth` | `number` | `1080` | Ancho máximo del collage (px) |
| `marginBetweenImages` | `number` | `15` | Margen entre imágenes (px) |
| `backgroundColor` | `string` | `'transparent'` | Color de fondo (CSS color o 'transparent') |
| `compressionQuality` | `number` | `0.92` | Calidad de compresión (0.0 - 1.0) |
| `interpolation` | `string` | `'bicubic'` | Algoritmo: 'bicubic', 'lanczos', 'bilinear', 'nearest' |
| `outputFormat` | `string` | `'image/jpeg'` | Formato de salida: 'image/jpeg', 'image/png', 'image/webp' |
| `squareThreshold` | `number` | `0.05` | Umbral para detectar imágenes cuadradas (5%) |
| `maxImages` | `number` | `Infinity` | Límite de imágenes a procesar |
| `timeout` | `number` | `30000` | Timeout por imagen en ms |
| `maxMemoryMB` | `number` | `512` | Límite de memoria estimado (MB) |

**Ejemplo:**

```javascript
const generator = new IntelligentCollageGenerator({
    maxWidth: 1200,
    margin: 20,
    backgroundColor: '#FFFFFF',
    quality: 0.95,
    interpolation: 'lanczos',
    outputFormat: 'image/webp',
    maxImages: 50
});
```

---

### Métodos Principales

#### `detectOrientation(width, height)`

Detecta la orientación de una imagen basada en sus dimensiones.

**Parámetros:**

- `width` (number): Ancho de la imagen
- `height` (number): Alto de la imagen

**Retorna:** `'vertical'` | `'horizontal'` | `'square'`

**Ejemplo:**

```javascript
const orientation = generator.detectOrientation(1920, 1080);
console.log(orientation); // 'horizontal'

const orientation2 = generator.detectOrientation(1080, 1920);
console.log(orientation2); // 'vertical'

const orientation3 = generator.detectOrientation(1000, 1000);
console.log(orientation3); // 'square'
```

**Lógica de detección:**

```javascript
aspectRatio = width / height

if (|aspectRatio - 1.0| <= squareThreshold):
    return 'square'
else if (height > width):
    return 'vertical'
else:
    return 'horizontal'
```

---

#### `intelligentResize(img, targetWidth)`

Redimensiona una imagen manteniendo proporciones y aplicando interpolación de alta calidad.

**Parámetros:**

- `img` (HTMLImageElement): Imagen a redimensionar
- `targetWidth` (number): Ancho objetivo en píxeles

**Retorna:** `Promise<Object>`

```typescript
{
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number,
    aspectRatio: number
}
```

**Ejemplo:**

```javascript
const img = new Image();
img.src = 'photo.jpg';

img.onload = async () => {
    const resized = await generator.intelligentResize(img, 800);
    
    console.log('Original:', resized.originalWidth, 'x', resized.originalHeight);
    console.log('Nueva:', resized.width, 'x', resized.height);
    console.log('Aspect ratio preservado:', resized.aspectRatio);
    
    // Mostrar resultado
    document.body.appendChild(resized.canvas);
};
```

**Características:**

- ✅ No amplía imágenes (evita pérdida de calidad)
- ✅ Calcula altura proporcional automáticamente
- ✅ Aplica devicePixelRatio para pantallas Retina
- ✅ Usa interpolación bicúbica/Lanczos por defecto
- ✅ Sin distorsión ni padding

---

#### `generateCollage(sources)`

Genera un collage vertical a partir de múltiples imágenes.

**Parámetros:**

- `sources` (Array<File|Blob|string>): Array de fuentes de imágenes

**Retorna:** `Promise<Object>`

```typescript
{
    success: boolean,
    dataURL?: string,           // Data URL del collage final
    width?: number,
    height?: number,
    images?: Array<Object>,     // Imágenes procesadas
    errors?: Array<Object>,     // Errores encontrados
    metrics?: Object,           // Métricas de rendimiento
    error?: string              // Error general (si success = false)
}
```

**Ejemplo Completo:**

```javascript
// Obtener archivos del input
const fileInput = document.getElementById('imageInput');
const files = Array.from(fileInput.files);

// Generar collage
const result = await generator.generateCollage(files);

if (result.success) {
    // Mostrar collage
    const img = document.createElement('img');
    img.src = result.dataURL;
    document.getElementById('output').appendChild(img);
    
    // Mostrar estadísticas
    console.log(`
        Dimensiones: ${result.width}x${result.height}
        Imágenes procesadas: ${result.metrics.imagesProcessed}
        Tiempo total: ${result.metrics.totalProcessTime.toFixed(2)}ms
        Tamaño: ${result.metrics.collageSizeMB.toFixed(2)}MB
    `);
    
    // Revisar errores parciales
    if (result.errors.length > 0) {
        console.warn('Algunas imágenes fallaron:', result.errors);
    }
} else {
    console.error('Error generando collage:', result.error);
}
```

---

#### `processImage(source, index)`

Procesa una imagen individual (uso interno, pero accesible).

**Parámetros:**

- `source` (File|Blob|string): Fuente de la imagen
- `index` (number): Índice de la imagen

**Retorna:** `Promise<Object>`

```typescript
{
    id: string,
    dataURL: string,
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number,
    orientation: string,
    aspectRatio: number,
    memorySizeMB: number,
    processTimeMs: number,
    index: number
}
```

---

#### `getMetrics()`

Obtiene métricas de rendimiento de la última operación.

**Retorna:** `Object`

```typescript
{
    totalProcessTime: number,      // Tiempo total (ms)
    averageResizeTime: number,     // Promedio por imagen (ms)
    totalMemoryUsed: number,       // Memoria total (MB)
    imagesProcessed: number,       // Imágenes exitosas
    imagesFailed: number,          // Imágenes fallidas
    collageWidth: number,
    collageHeight: number,
    collageSizeMB: number         // Tamaño del collage final
}
```

**Ejemplo:**

```javascript
const result = await generator.generateCollage(images);
const metrics = generator.getMetrics();

console.log(`Rendimiento:
    - Tiempo total: ${metrics.totalProcessTime}ms
    - Por imagen: ${metrics.averageResizeTime}ms
    - Memoria: ${metrics.totalMemoryUsed.toFixed(2)}MB
    - Tasa de éxito: ${metrics.imagesProcessed}/${metrics.imagesProcessed + metrics.imagesFailed}
`);
```

---

#### `reset()`

Limpia el estado interno del generador.

**Ejemplo:**

```javascript
generator.reset();
console.log(generator.getMetrics()); // Métricas en cero
```

---

## 🎨 Ejemplos de Uso

### Ejemplo 1: Collage Básico con Drag & Drop

```html
<div id="dropzone">Arrastra imágenes aquí</div>
<img id="output" />
```

```javascript
const dropzone = document.getElementById('dropzone');
const output = document.getElementById('output');
const generator = new IntelligentCollageGenerator();

dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    dropzone.textContent = 'Procesando...';
    
    const result = await generator.generateCollage(files);
    
    if (result.success) {
        output.src = result.dataURL;
        dropzone.textContent = `✓ Collage de ${result.metrics.imagesProcessed} imágenes generado`;
    } else {
        dropzone.textContent = `✗ Error: ${result.error}`;
    }
});

dropzone.addEventListener('dragover', (e) => e.preventDefault());
```

---

### Ejemplo 2: Collage con Configuración Personalizada

```javascript
const generator = new IntelligentCollageGenerator({
    maxWidth: 1920,              // Collage 1080p
    margin: 20,                  // Márgenes más amplios
    backgroundColor: '#F5F5F5',  // Fondo gris claro
    quality: 0.98,               // Máxima calidad
    outputFormat: 'image/png'    // PNG sin pérdida
});

const result = await generator.generateCollage(imageFiles);

// Descargar resultado
if (result.success) {
    const a = document.createElement('a');
    a.href = result.dataURL;
    a.download = 'collage.png';
    a.click();
}
```

---

### Ejemplo 3: Procesamiento con Progress Callback

```javascript
class ProgressCollageGenerator extends IntelligentCollageGenerator {
    async generateCollage(sources, onProgress) {
        this.errors = [];
        this.processedImages = [];
        
        for (let i = 0; i < sources.length; i++) {
            try {
                const processed = await this.processImage(sources[i], i);
                this.processedImages.push(processed);
                
                // Callback de progreso
                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: sources.length,
                        percentage: ((i + 1) / sources.length) * 100
                    });
                }
            } catch (error) {
                this.errors.push({ index: i, error: error.message });
            }
        }
        
        // Continuar con el resto del proceso...
        return super.generateCollage(sources);
    }
}

// Uso
const generator = new ProgressCollageGenerator();
const progressBar = document.getElementById('progress');

const result = await generator.generateCollage(files, (progress) => {
    progressBar.style.width = progress.percentage + '%';
    progressBar.textContent = `${progress.current}/${progress.total}`;
});
```

---

### Ejemplo 4: Validación Antes de Procesar

```javascript
// Validar archivos antes de generar collage
function validateFiles(files) {
    const errors = [];
    const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeMB = 10;
    
    files.forEach((file, i) => {
        if (!validFormats.includes(file.type)) {
            errors.push(`Archivo ${i + 1}: formato no soportado (${file.type})`);
        }
        
        if (file.size > maxSizeMB * 1024 * 1024) {
            errors.push(`Archivo ${i + 1}: demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        }
    });
    
    return errors;
}

// Uso
const files = Array.from(fileInput.files);
const validationErrors = validateFiles(files);

if (validationErrors.length > 0) {
    alert('Errores de validación:\n' + validationErrors.join('\n'));
} else {
    const result = await generator.generateCollage(files);
}
```

---

### Ejemplo 5: Comparación de Algoritmos de Interpolación

```javascript
async function compareInterpolations(imageFile) {
    const algorithms = ['bicubic', 'bilinear', 'nearest'];
    const results = {};
    
    for (const algo of algorithms) {
        const generator = new IntelligentCollageGenerator({
            interpolation: algo,
            maxWidth: 800
        });
        
        const start = performance.now();
        const result = await generator.generateCollage([imageFile]);
        const duration = performance.now() - start;
        
        results[algo] = {
            dataURL: result.dataURL,
            time: duration,
            size: result.metrics.collageSizeMB
        };
    }
    
    return results;
}

// Mostrar comparación
const comparison = await compareInterpolations(myImage);
console.table(comparison);
```

---

## ⚡ Métricas de Rendimiento

### Benchmarks Esperados

| Escenario | Imágenes | Resolución Promedio | Tiempo Esperado | Memoria |
|-----------|----------|---------------------|-----------------|---------|
| **Básico** | 5 | 1920x1080 | < 2s | ~50MB |
| **Medio** | 20 | 2560x1440 | < 8s | ~200MB |
| **Avanzado** | 50 | 3840x2160 | < 20s | ~500MB |

### Hardware de Referencia

- **CPU**: Intel i5-8th gen o equivalente
- **RAM**: 8GB
- **Browser**: Chrome 120+ / Firefox 122+

### Optimizaciones Implementadas

1. **Procesamiento paralelo** con `Promise.allSettled`
2. **Canvas offscreen** cuando está disponible
3. **devicePixelRatio** para Retina displays
4. **Interpolación bicúbica** GPU-accelerated
5. **Límites de timeout** y memoria

### Ejemplos de Medición

```javascript
// Con performance API
const start = performance.now();
const result = await generator.generateCollage(images);
const duration = performance.now() - start;

console.log(`
    Tiempo total: ${duration.toFixed(2)}ms
    Por imagen: ${(duration / images.length).toFixed(2)}ms
    FPS equivalente: ${(1000 / (duration / images.length)).toFixed(2)}
`);

// Con métricas internas
const metrics = generator.getMetrics();
console.log(`
    Procesamiento: ${metrics.totalProcessTime}ms
    Resize promedio: ${metrics.averageResizeTime}ms
    Memoria usada: ${metrics.totalMemoryUsed}MB
    Collage final: ${metrics.collageSizeMB}MB
`);
```

---

## 🐛 Troubleshooting

### Error: "Formato no soportado"

**Causa**: Archivo no es una imagen válida.

**Solución**:

```javascript
// Verificar antes de procesar
if (!file.type.startsWith('image/')) {
    console.error('El archivo no es una imagen válida');
}
```

---

### Error: "Timeout procesando imagen"

**Causa**: Imagen muy grande o dispositivo lento.

**Solución**:

```javascript
// Aumentar timeout
const generator = new IntelligentCollageGenerator({
    timeout: 60000  // 60 segundos
});
```

---

### Error: "Memoria insuficiente"

**Causa**: Demasiadas imágenes de alta resolución.

**Solución**:

```javascript
// Reducir resolución máxima
const generator = new IntelligentCollageGenerator({
    maxWidth: 800,  // En vez de 1080
    maxMemoryMB: 256  // Límite más estricto
});

// O procesar en lotes
async function processBatch(files, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const result = await generator.generateCollage(batch);
        results.push(result);
        generator.reset(); // Liberar memoria
    }
    
    return results;
}
```

---

### Imágenes se ven borrosas

**Causa**: Interpolación de baja calidad o compresión alta.

**Solución**:

```javascript
const generator = new IntelligentCollageGenerator({
    interpolation: 'lanczos',  // Mejor calidad
    quality: 0.98,             // Compresión mínima
    outputFormat: 'image/png'  // Sin pérdida
});
```

---

### Collage demasiado pesado

**Causa**: Resolución alta + formato PNG.

**Solución**:

```javascript
const generator = new IntelligentCollageGenerator({
    maxWidth: 1080,            // Reducir resolución
    quality: 0.85,             // Más compresión
    outputFormat: 'image/jpeg' // JPEG es más liviano
});
```

---

## 📝 Notas Adicionales

### Compatibilidad de Navegadores

| Browser | Versión Mínima | Notas |
|---------|----------------|-------|
| Chrome | 90+ | Completamente soportado |
| Firefox | 88+ | Completamente soportado |
| Safari | 14+ | Requiere polyfill para `Promise.allSettled` |
| Edge | 90+ | Completamente soportado |

### Limitaciones Conocidas

1. **Formatos SVG**: No soportados (requiere conversión previa)
2. **Imágenes animadas**: Solo se procesa el primer frame
3. **EXIF rotation**: No se preserva automáticamente
4. **Transparencia en JPEG**: Se convierte a fondo sólido

### Próximas Features

- [ ] Soporte para layouts horizontales
- [ ] Collage tipo "grid" configurable
- [ ] Filtros y efectos (blur, sepia, etc.)
- [ ] Exportación multi-formato simultánea
- [ ] Worker threads para procesamiento

---

**Documentado por**: AI Assistant  
**Última actualización**: 2026-02-03  
**Versión de la API**: 2.0.0
