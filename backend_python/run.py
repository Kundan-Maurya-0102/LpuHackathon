import sys
import os
import time
import signal
from pathlib import Path
import uvicorn

# Ensure the root is on python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend_python.config import config
import subprocess

def free_port_if_occupied(port: int):
    """Detects and terminates stale processes holding the target port."""
    try:
        cmd = f'netstat -ano | findstr :{port}'
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        for line in res.stdout.strip().splitlines():
            if "LISTENING" in line and f":{port}" in line:
                parts = line.strip().split()
                pid = int(parts[-1])
                if pid != os.getpid() and pid > 4:
                    print(f"[KisanSetu] 🔄 Freeing port {port} (Terminating previous process PID {pid})...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
                    time.sleep(1)
    except Exception:
        pass

def run_server_forever():
    """
    24/7 Unlimited Resilient Server Runner
    Automatically handles restarts, network blips, and ensures zero downtime.
    """
    free_port_if_occupied(config.PORT)
    should_reload = os.environ.get("RELOAD", "false").lower() == "true"
    restart_count = 0
    max_consecutive_fast_crashes = 10
    last_start_time = 0

    print("=" * 65)
    print("🌾 KisanSetu 24/7 Unlimited High-Performance Server")
    print(f"📍 Local URL:     http://localhost:{config.PORT}")
    print(f"📍 Network URL:   http://0.0.0.0:{config.PORT}")
    print(f"📍 API Docs:      http://localhost:{config.PORT}/docs")
    print("🛡️ Auto-Recovery:  ENABLED (Runs 24/7 without stopping)")
    print("=" * 65)

    while True:
        try:
            last_start_time = time.time()
            uvicorn.run(
                "backend_python.main:app",
                host="0.0.0.0",
                port=config.PORT,
                reload=should_reload,
                timeout_keep_alive=120,
                limit_concurrency=300,
                backlog=4096,
                access_log=False
            )
            # If uvicorn exited cleanly without exception
            print("\n[KisanSetu] Server stopped cleanly.")
            break

        except KeyboardInterrupt:
            print("\n[KisanSetu] Manual shutdown requested by user. Exiting...")
            sys.exit(0)

        except Exception as err:
            uptime = time.time() - last_start_time
            print(f"\n[KisanSetu ERROR] Server encountered an unexpected issue: {err}")
            
            if uptime < 5:
                restart_count += 1
                wait_time = min(2 ** restart_count, 30)
                print(f"[KisanSetu Auto-Recovery] Rapid crash detected. Waiting {wait_time}s before auto-restarting...")
                time.sleep(wait_time)
            else:
                restart_count = 0
                print("[KisanSetu Auto-Recovery] Restarting server immediately in 1 second...")
                time.sleep(1)

if __name__ == "__main__":
    run_server_forever()
