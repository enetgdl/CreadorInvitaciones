# ⛪ Mejoras en Campos de Misa/Ceremonia

## 📋 Resumen de Cambios

Se han implementado 3 nuevos campos en la pestaña **General** para gestionar la información de ceremonias religiosas, con controles de visibilidad (switches) y lógica automática basada en el tipo de evento.

---

## 🛠️ Campos Implementados

1. **Lugar de la Misa** (`massLocation`)
   - Input texto
   - Switch habilitar/deshabilitar
2. **Hora de la Misa** (`massTime`)
   - Input hora (Time Picker)
   - Switch habilitar/deshabilitar
3. **Dirección del Templo** (`massAddress`)
   - Textarea
   - Switch habilitar/deshabilitar

---

## ⚙️ Lógica de Comportamiento

### 1. Inicialización Automática
Al cambiar el "Tipo de Evento", los switches se configuran automáticamente:

| Tipo de Evento | Estado Switches |
|----------------|-----------------|
| XV Años        | ✅ ON (Activado) |
| Boda           | ✅ ON (Activado) |
| Bautizo        | ✅ ON (Activado) |
| Cumpleaños     | ❌ OFF (Desactivado) |
| Graduación     | ❌ OFF (Desactivado) |
| Otro           | ❌ OFF (Desactivado) |

> **Nota:** El usuario puede modificar manualmente estos switches en cualquier momento, independientemente del tipo de evento.

### 2. Comportamiento en Formulario
- **Switch ON:** Campo habilitado para escritura.
- **Switch OFF:** Campo deshabilitado en el formulario (evita edición).

### 3. Visualización en Preview
- Los campos solo aparecen en la invitación final si:
  1. Tienen contenido (texto/hora)
  2. El switch está **ACTIVADO**
  3. La sección de detalles es visible

---

## 🧪 Cómo Verificar

### Caso 1: Evento con Misa (Ej: Boda)
1. **Abrir** Creador de Invitaciones.
2. **Ir a** pestaña "General".
3. **Seleccionar** "Tipo de Evento": **Boda**.
4. **Verificar**:
   - ✅ Los 3 switches de Misa se activan automáticamente.
   - ✅ Campos habilitados.
5. **Llenar** datos de prueba en los campos de misa.
6. **Verificar Preview**:
   - ✅ Aparecen los iconos ⛪ (Lugar), 🔔 (Hora), 📍 (Dirección Templo).

### Caso 2: Evento sin Misa (Ej: Cumpleaños)
1. **Seleccionar** "Tipo de Evento": **Cumpleaños**.
2. **Verificar**:
   - ✅ Los 3 switches se desactivan automáticamentte.
   - ✅ Campos deshabilitados (grisaceos).
3. **Verificar Preview**:
   - ✅ La sección de Misa desaparece de la tarjeta.

### Caso 3: Activación Manual
1. Estando en "Cumpleaños" (switches apagados).
2. **Click** manualmente en el switch "Lugar de la Misa".
3. **Verificar**:
   - ✅ El campo se habilita.
   - ✅ Puedes escribir y aparece en el preview.

---

## 📁 Archivos Modificados

1. **`index.html`**: Agregada estructura HTML para los nuevos campos y switches.
2. **`js/storage.js`**: Definidos valores por defecto en `getDefaultData`.
3. **`js/editor.js`**:
   - Actualizado `loadFormValues` para cargar datos.
   - Actualizado `setupEventListeners` para lógica condicional de eventos y switches.
4. **`js/preview.js`**: Actualizado `generateBody` para renderizar los nuevos datos.

---

**Estado**: ✅ **COMPLETADO Y LISTO PARA PRUEBAS**
