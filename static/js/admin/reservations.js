// Admin reservations management functionality

class AdminReservationsManager {
    constructor() {
        this.baseURL = "/api";
        this.reservations = [];
        this.currentFilter = "all";
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadReservations();
    }

    checkAdminAuth() {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || user.role !== "admin") {
            window.location.href = "/login";
            return;
        }
    }

    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll(".filter-btn");
        filterButtons.forEach((button) => {
            button.addEventListener("click", this.handleFilterClick.bind(this));
        });

        // Status form
        const statusForm = document.getElementById("reservation-status-form");
        if (statusForm) {
            statusForm.addEventListener(
                "submit",
                this.handleStatusUpdate.bind(this)
            );
        }

        // Modal close handlers
        const modalCloses = document.querySelectorAll(".modal-close");
        modalCloses.forEach((close) => {
            close.addEventListener("click", () => {
                this.closeModal();
            });
        });
    }

    handleFilterClick(e) {
        // Update active filter button
        document.querySelectorAll(".filter-btn").forEach((btn) => {
            btn.classList.remove("active");
        });
        e.target.classList.add("active");

        // Update current filter
        this.currentFilter = e.target.dataset.status;
        this.filterReservations();
    }

    async loadReservations() {
        const tableBody = document.getElementById("reservations-table-body");
        if (!tableBody) return;

        tableBody.innerHTML =
            '<tr><td colspan="7" class="loading-cell"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading reservations...</p></div></td></tr>';

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/reservations`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                this.reservations = await response.json();
                this.renderReservationsTable();
            } else {
                tableBody.innerHTML =
                    '<tr><td colspan="7" class="error-cell">Failed to load reservations</td></tr>';
            }
        } catch (error) {
            console.error("Error loading reservations:", error);
            tableBody.innerHTML =
                '<tr><td colspan="7" class="error-cell">Error loading reservations</td></tr>';
        }
    }

    filterReservations() {
        let filteredReservations = this.reservations;

        if (this.currentFilter !== "all") {
            filteredReservations = this.reservations.filter(
                (reservation) => reservation.status === this.currentFilter
            );
        }

        this.renderReservationsTable(filteredReservations);
    }

    renderReservationsTable(reservationsToRender = this.reservations) {
        const tableBody = document.getElementById("reservations-table-body");
        if (!tableBody) return;

        if (reservationsToRender.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="7" class="no-data-cell">No reservations found</td></tr>';
            return;
        }

        tableBody.innerHTML = reservationsToRender
            .map(
                (reservation) => `
            <tr>
                <td class="reservation-id-cell">#${reservation._id.slice(
                    -8
                )}</td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${
                            reservation.user ? reservation.user.name : "Unknown"
                        }</div>
                        <div class="customer-email">${
                            reservation.user ? reservation.user.email : "N/A"
                        }</div>
                    </div>
                </td>
                <td class="date-cell">${this.formatDate(reservation.date)}</td>
                <td class="time-cell">${this.formatTime(reservation.time)}</td>
                <td class="guests-cell">${reservation.guests}</td>
                <td>
                    <span class="status-badge status-${reservation.status}">
                        ${this.formatStatus(reservation.status)}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="adminReservationsManager.viewReservationDetails('${
                        reservation._id
                    }')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="adminReservationsManager.updateReservationStatus('${
                        reservation._id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `
            )
            .join("");
    }

    viewReservationDetails(reservationId) {
        const reservation = this.reservations.find(
            (r) => r._id === reservationId
        );
        if (!reservation) return;

        const modalContent = document.getElementById(
            "reservation-details-content"
        );
        if (!modalContent) return;

        modalContent.innerHTML = `
            <div class="reservation-details-header">
                <h3>Reservation #${reservation._id.slice(-8)}</h3>
                <span class="status-badge status-${reservation.status}">
                    ${this.formatStatus(reservation.status)}
                </span>
            </div>

            <div class="reservation-customer-info">
                <h4>Customer Information</h4>
                <div class="customer-details">
                    <div class="detail-row">
                        <strong>Name:</strong>
                        <span>${
                            reservation.user ? reservation.user.name : "Unknown"
                        }</span>
                    </div>
                    <div class="detail-row">
                        <strong>Email:</strong>
                        <span>${
                            reservation.user ? reservation.user.email : "N/A"
                        }</span>
                    </div>
                    <div class="detail-row">
                        <strong>Phone:</strong>
                        <span>${
                            reservation.user && reservation.user.phone
                                ? reservation.user.phone
                                : "N/A"
                        }</span>
                    </div>
                </div>
            </div>

            <div class="reservation-details-info">
                <h4>Reservation Details</h4>
                <div class="detail-row">
                    <strong>Date:</strong>
                    <span>${this.formatDate(reservation.date)}</span>
                </div>
                <div class="detail-row">
                    <strong>Time:</strong>
                    <span>${this.formatTime(reservation.time)}</span>
                </div>
                <div class="detail-row">
                    <strong>Number of Guests:</strong>
                    <span>${reservation.guests}</span>
                </div>
                <div class="detail-row">
                    <strong>Created:</strong>
                    <span>${this.formatDateTime(reservation.created_at)}</span>
                </div>
                ${
                    reservation.notes
                        ? `
                    <div class="detail-row">
                        <strong>Special Requests:</strong>
                        <span>${reservation.notes}</span>
                    </div>
                `
                        : ""
                }
            </div>
        `;

        this.showModal("reservation-details-modal");
    }

    updateReservationStatus(reservationId) {
        const reservation = this.reservations.find(
            (r) => r._id === reservationId
        );
        if (!reservation) return;

        document.getElementById("status-reservation-id").value = reservationId;
        document.getElementById("reservation-status").value =
            reservation.status;

        this.showModal("reservation-status-modal");
    }

    async handleStatusUpdate(e) {
        e.preventDefault();

        const reservationId = document.getElementById(
            "status-reservation-id"
        ).value;
        const newStatus = document.getElementById("reservation-status").value;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${this.baseURL}/reservations/${reservationId}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (response.ok) {
                this.closeModal();
                this.loadReservations(); // Reload the table

                if (window.app) {
                    window.app.showNotification(
                        "Reservation status updated successfully!",
                        "success"
                    );
                }
            } else {
                const data = await response.json();
                if (window.app) {
                    window.app.showNotification(
                        data.error || "Status update failed",
                        "error"
                    );
                }
            }
        } catch (error) {
            console.error("Status update error:", error);
            if (window.app) {
                window.app.showNotification(
                    "Network error. Please try again.",
                    "error"
                );
            }
        }
    }

    formatStatus(status) {
        const statusMap = {
            pending: "Pending",
            confirmed: "Confirmed",
            cancelled: "Cancelled",
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add("active");
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    }

    closeModal() {
        const modals = document.querySelectorAll(".modal");
        modals.forEach((modal) => {
            modal.classList.remove("active");
            modal.style.display = "none";
        });
        document.body.style.overflow = "";
    }
}

// Initialize admin reservations manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.adminReservationsManager = new AdminReservationsManager();
});
