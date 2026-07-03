/**
 * RESPONSIVE-VIEWPORT-MANAGER.JS
 * Advanced responsive system for invitation rendering
 * Handles viewport detection, safe-area, scaling, and device-specific optimizations
 */

class ResponsiveViewportManager {
    constructor() {
        this.viewport = {
            width: 0,
            height: 0,
            availableHeight: 0,
            pixelRatio: 1,
            safeAreaTop: 0,
            safeAreaBottom: 0,
            orientation: 'portrait'
        };

        this.breakpoints = {
            mobile: 768,
            tablet: 1024
        };

        this.deviceType = 'desktop';
        this.resizeObserver = null;
        this.debounceTimer = null;

        this.init();
    }

    /**
     * Initialize the responsive system
     */
    init() {
        this.detectViewport();
        this.applySafeAreaStyles();
        this.applyResponsiveStyles();
        this.setupObservers();
        this.ensurePhotoVisibility();

        console.log('✅ Responsive Viewport Manager initialized', this.viewport);
    }

    /**
     * Detect viewport dimensions and device characteristics
     */
    detectViewport() {
        // Get window dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Calculate available height (excluding browser chrome)
        const visualViewport = window.visualViewport;
        const availableHeight = visualViewport ? visualViewport.height : height;

        // Detect pixel ratio
        const pixelRatio = window.devicePixelRatio || 1;

        // Detect safe area insets (iOS notch, Android navigation)
        const safeAreaTop = this.getSafeAreaInset('top');
        const safeAreaBottom = this.getSafeAreaInset('bottom');

        // Detect orientation
        const orientation = width > height ? 'landscape' : 'portrait';

        // Determine device type
        let deviceType = 'desktop';
        if (width < this.breakpoints.mobile) {
            deviceType = 'mobile';
        } else if (width < this.breakpoints.tablet) {
            deviceType = 'tablet';
        }

        // Update viewport object
        this.viewport = {
            width,
            height,
            availableHeight,
            pixelRatio,
            safeAreaTop,
            safeAreaBottom,
            orientation
        };

        this.deviceType = deviceType;

        // Log for debugging
        console.log('📱 Viewport detected:', this.viewport, 'Device:', deviceType);
    }

    /**
     * Get safe area inset value
     * @param {string} side - top, bottom, left, right
     * @returns {number} - Inset value in pixels
     */
    getSafeAreaInset(side) {
        // Try CSS env() first (modern browsers)
        const envValue = this.getCSSEnvValue(`safe-area-inset-${side}`);
        if (envValue) return envValue;

        // Try constant() (older iOS)
        const constantValue = this.getCSSConstantValue(`safe-area-inset-${side}`);
        if (constantValue) return constantValue;

        // Fallback: estimate based on device
        if (side === 'top') {
            // Check if likely iPhone X or newer (has notch)
            const isIPhoneX = /iPhone/i.test(navigator.userAgent) &&
                window.screen.height >= 812;
            return isIPhoneX ? 44 : 0;
        }

        return 0;
    }

    /**
     * Get value from CSS env() variable
     */
    getCSSEnvValue(variable) {
        const testElement = document.createElement('div');
        testElement.style.paddingTop = `env(${variable})`;
        document.body.appendChild(testElement);

        const computedPadding = window.getComputedStyle(testElement).paddingTop;
        document.body.removeChild(testElement);

        return parseFloat(computedPadding) || 0;
    }

    /**
     * Get value from CSS constant() variable (iOS 11)
     */
    getCSSConstantValue(variable) {
        const testElement = document.createElement('div');
        testElement.style.paddingTop = `constant(${variable})`;
        document.body.appendChild(testElement);

        const computedPadding = window.getComputedStyle(testElement).paddingTop;
        document.body.removeChild(testElement);

        return parseFloat(computedPadding) || 0;
    }

    /**
     * Apply safe area CSS custom properties
     */
    applySafeAreaStyles() {
        const root = document.documentElement;

        // Set CSS custom properties for safe areas
        root.style.setProperty('--sat', `${this.viewport.safeAreaTop}px`);
        root.style.setProperty('--sab', `${this.viewport.safeAreaBottom}px`);

        // Calculate dynamic padding top (15-20vh + safe area)
        const minPaddingVh = 15;
        const maxPaddingVh = 20;
        const basePadding = this.deviceType === 'mobile' ? maxPaddingVh : minPaddingVh;
        const paddingTop = `calc(${basePadding}vh + ${this.viewport.safeAreaTop}px)`;

        root.style.setProperty('--padding-top', paddingTop);

        // Apply to body
        document.body.style.paddingTop = `var(--padding-top, ${basePadding}vh)`;
        document.body.style.paddingBottom = `max(${this.viewport.safeAreaBottom}px, 2vh)`;
    }

