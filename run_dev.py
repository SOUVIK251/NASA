"""
Flame in Freefall — NASA Microgravity Combustion Research Workstation
Unified Development Server Runner

Runs both:
  1. FastAPI Backend (http://127.0.0.1:8000)
  2. Vite React Frontend (http://localhost:5173)

Monitors both processes, aggregates logs, and shuts down cleanly on Ctrl+C.
"""

import os
import sys
import time
import socket
import signal
import subprocess
import threading

WORKSPACE_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(WORKSPACE_ROOT, "backend")
FRONTEND_DIR = os.path.join(WORKSPACE_ROOT, "frontend")


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def stream_logs(process: subprocess.Popen, prefix: str):
    """Stream stdout/stderr from a subprocess with a tagged prefix."""
    try:
        for line in iter(process.stdout.readline, b""):
            if not line:
                break
            try:
                decoded = line.decode("utf-8", errors="replace").rstrip()
                print(f"{prefix} {decoded}")
            except Exception:
                pass
    except Exception:
        pass


def main():
    print("=" * 70)
    print("  FLAME IN FREEFALL — NASA COMBUSTION WORKSTATION (DEV MODE)")
    print("=" * 70)

    # 1. Check database initialization
    db_file = os.path.join(BACKEND_DIR, "flame_research.db")
    if not os.path.exists(db_file):
        print("\n[+] Initializing database (seed_data.py)...")
        subprocess.run([sys.executable, os.path.join(BACKEND_DIR, "seed_data.py")], check=True)

    # 2. Check port status
    if is_port_in_use(8000):
        print("\n[!] WARNING: Port 8000 is already in use.")
        print("    If a previous backend instance is running, stop it or run stop_servers.bat.")

    if is_port_in_use(5173):
        print("\n[!] WARNING: Port 5173 is already in use.")
        print("    If a previous Vite instance is running, stop it or run stop_servers.bat.")

    print("\n[+] Launching FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_cmd = [
        sys.executable, "-m", "uvicorn",
        "main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1
    )

    print("[+] Launching Vite Frontend on http://localhost:5173 ...")
    # On Windows, npm is a .cmd script
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=1,
        shell=(os.name == "nt")
    )

    # Start log streaming threads
    t_backend = threading.Thread(target=stream_logs, args=(backend_proc, "[BACKEND]"), daemon=True)
    t_frontend = threading.Thread(target=stream_logs, args=(frontend_proc, "[FRONTEND]"), daemon=True)
    t_backend.start()
    t_frontend.start()

    print("\n" + "=" * 70)
    print("  BOTH SERVERS RUNNING:")
    print("  - Backend API:  http://127.0.0.1:8000/docs")
    print("  - Frontend UI:  http://localhost:5173")
    print("  Press Ctrl+C to terminate both servers.")
    print("=" * 70 + "\n")

    def shutdown():
        print("\n[+] Shutting down development servers...")
        try:
            backend_proc.terminate()
            backend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()

        try:
            if os.name == "nt":
                # Kill process tree on Windows for npm
                subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, capture_output=True)
            else:
                frontend_proc.terminate()
                frontend_proc.wait(timeout=3)
        except Exception:
            frontend_proc.kill()
        print("[+] Servers stopped successfully.")

    try:
        while True:
            time.sleep(1)
            # Check if either process died unexpectedly
            b_code = backend_proc.poll()
            f_code = frontend_proc.poll()
            if b_code is not None:
                print(f"\n[!] Backend process exited unexpectedly with code {b_code}.")
                break
            if f_code is not None:
                print(f"\n[!] Frontend process exited unexpectedly with code {f_code}.")
                break
    except KeyboardInterrupt:
        pass
    finally:
        shutdown()


if __name__ == "__main__":
    main()
