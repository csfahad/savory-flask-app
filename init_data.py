#!/usr/bin/env python3
"""
Initialize the database with sample data for the Restaurant Management System
"""

from pymongo import MongoClient
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_database():
    # Connect to MongoDB
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/restaurant_db')
    client = MongoClient(mongo_uri)
    
    # Extract database name from URI
    db_name = mongo_uri.split('/')[-1]
    db = client[db_name]
    
    print(f"Initializing database: {db_name}")
    
    # Clear existing data
    print("Clearing existing data...")
    db.users.drop()
    db.menu_items.drop()
    db.orders.drop()
    db.reservations.drop()
    db.contacts.drop()
    
    # Create admin user
    print("Creating admin user...")
    admin_user = {
        '_id': str(uuid.uuid4()),
        'name': 'Admin User',
        'email': 'admin@savory.com',
        'password': generate_password_hash('admin123'),
        'phone': '+1234567890',
        'role': 'admin',
        'created_at': datetime.utcnow()
    }
    db.users.insert_one(admin_user)
    
    # Create sample customer
    print("Creating sample customer...")
    customer_user = {
        '_id': str(uuid.uuid4()),
        'name': 'John Customer',
        'email': 'customer@savory.com',
        'password': generate_password_hash('customer123'),
        'phone': '+1234567891',
        'role': 'customer',
        'created_at': datetime.utcnow()
    }
    db.users.insert_one(customer_user)
    
    # Create sample menu items
    print("Creating sample menu items...")
    sample_menu_items = [
        {
            '_id': str(uuid.uuid4()),
            'name': 'Grilled Salmon',
            'category': 'main-course',
            'description': 'Fresh Atlantic salmon grilled to perfection with herbs and lemon, served with seasonal vegetables',
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
            'description': 'Crisp romaine lettuce with parmesan cheese, croutons, and our signature Caesar dressing',
            'price': 12.99,
            'image': 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': True,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Premium Beef Steak',
            'category': 'main-course',
            'description': 'Premium beef steak cooked to your liking, served with roasted vegetables and mashed potatoes',
            'price': 32.99,
            'image': 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': True,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Chocolate Lava Cake',
            'category': 'desserts',
            'description': 'Rich chocolate cake with a molten center, served with vanilla ice cream',
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
            'description': 'Freshly squeezed orange juice from locally sourced oranges',
            'price': 4.99,
            'image': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': False,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Buffalo Chicken Wings',
            'category': 'starters',
            'description': 'Spicy buffalo chicken wings served with celery sticks and blue cheese dip',
            'price': 14.99,
            'image': 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': True,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Margherita Pizza',
            'category': 'main-course',
            'description': 'Classic Italian pizza with fresh tomato sauce, mozzarella, and basil',
            'price': 18.99,
            'image': 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': True,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Mushroom Soup',
            'category': 'starters',
            'description': 'Creamy mushroom soup made with fresh herbs and a touch of cream',
            'price': 9.99,
            'image': 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': False,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Tiramisu',
            'category': 'desserts',
            'description': 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
            'price': 7.99,
            'image': 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': True,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Iced Coffee',
            'category': 'beverages',
            'description': 'Cold brew coffee served over ice with a splash of milk',
            'price': 3.99,
            'image': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': False,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Greek Salad',
            'category': 'starters',
            'description': 'Fresh mixed greens with tomatoes, cucumbers, olives, and feta cheese',
            'price': 11.99,
            'image': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': False,
            'created_at': datetime.utcnow()
        },
        {
            '_id': str(uuid.uuid4()),
            'name': 'Lobster Bisque',
            'category': 'starters',
            'description': 'Rich and creamy lobster bisque with a hint of brandy',
            'price': 16.99,
            'image': 'https://images.pexels.com/photos/5409751/pexels-photo-5409751.jpeg?auto=compress&cs=tinysrgb&w=600',
            'available': True,
            'popular': False,
            'created_at': datetime.utcnow()
        }
    ]
    
    db.menu_items.insert_many(sample_menu_items)
    
    # Create indexes for better performance
    print("Creating database indexes...")
    db.users.create_index("email", unique=True)
    db.menu_items.create_index("category")
    db.menu_items.create_index("available")
    db.orders.create_index("user_id")
    db.orders.create_index("order_date")
    db.reservations.create_index("user_id")
    db.reservations.create_index("date")
    
    print("Database initialization completed successfully!")
    print("\nDemo Credentials:")
    print("Admin: admin@savory.com / admin123")
    print("Customer: customer@savory.com / customer123")
    
    client.close()

if __name__ == "__main__":
    init_database()