    /**
     * Apply responsive styles based on device type
     */
    applyResponsiveStyles() {
        const root = document.documentElement;
        const container = document.querySelector('.invitation-content, body');

        if (!container) return;

        // Base styles for all devices
        container.style.boxSizing = 'border-box';
        container.style.margin = '0 auto';
        container.style.position = 'relative';

        // Device-specific styles
        if (this.deviceType === 'mobile') {
            this.applyMobileStyles(container);
        } else if (this.deviceType === 'tablet') {
            this.applyTabletStyles(container);
        } else {
            this.applyDesktopStyles(container);
        }

        // Apply scaling if needed
        this.applyScaling(container);
    }

    /**
     * Apply mobile-specific styles
     */
    applyMobileStyles(container) {
        container.style.width = '100%';
        container.style.maxWidth = '100vw';
        container.style.padding = '0 5vw';

        // Ensure minimum spacing
        container.style.minHeight = `calc(100vh - var(--padding-top, 20vh))`;

        // Center content
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'flex-start';
    }

    /**
     * Apply tablet-specific styles
     */
    applyTabletStyles(container) {
        container.style.width = '90%';
        container.style.maxWidth = '720px';
        container.style.padding = '0 3vw';

        // Center
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'flex-start';
    }

    /**
     * Apply desktop-specific styles
     */
    applyDesktopStyles(container) {
        container.style.width = 'auto';
        container.style.maxWidth = '1200px';
        container.style.padding = '0 2rem';

        // Center
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'flex-start';
    }

    /**
     * Apply CSS transform scaling
     */
    applyScaling(container) {
        // Only scale on very small devices
        if (this.viewport.width < 360) {
            const scale = this.viewport.width / 360;
            container.style.transform = `scale(${scale})`;
            container.style.transformOrigin = 'top center';
        } else {
            container.style.transform = '';
            container.style.transformOrigin = '';
        }
    }

    /**
     * Ensure photo of honored person is fully visible
     */
    ensurePhotoVisibility() {
        const photo = document.querySelector('.honored-photo, [data-editor-id="honoredPhoto"], .event-photo');

        if (!photo) return;

        const photoRect = photo.getBoundingClientRect();
        const viewportTop = this.viewport.safeAreaTop;

        // Check if photo is cut off at top
        if (photoRect.top < viewportTop + (this.viewport.height * 0.1)) {
            // Add additional padding to body
            const additionalPadding = viewportTop + (this.viewport.height * 0.1) - photoRect.top + 20;
            const currentPadding = parseFloat(document.body.style.paddingTop) || 0;
            document.body.style.paddingTop = `${currentPadding + additionalPadding}px`;

            console.log('⚠️ Photo adjusted: added', additionalPadding, 'px padding');
        }
    }

    /**
     * Setup resize and orientation change observers
     */
    setupObservers() {
        // Resize observer
        const handleResize = () => {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.debounceTimer = setTimeout(() => {
                console.log('🔄 Viewport changed, recalculating...');
                this.detectViewport();
                this.applySafeAreaStyles();
                this.applyResponsiveStyles();
                this.ensurePhotoVisibility();

                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('viewportRecalculated', {
                    detail: this.viewport
                }));
            }, 150);
        };

        // Listen for resize
        window.addEventListener('resize', handleResize, { passive: true });

        // Listen for orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 300); // Delay to let browser settle
        }, { passive: true });

        // Use ResizeObserver if available
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(handleResize);
            this.resizeObserver.observe(document.body);
        }

        // Listen for visual viewport changes (mobile browser chrome hide/show)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize, { passive: true });
            window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            viewport: { ...this.viewport },
            deviceType: this.deviceType,
            breakpoints: { ...this.breakpoints }
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        console.log('🗑️ Responsive Viewport Manager destroyed');
    }
}

// Export as module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveViewportManager;
}

// Auto-initialize if not in module context
if (typeof define === 'undefined' && typeof module === 'undefined') {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.responsiveViewportManager = new ResponsiveViewportManager();
        });
    } else {
        window.responsiveViewportManager = new ResponsiveViewportManager();
    }
}
