# Online Restaurant Management and Ordering System

A comprehensive web-based restaurant management system built with HTML, CSS, JavaScript frontend and Python Flask backend with MongoDB database.

## Features

### Customer Features

-   **User Registration & Authentication**: Secure user registration and login system
-   **Menu Browsing**: Browse categorized menu items with search and filter functionality
-   **Shopping Cart**: Add items to cart, modify quantities, and manage orders
-   **Order Placement**: Place orders with delivery information and special instructions
-   **Table Reservations**: Book tables for specific dates and times
-   **Order History**: View past orders and their status
-   **User Profile**: Manage personal information and preferences

### Admin Features

-   **Admin Dashboard**: Comprehensive overview of restaurant operations
-   **Menu Management**: Add, edit, delete, and manage menu items and categories
-   **Order Management**: View and update order status (pending, confirmed, preparing, ready, delivered)
-   **Reservation Management**: View and manage table reservations
-   **User Management**: View registered users and their information

### Technical Features

-   **Responsive Design**: Mobile-first design that works on all devices
-   **Real-time Updates**: Dynamic content loading and updates
-   **Search & Filter**: Advanced search and filtering capabilities
-   **Form Validation**: Client and server-side form validation
-   **Security**: Password hashing, JWT authentication, and secure routes
-   **Error Handling**: Comprehensive error handling and user feedback

## Technology Stack

### Frontend

-   **HTML5**: Semantic markup and structure
-   **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
-   **JavaScript (ES6+)**: Client-side functionality and API interactions

### Backend

-   **Python 3.8+**: Server-side programming language
-   **Flask**: Lightweight web framework
-   **Flask-PyMongo**: MongoDB integration
-   **JWT**: JSON Web Tokens for authentication
-   **Bcrypt**: Password hashing
-   **Flask-CORS**: Cross-origin resource sharing

### Database

-   **MongoDB**: NoSQL database for flexible data storage

## Installation & Setup

### Prerequisites

-   Python 3.8 or higher
-   MongoDB 4.0 or higher
-   Git

### Local Development Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/restaurant-management-system.git
    cd restaurant-management-system
    ```

2. **Create virtual environment**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. **Install dependencies**

    ```bash
    pip install -r requirements.txt
    ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:

    ```env
    SECRET_KEY=your-secret-key-here
    MONGO_URI=mongodb://localhost:27017/restaurant_db
    JWT_SECRET_KEY=your-jwt-secret-key
    ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system:

    ```bash
    mongod
    ```

6. **Initialize sample data**

    ```bash
    python init_data.py
    ```

7. **Run the application**

    ```bash
    python app.py
    ```

8. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
restaurant-management-system/
├── app.py                  # Main Flask application
├── config.py              # Configuration settings
├── requirements.txt        # Python dependencies
├── README.md              # Project documentation
├── .env                   # Environment variables
├── templates/             # HTML templates
│   ├── base.html         # Base template
│   ├── index.html        # Home page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── menu.html         # Menu page
│   ├── cart.html         # Shopping cart
│   ├── reservations.html # Table reservations
│   ├── profile.html      # User profile
│   ├── orders.html       # Order history
│   └── admin/            # Admin templates
│       ├── dashboard.html
│       ├── menu.html
│       ├── orders.html
│       └── reservations.html
├── static/               # Static files
│   ├── css/             # Stylesheets
│   │   ├── style.css    # Main styles
│   │   └── responsive.css # Responsive design
│   └── js/              # JavaScript files
│       ├── main.js      # Main functionality
│       ├── auth.js      # Authentication
│       ├── cart.js      # Shopping cart
│       └── menu.js      # Menu functionality
└── uploads/             # File uploads directory
```

## Database Schema

### Collections

#### Users

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (customer/admin),
  created_at: Date
}
```

#### Menu Items

```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  description: String,
  price: Number,
  image: String,
  available: Boolean,
  popular: Boolean,
  created_at: Date
}
```

#### Orders

```javascript
{
  _id: ObjectId,
  user_id: String,
  items: Array,
  total: Number,
  delivery_address: String,
  notes: String,
  status: String,
  order_date: Date
}
```

#### Reservations

```javascript
{
  _id: ObjectId,
  user_id: String,
  date: String,
  time: String,
  guests: Number,
  notes: String,
  status: String,
  created_at: Date
}
```

## API Endpoints

### Authentication

-   `POST /api/register` - User registration
-   `POST /api/login` - User login

### Menu

-   `GET /api/menu` - Get all menu items
-   `GET /api/menu/popular` - Get popular items
-   `POST /api/menu` - Add menu item (Admin)
-   `PUT /api/menu/<id>` - Update menu item (Admin)
-   `DELETE /api/menu/<id>` - Delete menu item (Admin)

### Orders

-   `POST /api/orders` - Create order
-   `GET /api/orders` - Get orders
-   `PUT /api/orders/<id>/status` - Update order status (Admin)

### Reservations

-   `POST /api/reservations` - Create reservation
-   `GET /api/reservations` - Get reservations
-   `PUT /api/reservations/<id>/status` - Update reservation status (Admin)

### Profile

-   `GET /api/profile` - Get user profile
-   `PUT /api/profile` - Update user profile

## Demo Credentials

### Admin Account

-   **Email**: admin@savory.com
-   **Password**: admin123

### Customer Account

-   **Email**: customer@savory.com
-   **Password**: customer123

## Design Features

### Color Palette

-   **Primary**: Orange (#F97316)
-   **Secondary**: Green (#059669)
-   **Accent**: Red (#DC2626)
-   **Success**: Green (#10B981)
-   **Warning**: Amber (#F59E0B)
-   **Error**: Red (#EF4444)

### Typography

-   **Font Family**: Inter (Google Fonts)
-   **Weights**: 300, 400, 500, 600, 700

### Responsive Breakpoints

-   **Mobile**: < 576px
-   **Tablet**: 576px - 768px
-   **Desktop**: 768px - 1200px
-   **Large**: > 1200px

## Testing

### Manual Testing Checklist

-   [ ] User registration and login
-   [ ] Menu browsing and filtering
-   [ ] Add items to cart
-   [ ] Place orders
-   [ ] Make reservations
-   [ ] Admin menu management
-   [ ] Admin order management
-   [ ] Responsive design on different devices

### Browser Compatibility

-   Chrome 90+
-   Firefox 88+
-   Safari 14+
-   Edge 90+

## Security Features

-   Password hashing with bcrypt
-   JWT token-based authentication
-   Input validation and sanitization
-   CORS protection
-   SQL injection prevention (NoSQL injection for MongoDB)
-   XSS protection

## Performance Optimization

-   Lazy loading of images
-   Minified CSS and JavaScript
-   Optimized database queries
-   Caching strategies
-   Responsive images

## Future Enhancements

-   Online payment integration (Stripe, PayPal)
-   Real-time order tracking
-   Email notifications
-   SMS notifications
-   Review and rating system
-   Loyalty program
-   Multi-language support
-   Advanced analytics dashboard
-   Mobile application
-   Push notifications

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Acknowledgments

-   Flask framework and community
-   MongoDB documentation
-   Pexels for stock images
-   Font Awesome for icons
-   Google Fonts for typography
