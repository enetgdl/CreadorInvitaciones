/**
 * @fileoverview Validador de esquemas de configuración.
 * Asegura la integridad de los datos antes de guardarlos.
 */

export const ConfigSchema = {
    type: "object",
    properties: {
        theme: {
            type: "object",
            properties: {
                primaryColor: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                darkMode: { type: "boolean" },
                fontFamily: { type: "string" }
            },
            required: ["primaryColor"]
        },
        app: {
            type: "object",
            properties: {
                autoSave: { type: "boolean" },
                language: { type: "string", enum: ["es", "en"] },
                maxHistory: { type: "number", min: 1, max: 100 }
            }
        },
        "media-panel": {
            type: "object",
            properties: {
                defaultView: { type: "string", enum: ["grid", "list"] }
            }
        },
        version: { type: "number" },
        lastModified: { type: "string" } // ISO Date
    },
    required: ["version", "theme", "app"]
};

export class SchemaValidator {
    constructor(schema = ConfigSchema) {
        this.schema = schema;
    }

    /**
     * Valida un objeto de configuración contra el esquema.
     * @param {Object} data 
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate(data) {
        const errors = [];
        // Validación básica manual (en un entorno real usaríamos AJV)

        if (typeof data !== 'object' || data === null) {
            return { valid: false, errors: ["La configuración debe ser un objeto."] };
        }

        // Validar campos requeridos de nivel raíz
        this.schema.required.forEach(field => {
            if (!(field in data)) {
                errors.push(`Falta el campo requerido: ${field}`);
            }
        });

        // Validar tipos básicos (recorriendo propiedades definidas)
        for (const key in this.schema.properties) {
            if (data[key] !== undefined) {
                const rules = this.schema.properties[key];

                // Validación de tipo
                if (rules.type === 'object') {
                    if (typeof data[key] !== 'object' || Array.isArray(data[key])) {
                        errors.push(`El campo '${key}' debe ser un objeto.`);
                    } else if (rules.properties) {
                        // Validación recursiva simple para nivel 2
                        // Nota: Para profundidad arbitraria se requiere recursión completa.
                        for (const subKey in rules.properties) {
                            const subRules = rules.properties[subKey];
                            if (data[key][subKey] !== undefined) {
                                if (typeof data[key][subKey] !== subRules.type && subRules.type !== 'array') { // Simplificación
                                    errors.push(`El campo '${key}.${subKey}' debe ser tipo ${subRules.type}.`);
                                }
                                if (subRules.enum && !subRules.enum.includes(data[key][subKey])) {
                                    errors.push(`Valor inválido en '${key}.${subKey}'. Permitidos: ${subRules.enum.join(', ')}`);
                                }
                                if (subRules.pattern && typeof data[key][subKey] === 'string') {
                                    if (!new RegExp(subRules.pattern).test(data[key][subKey])) {
                                        errors.push(`El campo '${key}.${subKey}' tiene formato inválido.`);
                                    }
                                }
                            } else if (rules.required && rules.required.includes(subKey)) {
                                errors.push(`Falta campo requerido '${key}.${subKey}'`);
                            }
                        }
                    }
                } else if (typeof data[key] !== rules.type) {
                    errors.push(`El campo '${key}' debe ser tipo ${rules.type}.`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
