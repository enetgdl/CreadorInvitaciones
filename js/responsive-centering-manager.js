/**
 * RESPONSIVE-CENTERING-MANAGER.JS
 * Manages responsive centering and resizing of invitation elements
 * Excludes toolbar-inserted elements (text/image) from centering
 */

class ResponsiveCenteringManager {
    constructor(options = {}) {
        this.options = {
            containerSelector: options.containerSelector || '.invitation-container',
            excludeSelectors: options.excludeSelectors || [
                '.toolbar-inserted-text',
                '.toolbar-inserted-image',
                '[data-toolbar-element="true"]'
            ],
            mobileMaxWidth: options.mobileMaxWidth || 768,
            mobileWidthPercent: options.mobileWidthPercent || 90,
            mobileMaxWidthPx: options.mobileMaxWidthPx || 400,
            debounceDelay: options.debounceDelay || 250,
            ...options
        };

        this.enabled = true;
        this.resizeTimeout = null;
        this.containers = [];
        this.excludedElements = new Set();

        this.init();
    }

    init() {
        // Find all containers
        this.updateContainers();

        // Apply initial centering
        this.applyCentering();

        // Setup resize listener with debouncing
        this.setupResizeListener();

        // Setup mutation observer for dynamic elements
        this.setupMutationObserver();

        console.log('✅ Responsive Centering Manager initialized');
    }

    /**
     * Update list of containers to manage
     */
    updateContainers() {
        const containerElements = document.querySelectorAll(this.options.containerSelector);
        this.containers = Array.from(containerElements);

        // Update excluded elements
        this.updateExcludedElements();
    }

