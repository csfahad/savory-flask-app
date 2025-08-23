from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import uuid
from functools import wraps
import os
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['MONGO_URI'] = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/restaurant_db')

# Initialize MongoDB
mongo = PyMongo(app)
CORS(app)

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = mongo.db.users.find_one({'_id': data['user_id']})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = mongo.db.users.find_one({'_id': data['user_id']})
            
            if current_user['role'] != 'admin':
                return jsonify({'message': 'Admin access required!'}), 403
                
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# HTML Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/register')
def register_page():
    return render_template('register.html')

@app.route('/reservations')
def reservations():
    return render_template('reservations.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/orders')
def orders():
    return render_template('orders.html')

@app.route('/admin')
def admin_dashboard():
    return render_template('admin/dashboard.html')

@app.route('/admin/menu')
def admin_menu():
    return render_template('admin/menu.html')

@app.route('/admin/orders')
def admin_orders():
    return render_template('admin/orders.html')

@app.route('/admin/reservations')
def admin_reservations():
    return render_template('admin/reservations.html')

# API Routes

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        existing_user = mongo.db.users.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = generate_password_hash(data['password'])
        
        new_user = {
            '_id': user_id,
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password,
            'phone': data.get('phone', ''),
            'role': 'customer',
            'created_at': datetime.utcnow()
        }
        
        mongo.db.users.insert_one(new_user)
        
        # Generate token
        token = jwt.encode({
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': {
                'id': user_id,
                'name': data['name'],
                'email': data['email'],
                'role': 'customer'
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = mongo.db.users.find_one({'email': data['email']})
        
        if user and check_password_hash(user['password'], data['password']):
            token = jwt.encode({
                'user_id': user['_id'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user['_id'],
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role']
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Menu Routes
@app.route('/api/menu', methods=['GET'])
def get_menu():
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        
        query = {'available': True}
        
        if category and category != 'all':
            query['category'] = category
            
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        menu_items = list(mongo.db.menu_items.find(query))
        
        # Convert ObjectId to string for JSON serialization
        for item in menu_items:
            item['_id'] = str(item['_id'])
        
        return jsonify(menu_items), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menu/popular', methods=['GET'])
def get_popular_menu():
    try:
        popular_items = list(mongo.db.menu_items.find({'popular': True, 'available': True}).limit(6))
        
        for item in popular_items:
            item['_id'] = str(item['_id'])
        
        return jsonify(popular_items), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menu', methods=['POST'])
@admin_required
def add_menu_item(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['name', 'category', 'description', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        menu_item_id = str(uuid.uuid4())
        new_item = {
            '_id': menu_item_id,
            'name': data['name'],
            'category': data['category'],
            'description': data['description'],
            'price': float(data['price']),
            'image': data.get('image', ''),
            'available': data.get('available', True),
            'popular': data.get('popular', False),
            'created_at': datetime.utcnow()
        }
        
        mongo.db.menu_items.insert_one(new_item)
        new_item['_id'] = str(new_item['_id'])
        
        return jsonify(new_item), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menu/<item_id>', methods=['PUT'])
@admin_required
def update_menu_item(current_user, item_id):
    try:
        data = request.get_json()
        
        update_data = {
            'name': data['name'],
            'category': data['category'],
            'description': data['description'],
            'price': float(data['price']),
            'image': data.get('image', ''),
            'available': data.get('available', True),
            'popular': data.get('popular', False)
        }
        
        result = mongo.db.menu_items.update_one(
            {'_id': item_id},
            {'$set': update_data}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Menu item updated successfully'}), 200
        else:
            return jsonify({'error': 'Menu item not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/menu/<item_id>', methods=['DELETE'])
@admin_required
def delete_menu_item(current_user, item_id):
    try:
        result = mongo.db.menu_items.delete_one({'_id': item_id})
        
        if result.deleted_count:
            return jsonify({'message': 'Menu item deleted successfully'}), 200
        else:
            return jsonify({'error': 'Menu item not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Order Routes
@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['items', 'total', 'delivery_address']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        order_id = str(uuid.uuid4())
        new_order = {
            '_id': order_id,
            'user_id': current_user['_id'],
            'items': data['items'],
            'total': float(data['total']),
            'delivery_address': data['delivery_address'],
            'notes': data.get('notes', ''),
            'status': 'pending',
            'order_date': datetime.utcnow()
        }
        
        mongo.db.orders.insert_one(new_order)
        new_order['_id'] = str(new_order['_id'])
        
        return jsonify(new_order), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    try:
        if current_user['role'] == 'admin':
            # Admin can see all orders
            orders = list(mongo.db.orders.find().sort('order_date', -1))
            
            # Populate user information for admin
            for order in orders:
                user = mongo.db.users.find_one({'_id': order['user_id']})
                order['user'] = {
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user.get('phone', '')
                } if user else None
        else:
            # Regular users can only see their own orders
            orders = list(mongo.db.orders.find({'user_id': current_user['_id']}).sort('order_date', -1))
        
        for order in orders:
            order['_id'] = str(order['_id'])
        
        return jsonify(orders), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(current_user, order_id):
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        result = mongo.db.orders.update_one(
            {'_id': order_id},
            {'$set': {'status': data['status']}}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Order status updated successfully'}), 200
        else:
            return jsonify({'error': 'Order not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Reservation Routes
@app.route('/api/reservations', methods=['POST'])
@token_required
def create_reservation(current_user):
    try:
        data = request.get_json()
        
        required_fields = ['date', 'time', 'guests']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        reservation_id = str(uuid.uuid4())
        new_reservation = {
            '_id': reservation_id,
            'user_id': current_user['_id'],
            'date': data['date'],
            'time': data['time'],
            'guests': int(data['guests']),
            'notes': data.get('notes', ''),
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
        
        mongo.db.reservations.insert_one(new_reservation)
        new_reservation['_id'] = str(new_reservation['_id'])
        
        return jsonify(new_reservation), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reservations', methods=['GET'])
@token_required
def get_reservations(current_user):
    try:
        if current_user['role'] == 'admin':
            reservations = list(mongo.db.reservations.find().sort('created_at', -1))
            
            # Populate user information for admin
            for reservation in reservations:
                user = mongo.db.users.find_one({'_id': reservation['user_id']})
                reservation['user'] = {
                    'name': user['name'],
                    'email': user['email'],
                    'phone': user.get('phone', '')
                } if user else None
        else:
            reservations = list(mongo.db.reservations.find({'user_id': current_user['_id']}).sort('created_at', -1))
        
        for reservation in reservations:
            reservation['_id'] = str(reservation['_id'])
        
        return jsonify(reservations), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reservations/<reservation_id>/status', methods=['PUT'])
@admin_required
def update_reservation_status(current_user, reservation_id):
    try:
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        result = mongo.db.reservations.update_one(
            {'_id': reservation_id},
            {'$set': {'status': data['status']}}
        )
        
        if result.modified_count:
            return jsonify({'message': 'Reservation status updated successfully'}), 200
        else:
            return jsonify({'error': 'Reservation not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    try:
        data = request.get_json()
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required'}), 400
        
        # Verify current password
        if not check_password_hash(current_user['password'], current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Hash and update new password
        hashed_new_password = generate_password_hash(new_password)
        mongo.db.users.update_one(
            {'_id': current_user['_id']},
            {'$set': {'password': hashed_new_password}}
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Profile Routes
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        user_data = {
            'id': current_user['_id'],
            'name': current_user['name'],
            'email': current_user['email'],
            'phone': current_user.get('phone', ''),
            'role': current_user['role']
        }
        
        return jsonify(user_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'phone' in data:
            update_data['phone'] = data['phone']
        
        if update_data:
            mongo.db.users.update_one(
                {'_id': current_user['_id']},
                {'$set': update_data}
            )
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Contact Routes
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        contact_id = str(uuid.uuid4())
        contact_message = {
            '_id': contact_id,
            'name': data['name'],
            'email': data['email'],
            'subject': data['subject'],
            'message': data['message'],
            'created_at': datetime.utcnow(),
            'status': 'unread'
        }
        
        mongo.db.contacts.insert_one(contact_message)
        
        return jsonify({'message': 'Thank you for your message. We will get back to you soon!'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Initialize sample data
@app.route('/api/init-data', methods=['POST'])
def init_sample_data():
    try:
        # Create admin user
        admin_id = str(uuid.uuid4())
        admin_user = {
            '_id': admin_id,
            'name': 'Admin User',
            'email': 'admin@savory.com',
            'password': generate_password_hash('savory@admin'),
            'phone': '+1234567890',
            'role': 'admin',
            'created_at': datetime.utcnow()
        }
        
        # Create sample customer
        customer_id = str(uuid.uuid4())
        customer_user = {
            '_id': customer_id,
            'name': 'User',
            'email': 'user@savory.com',
            'password': generate_password_hash('savory@user'),
            'phone': '+1234567891',
            'role': 'customer',
            'created_at': datetime.utcnow()
        }
        
        # Insert users if they don't exist
        if not mongo.db.users.find_one({'email': 'admin@savory.com'}):
            mongo.db.users.insert_one(admin_user)
        if not mongo.db.users.find_one({'email': 'user@savory.com'}):
            mongo.db.users.insert_one(customer_user)
        
        # Sample menu items
        sample_menu_items = [
            {
                '_id': str(uuid.uuid4()),
                'name': 'Grilled Salmon',
                'category': 'main-course',
                'description': 'Fresh Atlantic salmon grilled to perfection with herbs and lemon',
                'price': 24.99,
                'image': 'https://images.pexels.com/photos/1516415/pexels-photo-1516415.jpeg?auto=compress&cs=tinysrgb&w=600',
                'available': True,
                'popular': True,
                'created_at': datetime.utcnow()
            },
            {
                '_id': str(uuid.uuid4()),
                'name': 'Caesar Salad',
                'category': 'starters',
                'description': 'Crisp romaine lettuce with parmesan cheese and our signature dressing',
                'price': 12.99,
                'image': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600',
                'available': True,
                'popular': True,
                'created_at': datetime.utcnow()
            },
            {
                '_id': str(uuid.uuid4()),
                'name': 'Beef Steak',
                'category': 'main-course',
                'description': 'Premium beef steak cooked to your liking with roasted vegetables',
                'price': 32.99,
                'image': 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600',
                'available': True,
                'popular': True,
                'created_at': datetime.utcnow()
            },
            {
                '_id': str(uuid.uuid4()),
                'name': 'Chocolate Cake',
                'category': 'desserts',
                'description': 'Rich chocolate cake with layers of creamy frosting',
                'price': 8.99,
                'image': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600',
                'available': True,
                'popular': False,
                'created_at': datetime.utcnow()
            },
            {
                '_id': str(uuid.uuid4()),
                'name': 'Fresh Orange Juice',
                'category': 'beverages',
                'description': 'Freshly squeezed orange juice',
                'price': 4.99,
                'image': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600',
                'available': True,
                'popular': False,
                'created_at': datetime.utcnow()
            },
            {
                '_id': str(uuid.uuid4()),
                'name': 'Chicken Wings',
                'category': 'starters',
                'description': 'Spicy buffalo wings served with blue cheese dip',
                'price': 14.99,
                'image': 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=600',
                'available': True,
                'popular': True,
                'created_at': datetime.utcnow()
            }
        ]
        
        # Insert menu items if collection is empty
        if mongo.db.menu_items.count_documents({}) == 0:
            mongo.db.menu_items.insert_many(sample_menu_items)
        
        return jsonify({'message': 'Sample data initialized successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)