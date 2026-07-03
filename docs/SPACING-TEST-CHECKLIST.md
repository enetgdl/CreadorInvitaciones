# ✓ Checklist de Verificación de Espaciado y Exportación

## Pre-Deploy Testing

### 🎨 Verificación Visual (Editor)
- [ ] Abrir el editor en navegador
- [ ] Verificar que el contenido comienza cerca del borde superior
- [ ] Medir espacio superior con DevTools (debe ser ~16px)
- [ ] Confirmar que no hay scroll vertical innecesario
- [ ] Verificar que la foto de festejados está completamente visible

### 📱 Testing Responsive

#### Desktop (1920x1080)
- [ ] Chrome: Espaciado superior ≤ 20px
- [ ] Firefox: Espaciado superior ≤ 20px
- [ ] Edge: Espaciado superior ≤ 20px
- [ ] Safari: Espaciado superior ≤ 20px

#### Tablet (768x1024)
- [ ] Chrome DevTools (iPad): Contenido centrado
- [ ] Firefox Responsive Mode: Sin scroll horizontal
- [ ] Safari iPad Simulator: Espaciado consistente

#### Mobile (375x667)
- [ ] Chrome DevTools (iPhone SE): Todo visible
- [ ] Firefox Responsive Mode: Sin zoom requerido
- [ ] Safari iPhone Simulator: Safe area respetado

### 🖨️ Testing de Exportación

#### Exportación HTML
- [ ] Click en "Exportar" → "Descargar HTML"
- [ ] Abrir archivo descargado en navegador
- [ ] Verificar que el espaciado es idéntico al editor
- [ ] Confirmar que el degradado de fondo es visible

#### Exportación a PDF (Chrome)
- [ ] Abrir invitación exportada
- [ ] Ctrl+P → Guardar como PDF
- [ ] Configuración:
  - [ ] Papel: A4
  - [ ] Orientación: Vertical
  - [ ] Márgenes: Ninguno
  - [ ] Escala: 100%
  - [ ] ✓ Gráficos de fondo
- [ ] Abrir PDF generado
- [ ] Verificar:
  - [ ] 1 página solamente
  - [ ] Foto de festejados completa (no cortada)
  - [ ] Degradado de fondo visible
  - [ ] Texto legible
  - [ ] Sin espacios en blanco excesivos

#### Exportación a PDF (Firefox)
- [ ] Repetir proceso anterior en Firefox
- [ ] Configuración: "Imprimir fondos" activado
- [ ] Verificar colores exactos

#### Exportación a PDF (Safari)
- [ ] Repetir proceso anterior en Safari
- [ ] Verificar que gradientes se renderizan correctamente

### 🖨️ Impresión Física

#### Impresora Láser
- [ ] Conectar impresora HP/Canon/Brother
- [ ] Imprimir invitación
- [ ] Verificar:
  - [ ] Márgenes de ~0.5cm
  - [ ] Foto completa
  - [ ] Colores aceptables (no RGB perfecto)
  - [ ] Texto nítido

#### Impresora de Inyección de Tinta
- [ ] Conectar impresora Epson/Canon Pixma
- [ ] Imprimir invitación
- [ ] Verificar:
  - [ ] Degradado suave (sin bandas)
  - [ ] Colores vibrantes
  - [ ] Sin manchas de tinta

### 🔍 Inspección de Código CSS

#### Variables CSS (js/preview.js)
- [ ] Abrir `js/preview.js`
- [ ] Buscar `--padding-top`
- [ ] Verificar valor: `max(var(--sat), 1rem)`
- [ ] Confirmar que NO hay valores `vh` para padding vertical

#### Media Queries
- [ ] Verificar que NO existen overrides de `--padding-top` en:
  - [ ] `@media (max-width: 767px)`
  - [ ] `@media (min-width: 768px) and (max-width: 1024px)`
  - [ ] `@media (min-width: 1025px)`
