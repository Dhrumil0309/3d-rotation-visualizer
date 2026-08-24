import http.server
import functools
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

if __name__ == '__main__':
    handler_class = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)
    server_address = ('', PORT) # Binds to all interfaces (0.0.0.0 and ::)
    
    with http.server.ThreadingHTTPServer(server_address, handler_class) as httpd:
        print(f"Serving HTTP on port {PORT} (http://localhost:{PORT}/) ...")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
