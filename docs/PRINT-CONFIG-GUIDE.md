# 🖨️ Guía de Configuración de Impresión por Navegador

## 🎯 Objetivo
Garantizar que la invitación se exporte/imprima correctamente sin recortes en todos los navegadores principales.

---

## 🌐 Google Chrome / Microsoft Edge (Chromium)

### Configuración Óptima
```
1. Abrir invitación exportada (HTML)
2. Presionar: Ctrl + P (Windows/Linux) o Cmd + P (Mac)
3. Configurar:
   ┌─────────────────────────────────────┐
   │ Destino: [Guardar como PDF]        │
   │ Diseño: [Vertical]                 │
   │ Papel: [A4] o [Letter]             │
   │ Páginas: [Todas]                   │
   │ Márgenes: [Ninguno]                │
   │ Escala: [Predeterminado (100%)]    │
   │                                     │
   │ Más opciones ▼                      │
   │   ☑ Gráficos de fondo              │
   │   ☐ Encabezados y pies de página   │
   └─────────────────────────────────────┘
4. Click en [Guardar]
```

### Atajos de Teclado
- **Abrir diálogo**: `Ctrl + P`
- **Cambiar orientación**: `Alt + O`
- **Cambiar destino**: `Alt + D`
- **Guardar**: `Enter`

### Solución de Problemas

#### ❌ Problema: Fondo no se imprime
**Solución**: Activar "Gráficos de fondo"
```
Más opciones → ☑ Gráficos de fondo
```

#### ❌ Problema: Contenido cortado
**Solución**: Cambiar márgenes a "Ninguno"
```
Márgenes: [Ninguno] ← Seleccionar esta opción
```

#### ❌ Problema: Texto muy pequeño
**Solución**: Ajustar escala
```
Escala: [100%] o [110%] (máximo recomendado)
```

---

## 🦊 Mozilla Firefox

### Configuración Óptima
```
1. Abrir invitación exportada (HTML)
2. Presionar: Ctrl + P (Windows/Linux) o Cmd + P (Mac)
3. Configurar:
   ┌─────────────────────────────────────┐
   │ Destino: [Guardar como PDF]        │
   │ Orientación: [Vertical]            │
   │ Tamaño del papel: [A4] o [Letter]  │
   │ Páginas por hoja: [1]              │
   │                                     │
   │ Márgenes (mm):                      │
   │   Superior: [0]                     │
   │   Inferior: [0]                     │
   │   Izquierdo: [0]                    │
   │   Derecho: [0]                      │
   │                                     │
   │ Opciones:                           │
   │   ☑ Imprimir fondos                │
   │   ☐ Imprimir encabezados y pies    │
   │   Escala: [Sin reducir]            │
   └─────────────────────────────────────┘
4. Click en [Guardar]
```

### Atajos de Teclado
- **Abrir diálogo**: `Ctrl + P`
- **Vista previa**: `Alt + V`
- **Configuración de página**: `Alt + S`

### Solución de Problemas

#### ❌ Problema: Colores apagados
**Solución**: Activar "Imprimir fondos"
```
Opciones → ☑ Imprimir fondos
```

#### ❌ Problema: Contenido reducido automáticamente
**Solución**: Cambiar escala
```
Escala: [Sin reducir] ← Importante
```

#### ❌ Problema: Márgenes grandes
**Solución**: Configurar márgenes personalizados
```
Márgenes personalizados:
Superior: 0 mm
Inferior: 0 mm
Izquierdo: 0 mm
Derecho: 0 mm
```

---

## 🧭 Safari (macOS)

### Configuración Óptima
```
1. Abrir invitación exportada (HTML)
2. Presionar: Cmd + P
3. En el diálogo de impresión:
   ┌─────────────────────────────────────┐
   │ Impresora: [Guardar como PDF]      │
   │ Preajustes: [Estándar]             │
   │ Copias: [1]                         │
   │ Páginas: [Todas]                    │
   │                                     │
   │ Click en [Mostrar detalles] ▼      │
   │                                     │
   │ Orientación: [Vertical]            │
   │ Tamaño del papel: [A4] o [US Letter]│
   │ Escala: [100%]                      │
   │                                     │
   │ Safari ▼                            │
   │   ☑ Imprimir fondos                │
   │   ☐ Imprimir encabezados y pies    │
   └─────────────────────────────────────┘
4. Click en [PDF ▼] → [Guardar como PDF]
5. Guardar archivo
```

### Atajos de Teclado
- **Abrir diálogo**: `Cmd + P`
- **Mostrar detalles**: `Cmd + D`
- **Vista previa**: `Cmd + Shift + P`

### Solución de Problemas

#### ❌ Problema: Gradiente no se ve
**Solución**: Activar "Imprimir fondos" en menú Safari
```
Safari (menú desplegable) → ☑ Imprimir fondos
```

#### ❌ Problema: Márgenes automáticos
**Solución**: Usar configuración de página
```
Archivo → Configurar página
Márgenes: Mínimo (0.5 cm)
```

#### ❌ Problema: PDF muy pesado
**Solución**: Usar filtro Quartz
```
PDF ▼ → Guardar como PDF
Filtro Quartz: [Reduce File Size]
```

---

## 🎭 Opera

### Configuración Óptima
```
Opera usa el mismo motor que Chrome (Chromium)
→ Seguir las instrucciones de Chrome/Edge
```

### Diferencias Específicas
- Menú de impresión idéntico a Chrome
- Atajos de teclado iguales
- Configuración de "Gráficos de fondo" en el mismo lugar

---

## 📱 Navegadores Móviles

### Safari iOS (iPhone/iPad)

