// Admin menu management functionality

class AdminMenuManager {
    constructor() {
        this.baseURL = "/api";
        this.menuItems = [];
        this.editingItemId = null;
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
        this.loadMenuItems();
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
        // Add item button
        const addItemBtn = document.getElementById("add-item-btn");
        if (addItemBtn) {
            addItemBtn.addEventListener("click", () => {
                this.showAddItemModal();
            });
        }

        // Menu item form
        const menuItemForm = document.getElementById("menu-item-form");
        if (menuItemForm) {
            menuItemForm.addEventListener(
                "submit",
                this.handleMenuItemSubmit.bind(this)
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

    async loadMenuItems() {
        const tableBody = document.getElementById("menu-table-body");
        if (!tableBody) return;

        try {
            const response = await fetch(`${this.baseURL}/menu`);

            if (response.ok) {
                this.menuItems = await response.json();
                this.renderMenuTable();
            } else {
                tableBody.innerHTML =
                    '<tr><td colspan="7" class="error-cell">Failed to load menu items</td></tr>';
            }
        } catch (error) {
            console.error("Error loading menu items:", error);
            tableBody.innerHTML =
                '<tr><td colspan="7" class="error-cell">Error loading menu items</td></tr>';
        }
    }

    renderMenuTable() {
        const tableBody = document.getElementById("menu-table-body");
        if (!tableBody) return;

        if (this.menuItems.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="7" class="no-data-cell">No menu items found</td></tr>';
            return;
        }

        tableBody.innerHTML = this.menuItems
            .map(
                (item) => `
            <tr>
                <td>
                    <img src="${
                        item.image ||
                        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100"
                    }" 
                         alt="${item.name}" class="menu-item-thumb"
                         onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100'">
                </td>
                <td>
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description.substring(
                        0,
                        50
                    )}...</div>
                </td>
                <td>
                    <span class="category-badge">${this.formatCategory(
                        item.category
                    )}</span>
                </td>
                <td class="price-cell">$${item.price.toFixed(2)}</td>
                <td>
                    <span class="status-badge ${
                        item.available
                            ? "status-available"
                            : "status-unavailable"
                    }">
                        ${item.available ? "Available" : "Unavailable"}
                    </span>
                </td>
                <td>
                    <span class="popular-badge ${
                        item.popular ? "popular-yes" : "popular-no"
                    }">
                        ${item.popular ? "Yes" : "No"}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn btn-sm btn-outline" onclick="adminMenuManager.editMenuItem('${
                        item._id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminMenuManager.deleteMenuItem('${
                        item._id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `
            )
            .join("");
    }

    showAddItemModal() {
        this.editingItemId = null;
        document.getElementById("modal-title").textContent = "Add Menu Item";
        document.getElementById("menu-item-form").reset();
        document.getElementById("item-available").checked = true;
        document.getElementById("item-popular").checked = false;
        this.showModal("menu-item-modal");
    }

    editMenuItem(itemId) {
        const item = this.menuItems.find((i) => i._id === itemId);
        if (!item) return;

        this.editingItemId = itemId;
        document.getElementById("modal-title").textContent = "Edit Menu Item";

        // Populate form
        document.getElementById("item-id").value = item._id;
        document.getElementById("item-name").value = item.name;
        document.getElementById("item-category").value = item.category;
        document.getElementById("item-price").value = item.price;
        document.getElementById("item-description").value = item.description;
        document.getElementById("item-image").value = item.image || "";
        document.getElementById("item-available").checked = item.available;
        document.getElementById("item-popular").checked = item.popular;

        this.showModal("menu-item-modal");
    }

    async handleMenuItemSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById("item-name").value,
            category: document.getElementById("item-category").value,
            price: parseFloat(document.getElementById("item-price").value),
            description: document.getElementById("item-description").value,
            image: document.getElementById("item-image").value,
            available: document.getElementById("item-available").checked,
            popular: document.getElementById("item-popular").checked,
        };

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateMenuItemForm(formData)) {
            return;
        }

        // Show loading state
        this.setFormLoading(true);

        try {
            const token = localStorage.getItem("token");
            const url = this.editingItemId
                ? `${this.baseURL}/menu/${this.editingItemId}`
                : `${this.baseURL}/menu`;

            const method = this.editingItemId ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                this.closeModal();
                this.loadMenuItems(); // Reload the table

                if (window.app) {
                    window.app.showNotification(
                        this.editingItemId
                            ? "Menu item updated successfully!"
                            : "Menu item added successfully!",
                        "success"
                    );
                }
            } else {
                this.showError("form-error", data.error || "Operation failed");
            }
        } catch (error) {
            console.error("Menu item operation error:", error);
            this.showError("form-error", "Network error. Please try again.");
        } finally {
            this.setFormLoading(false);
        }
    }

    deleteMenuItem(itemId) {
        const item = this.menuItems.find((i) => i._id === itemId);
        if (!item) return;

        // Store the item ID for deletion
        this.deletingItemId = itemId;

        // Show delete confirmation modal
        this.showModal("delete-modal");

        // Set up delete confirmation
        const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
        if (confirmDeleteBtn) {
            confirmDeleteBtn.onclick = () => this.confirmDeleteMenuItem();
        }
    }

    async confirmDeleteMenuItem() {
        if (!this.deletingItemId) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${this.baseURL}/menu/${this.deletingItemId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                this.closeModal();
                this.loadMenuItems(); // Reload the table

                if (window.app) {
                    window.app.showNotification(
                        "Menu item deleted successfully!",
                        "success"
                    );
                }
            } else {
                const data = await response.json();
                if (window.app) {
                    window.app.showNotification(
                        data.error || "Delete failed",
                        "error"
                    );
                }
            }
        } catch (error) {
            console.error("Delete menu item error:", error);
            if (window.app) {
                window.app.showNotification(
                    "Network error. Please try again.",
                    "error"
                );
            }
        }

        this.deletingItemId = null;
    }

    validateMenuItemForm(formData) {
        let isValid = true;

        if (!formData.name.trim()) {
            this.showError("name-error", "Name is required");
            isValid = false;
        }

        if (!formData.category) {
            this.showError("category-error", "Category is required");
            isValid = false;
        }

        if (!formData.price || formData.price <= 0) {
            this.showError("price-error", "Valid price is required");
            isValid = false;
        }

        if (!formData.description.trim()) {
            this.showError("description-error", "Description is required");
            isValid = false;
        }

        return isValid;
    }

    formatCategory(category) {
        return category
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
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
        const saveBtn = document.getElementById("save-item-btn");
        const saveText = document.getElementById("save-text");
        const saveSpinner = document.getElementById("save-spinner");

        if (saveBtn) {
            saveBtn.disabled = loading;
        }

        if (saveText) {
            saveText.style.display = loading ? "none" : "inline";
        }

        if (saveSpinner) {
            saveSpinner.style.display = loading ? "inline-block" : "none";
        }
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

// Initialize admin menu manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.adminMenuManager = new AdminMenuManager();
});
