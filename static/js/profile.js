// Profile page functionality

class ProfileManager {
    constructor() {
        this.baseURL = "/api";
        this.currentTab = "personal-info";
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserProfile();
        this.checkAuthentication();
    }

    checkAuthentication() {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
    }

    setupEventListeners() {
        // Tab navigation
        const tabLinks = document.querySelectorAll(".profile-nav-link");
        tabLinks.forEach((link) => {
            link.addEventListener("click", this.handleTabClick.bind(this));
        });

        // Profile form
        const profileForm = document.getElementById("profile-form");
        if (profileForm) {
            profileForm.addEventListener(
                "submit",
                this.handleProfileUpdate.bind(this)
            );
        }

        // Password form
        const passwordForm = document.getElementById("password-form");
        if (passwordForm) {
            passwordForm.addEventListener(
                "submit",
                this.handlePasswordChange.bind(this)
            );
        }

        // Password toggles
        this.setupPasswordToggles();
    }

    setupPasswordToggles() {
        const passwordToggles = document.querySelectorAll(".password-toggle");
        passwordToggles.forEach((toggle) => {
            toggle.addEventListener("click", function () {
                const passwordInput = this.previousElementSibling;
                const icon = this.querySelector("i");

                if (passwordInput.type === "password") {
                    passwordInput.type = "text";
                    icon.classList.remove("fa-eye");
                    icon.classList.add("fa-eye-slash");
                } else {
                    passwordInput.type = "password";
                    icon.classList.remove("fa-eye-slash");
                    icon.classList.add("fa-eye");
                }
            });
        });
    }

    handleTabClick(e) {
        e.preventDefault();

        const tabId = e.target.dataset.tab;
        if (!tabId) return;

        // Update active tab link
        document.querySelectorAll(".profile-nav-link").forEach((link) => {
            link.classList.remove("active");
        });
        e.target.classList.add("active");

        // Update active tab content
        document.querySelectorAll(".profile-tab").forEach((tab) => {
            tab.classList.remove("active");
        });
        document.getElementById(tabId).classList.add("active");

        this.currentTab = tabId;

        // Load tab-specific content
        if (tabId === "order-history") {
            this.loadOrderHistory();
        } else if (tabId === "reservations-history") {
            this.loadReservationsHistory();
        }
    }

    async loadUserProfile() {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const user = await response.json();
                this.populateProfileForm(user);
            } else {
                console.error("Failed to load profile");
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    }

