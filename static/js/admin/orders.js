// Admin orders management functionality

class AdminOrdersManager {
    constructor() {
        this.baseURL = "/api";
        this.orders = [];
        this.currentFilter = "all";
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadOrders();
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
        const statusForm = document.getElementById("status-form");
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
        this.filterOrders();
    }

    async loadOrders() {
        const tableBody = document.getElementById("orders-table-body");
        if (!tableBody) return;

        tableBody.innerHTML =
            '<tr><td colspan="7" class="loading-cell"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading orders...</p></div></td></tr>';

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                this.orders = await response.json();
                this.renderOrdersTable();
            } else {
                tableBody.innerHTML =
                    '<tr><td colspan="7" class="error-cell">Failed to load orders</td></tr>';
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            tableBody.innerHTML =
                '<tr><td colspan="7" class="error-cell">Error loading orders</td></tr>';
        }
    }

    filterOrders() {
        let filteredOrders = this.orders;

        if (this.currentFilter !== "all") {
            filteredOrders = this.orders.filter(
                (order) => order.status === this.currentFilter
            );
        }

        this.renderOrdersTable(filteredOrders);
    }

    renderOrdersTable(ordersToRender = this.orders) {
        const tableBody = document.getElementById("orders-table-body");
        if (!tableBody) return;

        if (ordersToRender.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="7" class="no-data-cell">No orders found</td></tr>';
            return;
        }

        tableBody.innerHTML = ordersToRender
            .map(
                (order) => `
            <tr>
                <td class="order-id-cell">#${order._id.slice(-8)}</td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${
                            order.user ? order.user.name : "Unknown"
                        }</div>
                        <div class="customer-email">${
                            order.user ? order.user.email : "N/A"
                        }</div>
                    </div>
                </td>
                <td>
                    <div class="items-summary">
                        ${order.items
                            .slice(0, 2)
                            .map(
                                (item) => `
                            <div class="item-line">${item.name} x${item.quantity}</div>
                        `
                            )
                            .join("")}
                        ${
                            order.items.length > 2
                                ? `<div class="more-items">+${
                                      order.items.length - 2
                                  } more</div>`
                                : ""
                        }
                    </div>
                </td>
                <td class="price-cell">$${order.total.toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${this.formatStatus(order.status)}
                    </span>
                </td>
                <td class="date-cell">${this.formatDate(order.order_date)}</td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="adminOrdersManager.viewOrderDetails('${
                        order._id
                    }')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="adminOrdersManager.updateOrderStatus('${
                        order._id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `
            )
            .join("");
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find((o) => o._id === orderId);
        if (!order) return;

        const modalContent = document.getElementById("order-details-content");
        if (!modalContent) return;

        modalContent.innerHTML = `
            <div class="order-details-header">
                <h3>Order #${order._id.slice(-8)}</h3>
                <span class="status-badge status-${order.status}">
                    ${this.formatStatus(order.status)}
                </span>
            </div>

            <div class="order-customer-info">
                <h4>Customer Information</h4>
                <div class="customer-details">
                    <div class="detail-row">
                        <strong>Name:</strong>
                        <span>${order.user ? order.user.name : "Unknown"}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Email:</strong>
                        <span>${order.user ? order.user.email : "N/A"}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Phone:</strong>
                        <span>${
                            order.user && order.user.phone
                                ? order.user.phone
                                : "N/A"
                        }</span>
                    </div>
                </div>
            </div>

            <div class="order-details-info">
                <h4>Order Information</h4>
                <div class="detail-row">
                    <strong>Order Date:</strong>
                    <span>${this.formatDateTime(order.order_date)}</span>
                </div>
                <div class="detail-row">
                    <strong>Total Amount:</strong>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
                ${
                    order.delivery_address
                        ? `
                    <div class="detail-row">
                        <strong>Delivery Address:</strong>
                        <span>${order.delivery_address}</span>
                    </div>
                `
                        : ""
                }
                ${
                    order.notes
                        ? `
                    <div class="detail-row">
                        <strong>Notes:</strong>
                        <span>${order.notes}</span>
                    </div>
                `
                        : ""
                }
            </div>

            <div class="order-items-detailed">
                <h4>Order Items</h4>
                <div class="items-table">
                    ${order.items
                        .map(
                            (item) => `
                        <div class="item-row">
                            <div class="item-details">
                                <span class="item-name">${item.name}</span>
                                <span class="item-price">$${item.price.toFixed(
                                    2
                                )} each</span>
                            </div>
                            <div class="item-quantity">x${item.quantity}</div>
                            <div class="item-total">$${(
                                item.price * item.quantity
                            ).toFixed(2)}</div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            </div>

            <div class="order-total-breakdown">
                <div class="breakdown-row">
                    <span>Subtotal:</span>
                    <span>$${this.calculateSubtotal(order.items).toFixed(
                        2
                    )}</span>
                </div>
                <div class="breakdown-row">
                    <span>Delivery Fee:</span>
                    <span>$3.99</span>
                </div>
                <div class="breakdown-row">
                    <span>Tax (8%):</span>
                    <span>$${this.calculateTax(order.items).toFixed(2)}</span>
                </div>
                <div class="breakdown-total">
                    <span>Total:</span>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
            </div>
        `;

        this.showModal("order-details-modal");
    }

    updateOrderStatus(orderId) {
        const order = this.orders.find((o) => o._id === orderId);
        if (!order) return;

        document.getElementById("status-order-id").value = orderId;
        document.getElementById("order-status").value = order.status;

        this.showModal("status-modal");
    }

    async handleStatusUpdate(e) {
        e.preventDefault();

        const orderId = document.getElementById("status-order-id").value;
        const newStatus = document.getElementById("order-status").value;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${this.baseURL}/orders/${orderId}/status`,
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
                this.loadOrders(); // Reload the table

                if (window.app) {
                    window.app.showNotification(
                        "Order status updated successfully!",
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

    calculateSubtotal(items) {
        return items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }

    calculateTax(items) {
        const subtotal = this.calculateSubtotal(items);
        return subtotal * 0.08;
    }

    formatStatus(status) {
        const statusMap = {
            pending: "Pending",
            confirmed: "Confirmed",
            preparing: "Preparing",
            ready: "Ready",
            delivered: "Delivered",
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
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

// Initialize admin orders manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.adminOrdersManager = new AdminOrdersManager();
});
