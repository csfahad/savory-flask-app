#!/usr/bin/env python3
"""
Server runner script for the Restaurant Management System
"""

import os
import sys
from app import app
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get configuration from environment
    debug = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    
    print("Starting Restaurant Management System...")
    print(f"Debug mode: {debug}")
    print(f"Server: http://{host}:{port}")
    print("\nDemo Credentials:")
    print("Admin: admin@savory.com / admin123")
    print("Customer: customer@savory.com / customer123")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        app.run(
            debug=debug,
            host=host,
            port=port,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)