    populateProfileForm(user) {
        // Update sidebar
        document.getElementById("profile-name").textContent = user.name;
        document.getElementById("profile-email").textContent = user.email;
        document.getElementById("profile-role").textContent =
            user.role.charAt(0).toUpperCase() + user.role.slice(1);

        // Update form fields
        document.getElementById("name").value = user.name || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;

        // Clear previous errors
        this.clearErrors("profile-form");

        // Validation
        if (!name.trim()) {
            this.showError("name-error", "Name is required");
            return;
        }

        // Show loading state
        this.setFormLoading("profile-form", true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, phone }),
            });

            const data = await response.json();

            if (response.ok) {
                // Update stored user data
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                user.name = name;
                localStorage.setItem("user", JSON.stringify(user));

                // Update UI
                document.getElementById("profile-name").textContent = name;
                if (window.app) {
                    window.app.updateAuthUI();
                }

                this.showSuccess(
                    "profile-form-error",
                    "Profile updated successfully!"
                );
            } else {
                this.showError(
                    "profile-form-error",
                    data.error || "Update failed"
                );
            }
        } catch (error) {
            console.error("Profile update error:", error);
            this.showError(
                "profile-form-error",
                "Network error. Please try again."
            );
        } finally {
            this.setFormLoading("profile-form", false);
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();

        const currentPassword =
            document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmNewPassword = document.getElementById(
            "confirm-new-password"
        ).value;

        // Clear previous errors
        this.clearErrors("password-form");

        // Validation
        if (!currentPassword) {
            this.showError(
                "current-password-error",
                "Current password is required"
            );
            return;
        }

        if (!newPassword) {
            this.showError("new-password-error", "New password is required");
            return;
        }

        if (newPassword.length < 6) {
            this.showError(
                "new-password-error",
                "Password must be at least 6 characters long"
            );
            return;
        }

        if (newPassword !== confirmNewPassword) {
            this.showError(
                "confirm-new-password-error",
                "Passwords do not match"
            );
            return;
        }

        // Show loading state
        this.setFormLoading("password-form", true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                // Clear form
                document.getElementById("password-form").reset();
                this.showSuccess(
                    "password-form-error",
                    "Password changed successfully!"
                );
            } else {
                this.showError(
                    "password-form-error",
                    data.error || "Password change failed"
                );
            }
        } catch (error) {
            console.error("Password change error:", error);
            this.showError(
                "password-form-error",
                "Network error. Please try again."
            );
        } finally {
            this.setFormLoading("password-form", false);
        }
    }

    async loadOrderHistory() {
        const container = document.getElementById("orders-container");
        if (!container) return;

        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading orders...</p>
            </div>
        `;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const orders = await response.json();
                this.renderOrderHistory(orders);
            } else {
                container.innerHTML =
                    '<p class="error">Failed to load orders</p>';
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            container.innerHTML =
                '<p class="error">Network error loading orders</p>';
        }
    }

    renderOrderHistory(orders) {
        const container = document.getElementById("orders-container");

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No orders yet</h3>
                    <p>You haven't placed any orders yet.</p>
                    <a href="/menu" class="btn btn-primary">Browse Menu</a>
                </div>
            `;
            return;
        }

        container.innerHTML = orders
            .map(
                (order) => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Order #${order._id.slice(-8)}</div>
                    <div class="order-status status-${order.status}">${
                    order.status.charAt(0).toUpperCase() + order.status.slice(1)
                }</div>
                </div>
                <div class="order-details">
                    <div class="order-date">${new Date(
                        order.order_date
                    ).toLocaleDateString()}</div>
                    <div class="order-total">$${order.total.toFixed(2)}</div>
                </div>
                <div class="order-items">
                    ${order.items
                        .slice(0, 2)
                        .map(
                            (item) => `
                        <span class="order-item">${item.name} x${item.quantity}</span>
                    `
                        )
                        .join("")}
                    ${
                        order.items.length > 2
                            ? `<span class="more-items">+${
                                  order.items.length - 2
                              } more</span>`
                            : ""
                    }
                </div>
            </div>
        `
            )
            .join("");
    }

    async loadReservationsHistory() {
        const container = document.getElementById("reservations-container");
        if (!container) return;

        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading reservations...</p>
            </div>
        `;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/reservations`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const reservations = await response.json();
                this.renderReservationsHistory(reservations);
            } else {
                container.innerHTML =
                    '<p class="error">Failed to load reservations</p>';
            }
        } catch (error) {
            console.error("Error loading reservations:", error);
            container.innerHTML =
                '<p class="error">Network error loading reservations</p>';
        }
    }

    renderReservationsHistory(reservations) {
        const container = document.getElementById("reservations-container");

        if (reservations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar"></i>
                    <h3>No reservations yet</h3>
                    <p>You haven't made any reservations yet.</p>
                    <a href="/reservations" class="btn btn-primary">Make Reservation</a>
                </div>
            `;
            return;
        }

        container.innerHTML = reservations
            .map(
                (reservation) => `
            <div class="reservation-card">
                <div class="reservation-header">
                    <div class="reservation-id">Reservation #${reservation._id.slice(
                        -8
                    )}</div>
                    <div class="reservation-status status-${
                        reservation.status
                    }">${
                    reservation.status.charAt(0).toUpperCase() +
                    reservation.status.slice(1)
                }</div>
                </div>
                <div class="reservation-details">
                    <div class="reservation-date">
                        <i class="fas fa-calendar"></i>
                        ${new Date(reservation.date).toLocaleDateString()}
                    </div>
                    <div class="reservation-time">
                        <i class="fas fa-clock"></i>
                        ${reservation.time}
                    </div>
                    <div class="reservation-guests">
                        <i class="fas fa-users"></i>
                        ${reservation.guests} guests
                    </div>
                </div>
                ${
                    reservation.notes
                        ? `<div class="reservation-notes">${reservation.notes}</div>`
                        : ""
                }
            </div>
        `
            )
            .join("");
    }

    clearErrors(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const errorElements = form.querySelectorAll(".error-message");
            errorElements.forEach((el) => {
                el.textContent = "";
                el.style.color = "";
            });
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.color = "var(--error-color)";
        }
    }

    showSuccess(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.color = "var(--success-color)";
        }
    }

    setFormLoading(formId, loading) {
        const form = document.getElementById(formId);
        if (!form) return;

        const submitButton = form.querySelector('button[type="submit"]');
        const submitText = submitButton.querySelector("span");
        const submitSpinner = submitButton.querySelector("i");

        if (submitButton) {
            submitButton.disabled = loading;
        }

        if (submitText) {
            submitText.style.display = loading ? "none" : "inline";
        }

        if (submitSpinner) {
            submitSpinner.style.display = loading ? "inline-block" : "none";
        }
    }
}

// Initialize profile manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.profileManager = new ProfileManager();
});
