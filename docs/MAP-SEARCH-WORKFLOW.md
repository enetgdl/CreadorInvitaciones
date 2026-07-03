# Documentación del Flujo de Búsqueda de Mapa

Este documento describe el flujo técnico y funcional de la característica "Búsqueda Inteligente de Mapa" implementada en el editor de invitaciones.

## Resumen
La función permite a los usuarios establecer las coordenadas del mapa (`lat, lng`) automáticamente basándose en la dirección o nombre del lugar ingresado, o manualmente a través de una interfaz de mapa interactivo.

## Componentes
1.  **Botón de Búsqueda**: Ubicado en el panel "Interactivo" junto al control "Mostrar Mapa del Lugar".
2.  **MapSearchManager (`js/map-search.js`)**: Controlador principal de la lógica.
3.  **API de Nominatim (OpenStreetMap)**: Utilizada para geocodificación (convertir texto a coordenadas).
4.  **Leaflet.js**: Librería de mapas utilizada para el modo manual (cargada bajo demanda).
5.  **Modal (`#mapSearchModal`)**: Interfaz para búsqueda y selección manual.

## Flujo del Proceso

### 1. Inicio de Búsqueda
El usuario hace click en el botón `🗺️ Buscar`.
El sistema verifica si existen valores en los inputs `eventAddress` (Dirección) o `eventLocation` (Ubicación) de la pestaña General.

### 2. Secuencia de Búsqueda Inteligente (Automática)
El sistema ejecuta los siguientes pasos en orden:

*   **Paso 2.1: Búsqueda por Dirección Exacta**
    *   Se envía el contenido de `eventAddress` a la API de Nominatim.
    *   **Éxito**: Si la API devuelve un resultado con confianza, se toman `lat` y `lon`, se actualiza el input `mapCoords` y se termina el proceso.
    *   **Fallo**: Si no hay resultados, se pasa al siguiente paso.

*   **Paso 2.2: Búsqueda por Nombre del Lugar**
    *   Se envía el contenido de `eventLocation` a la API.
    *   **Éxito**: Se actualizan las coordenadas y termina el proceso.
    *   **Fallo**: Se pasa al modo manual.

### 3. Modo de Búsqueda Manual (Fallback)
Si la búsqueda automática falla o hay un error de conexión:
1.  Se notifica al usuario ("No se encontró automáticamente...").
2.  Se abre el modal `#mapSearchModal`.
3.  Se carga la librería **Leaflet** dinámicamente (si no estaba cargada).
4.  Se inicializa un mapa interactivo centrado en CDMX (default).
5.  El usuario puede:
    *   Usar la barra de búsqueda interna del modal.
    *   Hacer click en el mapa para colocar un marcador (Pin).
6.  Al dar click en "Confirmar Ubicación":
    *   Se toman las coordenadas del marcador seleccionado.
    *   Se inyectan en el input `mapCoords`.

## Actualización del Editor
Al insertarse las coordenadas en `#mapCoords`, el sistema dispara eventos `input` y `change` sintéticos.
Esto asegura que la clase principal `InvitationEditor` (`editor.js`) detecte el cambio, marque el estado como "dirty" (guardar cambios), y regenere la vista previa del mapa (`preview.js`) automáticamente.

## Pruebas
Se incluyen pruebas unitarias en `js/tests/map-search-test.js` que validan los tres escenarios principales mockeando las respuestas de red.
