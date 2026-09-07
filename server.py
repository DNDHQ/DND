import hmac
import json
import os
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

PORT = int(os.environ.get("PORT", "3000"))
ACCESS_PASSWORD = os.environ.get("DND_ACCESS_PASSWORD")
REDIRECT_URL = "https://yeezy.com"
ROOT = Path(__file__).parent
MAX_BODY_BYTES = 4_096
MAX_ATTEMPTS = 5
ATTEMPT_WINDOW_SECONDS = 5 * 60
ATTEMPTS = {}

STATIC_FILES = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/styles.css": ("styles.css", "text/css; charset=utf-8"),
    "/gate.js": ("gate.js", "text/javascript; charset=utf-8"),
    "/images/BURGER.png": ("images/BURGER.png", "image/png"),
    "/images/burger-icon.png": ("images/burger-icon.png", "image/png"),
}


class DndHandler(BaseHTTPRequestHandler):
    def security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' https://fonts.googleapis.com; "
            "font-src https://fonts.gstatic.com; img-src 'self'; script-src 'self'; "
            "base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
        )

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.security_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def wants_json(self):
        return "application/json" in self.headers.get("Accept", "")

    def client_is_rate_limited(self):
        now = time.monotonic()
        recent = [t for t in ATTEMPTS.get(self.client_address[0], []) if now - t < ATTEMPT_WINDOW_SECONDS]
        ATTEMPTS[self.client_address[0]] = recent
        return len(recent) >= MAX_ATTEMPTS

    def record_failed_attempt(self):
        ATTEMPTS.setdefault(self.client_address[0], []).append(time.monotonic())

    def deny_access(self, status, message):
        if self.wants_json():
            self.send_json(status, {"message": message})
            return

        self.send_response(HTTPStatus.SEE_OTHER)
        self.security_headers()
        self.send_header("Location", "/")
        self.end_headers()

    def do_POST(self):
        if urlparse(self.path).path != "/unlock":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        if self.client_is_rate_limited():
            self.deny_access(HTTPStatus.TOO_MANY_REQUESTS, "Too many attempts. Please wait a few minutes.")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > MAX_BODY_BYTES:
            self.deny_access(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "Request is too large.")
            return

        form = parse_qs(self.rfile.read(content_length).decode("utf-8"), keep_blank_values=True)
        password = form.get("password", [""])[0]
        passwords_match = ACCESS_PASSWORD and hmac.compare_digest(
            password.encode("utf-8"), ACCESS_PASSWORD.encode("utf-8")
        )
        if not passwords_match:
            self.record_failed_attempt()
            message = "Incorrect password." if ACCESS_PASSWORD else "Password access is not configured."
            self.deny_access(HTTPStatus.UNAUTHORIZED, message)
            return

        ATTEMPTS.pop(self.client_address[0], None)
        if self.wants_json():
            self.send_json(HTTPStatus.OK, {"redirectUrl": REDIRECT_URL})
            return

        self.send_response(HTTPStatus.SEE_OTHER)
        self.security_headers()
        self.send_header("Location", REDIRECT_URL)
        self.end_headers()

    def do_GET(self):
        self.serve_static()

    def do_HEAD(self):
        self.serve_static(send_body=False)

    def serve_static(self, send_body=True):
        file_info = STATIC_FILES.get(urlparse(self.path).path)
        if not file_info:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        relative_path, content_type = file_info
        content = (ROOT / relative_path).read_bytes()
        self.send_response(HTTPStatus.OK)
        self.security_headers()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        if send_body:
            self.wfile.write(content)


if __name__ == "__main__":
    if not ACCESS_PASSWORD:
        print("DND_ACCESS_PASSWORD is not set; password entry will remain disabled.")
    print(f"DND HQ is running at http://localhost:{PORT}")
    ThreadingHTTPServer(("", PORT), DndHandler).serve_forever()
