/**
 * RSVP-HELP-MODAL.JS
 * Manages the RSVP help modal functionality
 */

class RSVPHelpModal {
    constructor() {
        this.modal = document.getElementById('rsvpHelpModal');
        this.helpBtn = document.getElementById('rsvpHelpBtn');
        this.closeBtn = document.getElementById('rsvpHelpClose');
        this.okBtn = document.getElementById('rsvpHelpOk');
        this.rsvpCheckbox = document.getElementById('enableRSVP');

        this.init();
    }

    init() {
        if (!this.modal || !this.helpBtn) return;

        // Open modal on help button click
        this.helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.open();
        });

        // Close modal handlers
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.okBtn) {
            this.okBtn.addEventListener('click', () => this.close());
        }

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        // Add hover effect to help button
        this.helpBtn.addEventListener('mouseenter', () => {
            this.helpBtn.style.opacity = '1';
            this.helpBtn.style.transform = 'scale(1.1)';
        });

        this.helpBtn.addEventListener('mouseleave', () => {
            this.helpBtn.style.opacity = '0.7';
            this.helpBtn.style.transform = 'scale(1)';
        });

        // Set initial button style
        this.helpBtn.style.opacity = '0.7';
        this.helpBtn.style.transition = 'opacity 0.2s, transform 0.2s';
    }

    open() {
        if (!this.modal) return;

        this.modal.style.display = 'flex';
        this.modal.setAttribute('aria-hidden', 'false');

        // Focus first focusable element
        setTimeout(() => {
            const firstFocusable = this.modal.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Announce to screen readers
        this.announce('Modal de ayuda para confirmación de asistencia abierto');
    }

    close() {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to help button
        if (this.helpBtn) {
            this.helpBtn.focus();
        }
    }

    isOpen() {
        return this.modal && this.modal.style.display === 'flex';
    }

    announce(message) {
        let liveRegion = document.getElementById('rsvp-help-live-region');

        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'rsvp-help-live-region';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.rsvpHelpModal = new RSVPHelpModal();
});

console.log('✅ RSVP Help Modal loaded.');
