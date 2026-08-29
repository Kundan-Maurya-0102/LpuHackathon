import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))

from backend_python.run import run_server_forever

if __name__ == "__main__":
    run_server_forever()
