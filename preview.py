"""Loopback-only static preview with an explicit public-file allowlist.
Run: python3 preview.py --port 4173
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT = Path(__file__).resolve().parent
PUBLIC_FILES = frozenset({
    '/index.html', '/style.css', '/script.js',
    '/assets/terrain.svg', '/assets/favicon.svg',
    '/research/shandong-water-quality/index.html',
    '/research/tire-rubber-particles/index.html',
})


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = unquote(urlsplit(self.path).path)
        if path.endswith('/'):
            path += 'index.html'
        if path not in PUBLIC_FILES:
            self.send_error(404, 'Not found')
            return None
        self.path = path
        return super().send_head()

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def make_server(port):
    return ThreadingHTTPServer(('127.0.0.1', port), partial(PreviewHandler, directory=str(ROOT)))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    server = make_server(args.port)
    print(f'Local preview: http://127.0.0.1:{server.server_port}', flush=True)
    print('Only website files are served. Original documents remain private.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
