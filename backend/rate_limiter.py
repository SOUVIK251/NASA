"""
Rate Limiter Middleware for Flame in Freefall Auth Routes.
Limits requests per IP per time window using in-memory sliding window.
"""

import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Max requests per window per IP for auth routes
AUTH_RATE_LIMIT_REQUESTS = 10      # max 10 requests
AUTH_RATE_LIMIT_WINDOW   = 60      # per 60 seconds

# Track per-IP request timestamps
_ip_windows: dict[str, deque] = defaultdict(deque)


class AuthRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter for /api/auth/* endpoints.
    Returns HTTP 429 Too Many Requests if the limit is exceeded.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Only rate-limit auth endpoints
        if not request.url.path.startswith("/api/auth/"):
            return await call_next(request)

        # Skip rate limiting on admin and /me routes
        skip_paths = ["/api/auth/me", "/api/auth/admin"]
        if any(request.url.path.startswith(p) for p in skip_paths):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now       = time.time()
        window    = _ip_windows[client_ip]

        # Evict entries older than the window
        while window and window[0] < now - AUTH_RATE_LIMIT_WINDOW:
            window.popleft()

        if len(window) >= AUTH_RATE_LIMIT_REQUESTS:
            retry_after = int(AUTH_RATE_LIMIT_WINDOW - (now - window[0]))
            return JSONResponse(
                status_code=429,
                content={
                    "detail": (
                        f"Too many requests. You have exceeded {AUTH_RATE_LIMIT_REQUESTS} "
                        f"auth requests per {AUTH_RATE_LIMIT_WINDOW}s. "
                        f"Retry after {retry_after}s."
                    ),
                    "retry_after_seconds": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )

        window.append(now)
        return await call_next(request)

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Extract real client IP, respecting X-Forwarded-For header."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client:
            return request.client.host
        return "unknown"
