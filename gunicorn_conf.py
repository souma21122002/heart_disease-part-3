# Gunicorn configuration file
import multiprocessing

# Number of worker processes
workers = multiprocessing.cpu_count() * 2 + 1

# Socket to bind
bind = "0.0.0.0:10000"

# Use the standard sync worker instead of Uvicorn
worker_class = "sync"

# Application object - point directly to the Flask app
wsgi_app = "main:app"

# Timeout settings
timeout = 120