// Orders page functionality

class OrdersManager {
    constructor() {
        this.baseURL = "/api";
        this.currentFilter = "all";
        this.orders = [];
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadOrders();
    }

    checkAuthentication() {
        const token = localStorage.getItem("token");
        if (!token) {
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
        const loadingElement = document.getElementById("orders-loading");
        const ordersListElement = document.getElementById("orders-list");
        const emptyOrdersElement = document.getElementById("empty-orders");

        // Show loading state
        if (loadingElement) loadingElement.style.display = "block";
        if (ordersListElement) ordersListElement.style.display = "none";
        if (emptyOrdersElement) emptyOrdersElement.style.display = "none";

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${this.baseURL}/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                this.orders = await response.json();
                this.renderOrders();
            } else {
                this.showError("Failed to load orders");
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            this.showError("Network error loading orders");
        } finally {
            if (loadingElement) loadingElement.style.display = "none";
        }
    }

    filterOrders() {
        let filteredOrders = this.orders;

        if (this.currentFilter !== "all") {
            filteredOrders = this.orders.filter(
                (order) => order.status === this.currentFilter
            );
        }

        this.renderOrders(filteredOrders);
    }

    renderOrders(ordersToRender = this.orders) {
        const ordersListElement = document.getElementById("orders-list");
        const emptyOrdersElement = document.getElementById("empty-orders");

        if (!ordersListElement) return;

        if (ordersToRender.length === 0) {
            ordersListElement.style.display = "none";
            if (emptyOrdersElement) emptyOrdersElement.style.display = "block";
            return;
        }

        if (emptyOrdersElement) emptyOrdersElement.style.display = "none";
        ordersListElement.style.display = "block";

        ordersListElement.innerHTML = ordersToRender
            .map(
                (order) => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3 class="order-id">Order #${order._id.slice(-8)}</h3>
                        <p class="order-date">${this.formatDate(
                            order.order_date
                        )}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status}">
                            ${this.formatStatus(order.status)}
                        </span>
                    </div>
                </div>

                <div class="order-body">
                    <div class="order-items">
                        <h4>Items (${order.items.length})</h4>
                        <div class="items-list">
                            ${order.items
                                .slice(0, 3)
                                .map(
                                    (item) => `
                                <div class="order-item">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-quantity">x${
                                        item.quantity
                                    }</span>
                                    <span class="item-price">$${(
                                        item.price * item.quantity
                                    ).toFixed(2)}</span>
                                </div>
                            `
                                )
                                .join("")}
                            ${
                                order.items.length > 3
                                    ? `
                                <div class="more-items">
                                    +${order.items.length - 3} more items
                                </div>
                            `
                                    : ""
                            }
                        </div>
                    </div>

                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Total Amount:</span>
                            <span class="total-amount">$${order.total.toFixed(
                                2
                            )}</span>
                        </div>
                        ${
                            order.delivery_address
                                ? `
                            <div class="delivery-address">
                                <strong>Delivery Address:</strong>
                                <p>${order.delivery_address}</p>
                            </div>
                        `
                                : ""
                        }
                    </div>
                </div>

                <div class="order-footer">
                    <button class="btn btn-outline btn-sm" onclick="ordersManager.showOrderDetails('${
                        order._id
                    }')">
                        View Details
                    </button>
                    ${
                        this.canReorder(order.status)
                            ? `
                        <button class="btn btn-primary btn-sm" onclick="ordersManager.reorderItems('${order._id}')">
                            Reorder
                        </button>
                    `
                            : ""
                    }
                </div>
            </div>
        `
            )
            .join("");
    }

    showOrderDetails(orderId) {
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

            <div class="order-details-info">
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

    reorderItems(orderId) {
        const order = this.orders.find((o) => o._id === orderId);
        if (!order) return;

        // Add all items from the order to cart
        order.items.forEach((item) => {
            if (window.cartManager) {
                window.cartManager.addItem({
                    id: item.id || item._id,
                    name: item.name,
                    price: item.price,
                    image: item.image || "",
                    quantity: item.quantity,
                });
            }
        });

        if (window.app) {
            window.app.showNotification("Items added to cart!", "success");
        }

        // Redirect to cart after a short delay
        setTimeout(() => {
            window.location.href = "/cart";
        }, 1500);
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

    canReorder(status) {
        return ["delivered", "ready"].includes(status);
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
            year: "numeric",
            month: "long",
            day: "numeric",
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

    showError(message) {
        const ordersListElement = document.getElementById("orders-list");
        if (ordersListElement) {
            ordersListElement.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Orders</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="ordersManager.loadOrders()">
                        Try Again
                    </button>
                </div>
            `;
            ordersListElement.style.display = "block";
        }
    }
}

// Initialize orders manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.ordersManager = new OrdersManager();
});
