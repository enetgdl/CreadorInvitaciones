# Sistema Responsive de Invitaciones Digitales

## Descripción General

Sistema avanzado de diseño responsivo que garantiza que las invitaciones digitales se visualicen correctamente en cualquier dispositivo móvil, tablet o desktop, considerando características especiales como el notch de iOS y las barras de navegación de Android.

## Características Implementadas

### 1. Meta Viewport Optimizado
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

- **viewport-fit=cover**: Permite que el contenido se extienda hasta los bordes de la pantalla en dispositivos con notch
- **user-scalable=no**: Previene el zoom accidental en dispositivos móviles
- **apple-mobile-web-app-capable**: Habilita modo fullscreen en iOS cuando se agrega a la pantalla de inicio

### 2. Safe Area Variables (CSS)

Variables CSS que detectan automáticamente las áreas seguras del dispositivo:

```css
:root {
    --sat: env(safe-area-inset-top, constant(safe-area-inset-top, 0px));
    --sab: env(safe-area-inset-bottom, constant(safe-area-inset-bottom, 0px));
    --sal: env(safe-area-inset-left, constant(safe-area-inset-left, 0px));
    --sar: env(safe-area-inset-right, constant(safe-area-inset-right, 0px));
}
```

**Fallbacks implementados:**
- `env()` - Navegadores modernos (Chrome 69+, Safari 11.1+)
- `constant()` - iOS 11.0-11.1
- `0px` - Navegadores antiguos

### 3. Padding Superior Dinámico

```css
--padding-top: max(var(--sat), 15vh);
```

- **Móvil**: 20vh + safe-area-top
- **Tablet**: 18vh + safe-area-top
- **Desktop**: 15vh + safe-area-top
- **Landscape**: 10vh + safe-area-top (tablets y móviles)

Este padding garantiza que el contenido nunca quede oculto detrás del notch o barra de estado.

### 4. Breakpoints Específicos

#### Móvil (< 768px)
```css
@media (max-width: 767px) {
    html { font-size: 75%; }
    body {
        padding-left: max(var(--sal), 5vw);
        padding-right: max(var(--sar), 5vw);
    }
}
```

#### Tablet (768px - 1024px)
```css
@media (min-width: 768px) and (max-width: 1024px) {
    html { font-size: 80%; }
}
```

#### Desktop (> 1024px)
```css
@media (min-width: 1025px) {
    html { font-size: 85%; }
}
```

### 5. Centrado Automático

```css
body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}
```

Garantiza que el contenido siempre esté centrado horizontalmente.

### 6. JavaScript Responsive Viewport Manager

Clase JavaScript inyectada automáticamente que:

- **Detecta viewport**: Ancho, alto, pixel ratio, safe-area
- **Aplica estilos responsivos**: Ajusta containers según tipo de dispositivo
- **Verifica visibilidad de fotos**: Asegura que la foto del festejado tenga al menos 10% de espacio superior
- **Observa cambios**: Re-calcula en eventos `resize` y `orientationchange`
- **Soporta Visual Viewport API**: Para detectar cambios al mostrar/ocultar barras del navegador

#### Métodos Principales

```javascript
detectViewport()          // Detecta dimensiones y características
getSafeAreaInset(side)    // Obtiene valores de safe-area
applyResponsiveStyles()   // Aplica estilos según dispositivo
ensurePhotoVisibility()   // Ajusta padding si foto está cortada
setupObservers()          // Configura listeners de eventos
```

### 7. Transform Scale para Pantallas Pequeñas

Para dispositivos con width < 360px:

```javascript
if (this.viewport.width < 360) {
    const scale = this.viewport.width / 360;
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = 'top center';
}
```

## Flujo de Renderizado

1. **HTML se genera** con meta viewport optimizado
2. **CSS aplica** safe-area y breakpoints
3. **Body usa Flexbox** para centrado
4. **JavaScript inicia** ResponsiveViewportManager
5. **Se detecta viewport** y tipo de dispositivo
6. **Se aplican estilos** específicos
7. **Se verifica foto** y ajusta padding si es necesario
8. **Se observan eventos** para ajustes dinámicos

## Pruebas Recomendadas

### Dispositivos iOS

#### iPhone X/XS/11 Pro (Portrait)
- Viewport: 375x812
- Safe Area Top: ~44px (notch)
- Safe Area Bottom: ~34px (home indicator)

#### iPhone 12/13/14 (Portrait)
- Viewport: 390x844
- Safe Area Top: ~47px
- Safe Area Bottom: ~34px

#### iPhone 14 Pro Max (Portrait)
- Viewport: 430x932
- Safe Area Top: ~59px (Dynamic Island)
- Safe Area Bottom: ~34px

