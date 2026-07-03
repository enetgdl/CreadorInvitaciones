/**
 * COUNTDOWN.JS - Sistema de Cuenta Regresiva
 * Calcula y muestra el tiempo restante hasta el evento
 */

class CountdownTimer {
    constructor(targetDate, targetTime, displayElement) {
        this.targetDate = targetDate;
        this.targetTime = targetTime;
        this.displayElement = displayElement;
        this.interval = null;
        this.isRunning = false;
    }

    /**
     * Iniciar contador regresivo
     */
    start() {
        if (!this.targetDate || !this.targetTime) {
            console.error('Fecha u hora objetivo no definida');
            return;
        }

        // Combinar fecha y hora
        const targetDateTime = new Date(`${this.targetDate}T${this.targetTime}`);

        if (isNaN(targetDateTime.getTime())) {
            console.error('Fecha u hora inválida');
            return;
        }

        this.isRunning = true;
        this.update(targetDateTime);

        // Actualizar cada segundo
        this.interval = setInterval(() => {
            this.update(targetDateTime);
        }, 1000);
    }

    /**
     * Actualizar display del contador
     */
    update(targetDateTime) {
        const now = new Date();
        const difference = targetDateTime - now;

        // Si el evento ya pasó
        if (difference <= 0) {
            this.displayFinished();
            this.stop();
            return;
        }

        // Calcular tiempo restante
        const timeLeft = this.calculateTimeLeft(difference);

        // Actualizar display
        if (this.displayElement) {
            this.render(timeLeft);
        }
    }

    /**
     * Calcular tiempo restante
     */
    calculateTimeLeft(difference) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            total: difference
        };
    }

    /**
     * Renderizar contador en el DOM
     */
    render(timeLeft) {
        const html = `
            <div class="countdown-item">
                <span class="countdown-value">${this.pad(timeLeft.days)}</span>
                <span class="countdown-label">${timeLeft.days === 1 ? 'Día' : 'Días'}</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${this.pad(timeLeft.hours)}</span>
                <span class="countdown-label">Horas</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${this.pad(timeLeft.minutes)}</span>
                <span class="countdown-label">Minutos</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${this.pad(timeLeft.seconds)}</span>
                <span class="countdown-label">Segundos</span>
            </div>
        `;

        this.displayElement.innerHTML = html;
    }

    /**
     * Mostrar cuando el evento ha terminado
     */
    displayFinished() {
        if (this.displayElement) {
            this.displayElement.innerHTML = `
                <div class="countdown-finished">
                    <h3>¡El evento ha comenzado!</h3>
                    <p>🎉 ¡Disfruten! 🎉</p>
                </div>
            `;
        }
    }

    /**
     * Agregar ceros a la izquierda
     */
    pad(number) {
        return number < 10 ? '0' + number : number;
    }

    /**
     * Detener contador
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            this.isRunning = false;
        }
    }

    /**
     * Reiniciar contador con nueva fecha
     */
    restart(newDate, newTime) {
        this.stop();
        this.targetDate = newDate;
        this.targetTime = newTime;
        this.start();
    }

    /**
     * Obtener tiempo restante sin iniciar el contador
     */
    getTimeLeft() {
        const targetDateTime = new Date(`${this.targetDate}T${this.targetTime}`);
        const now = new Date();
        const difference = targetDateTime - now;

        if (difference <= 0) {
            return null;
        }

        return this.calculateTimeLeft(difference);
    }
}

/**
 * Función auxiliar para crear contador regresivo
 */
function createCountdown(elementId, date, time) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento con ID ${elementId} no encontrado`);
        return null;
    }

    const countdown = new CountdownTimer(date, time, element);
    countdown.start();
    return countdown;
}

/**
 * Función para formatear duración legible
 */
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
        return `${seconds} segundo${seconds > 1 ? 's' : ''}`;
    }
}

/**
 * Clase para múltiples contadores
 */
class CountdownManager {
    constructor() {
        this.countdowns = new Map();
    }

    /**
     * Agregar nuevo contador
     */
    add(id, date, time, elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Elemento ${elementId} no encontrado`);
            return null;
        }

        const countdown = new CountdownTimer(date, time, element);
        countdown.start();
        this.countdowns.set(id, countdown);
        return countdown;
    }

    /**
     * Obtener contador por ID
     */
    get(id) {
        return this.countdowns.get(id);
    }

    /**
     * Detener contador específico
     */
    stop(id) {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            countdown.stop();
        }
    }

    /**
     * Detener todos los contadores
     */
    stopAll() {
        this.countdowns.forEach(countdown => countdown.stop());
    }

    /**
     * Eliminar contador
     */
    remove(id) {
        const countdown = this.countdowns.get(id);
        if (countdown) {
            countdown.stop();
            this.countdowns.delete(id);
        }
    }

    /**
     * Limpiar todos los contadores
     */
    clear() {
        this.stopAll();
        this.countdowns.clear();
    }
}

/**
 * Función para verificar si una fecha es válida
 */
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Función para obtener fecha/hora actual en formato ISO local
 */
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        datetime: `${year}-${month}-${day}T${hours}:${minutes}`
    };
}

/**
 * Función para agregar días a una fecha
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Función para obtener diferencia entre dos fechas
 */
function getDateDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const difference = Math.abs(d2 - d1);

    return {
        milliseconds: difference,
        seconds: Math.floor(difference / 1000),
        minutes: Math.floor(difference / (1000 * 60)),
        hours: Math.floor(difference / (1000 * 60 * 60)),
        days: Math.floor(difference / (1000 * 60 * 60 * 24))
    };
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CountdownTimer,
        CountdownManager,
        createCountdown,
        formatDuration,
        isValidDate,
        getCurrentDateTime,
        addDays,
        getDateDifference
    };
}
