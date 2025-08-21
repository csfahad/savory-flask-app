// Reservations functionality

class ReservationsManager {
    constructor() {
        this.baseURL = "/api";
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setMinDate();
    }

    setupEventListeners() {
        const reservationForm = document.getElementById("reservation-form");
        if (reservationForm) {
            reservationForm.addEventListener(
                "submit",
                this.handleReservation.bind(this)
            );
        }
    }

    setMinDate() {
        const dateInput = document.getElementById("reservation-date");
        if (dateInput) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split("T")[0];
        }
    }

    async handleReservation(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);

        const date = document.getElementById("reservation-date").value;
        const time = document.getElementById("reservation-time").value;
        const guests = document.getElementById("guests").value;
        const notes = document.getElementById("special-requests").value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateReservationForm(date, time, guests)) {
            return;
        }

        // Check authentication
        const token = localStorage.getItem("token");
        if (!token) {
            this.showError("form-error", "Please login to make a reservation");
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
            return;
        }

        // Show loading state
        this.setFormLoading(true);

        try {
            const response = await fetch(`${this.baseURL}/reservations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ date, time, guests, notes }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show success modal
                this.showReservationSuccess(data._id);
                form.reset();
                this.setMinDate();
            } else {
                this.showError(
                    "form-error",
                    data.error || "Reservation failed"
                );
            }
        } catch (error) {
            console.error("Reservation error:", error);
            this.showError("form-error", "Network error. Please try again.");
        } finally {
            this.setFormLoading(false);
        }
    }

    validateReservationForm(date, time, guests) {
        let isValid = true;

        if (!date) {
            this.showError("date-error", "Please select a date");
            isValid = false;
        } else {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate <= today) {
                this.showError("date-error", "Please select a future date");
                isValid = false;
            }
        }

        if (!time) {
            this.showError("time-error", "Please select a time");
            isValid = false;
        }

        if (!guests) {
            this.showError("guests-error", "Please select number of guests");
            isValid = false;
        }

        return isValid;
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
        const reservationBtn = document.getElementById("reservation-btn");
        const reservationText = document.getElementById("reservation-text");
        const reservationSpinner = document.getElementById(
            "reservation-spinner"
        );

        if (reservationBtn) {
            reservationBtn.disabled = loading;
        }

        if (reservationText) {
            reservationText.style.display = loading ? "none" : "inline";
        }

        if (reservationSpinner) {
            reservationSpinner.style.display = loading
                ? "inline-block"
                : "none";
        }
    }

    showReservationSuccess(reservationId) {
        const modal = document.getElementById("reservation-success-modal");
        const reservationIdEl = document.getElementById("reservation-id");

        if (reservationIdEl) {
            reservationIdEl.textContent = `#${reservationId.slice(-8)}`;
        }

        if (modal && window.app) {
            window.app.showModal("reservation-success-modal");
        } else {
            if (window.app) {
                window.app.showNotification(
                    "Reservation confirmed successfully!",
                    "success"
                );
            }
        }
    }
}

// Initialize reservations manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.reservationsManager = new ReservationsManager();
});
