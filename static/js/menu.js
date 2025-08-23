// Menu page functionality

class MenuManager {
    constructor() {
        this.baseURL = "/api";
        this.menuItems = [];
        this.filteredItems = [];
        this.currentCategory = "all";
        this.currentSearch = "";
        this.init();
    }

    init() {
        if (window.location.pathname === "/menu") {
            this.setupEventListeners();
            this.loadMenuItems();
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.addEventListener(
                "input",
                this.debounce(this.handleSearch.bind(this), 300)
            );
        }

        // Category filter buttons
        const filterButtons = document.querySelectorAll(".filter-btn");
        filterButtons.forEach((button) => {
            button.addEventListener(
                "click",
                this.handleCategoryFilter.bind(this)
            );
        });
    }

    async loadMenuItems() {
        const loadingSpinner = document.getElementById("loading-spinner");
        const menuGrid = document.getElementById("menu-grid");
        const noResults = document.getElementById("no-results");

        try {
            // Show loading state
            if (loadingSpinner) loadingSpinner.style.display = "flex";
            if (menuGrid) menuGrid.style.display = "none";
            if (noResults) noResults.style.display = "none";

            const response = await fetch(`${this.baseURL}/menu`);

            if (response.ok) {
                this.menuItems = await response.json();
                this.filteredItems = [...this.menuItems];
                this.renderMenuItems();
            } else {
                throw new Error("Failed to load menu items");
            }
        } catch (error) {
            console.error("Error loading menu:", error);
            this.showError(
                "Failed to load menu items. Please try again later."
            );
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = "none";
            if (menuGrid) menuGrid.style.display = "grid";
        }
    }

    handleSearch(event) {
        this.currentSearch = event.target.value.toLowerCase().trim();
        this.filterItems();
    }

    handleCategoryFilter(event) {
        // Update active button
        document.querySelectorAll(".filter-btn").forEach((btn) => {
            btn.classList.remove("active");
        });
        event.target.classList.add("active");

        // Update current category
        this.currentCategory = event.target.dataset.category;
        this.filterItems();
    }

    filterItems() {
        this.filteredItems = this.menuItems.filter((item) => {
            const matchesCategory =
                this.currentCategory === "all" ||
                item.category === this.currentCategory;
            const matchesSearch =
                !this.currentSearch ||
                item.name.toLowerCase().includes(this.currentSearch) ||
                item.description.toLowerCase().includes(this.currentSearch);

            return matchesCategory && matchesSearch;
        });

        this.renderMenuItems();
    }

    renderMenuItems() {
        const menuGrid = document.getElementById("menu-grid");
        const noResults = document.getElementById("no-results");

        if (!menuGrid) return;

        if (this.filteredItems.length === 0) {
            menuGrid.style.display = "none";
            if (noResults) noResults.style.display = "block";
            return;
        }

        if (noResults) noResults.style.display = "none";
        menuGrid.style.display = "grid";

        menuGrid.innerHTML = this.filteredItems
            .map(
                (item) => `
            <div class="menu-item-card" data-item-id="${item._id}">
                <div class="menu-item-image">
                    <img src="${
                        item.image ||
                        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600"
                    }" 
                         alt="${item.name}" 
                         onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600'">
                    <div class="menu-item-category">${this.formatCategory(
                        item.category
                    )}</div>
                </div>
                <div class="menu-item-info">
                    <div class="menu-item-header">
                        <h3 class="menu-item-name">${item.name}</h3>
                        <span class="menu-item-price">$${item.price.toFixed(
                            2
                        )}</span>
                    </div>
                    <p class="menu-item-description">${item.description}</p>
                    <div class="menu-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="this.parentElement.querySelector('.quantity-input').stepDown()">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="1" min="1" max="10">
                            <button class="quantity-btn" onclick="this.parentElement.querySelector('.quantity-input').stepUp()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="btn btn-primary add-to-cart-btn" 
                                data-item-id="${item._id}"
                                data-item-name="${item.name}"
                                data-item-price="${item.price}"
                                data-item-image="${item.image}"
				>
                            <i class="fas fa-cart-plus"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `
            )
            .join("");

        // Add event listeners for add to cart buttons
        this.setupAddToCartButtons();
    }

    setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

