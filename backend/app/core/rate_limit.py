import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, status


class SlidingWindowRateLimiter:
    """In-memory rate limiter using sliding timestamp windows."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old timestamps
        valid_timestamps = [t for t in self.requests[key] if t > window_start]
        self.requests[key] = valid_timestamps

        if len(valid_timestamps) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - valid_timestamps[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please wait {max(1, retry_after)} seconds before trying again.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        self.requests[key].append(now)


# Global rate limiters
otp_rate_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
ai_rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=60)
