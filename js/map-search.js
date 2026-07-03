/**
 * Módulo de Búsqueda de Mapa mediante Google Maps
 * Gestiona la búsqueda de ubicaciones y el modal de mapa manual
 * Soporta carga dinámica de API Key desde Settings
 */

class MapSearchManager {
    constructor() {
        this.btn = document.getElementById('mapSearchBtn');
        this.modal = document.getElementById('mapSearchModal');
        this.coordsInput = document.getElementById('mapCoords');
        this.addressInput = document.getElementById('eventAddress');
        this.locationInput = document.getElementById('eventLocation');

        this.closeBtn = document.getElementById('mapSearchClose');
        this.cancelBtn = document.getElementById('mapSearchCancel');
        this.confirmBtn = document.getElementById('mapSearchConfirm');
        this.searchInput = document.getElementById('mapSearchInput');
        this.searchActionBtn = document.getElementById('mapSearchActionBtn');

        this.map = null;
        this.marker = null;
        this.selectedCoords = null;
        this.geocoder = null;

        this.init();

        // Intentar precarga si hay key guardada
        setTimeout(() => this.checkGoogleApi(), 1000);
    }

    init() {
        if (!this.btn) return;
        this.btn.addEventListener('click', () => this.handleSmartSearch());

        if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
        if (this.cancelBtn) this.cancelBtn.addEventListener('click', () => this.closeModal());
        if (this.confirmBtn) this.confirmBtn.addEventListener('click', () => this.applyManualSelection());

        if (this.searchActionBtn) this.searchActionBtn.addEventListener('click', () => this.handleManualSearch());
        if (this.searchInput) {
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleManualSearch();
            });
        }
    }

    checkGoogleApi() {
        if (window.google && window.google.maps) return true;

        // Intentar cargar desde configuración
        if (window.settingsManager && window.settingsManager.settings.googleMapsApiKey) {
            this.loadGoogleMaps(window.settingsManager.settings.googleMapsApiKey);
        }
        return false;
    }

    loadGoogleMaps(apiKey) {
        if (document.getElementById('gmaps-dynamic-loader')) return;

        console.log('Iniciando carga dinámica de Google Maps API...');
        const script = document.createElement('script');
        script.id = 'gmaps-dynamic-loader';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=onGoogleMapsLoaded`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            console.error('Error cargando Google Maps API. Verifique su Key.');
        };

        window.onGoogleMapsLoaded = () => {
            console.log('Google Maps API cargada exitosamente via Settings');
        };

        document.body.appendChild(script);
    }

    async handleSmartSearch() {
        // Verificar API
        if (!window.google || !window.google.maps) {
            // Intentar cargar una última vez
            this.checkGoogleApi();

            // Si sigue sin estar disponible (carga asíncrona pendiente o key faltante)
            if (!window.google) {
                this.showNotification('API de Google Maps no disponible. Configure su API Key en [Menú > Configuración > Integraciones] y espere unos segundos.', 'error');

                // Abrir configuración automáticamente para ayudar al usuario
                if (window.settingsManager) window.settingsManager.openModal();
                return;
            }
        }

        const address = this.addressInput?.value?.trim();
        const locationName = this.locationInput?.value?.trim();

        if (!address && !locationName) {
            this.showNotification('Ingrese una dirección o lugar primero en la pestaña General', 'warning');
            return;
        }

        this.setLoading(true);

        try {
            if (address) {
                const found = await this.geocodeGoogle(address);
                if (found) {
                    this.applyCoords(found.lat, found.lng);
                    this.showNotification(`Ubicación encontrada: ${address}`, 'success');
                    this.setLoading(false);
                    return;
                }
            }

            if (locationName) {
                const found = await this.geocodeGoogle(locationName);
                if (found) {
                    this.applyCoords(found.lat, found.lng);
                    this.showNotification(`Lugar encontrado: ${locationName}`, 'success');
                    this.setLoading(false);
                    return;
                }
            }

            this.showNotification('No se encontró automáticamente. Abriendo mapa selector...', 'info');
            this.openManualModal(address || locationName || '');

        } catch (error) {
            console.error(error);
            this.showNotification('Error buscando ubicación. Intente manualmente.', 'error');
            this.openManualModal(address || locationName || '');
        } finally {
            this.setLoading(false);
        }
    }

    async geocodeGoogle(query) {
        if (!this.geocoder) this.geocoder = new google.maps.Geocoder();
        return new Promise((resolve) => {
            this.geocoder.geocode({ address: query }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const loc = results[0].geometry.location;
                    resolve({ lat: loc.lat(), lng: loc.lng() });
                } else {
                    resolve(null);
                }
            });
        });
    }

    applyCoords(lat, lng) {
        if (!this.coordsInput) return;
        const val = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
        this.coordsInput.value = val;
        this.coordsInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.coordsInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    openManualModal(initialQuery) {
        if (!this.modal) return;
        this.modal.classList.add('active');
        if (this.searchInput) this.searchInput.value = initialQuery;

        setTimeout(() => {
            requestAnimationFrame(() => {
                this.initGoogleMap();
                if (initialQuery) {
                    this.handleManualSearch();
                }
            });
        }, 100);
    }

    initGoogleMap() {
        if (!window.google || !window.google.maps) return;

        const mapDiv = document.getElementById('mapSearchGoogleContainer');
        if (!mapDiv) return;

        if (!this.map) {
            const defaultPos = { lat: 19.4326, lng: -99.1332 };
            this.map = new google.maps.Map(mapDiv, {
                center: defaultPos,
                zoom: 13,
                mapTypeControl: false,
                streetViewControl: false
            });

            this.map.addListener('click', (e) => {
                this.setMarker(e.latLng);
            });
        } else {
            google.maps.event.trigger(this.map, 'resize');
        }
    }

    setMarker(latLng) {
        if (this.marker) {
            this.marker.setPosition(latLng);
        } else {
            this.marker = new google.maps.Marker({
                position: latLng,
                map: this.map
            });
        }
        this.selectedCoords = { lat: latLng.lat(), lng: latLng.lng() };
    }

    async handleManualSearch() {
        const query = this.searchInput?.value?.trim();
        if (!query || !this.map) return;

        const found = await this.geocodeGoogle(query);
        if (found) {
            const pos = { lat: found.lat, lng: found.lng };
            this.map.setCenter(pos);
            this.map.setZoom(15);
            this.setMarker(new google.maps.LatLng(found.lat, found.lng));
        }
    }

    applyManualSelection() {
        if (this.selectedCoords) {
            this.applyCoords(this.selectedCoords.lat, this.selectedCoords.lng);
            this.closeModal();
            this.showNotification('Coordenadas actualizadas', 'success');
        } else {
            this.showNotification('Haga click en el mapa para seleccionar ubicación', 'warning');
        }
    }

    closeModal() {
        if (this.modal) this.modal.classList.remove('active');
    }

    setLoading(isLoading) {
        if (this.btn) {
            this.btn.textContent = isLoading ? '⏳' : '🗺️';
            this.btn.disabled = isLoading;
        }
    }

    showNotification(msg, type = 'info') {
        if (window.invitationStorage && window.invitationStorage.showNotification) {
            window.invitationStorage.showNotification(msg, type);
        } else {
            alert(msg);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mapSearchManager = new MapSearchManager();
});