- [ ] Confirmar que SÍ existe `@media print` con `padding: 0.5cm`

#### Reglas de Impresión (js/export.js)
- [ ] Abrir `js/export.js`
- [ ] Buscar `@media print`
- [ ] Verificar que incluye:
  - [ ] `@page { margin: 0; size: auto; }`
  - [ ] `break-inside: avoid` en elementos críticos
  - [ ] `print-color-adjust: exact`
  - [ ] `position: absolute` para `.invitation-background`

### 📊 Mediciones Precisas

#### Con DevTools (Chrome)
```javascript
// Ejecutar en consola del navegador:
const body = document.querySelector('body');
const computed = window.getComputedStyle(body);
console.log('Padding Top:', computed.paddingTop);
// Debe ser: "16px" o menos (excepto en iPhone con notch)
```

#### Altura de Contenedor
```javascript
const container = document.querySelector('.invitation-container');
console.log('Container Height:', container.offsetHeight);
console.log('Window Height:', window.innerHeight);
// Container debe ser ≤ Window Height para evitar scroll
```

### 🐛 Casos Edge a Probar

#### iPhone con Notch (iPhone X+)
- [ ] Abrir en Safari iOS
- [ ] Verificar que safe-area-inset-top se respeta
- [ ] Contenido no debe quedar detrás del notch

#### Modo Oscuro del Sistema
- [ ] Activar modo oscuro en OS
- [ ] Verificar que la invitación mantiene colores correctos
- [ ] Fondo degradado debe ser visible

#### Zoom del Navegador
- [ ] Zoom 50%: Contenido debe ser legible
- [ ] Zoom 100%: Espaciado correcto
- [ ] Zoom 150%: Sin overflow horizontal
- [ ] Zoom 200%: Funcional aunque pequeño

#### Impresión en Blanco y Negro
- [ ] Configurar impresora en modo B/N
- [ ] Imprimir invitación
- [ ] Verificar que el texto es legible
- [ ] Degradado debe verse como gradiente de grises

### 📸 Capturas de Pantalla para Documentación

- [ ] Captura: Vista del editor (espaciado correcto)
- [ ] Captura: Vista previa de impresión (Chrome)
- [ ] Captura: PDF generado (primera página completa)
- [ ] Captura: DevTools mostrando padding-top: 16px
- [ ] Captura: Invitación impresa físicamente

### 📝 Registro de Pruebas

```
Fecha: _______________
Tester: _______________
Navegador: _______________
Versión: _______________

Resultados:
[ ] PASS - Espaciado visual correcto
[ ] PASS - Exportación PDF sin recortes
[ ] PASS - Impresión física exitosa
[ ] PASS - Responsive en todos los dispositivos

Notas:
_________________________________
_________________________________
_________________________________
```

---

## 🚨 Criterios de Fallo

### ❌ Rechazar si:
1. Espaciado superior > 30px en desktop
2. PDF generado tiene más de 1 página (para invitación estándar)
3. Foto de festejados se corta en cualquier formato
4. Degradado de fondo no es visible en exportación
5. Existen valores `vh` para padding vertical en código

### ⚠️ Advertir si:
1. Espaciado superior entre 20-30px (aceptable pero no óptimo)
2. Tiempo de carga > 1 segundo
3. Colores ligeramente diferentes entre navegadores
4. Impresión física requiere ajuste de escala

---

## 🎯 Métricas de Éxito

- ✅ **Espaciado superior**: ≤ 20px (ideal: 16px)
- ✅ **Páginas en PDF**: 1 página
- ✅ **Recortes**: 0 (cero)
- ✅ **Compatibilidad**: 100% en Chrome, Firefox, Safari, Edge
- ✅ **Tiempo de carga**: < 1 segundo
- ✅ **Satisfacción de usuario**: ≥ 4.5/5

---

**Última actualización**: 2026-02-01  
**Versión del checklist**: 2.0  
**Próxima revisión**: Mensual o después de cambios CSS
