// Main JavaScript file
class CRMApp {
    constructor() {
        this.apiBaseUrl = 'https://riseandshine-crm-production.up.railway.app/api';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            console.log('🔍 Checking authentication...');
            console.log('🔍 Current cookies:', document.cookie);
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('🔍 Auth response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 Auth successful, user:', data.user);
                this.currentUser = data.user;
                
                // Check admin status with timeout
                await this.checkAdminStatus();
                
                this.updateUIForAuthenticatedUser();
            } else if (response.status === 401) {
                console.log('🔍 Auth failed with 401, clearing cookies');
                // Clear any invalid cookies
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.railway.app;';
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                
                // If we're on a protected page, redirect to login
                const protectedPages = ['dashboard.html', 'admin.html'];
                const currentPage = window.location.pathname.split('/').pop();
                if (protectedPages.includes(currentPage)) {
                    window.location.href = 'login.html';
                    return;
                }
                
                this.updateUIForUnauthenticatedUser();
            } else {
                this.updateUIForUnauthenticatedUser();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            if (error.name === 'AbortError') {
                console.log('Auth check timed out, showing guest UI');
            }
            this.updateUIForUnauthenticatedUser();
        }
    }

    async checkAdminStatus() {
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(`${this.apiBaseUrl}/admin/my-status`, {
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser.isAdmin = data.isAdmin;
            }
        } catch (error) {
            console.error('Admin status check failed:', error);
            if (error.name === 'AbortError') {
                console.log('Admin check timed out, defaulting to non-admin');
            }
            this.currentUser.isAdmin = false;
        }
    }

    updateUIForAuthenticatedUser() {
        // Remove loading states
        this.hideLoadingStates();
        
        const authLinks = document.querySelectorAll('.auth-required');
        const guestLinks = document.querySelectorAll('.guest-only');
        const adminLinks = document.querySelectorAll('.admin-only');
        
        authLinks.forEach(link => link.style.display = 'inline-block');
        guestLinks.forEach(link => link.style.display = 'none');
        
        // Show admin links if user is admin
        if (this.currentUser && this.currentUser.isAdmin) {
            adminLinks.forEach(link => link.style.display = 'inline-block');
        } else {
            adminLinks.forEach(link => link.style.display = 'none');
        }
        
        // Update user info if elements exist
        const userEmail = document.getElementById('userEmail');
        if (userEmail && this.currentUser) {
            userEmail.textContent = this.currentUser.email;
        }
    }

    updateUIForUnauthenticatedUser() {
        // Remove loading states
        this.hideLoadingStates();
        
        const authLinks = document.querySelectorAll('.auth-required');
        const guestLinks = document.querySelectorAll('.guest-only');
        
        authLinks.forEach(link => link.style.display = 'none');
        guestLinks.forEach(link => link.style.display = 'inline-block');
    }

    hideLoadingStates() {
        // Remove any loading indicators
        const loadingElements = document.querySelectorAll('.loading, .spinner');
        loadingElements.forEach(el => el.remove());
    }



    async logout() {
        try {
            // Show loading state
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.textContent = 'Logging out...';
                logoutBtn.disabled = true;
            }

            const response = await fetch(`${this.apiBaseUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.currentUser = null;
                this.updateUIForUnauthenticatedUser();
                
                // Redirect to homepage (not /)
                window.location.href = window.location.origin;
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout failed:', error);
            this.showNotification('Logout failed. Please try again.', 'error');
            
            // Reset button state
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.textContent = 'Logout';
                logoutBtn.disabled = false;
            }
        }
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Utility methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// API utility class
class API {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint);
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Form validation utility
class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.errors = [];
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validate()) {
                e.preventDefault();
                this.showErrors();
            }
        });
    }

    validate() {
        this.errors = [];
        
        // Email validation
        const emailInputs = this.form.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            if (input.value && !this.isValidEmail(input.value)) {
                this.errors.push(`${input.name || 'Email'} is invalid`);
            }
        });

        // Required field validation
        const requiredInputs = this.form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                this.errors.push(`${input.name || 'This field'} is required`);
            }
        });

        // Password validation
        const passwordInputs = this.form.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.value && input.value.length < 6) {
                this.errors.push('Password must be at least 6 characters long');
            }
        });

        return this.errors.length === 0;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showErrors() {
        // Clear previous errors
        this.clearErrors();
        
        // Show new errors
        this.errors.forEach(error => {
            const errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.textContent = error;
            this.form.appendChild(errorElement);
        });
    }

    clearErrors() {
        const errorElements = this.form.querySelectorAll('.form-error');
        errorElements.forEach(element => element.remove());
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.crmApp = new CRMApp();
    window.api = new API('https://riseandshine-crm-production.up.railway.app/api');
    
    // Initialize form validation for all forms
    document.querySelectorAll('form').forEach(form => {
        new FormValidator(form);
    });
}); 