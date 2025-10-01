# Vercel serverless handler
from backend.main import app

# Export the app for Vercel
def handler(request, response):
    return app(request, response)