// Authentication functionality

class AuthManager {
    constructor() {
        this.baseURL = '/api';
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupAuthForms();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (token && user.id) {
            // Verify token is still valid
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Token is invalid
                this.logout();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
        }
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Profile form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', this.handleUpdateProfile.bind(this));
        }

        // Password visibility toggles
        this.setupPasswordToggles();
    }

    setupPasswordToggles() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const passwordInput = this.previousElementSibling;
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const email = formData.get('email') || document.getElementById('email').value;
        const password = formData.get('password') || document.getElementById('password').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        // Show loading state
        this.setFormLoading(form, true);

        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show success message
                this.showSuccess('Login successful! Redirecting...');

                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/';
                    }
                }, 1500);
            } else {
                this.showError('form-error', data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('form-error', 'Network error. Please try again.');
        } finally {
            this.setFormLoading(form, false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const name = formData.get('name') || document.getElementById('name').value;
        const email = formData.get('email') || document.getElementById('email').value;
        const phone = formData.get('phone') || document.getElementById('phone').value;
        const password = formData.get('password') || document.getElementById('password').value;
        const confirmPassword = formData.get('confirm-password') || document.getElementById('confirm-password').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateRegisterForm(name, email, phone, password, confirmPassword)) {
            return;
        }

        // Show loading state
        this.setFormLoading(form, true);

        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Show success message
                this.showSuccess('Registration successful! Redirecting...');

                // Redirect to home page
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showError('form-error', data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('form-error', 'Network error. Please try again.');
        } finally {
            this.setFormLoading(form, false);
        }
    }

    async handleUpdateProfile(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const name = formData.get('name') || document.getElementById('name').value;
        const phone = formData.get('phone') || document.getElementById('phone').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!name.trim()) {
            this.showError('name-error', 'Name is required');
            return;
        }

        // Show loading state
        this.setFormLoading(form, true);

        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, phone })
            });

            const data = await response.json();

            if (response.ok) {
                // Update stored user data
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.name = name;
                localStorage.setItem('user', JSON.stringify(user));

                // Update UI
                if (window.app) {
                    window.app.updateAuthUI();
                }

                this.showSuccess('Profile updated successfully!');
            } else {
                this.showError('form-error', data.error || 'Update failed');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showError('form-error', 'Network error. Please try again.');
        } finally {
            this.setFormLoading(form, false);
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;

        if (!email) {
            this.showError('email-error', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('email-error', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            this.showError('password-error', 'Password is required');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(name, email, phone, password, confirmPassword) {
        let isValid = true;

        if (!name.trim()) {
            this.showError('name-error', 'Name is required');
            isValid = false;
        } else if (name.trim().length < 2) {
            this.showError('name-error', 'Name must be at least 2 characters long');
            isValid = false;
        }

        if (!email) {
            this.showError('email-error', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError('email-error', 'Please enter a valid email address');
            isValid = false;
        }

        if (phone && !this.isValidPhone(phone)) {
            this.showError('phone-error', 'Please enter a valid phone number');
            isValid = false;
        }

        if (!password) {
            this.showError('password-error', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError('password-error', 'Password must be at least 6 characters long');
            isValid = false;
        }

        if (!confirmPassword) {
            this.showError('confirm-password-error', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showError('confirm-password-error', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.color = '';
        });
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.color = 'var(--error-color)';
        }
    }

    showSuccess(message) {
        const formError = document.getElementById('form-error');
        if (formError) {
            formError.textContent = message;
            formError.style.color = 'var(--success-color)';
        }

        // Also show notification if available
        if (window.app) {
            window.app.showNotification(message, 'success');
        }
    }

    setFormLoading(form, loading) {
        const submitButton = form.querySelector('button[type="submit"]');
        const submitText = submitButton.querySelector('.submit-text, #login-text, #register-text');
        const submitSpinner = submitButton.querySelector('.submit-spinner, #login-spinner, #register-spinner');

        if (submitButton) {
            submitButton.disabled = loading;
        }

        if (submitText) {
            submitText.style.display = loading ? 'none' : 'inline';
        }

        if (submitSpinner) {
            submitSpinner.style.display = loading ? 'inline-block' : 'none';
        }
    }

    logout() {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart'); // Clear cart on logout

        // Update UI
        if (window.app) {
            window.app.updateAuthUI();
            window.app.updateCartCount();
        }

        // Redirect if on protected pages
        const protectedPaths = ['/admin', '/profile', '/orders'];
        const currentPath = window.location.pathname;
        
        if (protectedPaths.some(path => currentPath.includes(path))) {
            window.location.href = '/login';
        } else {
            // Reload to update UI
            window.location.reload();
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    }

    // Get current user
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || '{}');
    }

    // Get auth token
    getToken() {
        return localStorage.getItem('token');
    }

    // Check if current user is admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user.role === 'admin';
    }

    // Redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }

    // Redirect to home if not admin
    requireAdmin() {
        if (!this.requireAuth()) {
            return false;
        }

        if (!this.isAdmin()) {
            window.location.href = '/';
            return false;
        }
        
        return true;
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Auto-fill demo credentials functionality
function fillDemoCredentials(type) {
    if (type === 'admin') {
        document.getElementById('email').value = 'admin@savory.com';
        document.getElementById('password').value = 'admin123';
    } else if (type === 'customer') {
        document.getElementById('email').value = 'customer@savory.com';
        document.getElementById('password').value = 'customer123';
    }
}

// Add click handlers for demo credentials (if elements exist)
document.addEventListener('DOMContentLoaded', () => {
    const demoCredentials = document.querySelector('.demo-credentials');
    if (demoCredentials) {
        demoCredentials.addEventListener('click', (e) => {
            const text = e.target.textContent;
            if (text.includes('admin@savory.com')) {
                fillDemoCredentials('admin');
            } else if (text.includes('customer@savory.com')) {
                fillDemoCredentials('customer');
            }
        });
    }
});