// Admin dashboard functionality

class AdminDashboard {
    constructor() {
        this.baseURL = "/api";
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.loadDashboardData();
    }

    checkAdminAuth() {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        if (!token || user.role !== "admin") {
            window.location.href = "/login";
            return;
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStats(),
                this.loadRecentOrders(),
                this.loadRecentReservations(),
            ]);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    async loadStats() {
        try {
            const token = localStorage.getItem("token");

            // Load orders for stats
            const ordersResponse = await fetch(`${this.baseURL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Load reservations for stats
            const reservationsResponse = await fetch(
                `${this.baseURL}/reservations`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Load menu items for stats
            const menuResponse = await fetch(`${this.baseURL}/menu`);

            if (
                ordersResponse.ok &&
                reservationsResponse.ok &&
                menuResponse.ok
            ) {
                const orders = await ordersResponse.json();
                const reservations = await reservationsResponse.json();
                const menuItems = await menuResponse.json();

                this.updateStats(orders, reservations, menuItems);
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    }

    updateStats(orders, reservations, menuItems) {
        // Update total orders
        const totalOrdersEl = document.getElementById("total-orders");
        if (totalOrdersEl) {
            totalOrdersEl.textContent = orders.length;
        }

        // Update total reservations
        const totalReservationsEl =
            document.getElementById("total-reservations");
        if (totalReservationsEl) {
            totalReservationsEl.textContent = reservations.length;
        }

        // Update total menu items
        const totalMenuItemsEl = document.getElementById("total-menu-items");
        if (totalMenuItemsEl) {
            totalMenuItemsEl.textContent = menuItems.length;
        }

        // Calculate total revenue
        const totalRevenue = orders.reduce(
            (sum, order) => sum + order.total,
            0
        );
        const totalRevenueEl = document.getElementById("total-revenue");
        if (totalRevenueEl) {
            totalRevenueEl.textContent = `$${totalRevenue.toFixed(2)}`;
        }
    }

    async loadRecentOrders() {
        const container = document.getElementById("recent-orders");
        if (!container) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const orders = await response.json();
                const recentOrders = orders.slice(0, 5); // Get 5 most recent
                this.renderRecentOrders(recentOrders);
            } else {
                container.innerHTML =
                    '<p class="error">Failed to load recent orders</p>';
            }
        } catch (error) {
            console.error("Error loading recent orders:", error);
            container.innerHTML =
                '<p class="error">Error loading recent orders</p>';
        }
    }

    renderRecentOrders(orders) {
        const container = document.getElementById("recent-orders");

        if (orders.length === 0) {
            container.innerHTML = '<p class="no-data">No recent orders</p>';
            return;
        }

        container.innerHTML = orders
            .map(
                (order) => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-title">Order #${order._id.slice(-8)}</div>
                    <div class="item-subtitle">${
                        order.user ? order.user.name : "Unknown Customer"
                    }</div>
                </div>
                <div class="item-meta">
                    <div class="item-amount">$${order.total.toFixed(2)}</div>
                    <div class="item-status status-${
                        order.status
                    }">${this.formatStatus(order.status)}</div>
                </div>
            </div>
        `
            )
            .join("");
    }

    async loadRecentReservations() {
        const container = document.getElementById("recent-reservations");
        if (!container) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/reservations`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const reservations = await response.json();
                const recentReservations = reservations.slice(0, 5); // Get 5 most recent
                this.renderRecentReservations(recentReservations);
            } else {
                container.innerHTML =
                    '<p class="error">Failed to load recent reservations</p>';
            }
        } catch (error) {
            console.error("Error loading recent reservations:", error);
            container.innerHTML =
                '<p class="error">Error loading recent reservations</p>';
        }
    }

    renderRecentReservations(reservations) {
        const container = document.getElementById("recent-reservations");

        if (reservations.length === 0) {
            container.innerHTML =
                '<p class="no-data">No recent reservations</p>';
            return;
        }

        container.innerHTML = reservations
            .map(
                (reservation) => `
            <div class="recent-item">
                <div class="item-info">
                    <div class="item-title">Reservation #${reservation._id.slice(
                        -8
                    )}</div>
                    <div class="item-subtitle">${
                        reservation.user
                            ? reservation.user.name
                            : "Unknown Customer"
                    }</div>
                </div>
                <div class="item-meta">
                    <div class="item-date">${new Date(
                        reservation.date
                    ).toLocaleDateString()}</div>
                    <div class="item-status status-${
                        reservation.status
                    }">${this.formatStatus(reservation.status)}</div>
                </div>
            </div>
        `
            )
            .join("");
    }

    formatStatus(status) {
        const statusMap = {
            pending: "Pending",
            confirmed: "Confirmed",
            preparing: "Preparing",
            ready: "Ready",
            delivered: "Delivered",
            cancelled: "Cancelled",
        };
        return statusMap[status] || status;
    }
}

// Initialize admin dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.adminDashboard = new AdminDashboard();
});