        addToCartButtons.forEach((button) => {
            // Remove any existing event listener
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            newButton.addEventListener("click", (e) => {
                e.preventDefault();

                const card = e.target.closest(".menu-item-card");
                const quantityInput = card.querySelector(".quantity-input");
                const quantity = parseInt(quantityInput.value) || 1;

                const itemId = newButton.dataset.itemId;
                const itemName = newButton.dataset.itemName;
                const itemPrice = parseFloat(newButton.dataset.itemPrice);
                const itemImage = newButton.dataset.itemImage;

                // Add item with the specified quantity
                if (window.cartManager) {
                    window.cartManager.addItem({
                        id: itemId,
                        name: itemName,
                        price: itemPrice,
                        image: itemImage,
                        quantity: quantity,
                    });
                }

                // Reset quantity to 1
                quantityInput.value = 1;

                // Show success feedback
                this.showAddToCartFeedback(newButton);
            });
        });
    }

    showAddToCartFeedback(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Added!';
        button.classList.add("btn-success");
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove("btn-success");
            button.disabled = false;
        }, 1500);

        // Show modal if available
        const modal = document.getElementById("add-to-cart-modal");
        if (modal && window.app) {
            window.app.showModal("add-to-cart-modal");
        }
    }

    formatCategory(category) {
        return category
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    showError(message) {
        const menuGrid = document.getElementById("menu-grid");
        const loadingSpinner = document.getElementById("loading-spinner");

        if (loadingSpinner) loadingSpinner.style.display = "none";

        if (menuGrid) {
            menuGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="menuManager.loadMenuItems()">
                        Try Again
                    </button>
                </div>
            `;
            menuGrid.style.display = "block";
        }
    }

    // Utility method for debouncing
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
}

// Add menu-specific styles
const menuStyles = `
    .menu-item-card {
        background-color: white;
        border-radius: var(--border-radius-xl);
        overflow: hidden;
        box-shadow: var(--shadow-md);
        transition: all var(--transition-base);
    }

    .menu-item-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-xl);
    }

    .menu-item-image {
        position: relative;
        height: 200px;
        overflow: hidden;
    }

    .menu-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-slow);
    }

    .menu-item-card:hover .menu-item-image img {
        transform: scale(1.1);
    }

    .menu-item-category {
        position: absolute;
        top: var(--spacing-sm);
        left: var(--spacing-sm);
        background-color: var(--primary-color);
        color: white;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-md);
        font-size: 0.75rem;
        font-weight: var(--font-weight-medium);
        text-transform: capitalize;
    }

    .menu-item-info {
        padding: var(--spacing-lg);
    }

    .menu-item-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
        gap: var(--spacing-md);
    }

    .menu-item-name {
        font-size: 1.25rem;
        font-weight: var(--font-weight-semibold);
        margin: 0;
        flex: 1;
    }

    .menu-item-price {
        font-size: 1.25rem;
        font-weight: var(--font-weight-bold);
        color: var(--primary-color);
        white-space: nowrap;
    }

    .menu-item-description {
        color: var(--gray-600);
        font-size: 0.875rem;
        margin-bottom: var(--spacing-lg);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.4;
    }

    .menu-item-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }

    .quantity-selector {
        display: flex;
        align-items: center;
        border: 2px solid var(--gray-200);
        border-radius: var(--border-radius-md);
        overflow: hidden;
    }

    .quantity-btn {
        background-color: var(--gray-100);
        border: none;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color var(--transition-fast);
        color: var(--gray-600);
    }

    .quantity-btn:hover {
        background-color: var(--gray-200);
        color: var(--gray-800);
    }

    .quantity-input {
        width: 50px;
        text-align: center;
        border: none;
        padding: var(--spacing-xs);
        font-weight: var(--font-weight-medium);
        background-color: white;
    }

    .quantity-input:focus {
        outline: none;
    }

    .add-to-cart-btn {
        flex: 1;
        gap: var(--spacing-xs);
    }

    .btn-success {
        background-color: var(--success-color) !important;
        border-color: var(--success-color) !important;
    }

    .error-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: var(--spacing-3xl);
        color: var(--gray-500);
    }

    .error-message i {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
        color: var(--error-color);
    }

    .error-message h3 {
        margin-bottom: var(--spacing-md);
        color: var(--gray-700);
    }

    @media (max-width: 768px) {
        .menu-item-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
        }

        .menu-item-actions {
            flex-direction: column;
            gap: var(--spacing-sm);
            width: 100%;
        }

        .quantity-selector {
            align-self: center;
        }

        .add-to-cart-btn {
            width: 100%;
        }
    }
`;

// Inject menu styles
const menuStyleSheet = document.createElement("style");
menuStyleSheet.textContent = menuStyles;
document.head.appendChild(menuStyleSheet);

// Initialize menu manager when DOM is ready
if (!window.menuManager) {
    document.addEventListener("DOMContentLoaded", () => {
        window.menuManager = new MenuManager();
    });
}

// Global function for adding items to cart with quantity
window.addToCartWithQuantity = function (
    itemId,
    name,
    price,
    image,
    quantity = 1
) {
    if (window.cartManager) {
        for (let i = 0; i < quantity; i++) {
            window.cartManager.addItem({
                id: itemId,
                name: name,
                price: parseFloat(price),
                image: image,
                quantity: 1,
            });
        }
    }
};
