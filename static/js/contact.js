// Contact form functionality

class ContactManager {
    constructor() {
        this.baseURL = "/api";
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const contactForm = document.getElementById("contact-form");
        if (contactForm) {
            contactForm.addEventListener(
                "submit",
                this.handleContactSubmit.bind(this)
            );
        }
    }

    async handleContactSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const name = document.getElementById("contact-name").value;
        const email = document.getElementById("contact-email").value;
        const subject = document.getElementById("contact-subject").value;
        const message = document.getElementById("contact-message").value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateContactForm(name, email, subject, message)) {
            return;
        }

        // Show loading state
        this.setFormLoading(true);

        try {
            const response = await fetch(`${this.baseURL}/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, subject, message }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show success modal
                this.showContactSuccess();
                form.reset();
            } else {
                this.showError(
                    "form-error",
                    data.error || "Failed to send message"
                );
            }
        } catch (error) {
            console.error("Contact form error:", error);
            this.showError("form-error", "Network error. Please try again.");
        } finally {
            this.setFormLoading(false);
        }
    }

    validateContactForm(name, email, subject, message) {
        let isValid = true;

        if (!name.trim()) {
            this.showError("name-error", "Name is required");
            isValid = false;
        }

        if (!email.trim()) {
            this.showError("email-error", "Email is required");
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showError("email-error", "Please enter a valid email address");
            isValid = false;
        }

        if (!subject.trim()) {
            this.showError("subject-error", "Subject is required");
            isValid = false;
        }

        if (!message.trim()) {
            this.showError("message-error", "Message is required");
            isValid = false;
        } else if (message.trim().length < 10) {
            this.showError(
                "message-error",
                "Message must be at least 10 characters long"
            );
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    clearErrors() {
        const errorElements = document.querySelectorAll(".error-message");
        errorElements.forEach((el) => (el.textContent = ""));
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    setFormLoading(loading) {
        const contactBtn = document.getElementById("contact-btn");
        const contactText = document.getElementById("contact-text");
        const contactSpinner = document.getElementById("contact-spinner");

        if (contactBtn) {
            contactBtn.disabled = loading;
        }

        if (contactText) {
            contactText.style.display = loading ? "none" : "inline";
        }

        if (contactSpinner) {
            contactSpinner.style.display = loading ? "inline-block" : "none";
        }
    }

    showContactSuccess() {
        const modal = document.getElementById("contact-success-modal");
        if (modal && window.app) {
            window.app.showModal("contact-success-modal");
        } else {
            if (window.app) {
                window.app.showNotification(
                    "Message sent successfully!",
                    "success"
                );
            }
        }
    }
}

// Initialize contact manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.contactManager = new ContactManager();
});