    /**
     * Update list of excluded elements
     */
    updateExcludedElements() {
        this.excludedElements.clear();

        this.options.excludeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => this.excludedElements.add(el));
        });
    }

    /**
     * Apply centering and responsive sizing
     */
    applyCentering() {
        if (!this.enabled) return;

        const isMobile = window.innerWidth <= this.options.mobileMaxWidth;

        this.containers.forEach(container => {
            if (this.excludedElements.has(container)) return;

            // Apply flexbox centering
            this.applyCenteringStyles(container);

            // Apply responsive sizing
            if (isMobile) {
                this.applyMobileSizing(container);
            } else {
                this.applyDesktopSizing(container);
            }

            // Process children
            this.processChildren(container);
        });
    }

    /**
     * Apply centering styles to container
     */
    applyCenteringStyles(container) {
        const parent = container.parentElement;
        if (!parent) return;

        // Ensure parent uses flexbox for centering
        if (!parent.style.display || parent.style.display === 'block') {
            parent.style.display = 'flex';
            parent.style.flexDirection = 'column';
            parent.style.alignItems = 'center';
            parent.style.justifyContent = 'flex-start';
        }

        // Center the container itself
        container.style.marginLeft = 'auto';
        container.style.marginRight = 'auto';
    }

    /**
     * Apply mobile-specific sizing
     */
    applyMobileSizing(container) {
        container.style.width = `${this.options.mobileWidthPercent}%`;
        container.style.maxWidth = `${this.options.mobileMaxWidthPx}px`;
        container.style.minWidth = '320px';

        // Maintain aspect ratio
        container.style.height = 'auto';
    }

    /**
     * Apply desktop sizing
     */
    applyDesktopSizing(container) {
        // Remove mobile constraints
        container.style.width = '';
        container.style.maxWidth = '';
        container.style.minWidth = '';
    }

    /**
     * Process children elements
     */
    processChildren(container) {
        const children = container.children;

        Array.from(children).forEach(child => {
            // Skip excluded elements
            if (this.isExcluded(child)) {
                this.handleExcludedElement(child);
                return;
            }

            // Apply responsive sizing to included children
            this.applyChildSizing(child);
        });
    }

    /**
     * Check if element should be excluded
     */
    isExcluded(element) {
        // Check if in excluded set
        if (this.excludedElements.has(element)) return true;

        // Check if matches any exclude selector
        return this.options.excludeSelectors.some(selector => {
            try {
                return element.matches(selector);
            } catch (e) {
                return false;
            }
        });
    }

    /**
     * Handle excluded elements (toolbar-inserted)
     */
    handleExcludedElement(element) {
        // Maintain original position but allow responsive sizing
        element.style.position = element.style.position || 'relative';

        // Allow element to resize proportionally
        const isMobile = window.innerWidth <= this.options.mobileMaxWidth;
        if (isMobile) {
            // Scale down on mobile if needed
            const scale = Math.min(1, window.innerWidth / 768);
            element.style.transform = `scale(${scale})`;
            element.style.transformOrigin = 'top left';
        } else {
            element.style.transform = '';
        }
    }

    /**
     * Apply sizing to child elements
     */
    applyChildSizing(child) {
        const isMobile = window.innerWidth <= this.options.mobileMaxWidth;

        if (isMobile) {
            // Make children responsive
            child.style.width = '100%';
            child.style.maxWidth = '100%';
        } else {
            // Reset on desktop
            child.style.width = '';
            child.style.maxWidth = '';
        }
    }

    /**
     * Setup resize listener with debouncing
     */
    setupResizeListener() {
        window.addEventListener('resize', () => {
            // Clear existing timeout
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            // Set new timeout
            this.resizeTimeout = setTimeout(() => {
                this.applyCentering();
                this.notifyResize();
            }, this.options.debounceDelay);
        }, { passive: true });
    }

    /**
     * Setup mutation observer for dynamic elements
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate) {
                this.updateContainers();
                this.applyCentering();
            }
        });

        // Observe document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.observer = observer;
    }

    /**
     * Notify resize event
     */
    notifyResize() {
        const event = new CustomEvent('responsiveCenteringResize', {
            detail: {
                dimensions: this.getDimensions(),
                isMobile: window.innerWidth <= this.options.mobileMaxWidth
            }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get current dimensions of managed containers
     */
    getDimensions() {
        return this.containers.map(container => ({
            element: container,
            width: container.offsetWidth,
            height: container.offsetHeight,
            boundingRect: container.getBoundingClientRect()
        }));
    }

    /**
     * Enable centering
     */
    enable() {
        this.enabled = true;
        this.applyCentering();
        console.log('✅ Responsive centering enabled');
    }

    /**
     * Disable centering
     */
    disable() {
        this.enabled = false;
        console.log('⏸️ Responsive centering disabled');
    }

    /**
     * Toggle centering
     */
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    }

    /**
     * Add element to exclusion list
     */
    addExclusion(element) {
        if (element instanceof HTMLElement) {
            this.excludedElements.add(element);
            this.applyCentering();
        }
    }

    /**
     * Remove element from exclusion list
     */
    removeExclusion(element) {
        if (this.excludedElements.has(element)) {
            this.excludedElements.delete(element);
            this.applyCentering();
        }
    }

    /**
     * Update exclusions dynamically
     */
    updateExclusions(selectors) {
        if (Array.isArray(selectors)) {
            this.options.excludeSelectors = selectors;
            this.updateExcludedElements();
            this.applyCentering();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            enabled: this.enabled,
            containerCount: this.containers.length,
            excludedCount: this.excludedElements.size,
            isMobile: window.innerWidth <= this.options.mobileMaxWidth,
            dimensions: this.getDimensions()
        };
    }

    /**
     * Destroy manager
     */
    destroy() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        if (this.observer) {
            this.observer.disconnect();
        }

        console.log('🗑️ Responsive Centering Manager destroyed');
    }
}

// Auto-initialize with default settings
document.addEventListener('DOMContentLoaded', () => {
    // Wait for preview frame to load
    setTimeout(() => {
        const previewFrame = document.getElementById('previewFrame');
        if (previewFrame && previewFrame.contentDocument) {
            const frameDoc = previewFrame.contentDocument;

            // Initialize manager for preview content
            window.responsiveCenteringManager = new ResponsiveCenteringManager({
                containerSelector: '.invitation-container, .event-section, .content-wrapper',
                excludeSelectors: [
                    '.toolbar-inserted-text',
                    '.toolbar-inserted-image',
                    '[data-toolbar-element="true"]',
                    '.draggable-element'
                ]
            });

            console.log('✅ Responsive Centering Manager initialized for preview');
        }
    }, 1000);
});

console.log('✅ Responsive Centering Manager module loaded.');
