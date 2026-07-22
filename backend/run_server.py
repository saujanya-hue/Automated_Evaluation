import sys
import os

# Force Python to look in the local backend directory first
current_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, current_dir)

import uvicorn

if __name__ == "__main__":
    print(f"Starting local evaluation server. Python Path: {sys.path[0]}")
    uvicorn.run("evaluation_app.main:app", host="127.0.0.1", port=8002, reload=True)
