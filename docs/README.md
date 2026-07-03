# Sistema de Invitaciones Digitales Interactivas

Sistema completo para crear invitaciones digitales personalizadas para eventos como XV años, bodas, bautizos, cumpleaños y más.

## 🚀 Características Principales

### Editor Visual Completo
- Modificación en tiempo real de todos los elementos
- Interfaz intuitiva con tabs organizados
- Vista previa instantánea de cambios
- Guardado automático cada 5 segundos

### Soporte Multimedia Avanzado
- **Fondos**: Videos en bucle, imágenes estáticas o degradados animados
- **Música**: Reproducción automática con controles
- **Fotos**: Imagen del homenajeado con efectos
- **Efectos visuales**: Partículas, confetti, bokeh, degradados animados

### Personalización de Contenido
- Múltiples tipos de letra profesionales
- Paleta de colores personalizable
- Efectos visuales y animaciones
- Transparencia de overlay ajustable

### Funcionalidades Interactivas
- **Cuenta regresiva**: Calculada en tiempo real desde la fecha actual
- **Código QR**: Generado automáticamente para ubicación o confirmación
- **Mapa integrado**: Muestra la ubicación del evento
- **Confirmación de asistencia**: Link a formulario externo

## 📁 Estructura del Proyecto

```
Invitacion/
├── index.html              # Editor principal
├── css/
│   ├── editor.css         # Estilos del editor (dark mode premium)
│   ├── invitation.css     # Estilos de las invitaciones
│   └── animations.css     # Animaciones y efectos
├── js/
│   ├── storage.js         # Almacenamiento local
│   ├── countdown.js       # Cuenta regresiva en tiempo real
│   ├── qr-generator.js    # Generación de códigos QR
│   ├── preview.js         # Vista previa en tiempo real
│   ├── export.js          # Exportación HTML standalone
│   └── editor.js          # Lógica principal del editor
└── README.md              # Este archivo
```

## 🎯 Cómo Usar

### 1. Abrir el Editor
1. Asegúrate de que XAMPP esté corriendo
2. Abre tu navegador web (Chrome, Firefox, Safari, Edge)
3. Navega a: `http://localhost/Invitacion/`

### 2. Crear tu Invitación

#### Tab General
- Selecciona el tipo de evento (XV años, boda, etc.)
- Completa los datos básicos: nombre, fecha, hora, lugar
- Todos los campos son opcionales, completa solo lo necesario

#### Tab Diseño
- Elige un preset de color o personaliza manualmente
- Selecciona fuentes para título y texto
- Configura efectos de fondo (partículas, confetti, bokeh)
- Ajusta la opacidad del overlay

#### Tab Contenido
- Escribe mensajes personalizados
- Código de vestimenta
- Teléfono para confirmación
- Hashtag del evento

#### Tab Multimedia
- **Imagen de fondo**: JPG, PNG, WebP (Max 2MB)
- **Video de fondo**: MP4, WebM (Max 5MB)
- **Foto del homenajeado**: JPG, PNG (Max 1MB)
- **Música de fondo**: MP3, WAV, OGG (Max 3MB)
- **Nota de audio**: Mensaje de voz personalizado

#### Tab Interactivo
- Habilita cuenta regresiva (actualización en tiempo real)
- Genera código QR con URL de confirmación o ubicación
- Muestra mapa con coordenadas (formato: latitud, longitud)
- Link a formulario RSVP (Google Forms, etc.)

### 3. Vista Previa
- La vista previa se actualiza automáticamente al hacer cambios
- Click en "Vista Previa" para abrir en ventana nueva
- Click en "🔄" para refrescar manualmente
- Click en "⛶" para pantalla completa

### 4. Guardar y Exportar

#### Guardar Progreso
- Click en "Guardar" para guardar manualmente
- El sistema guarda automáticamente cada 5 segundos
- Los datos se almacenan en localStorage del navegador

#### Exportar Invitación
1. Click en "Exportar"
2. Selecciona opciones:
   - ✅ Minificar código (reduce tamaño)
   - ✅ Optimizar imágenes
3. Click en "Descargar ZIP"
4. Se descargará un archivo HTML completo

## 🌐 Publicar tu Invitación

