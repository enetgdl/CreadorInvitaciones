/**
 * LAYER-STORE.JS
 * State Management para el sistema de capas (Redux-pattern)
 * Gestiona el estado único de la verdad para las capas
 */

class LayerStore {
    constructor() {
        // Estado inicial
        this.state = {
            layers: [], // Array de objetos capa
            selectedLayerId: null,
            isSyncing: false,
            lastUpdate: Date.now(),
            version: 0
        };

        this.listeners = new Set();
        this.middlewares = [];

        // Inicializar
        console.log('📦 Layer Store inicializado');
    }

    /**
     * Obtener el estado actual (copia)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Suscribirse a cambios
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Despachar una acción
     */
    dispatch(action) {
        // Ejecutar middlewares log
        this.middlewares.forEach(mw => mw(action, this.state));

        const prevState = this.state;
        const newState = this.reducer(this.state, action);

        if (newState !== prevState) {
            this.state = newState;
            this.notify();
        }
    }

    /**
     * Reducer puro: (state, action) => newState
     */
    reducer(state, action) {
        switch (action.type) {
            case 'INIT_LAYERS':
                return {
                    ...state,
                    layers: action.payload,
                    lastUpdate: Date.now(),
                    version: state.version + 1
                };

            case 'ADD_LAYER':
                // Evitar duplicados
                if (state.layers.some(l => l.id === action.payload.id)) return state;
                return {
                    ...state,
                    layers: [action.payload, ...state.layers],
                    lastUpdate: Date.now(),
                    version: state.version + 1
                };

            case 'REMOVE_LAYER':
                return {
                    ...state,
                    layers: state.layers.filter(l => l.id !== action.payload),
                    selectedLayerId: state.selectedLayerId === action.payload ? null : state.selectedLayerId,
                    lastUpdate: Date.now(),
                    version: state.version + 1
                };

            case 'UPDATE_LAYER':
                return {
                    ...state,
                    layers: state.layers.map(layer =>
                        layer.id === action.payload.id
                            ? { ...layer, ...action.payload.updates }
                            : layer
                    ),
                    lastUpdate: Date.now(),
                    version: state.version + 1
                };

            case 'REORDER_LAYERS':
                return {
                    ...state,
                    layers: [...action.payload], // Nuevo orden
                    lastUpdate: Date.now(),
                    version: state.version + 1
                };

            case 'SELECT_LAYER':
                return {
                    ...state,
                    selectedLayerId: action.payload
                };

            case 'SYNC_START':
                return { ...state, isSyncing: true };

            case 'SYNC_COMPLETE':
                return { ...state, isSyncing: false };

            default:
                return state;
        }
    }

    /**
     * Notificar a los suscriptores
     */
    notify() {
        const state = this.getState();
        this.listeners.forEach(listener => listener(state));
    }

    /**
     * Middleware para logging
     */
    addMiddleware(mw) {
        this.middlewares.push(mw);
    }
}

// Singleton global
window.layerStore = new LayerStore();
