// Cart functionality

class CartManager {
    constructor() {
        this.baseURL = '/api';
        this.cart = this.getCartFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderCartPage();
        this.updateCartUI();
    }

    setupEventListeners() {
        // Add to cart buttons (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn') || 
                e.target.closest('.add-to-cart-btn')) {
                this.handleAddToCart(e);
            }
        });

        // Cart page specific events
        if (window.location.pathname === '/cart') {
            this.setupCartPageEvents();
        }
    }

    setupCartPageEvents() {
        const clearCartBtn = document.getElementById('clear-cart-btn');
        const checkoutForm = document.getElementById('checkout-form');

        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                this.clearCart();
            });
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', this.handleCheckout.bind(this));
        }
    }

    handleAddToCart(e) {
        e.preventDefault();
        
        const button = e.target.closest('.add-to-cart-btn');
        const itemId = button.dataset.itemId || button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        const itemName = button.dataset.itemName || button.getAttribute('onclick')?.match(/'([^']+)', '([^']+)'/)?.[2];
        const itemPrice = parseFloat(button.dataset.itemPrice || button.getAttribute('onclick')?.match(/(\d+\.?\d*)/g)?.[2]);
        const itemImage = button.dataset.itemImage || button.getAttribute('onclick')?.match(/'([^']+)', '([^']+)', (\d+\.?\d*), '([^']*)'/)?.[4];

        if (!itemId || !itemName || !itemPrice) {
            console.error('Missing item data for add to cart');
            return;
        }

        this.addItem({
            id: itemId,
            name: itemName,
            price: itemPrice,
            image: itemImage || '',
            quantity: 1
        });
    }

    addItem(item) {
        const existingItemIndex = this.cart.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += item.quantity;
        } else {
            this.cart.push(item);
        }
        
        this.saveCartToStorage();
        this.updateCartUI();
        this.showAddToCartSuccess();
    }

    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCartToStorage();
        this.updateCartUI();
        this.renderCartPage();
    }

    updateItemQuantity(itemId, quantity) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        
        if (itemIndex > -1) {
            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                this.cart[itemIndex].quantity = parseInt(quantity);
                this.saveCartToStorage();
                this.updateCartUI();
                this.renderCartPage();
            }
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.saveCartToStorage();
            this.updateCartUI();
            this.renderCartPage();
            
            if (window.app) {
                window.app.showNotification('Cart cleared successfully', 'success');
            }
        }
    }

    getCartFromStorage() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }

    saveCartToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems.toString();
        }
    }

    renderCartPage() {
        if (window.location.pathname !== '/cart') return;

        const emptyCart = document.getElementById('empty-cart');
        const cartContent = document.getElementById('cart-content');
        const cartItemsList = document.getElementById('cart-items-list');

        if (this.cart.length === 0) {
            if (emptyCart) emptyCart.style.display = 'block';
            if (cartContent) cartContent.style.display = 'none';
            return;
        }

        if (emptyCart) emptyCart.style.display = 'none';
        if (cartContent) cartContent.style.display = 'block';

        if (cartItemsList) {
            cartItemsList.innerHTML = this.cart.map(item => `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200'}" 
                             alt="${item.name}" 
                             onerror="this.src='https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200'">
                    </div>
                    <div class="cart-item-info">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="cartManager.updateItemQuantity('${item.id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                                   onchange="cartManager.updateItemQuantity('${item.id}', this.value)">
                            <button class="quantity-btn" onclick="cartManager.updateItemQuantity('${item.id}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="cartManager.removeItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="cart-item-total">
                        $${(item.price * item.quantity).toFixed(2)}
                    </div>
                </div>
            `).join('');
        }

        this.updateOrderSummary();
    }

    updateOrderSummary() {
        const subtotal = this.getSubtotal();
        const deliveryFee = 3.99;
        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        const total = subtotal + deliveryFee + tax;

        const subtotalEl = document.getElementById('subtotal');
        const taxEl = document.getElementById('tax');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTotal() {
        const subtotal = this.getSubtotal();
        const deliveryFee = 3.99;
        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        return subtotal + deliveryFee + tax;
    }

    showAddToCartSuccess() {
        const modal = document.getElementById('add-to-cart-modal');
        if (modal && window.app) {
            window.app.showModal('add-to-cart-modal');
        } else if (window.app) {
            window.app.showNotification('Item added to cart!', 'success');
        }
    }

    async handleCheckout(e) {
        e.preventDefault();

        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            if (window.app) {
                window.app.showNotification('Please login to place an order', 'warning');
            }
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        if (this.cart.length === 0) {
            if (window.app) {
                window.app.showNotification('Your cart is empty', 'warning');
            }
            return;
        }

        const form = e.target;
        const formData = new FormData(form);
        
        const deliveryAddress = formData.get('delivery-address') || document.getElementById('delivery-address').value;
        const notes = formData.get('order-notes') || document.getElementById('order-notes').value;

        // Validation
        if (!deliveryAddress.trim()) {
            if (window.app) {
                window.app.showNotification('Please enter delivery address', 'error');
            }
            return;
        }

        // Show loading state
        this.setCheckoutLoading(true);

        try {
            const orderData = {
                items: this.cart,
                total: this.getTotal(),
                delivery_address: deliveryAddress,
                notes: notes || ''
            };

            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (response.ok) {
                // Clear cart
                this.cart = [];
                this.saveCartToStorage();
                this.updateCartUI();

                // Show success modal
                this.showOrderSuccess(data._id);
            } else {
                if (window.app) {
                    window.app.showNotification(data.error || 'Order failed', 'error');
                }
            }
        } catch (error) {
            console.error('Checkout error:', error);
            if (window.app) {
                window.app.showNotification('Network error. Please try again.', 'error');
            }
        } finally {
            this.setCheckoutLoading(false);
        }
    }

    setCheckoutLoading(loading) {
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (checkoutBtn) {
            checkoutBtn.disabled = loading;
            checkoutBtn.innerHTML = loading 
                ? '<i class="fas fa-spinner fa-spin"></i> Processing...' 
                : 'Place Order';
        }
    }

    showOrderSuccess(orderId) {
        const modal = document.getElementById('order-success-modal');
        const orderIdEl = document.getElementById('order-id');
        
        if (orderIdEl) {
            orderIdEl.textContent = `#${orderId.slice(-8)}`;
        }
        
        if (modal && window.app) {
            window.app.showModal('order-success-modal');
        } else {
            if (window.app) {
                window.app.showNotification('Order placed successfully!', 'success');
            }
            setTimeout(() => {
                window.location.href = '/orders';
            }, 2000);
        }
    }
}

