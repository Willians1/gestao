# Vercel serverless handler for FastAPI
import os
import sys

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.main import app

# Export the FastAPI app for Vercel
# Vercel will handle the ASGI interface automatically