# 🚀 Panel de Historia - Guía Rápida de Inicio

## ¿Qué es?

El **Panel de Historia** es tu registro completo de todas las acciones que realizas en el editor. Te permite:
- Ver todo lo que has hecho ✅
- Deshacer/rehacer múltiples acciones de una vez ↶↷
- Filtrar acciones por tipo 🔍
- Navegar visualmente por tu historial 📊

## Apertura Rápida

**Método 1**: Click en el botón 🕐 (reloj) en la barra superior  
**Método 2**: Menú → Edición → Historia de Acciones

## Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Deshacer | `Ctrl + Z` |
| Rehacer | `Ctrl + Y` |

## Modos de Visualización

### 🪟 Ventana Flotante (Por Defecto)
- Se puede arrastrar a cualquier lugar
- Click en 📌 para fijar posición
- Se ajusta automáticamente para no cubrir el canvas

### 📎 Modo Adosado
- Click en ⫶ para adosar al panel derecho
- Comparte espacio con "Relleno Avanzado"
- División automática 50/50 cuando ambos están adosados

## Navegación en el Historial

### Estados del Historial

```
[Acciones Pasadas] ← Cosas que ya hiciste
────────────────────
   📍 ESTADO ACTUAL
────────────────────
[Acciones Futuras] ← Cosas deshechas (disponibles para rehacer)
```

### Cómo Usarlo

1. **Ver detalles de una acción**:
   - Cada item muestra: Ícono | Nombre | Hora | Categoría

2. **Deshacer hasta un punto**:
   - Click en el botón ↶ de cualquier acción pasada
   - Todas las acciones hasta ese punto se deshacen

3. **Rehacer hasta un punto**:
   - Click en el botón ↷ de cualquier acción futura
   - Todas las acciones hasta ese punto se rehacen

## Filtros de Acciones

Click en los botones superiores para filtrar:

| Filtro | Muestra |
|--------|---------|
| **Todas** | Sin filtrar |
| **Elementos** | ➕ Crear, 🗑️ Eliminar, 📋 Duplicar |
| **Propiedades** | 📝 Modificar texto, atributos |
| **Transformaciones** | ⬌ Mover, ⇔ Redimensionar, 🔄 Rotar |
| **Colores** | 🎨 Cambios de color, 🌈 Degradados |

## Iconos Comunes

| Ícono | Significa |
|-------|-----------|
| 📝 | Edición de texto |
| 🎨 | Cambio de color |
| 🌈 | Degradado aplicado |
| ⬌ | Elemento movido |
| ⇔ | Elemento redimensionado |
| 🔄 | Elemento rotado |
| ➕ | Elemento creado |
| 🗑️ | Elemento eliminado |
| 📚 | Cambio de orden/capas |
| 🖼️ | Imagen/fondo modificado |

## Gestión del Historial

### Borrar Todo el Historial
1. Click en 🗑️ en el header del panel
2. Confirmar acción
3. ⚠️ **Irreversible** - todo el historial se borra

### Límite de Acciones
- **Por defecto**: 20 acciones
- Las acciones más antiguas se eliminan automáticamente
- Configurable en ajustes (si necesario)

## Tips y Trucos

### 💡 Experimentar sin Miedo
Haz cambios libremente sabiendo que puedes volver atrás en cualquier momento.

### 💡 Comparar Versiones
1. Haz cambios
2. Usa el historial para volver a estado anterior
3. Compara resultados
4. Rehacer si la nueva versión es mejor

### 💡 Aprender del Historial
Revisa las acciones realizadas para entender qué operaciones están disponibles.

### 💡 Filtrar para Enfocarse
Si solo quieres ver cambios de color, usa el filtro "Colores" para claridad.

### 💡 Modo Adosado para Trabajo Intensivo
Si usas mucho el historial, módo adosado te da acceso rápido sin ocupar espacio del canvas.

## Solución de Problemas

### ❓ El panel no se muestra
- Verifica que el botón 🕐 esté presionado
- Revisa la consola del navegador (F12) por errores

### ❓ El historial está vacío
- Realiza alguna acción en el editor
- El panel se actualiza automáticamente cada segundo

### ❓ No puedo hacer/deshacer
- Verifica que haya acciones en el historial
- Los botones estarán deshabilitados si no hay acciones disponibles

### ❓ El panel cubre mi trabajo
- Usa el modo adosado (⫶)
- O arrastra el panel a otro lugar
- O fija el panel (📌) después de arrastrarlo

## Flujo de Trabajo Sugerido

### Para Diseño Iterativo
```
1. Abrir panel de historia (modo adosado)
2. Realizar cambios experimentales
3. Revisar historial
4. Deshacer lo que no gusta
5. Continuar con los cambios que sí gustan
```

### Para Corrección de Errores
```
1. Identificar error
2. Abrir panel de historia
3. Filtrar por tipo de acción relevante
4. Encontrar la acción incorrecta
5. Deshacer hasta ese punto
6. Corregir
```

### Para Aprendizaje
```
1. Mantener panel abierto mientras trabajas
2. Observar qué acciones se registran
3. Entender nomenclatura
4. Usar filtros para categorizar
```

## Próximos Pasos

✅ Prueba el panel con tu proyecto actual  
✅ Experimenta con los diferentes filtros  
✅ Familiarízate con los iconos  
✅ Intenta usar modo adosado vs flotante  
✅ Practica navegación rápida con los botones ↶ ↷  

---

**¿Necesitas más ayuda?**  
Consulta la documentación completa en `HISTORY-PANEL-README.md`

**Versión**: 1.0.0  
**Última Actualización**: 2026-02-08
