import sys
from pathlib import Path
import uvicorn

# Ensure the root is on python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend_python.config import config

if __name__ == "__main__":
    print(f"🌾 Starting KisanSetu Python Backend on http://localhost:{config.PORT}...")
    uvicorn.run(
        "backend_python.main:app",
        host="0.0.0.0",
        port=config.PORT,
        reload=True
    )
