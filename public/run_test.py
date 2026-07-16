import http.server
import socketserver
import urllib.parse
import sys
import webbrowser
import threading
import time

class ErrorLogger(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        print(f"\n\n=== RESULT FROM BROWSER ===\n{urllib.parse.unquote(post_data)}\n===========================\n")
        self.send_response(200)
        self.end_headers()
        # Shutdown server
        def shutdown():
            httpd.shutdown()
        threading.Thread(target=shutdown).start()
    
    # Suppress normal GET logs
    def log_message(self, format, *args):
        pass

PORT = 8081
httpd = socketserver.TCPServer(("", PORT), ErrorLogger)
print(f"Serving on port {PORT}")

# Open browser after a small delay
def open_browser():
    time.sleep(1)
    webbrowser.open(f'http://localhost:{PORT}/test_js.html')

threading.Thread(target=open_browser).start()
httpd.serve_forever()