// Add cart item styles dynamically
const cartStyles = `
    .cart-item {
        display: grid;
        grid-template-columns: 80px 1fr auto auto auto;
        gap: var(--spacing-md);
        align-items: center;
        padding: var(--spacing-lg);
        background-color: white;
        border-radius: var(--border-radius-lg);
        margin-bottom: var(--spacing-md);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--gray-200);
    }

    .cart-item-image img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: var(--border-radius-md);
    }

    .cart-item-name {
        font-size: 1.125rem;
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-xs);
        color: var(--gray-800);
    }

    .cart-item-price {
        color: var(--gray-600);
        font-size: 0.875rem;
    }

    .cart-item-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }

    .cart-item-total {
        font-size: 1.125rem;
        font-weight: var(--font-weight-semibold);
        color: var(--primary-color);
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
    }

    .quantity-btn:hover {
        background-color: var(--gray-200);
    }

    .quantity-input {
        width: 50px;
        text-align: center;
        border: none;
        padding: var(--spacing-xs);
        font-weight: var(--font-weight-medium);
    }

    .empty-cart {
        text-align: center;
        padding: var(--spacing-3xl);
        color: var(--gray-500);
    }

    .empty-cart i {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
        color: var(--gray-400);
    }

    .empty-cart h2 {
        margin-bottom: var(--spacing-md);
        color: var(--gray-600);
    }

    .cart-section {
        padding: var(--spacing-2xl) 0;
        min-height: 60vh;
    }

    .cart-content {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: var(--spacing-2xl);
        align-items: start;
    }

    .cart-items-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-lg);
    }

    .order-summary {
        background-color: white;
        padding: var(--spacing-xl);
        border-radius: var(--border-radius-xl);
        box-shadow: var(--shadow-lg);
        position: sticky;
        top: 100px;
    }

    .order-summary h2 {
        margin-bottom: var(--spacing-lg);
        font-size: 1.5rem;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-md);
        color: var(--gray-600);
    }

    .summary-total {
        display: flex;
        justify-content: space-between;
        padding-top: var(--spacing-md);
        border-top: 2px solid var(--gray-200);
        font-size: 1.25rem;
        font-weight: var(--font-weight-semibold);
        color: var(--gray-800);
        margin-bottom: var(--spacing-xl);
    }

    .checkout-form h3 {
        margin-bottom: var(--spacing-md);
        font-size: 1.125rem;
    }

    .success-icon {
        color: var(--success-color);
    }

    @media (max-width: 768px) {
        .cart-content {
            grid-template-columns: 1fr;
            gap: var(--spacing-xl);
        }

        .cart-item {
            grid-template-columns: 60px 1fr;
            gap: var(--spacing-sm);
        }

        .cart-item-actions {
            grid-column: 1 / -1;
            justify-content: space-between;
            margin-top: var(--spacing-md);
        }

        .cart-item-total {
            grid-column: 1 / -1;
            text-align: center;
            margin-top: var(--spacing-sm);
        }

        .order-summary {
            position: static;
        }
    }
`;

// Inject cart styles
const styleSheet = document.createElement('style');
styleSheet.textContent = cartStyles;
document.head.appendChild(styleSheet);

// Initialize cart manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});

// Export for global use
window.addToCart = function(itemId, name, price, image = '') {
    if (window.cartManager) {
        window.cartManager.addItem({
            id: itemId,
            name: name,
            price: parseFloat(price),
            image: image,
            quantity: 1
        });
    }
};