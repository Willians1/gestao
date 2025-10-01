# Vercel serverless handler for FastAPI
import os
import sys

# Add backend to Python path (absolute path)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
	sys.path.append(BASE_DIR)

from backend.main import app  # FastAPI instance

# Exported variable `app` is detected by @vercel/python (ASGI)