import os
import sys
import time
import subprocess
import webbrowser
import threading
import socket

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def wait_for_port(port, timeout=60):
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_in_use(port):
            return True
        time.sleep(1)
    return False

def run_backend(root_dir):
    backend_dir = os.path.join(root_dir, 'backend')
    venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
    
    if not os.path.exists(venv_python):
        print("Backend virtual environment not found. Please run setup.ps1 first.")
        return None

    print("Starting Backend (FastAPI)...")
    # Use CREATE_NO_WINDOW to hide the console window for subprocesses on Windows
    creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    
    process = subprocess.Popen(
        [venv_python, '-m', 'uvicorn', 'app.main:app', '--port', '8000'],
        cwd=backend_dir,
        creationflags=creationflags,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    return process

def run_frontend(root_dir):
    print("Starting Frontend (Next.js)...")
    npm_cmd = 'npm.cmd' if sys.platform == 'win32' else 'npm'
    
    creationflags = subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
    
    process = subprocess.Popen(
        [npm_cmd, 'run', 'dev'],
        cwd=root_dir,
        creationflags=creationflags,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    return process

def main():
    print("========================================")
    print("      Van Dinh Ho So Dia Chinh          ")
    print("          Starting services...          ")
    print("========================================")
    
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle (PyInstaller), the PyInstaller bootloader
        # extends the sys module by a flag frozen=True and sets the app path into variable _MEIPASS'.
        application_path = os.path.dirname(sys.executable)
    else:
        application_path = os.path.dirname(os.path.abspath(__file__))

    # Check if backend and frontend are already running
    backend_proc = None
    frontend_proc = None

    if not is_port_in_use(8000):
        backend_proc = run_backend(application_path)
    else:
        print("Backend is already running on port 8000.")

    if not is_port_in_use(3000):
        frontend_proc = run_frontend(application_path)
    else:
        print("Frontend is already running on port 3000.")

    print("Waiting for frontend to be ready on port 3000...")
    if wait_for_port(3000, timeout=60):
        print("Services are ready. Launching App Window...")
        # Open in Chrome/Edge App Mode
        chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
        edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
        
        url = "http://localhost:3000"
        app_launched = False
        
        try:
            if os.path.exists(chrome_path):
                subprocess.Popen([chrome_path, f"--app={url}"])
                app_launched = True
            elif os.path.exists(edge_path):
                subprocess.Popen([edge_path, f"--app={url}"])
                app_launched = True
        except Exception as e:
            pass
            
        if not app_launched:
            webbrowser.open(url)
            
        print("App launched. You can close this console window to stop the server.")
        
        try:
            # Keep the main thread alive until the user closes the CLI window
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down services...")
    else:
        print("Error: Frontend did not start within 60 seconds.")
        input("Press Enter to exit...")

    # Cleanup
    if backend_proc:
        backend_proc.terminate()
    if frontend_proc:
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