```
1. Abrir invitación en Safari
2. Tocar el botón [Compartir] 🔗
3. Desplazar hacia abajo
4. Seleccionar [Imprimir]
5. Pellizcar para hacer zoom en vista previa
6. Tocar [Compartir] en la vista previa
7. Seleccionar [Guardar en Archivos] o [Guardar PDF en iBooks]
```

**Nota**: iOS no permite configurar márgenes. El sistema usa valores predeterminados.

### Chrome Android

```
1. Abrir invitación en Chrome
2. Tocar menú [⋮] (tres puntos)
3. Seleccionar [Compartir...]
4. Seleccionar [Imprimir]
5. Tocar [Guardar como PDF]
6. Configurar:
   - Tamaño: A4
   - Orientación: Vertical
   - Color: Color
7. Tocar [PDF] para guardar
```

---

## 🖨️ Impresoras Físicas - Configuración Recomendada

### Impresoras Láser (HP, Canon, Brother)

```
Configuración del Driver:
┌─────────────────────────────────────┐
│ Calidad: [Alta] o [1200 DPI]       │
│ Tipo de papel: [Normal] o [Foto]   │
│ Color: [Color] (si está disponible)│
│ Tamaño: [A4] o [Letter]            │
│ Orientación: [Vertical]            │
│ Márgenes: [Sin bordes] si soporta  │
│ Escala: [100%]                      │
│                                     │
│ Opciones avanzadas:                 │
│   ☑ Imprimir gráficos              │
│   ☐ Modo económico                 │
│   Resolución: [Alta calidad]       │
└─────────────────────────────────────┘
```

**Nota**: Las impresoras láser pueden tener colores menos vibrantes que las de inyección de tinta.

### Impresoras de Inyección de Tinta (Epson, Canon Pixma)

```
Configuración del Driver:
┌─────────────────────────────────────┐
│ Calidad: [Máxima] o [Foto]         │
│ Tipo de papel: [Papel fotográfico] │
│ Color: [Color]                      │
│ Tamaño: [A4] o [Letter]            │
│ Orientación: [Vertical]            │
│ Márgenes: [Sin bordes]             │
│ Escala: [100%]                      │
│                                     │
│ Opciones avanzadas:                 │
│   Gestión de color: [ICM/ColorSync]│
│   Velocidad: [Calidad] (no rápido) │
│   Intensidad: [+1] o [+2]          │
└─────────────────────────────────────┘
```

**Consejo**: Usar papel fotográfico para mejores resultados con degradados.

---

## 🎨 Gestión de Color

### Perfiles de Color Recomendados

| Navegador | Perfil | Configuración |
|-----------|--------|---------------|
| Chrome | sRGB | Automático |
| Firefox | sRGB | Automático |
| Safari | Display P3 | Automático (macOS) |
| Edge | sRGB | Automático |

### Para Impresión Profesional

```
1. Exportar PDF desde navegador
2. Abrir en Adobe Acrobat / Preview
3. Archivo → Imprimir
4. Configurar:
   - Gestión de color: [Dejar que la impresora determine los colores]
   - Perfil de salida: [sRGB IEC61966-2.1]
5. Imprimir
```

---

## 📊 Tabla de Compatibilidad de Características

| Característica | Chrome | Firefox | Safari | Edge | Opera |
|----------------|--------|---------|--------|------|-------|
| Gráficos de fondo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Márgenes personalizados | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Escala ajustable | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vista previa precisa | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gradientes CSS | ✅ | ✅ | ✅ | ✅ | ✅ |
| @media print | ✅ | ✅ | ✅ | ✅ | ✅ |

**Leyenda**:
- ✅ Soportado completamente
- ⚠️ Soportado con limitaciones
- ❌ No soportado

---

## 🚨 Errores Comunes y Soluciones

### Error 1: "El PDF está en blanco"
**Causa**: Gráficos de fondo desactivados  
**Solución**: Activar "Gráficos de fondo" / "Imprimir fondos"

### Error 2: "La invitación ocupa 2 páginas"
**Causa**: Márgenes grandes o escala reducida  
**Solución**: Márgenes = Ninguno, Escala = 100%

### Error 3: "Los colores se ven diferentes"
**Causa**: Perfil de color incorrecto  
**Solución**: Usar sRGB, activar gestión de color

### Error 4: "La foto está cortada"
**Causa**: Salto de página forzado  
**Solución**: Ya corregido con `break-inside: avoid` en CSS

### Error 5: "El texto es muy pequeño"
**Causa**: Escala reducida automáticamente  
**Solución**: Forzar escala al 100%

---

## 📋 Checklist Rápido Pre-Impresión

```
Antes de imprimir, verificar:
☐ Navegador actualizado a última versión
☐ Invitación cargada completamente (sin spinners)
☐ Vista previa muestra contenido correcto
☐ Configuración:
  ☐ Papel: A4 o Letter
  ☐ Orientación: Vertical
  ☐ Márgenes: Ninguno (0mm)
  ☐ Escala: 100%
  ☐ Gráficos de fondo: Activado
☐ Vista previa PDF muestra 1 página
☐ Foto de festejados visible completa
☐ Degradado de fondo visible
```

---

## 🎯 Configuración Recomendada Universal

**Para máxima compatibilidad en todos los navegadores**:

```
Papel: A4 (210 x 297 mm)
Orientación: Vertical
Márgenes: 0 mm (todos los lados)
Escala: 100% (sin reducir)
Gráficos de fondo: ✓ Activado
Encabezados/Pies: ✗ Desactivado
Calidad: Alta / Máxima
Color: Color (no escala de grises)
```

---

**Última actualización**: 2026-02-01  
**Probado en**: Chrome 120, Firefox 121, Safari 17, Edge 120, Opera 105  
**Sistemas**: Windows 11, macOS Sonoma, Ubuntu 22.04, iOS 17, Android 14
