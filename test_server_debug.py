import http.server
import traceback
import sys

class DebugHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print("HTTP LOG:", format % args)
        sys.stdout.flush()

    def do_GET(self):
        try:
            print("Received GET request for:", self.path)
            sys.stdout.flush()
            super().do_GET()
        except Exception:
            traceback.print_exc()
            sys.stdout.flush()

if __name__ == '__main__':
    port = 8085
    server = http.server.HTTPServer(('127.0.0.1', port), DebugHandler)
    print(f"Debug server ready on port {port}")
    sys.stdout.flush()
    server.handle_request()
