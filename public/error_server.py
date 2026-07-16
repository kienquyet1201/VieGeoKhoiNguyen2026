import http.server
import socketserver
import urllib.parse
import sys

class ErrorLogger(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        print(f"\n\n--- JS ERROR DETECTED ---\n{urllib.parse.unquote(post_data)}\n-------------------------\n")
        self.send_response(200)
        self.end_headers()
        # Shutdown after receiving an error
        sys.exit(0)

PORT = 8081
with socketserver.TCPServer(("", PORT), ErrorLogger) as httpd:
    print(f"Serving on port {PORT}")
    httpd.serve_forever()