**Verificar:**
- [ ] Contenido no queda detrás del notch
- [ ] Home indicator no cubre contenido inferior
- [ ] Foto del festejado visible con espacio superior
- [ ] Rotación a landscape funciona correctamente

### Dispositivos Android

#### Samsung Galaxy S21/S22 (Portrait)
- Viewport: 360x800
- Safe Area: Variable según navegador

#### Google Pixel 6/7 (Portrait)
- Viewport: 412x915
- Safe Area: Variable

**Verificar:**
- [ ] Barra de estado no cubre contenido
- [ ] Navegación por gestos funciona
- [ ] Content se adapta al cambiar orientación

### Tablets

#### iPad Pro 11" (Portrait)
- Viewport: 834x1194

#### iPad Air (Portrait)
- Viewport: 820x1180

**Verificar:**
- [ ] Contenido centrado correctamente
- [ ] Tamaño de fuente apropiado (80%)
- [ ] Máximo ancho de 720px aplicado

### Herramientas de Prueba

#### Chrome DevTools
1. Abrir DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Seleccionar dispositivo preconfigurado
4. Probar rotación con icono de rotación
5. Verificar en "Network" que no haya errores

#### Simulador iOS (Mac)
```bash
xcode-select --install  # Instalar Xcode
xcrun simctl list      # Listar simuladores
```

#### Emulador Android
```bash
# Android Studio > AVD Manager
```

#### BrowserStack / LambdaTest
Servicios cloud para probar en dispositivos reales remotamente.

### Escenarios de Prueba

#### Test 1: Notch de iPhone X
1. Abrir en iPhone X (real o simulador)
2. Verificar que el título no quede detrás del notch
3. Scroll down/up - debe mantener padding

#### Test 2: Rotación en Tablet
1. Abrir en iPad
2. Rotar de portrait a landscape
3. Verificar que el layout se ajuste
4. Padding debe cambiar a 10vh en landscape

#### Test 3: Foto Cortada
1. Reducir padding-top artificialmente
2. Sistema debe detectar y agregar padding
3. Console debe mostrar: "⚠️ Photo adjusted: +Xpx"

#### Test 4: Pantalla Muy Pequeña (< 360px)
1. Simular Galaxy Fold cerrado (280px)
2. Container debe aplicar `transform: scale(0.78)`
3. Contenido debe ser legible

#### Test 5: Navegador sin env()
1. Abrir en navegador antiguo (IE11, Safari 10)
2. Debe aplicar fallback de 0px
3. Padding-top debe ser solo 15-20vh

## Logs de Debugging

Abrir Console del navegador para ver:

```
✅ Responsive initialized { width: 390, height: 844, ... }
⚠️ Photo adjusted: +25px
🔄 Orientation changed to landscape
```

## Variables Globales Disponibles

```javascript
window.responsiveViewportManager.viewport
// { width, height, safeAreaTop, ... }

window.responsiveViewportManager.deviceType
// 'mobile' | 'tablet' | 'desktop'
```

## Eventos Personalizados

```javascript
window.addEventListener('viewportRecalculated', (e) => {
    console.log('Nuevo viewport:', e.detail);
});
```

## Limitaciones Conocidas

1. **Safe-area en Android**: Soporte variable según navegador
2. **Pixel ratio alto**: En dispositivos con pixel ratio > 3, algunas fuentes pueden verse pequeñas
3. **Navegadores antiguos**: IE11 no soporta CSS variables ni env()

## Optimizaciones Futuras

- [ ] Lazy loading de imágenes según viewport
- [ ] Ajuste dinámico de tamaño de fuente según orientación
- [ ] Cache de cálculos de viewport en localStorage
- [ ] Detección de slow network para reducir calidad de medios
- [ ] Integración con Intersection Observer para elementos lazy

## Código de Ejemplo

### Agregar padding custom a un elemento

```javascript
document.addEventListener('viewportRecalculated', (e) => {
    const myElement = document.querySelector('.my-element');
    if (e.detail.deviceType === 'mobile') {
        myElement.style.padding = '2rem';
    }
});
```

### Ajustar contenido según orientación

```javascript
const manager = window.responsiveViewportManager;
if (manager.viewport.orientation === 'landscape') {
    // Reducir tamaño de imágenes
}
```

## Soporte de Navegadores

| Navegador | Versión Mínima | Safe Area | Visual Viewport |
|-----------|----------------|-----------|-----------------|
| Chrome    | 69+            | ✅        | ✅              |
| Safari    | 11.1+          | ✅        | ✅              |
| Firefox   | 69+            | ✅        | ✅              |
| Edge      | 79+            | ✅        | ✅              |
| Samsung   | 10+            | ✅        | ✅              |

## Autor

Sistema desarrollado para el Creador de Invitaciones Digitales.

## Licencia

Uso interno del proyecto.
