import os
import sys
import time
import json
import shutil
import socket
import subprocess
import threading
from pathlib import Path

try:
    import requests
except ImportError:
    subprocess.run([sys.executable, "-m", "pip", "install", "requests"], check=True)
    import requests

ROOT_DIR = Path(__file__).resolve().parent
PORT = 3000

def is_server_ready():
    """Checks if the local KisanSetu server is answering health checks."""
    try:
        r = requests.get(f"http://127.0.0.1:{PORT}/health", timeout=1.5)
        return r.status_code == 200
    except Exception:
        return False

def start_backend_if_needed():
    """Starts the Python backend if it isn't already running."""
    if is_server_ready():
        print(f"[KisanSetu] ✅ Local backend server is already active on http://localhost:{PORT}")
        return None

    print(f"[KisanSetu] 🚀 Starting background backend server on http://localhost:{PORT}...")
    proc = subprocess.Popen(
        [sys.executable, str(ROOT_DIR / "run_server.py")],
        cwd=str(ROOT_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for server to bind
    for i in range(25):
        time.sleep(0.5)
        if is_server_ready():
            print(f"[KisanSetu] ✅ Backend server ready on http://localhost:{PORT}!")
            return proc
            
    print(f"[KisanSetu] ⚠️ Backend taking longer to start, continuing...")
    return proc

def get_ngrok_tunnel_url():
    """Queries ngrok local API to extract the public https URL."""
    try:
        r = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        if r.status_code == 200:
            tunnels = r.json().get("tunnels", [])
            for t in tunnels:
                if t.get("proto") == "https":
                    return t.get("public_url")
            if tunnels:
                return tunnels[0].get("public_url")
    except Exception:
        pass
    return None

def run_ngrok():
    print("=" * 68)
    print("🌾 KisanSetu - ngrok 24/7 Public Hosting Launcher")
    print("=" * 68)

    # 1. Verify ngrok CLI is installed
    ngrok_bin = shutil.which("ngrok")
    if not ngrok_bin:
        print("[!] ERROR: 'ngrok' command is not found in your system PATH.")
        print("[*] Please download ngrok from https://ngrok.com/download and add to PATH.")
        sys.exit(1)

    # 2. Ensure local backend is running
    server_proc = start_backend_if_needed()

    # 3. Launch ngrok tunnel
    print(f"\n[*] Launching ngrok tunnel forwarding to http://localhost:{PORT}...")
    ngrok_cmd = [
        "ngrok", "http", str(PORT),
        "--host-header=rewrite",
        "--log=stdout"
    ]
    
    ngrok_proc = subprocess.Popen(
        ngrok_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # 4. Wait for ngrok local dashboard to report public URL
    public_url = None
    for attempt in range(20):
        time.sleep(0.6)
        public_url = get_ngrok_tunnel_url()
        if public_url:
            break

    if public_url:
        print("\n" + "=" * 68)
        print("🎉 KISANSETU IS NOW LIVE ONLINE VIA NGROK!")
        print("=" * 68)
        print(f"🌐 Public Website URL:   {public_url}")
        print(f"📄 Swagger API Docs:     {public_url}/docs")
        print(f"📱 Mobile Access:        Share this link to open on any mobile phone!")
        print(f"💻 Local Dashboard:      http://127.0.0.1:4040")
        print("=" * 68)
        print("\n[INFO] Press CTRL+C to stop hosting.\n")
    else:
        print("\n[*] Ngrok is starting. If prompted to authenticate, run:")
        print("    ngrok config add-authtoken <YOUR_NGROK_TOKEN>")
        print("    (Get a free token from https://dashboard.ngrok.com/get-started/your-authtoken)\n")

    try:
        ngrok_proc.wait()
    except KeyboardInterrupt:
        print("\n[KisanSetu] Stopping ngrok hosting...")
        ngrok_proc.terminate()
        if server_proc:
            server_proc.terminate()
        print("[KisanSetu] Host session closed.")

if __name__ == "__main__":
    run_ngrok()
