import asyncio
from typing import Dict
from ..config import get_config

_semaphores: Dict[int, asyncio.Semaphore] = {}
_semaphores_lock = asyncio.Lock()

async def get_key_semaphore(worker_id: int) -> asyncio.Semaphore:
    """
    Get the semaphore for a specific API key (identified by worker_id).
    Used to defensively bound concurrency per key to MAX_CONCURRENT_PER_KEY.
    """
    async with _semaphores_lock:
        if worker_id not in _semaphores:
            max_concurrent = get_config().MAX_CONCURRENT_PER_KEY
            _semaphores[worker_id] = asyncio.Semaphore(max_concurrent)
        return _semaphores[worker_id]