### Opción 1: Hosting Gratuito
1. Ve a [Netlify Drop](https://app.netlify.com/drop)
2. Arrastra el archivo `invitacion.html` exportado
3. Obtendrás un link público para compartir

### Opción 2: Servidor Web
1. Sube el archivo `invitacion.html` a tu servidor
2. Comparte el link con tus invitados

### Opción 3: Email
1. Sube el archivo a Dropbox/Google Drive
2. Obtén link de compartición
3. Envía por email, WhatsApp, etc.

## 💡 Consejos y Trucos

### Para Mejor Rendimiento
- Usa imágenes optimizadas (comprímelas antes de subir)
- Videos cortos (10-15 segundos en bucle)
- Música en formato MP3 (mejor compatibilidad)

### Para Mejor Diseño
- Usa fuentes que combinen bien (Display para títulos, Sans-serif para texto)
- Colores complementarios o monocromáticos
- No sobrecargues de efectos (menos es más)
- Prueba en móvil y escritorio

### Cuenta Regresiva
- Se calcula automáticamente desde la fecha/hora actual
- Se actualiza cada segundo
- Muestra días, horas, minutos y segundos
- Al llegar a cero, muestra "¡El evento ha comenzado!"

### Códigos QR
- Generados automáticamente con API externa
- Puedes usar URL de:
  - Google Maps (ubicación)
  - Google Forms (confirmación)
  - Tu sitio web
  - Cualquier link válido

### Mapas
- Formato de coordenadas: `latitud, longitud`
- Ejemplo: `19.4326, -99.1332`
- Obtén coordenadas desde Google Maps:
  1. Click derecho en el mapa
  2. Primer número es latitud
  3. Segundo es longitud

## 🎨 Temas de Color Incluidos

1. **Dorado Elegante**: Dorado + Beige (Ideal para XV años)
2. **Rosa Romántico**: Rosa + Rosa claro (Perfecto para bodas)
3. **Azul Cielo**: Azul + Celeste (Bautizos, baby shower)
4. **Rojo Pasión**: Rojo + Rosa pálido (Aniversarios)
5. **Púrpura Real**: Púrpura + Lavanda (Graduaciones)
6. **Verde Naturaleza**: Verde + Verde claro (Eventos al aire libre)

## ⚙️ Requisitos Técnicos

### Navegadores Compatibles
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

### Dispositivos
- ✅ Escritorio (Windows, Mac, Linux)
- ✅ Móviles (iOS, Android)
- ✅ Tablets (iPad, Android)

### Tamaño de Archivos
- Imagen de fondo: Max 2MB
- Video de fondo: Max 5MB
- Foto homenajeado: Max 1MB
- Música: Max 3MB
- Total recomendado: < 5MB para carga rápida

## 🔧 Solución de Problemas

### El editor no carga
- Verifica que XAMPP esté corriendo
- Asegúrate de estar en `http://localhost/Invitacion/`
- Limpia caché del navegador (Ctrl+F5)

### La vista previa no se actualiza
- Click en el botón "🔄 Refrescar"
- Espera 1-2 segundos entre cambios
- Verifica la consola del navegador (F12)

### Los archivos no se cargan
- Verifica el tamaño (no exceder límites)
- Usa formatos compatibles
- Prueba con archivo más pequeño

### La música no reproduce
- Los navegadores bloquean autoplay
- El usuario debe interactuar con la página primero
- Click en el botón 🎵 para reproducir

### Datos perdidos
- Los datos se guardan en localStorage
- Si limpias caché, se pierden
- Exporta regularmente como respaldo

## 📱 Compartir Invitación

### WhatsApp
```
¡Estás invitado/a! 🎉
Revisa los detalles aquí:
[TU_LINK]
```

### Email
```
Asunto: Invitación a [EVENTO]

Hola [NOMBRE],

Tenemos el gusto de invitarte a [EVENTO].

Para ver todos los detalles, visita:
[TU_LINK]

¡Te esperamos!
```

### Redes Sociales
- Instagram Stories: Agrega link en bio o sticker de link
- Facebook: Post con link directo
- Twitter: Tweet con link acortado (bit.ly)

## 🎁 Características Avanzadas

### Almacenamiento
- Usa localStorage del navegador
- Capacidad: ~5-10MB
- Persistente (no expira)
- Por dominio (solo en ese navegador)

### Exportación
- HTML standalone completo
- Todos los recursos embebidos (base64)
- Sin dependencias externas
- Listo para publicar

### Sistema Modular
- 6 módulos JavaScript independientes
- Arquitectura escalable
- Código limpio y comentado
- Fácil de mantener y extender

## 📞 Soporte

### Debug
1. Abre consola del navegador (F12)
2. Revisa errores en tab "Console"
3. Verifica que todos los archivos carguen en "Network"

### Estadísticas
```javascript
// En consola del navegador
invitationEditor.getStats()
```

### Limpiar Datos
```javascript
// En consola del navegador
invitationStorage.clearData()
```

## ✨ Próximas Mejoras (Sugerencias)

- [ ] Más plantillas prediseñadas
- [ ] Galería de fotos
- [ ] Integración con Spotify
- [ ] Envío masivo de invitaciones
- [ ] Panel de administración de invitados
- [ ] Estadísticas de visualización
- [ ] Modo multiidioma

## 📝 Notas Importantes

1. **Compatibilidad de Audio**: Algunos navegadores bloquean autoplay de audio. Los usuarios necesitarán interactuar con la página primero.

2. **Tamaño de Archivos**: Mantén el tamaño total < 5MB para garantizar carga rápida en redes móviles.

3. **Privacidad**: Todos los datos se almacenan localmente en el navegador. No se envía información a servidores externos.

4. **Respaldos**: Exporta tu invitación regularmente. Si limpias el caché del navegador, los datos se perderán.

5. **Mobile First**: Las invitaciones están optimizadas para visualización en móvil (formato vertical 9:16).

## 🏆 Ventajas del Sistema

✅ **Sin Instalación**: Funciona directo en el navegador
✅ **Gratis**: No requiere subscripciones ni pagos
✅ **Universal**: Compatible con todos los navegadores modernos
✅ **Offline**: Funciona sin conexión una vez cargado
✅ **Personalizable**: Control total sobre diseño y contenido
✅ **Profesional**: Diseños premium con animaciones
✅ **Responsive**: Se ve perfecto en cualquier dispositivo
✅ **Interactivo**: Cuenta regresiva, QR, mapas integrados

## 🎓 Casos de Uso

### XV Años
- Foto central de la quinceañera
- Colores dorado/rosa
- Música de vals
- Código de vestimenta formal
- Cuenta regresiva dramática

### Bodas
- Foto de la pareja
- Colores elegantes (blanco/dorado)
- Música romántica
- Link a mesa de regalos
- Confirmación de asistencia

### Bautizos
- Foto del bebé
- Colores pastel
- Música suave
- Información de iglesia y salón
- Mapa de ubicación

### Cumpleaños
- Foto del festejado
- Colores vibrantes
- Música festiva
- Temática del evento
- Lista de regalos

---

**Desarrollado con ❤️ para crear momentos inolvidables**

Sistema de Invitaciones Digitales v1.0
Compatible con todos los navegadores modernos
Optimizado para rendimiento y experiencia de usuario
